import { asyncHandler } from "../middlewares/asyncHandler.js";
import MedicalShop from "../models/MedicalShop.js";
import Medicine from "../models/Medicine.js";
import Inventory from "../models/Inventory.js";
import { publishEvent } from "../events/kafka.js";
import { TOPICS, EVENT_TYPES } from "../events/eventTypes.js";

// @desc    Create a new medical shop
// @route   POST /api/shops
// @access  Private (Shop Owner)
export const createShop = asyncHandler(async (req, res) => {
  const shopData = {
    ...req.body,
    ownerId: req.user.id
  };

  // Check if user already owns a shop
  const existingShop = await MedicalShop.findOne({ ownerId: req.user.id });
  if (existingShop) {
    const error = new Error("User already owns a medical shop");
    error.statusCode = 400;
    throw error;
  }

  // Check if license number is already registered
  const existingLicense = await MedicalShop.findOne({
    licenseNumber: req.body.licenseNumber
  });
  if (existingLicense) {
    const error = new Error("License number already registered");
    error.statusCode = 400;
    throw error;
  }

  const shop = await MedicalShop.create(shopData);

  // Publish shop created event
  await publishEvent(TOPICS.SHOP_EVENTS, EVENT_TYPES.SHOP_CREATED, {
    shopId: shop._id,
    ownerId: shop.ownerId,
    shopName: shop.name,
    licenseNumber: shop.licenseNumber,
    location: {
      city: shop.address.city,
      coordinates: shop.address.coordinates
    }
  });

  res.status(201).json({
    success: true,
    message: "Medical shop created successfully",
    data: shop
  });
});

// @desc    Get all shops with filtering and pagination
// @route   GET /api/shops
// @access  Public
export const getShops = asyncHandler(async (req, res) => {
  const {
    query,
    city,
    services,
    latitude,
    longitude,
    radius = 10,
    limit = 20,
    offset = 0,
    sortBy = "distance",
    sortOrder = "asc"
  } = req.query;

  let filter = { status: "active", verificationStatus: "verified" };

  // Text search
  if (query) {
    filter.$text = { $search: query };
  }

  // City filter
  if (city) {
    filter["address.city"] = new RegExp(city, "i");
  }

  // Services filter
  if (services) {
    const servicesArray = Array.isArray(services) ? services : [services];
    filter.services = { $in: servicesArray };
  }

  let shops;
  let totalCount;

  if (latitude && longitude) {
    // Use geospatial query for nearby shops
    const coordinates = [parseFloat(longitude), parseFloat(latitude)];

    shops = await MedicalShop.find({
      ...filter,
      "address.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    })
    .populate("ownerId", "name email")
    .limit(parseInt(limit))
    .skip(parseInt(offset))
    .sort({ [sortBy === "distance" ? "_id" : sortBy]: sortOrder === "desc" ? -1 : 1 });

    totalCount = await MedicalShop.countDocuments({
      ...filter,
      "address.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates
          },
          $maxDistance: radius * 1000
        }
      }
    });
  } else {
    // Regular query without geospatial sorting
    shops = await MedicalShop.find(filter)
      .populate("ownerId", "name email")
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 });

    totalCount = await MedicalShop.countDocuments(filter);
  }

  // Add distance calculation if coordinates provided
  if (latitude && longitude) {
    shops = shops.map(shop => {
      const shopObj = shop.toObject();
      if (shop.address.coordinates) {
        shopObj.distance = shop.calculateDistance(parseFloat(latitude), parseFloat(longitude));
      }
      return shopObj;
    });

    // Sort by distance if requested
    if (sortBy === "distance") {
      shops.sort((a, b) => {
        if (sortOrder === "desc") {
          return (b.distance || 0) - (a.distance || 0);
        }
        return (a.distance || 0) - (b.distance || 0);
      });
    }
  }

  res.json({
    success: true,
    data: shops,
    pagination: {
      total: totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: offset + shops.length < totalCount
    }
  });
});

// @desc    Get single shop by ID
// @route   GET /api/shops/:id
// @access  Public
export const getShopById = asyncHandler(async (req, res) => {
  const shop = await MedicalShop.findById(req.params.id)
    .populate("ownerId", "name email");

  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  // Check if shop is active and verified
  if (shop.status !== "active" || shop.verificationStatus !== "verified") {
    const error = new Error("Shop is not available");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: shop
  });
});

// @desc    Update shop details
// @route   PUT /api/shops/:id
// @access  Private (Shop Owner/Admin)
export const updateShop = asyncHandler(async (req, res) => {
  const shop = await MedicalShop.findById(req.params.id);

  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  // Check ownership (unless admin)
  if (shop.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error("Not authorized to update this shop");
    error.statusCode = 403;
    throw error;
  }

  const updatedShop = await MedicalShop.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  // Publish shop updated event
  await publishEvent(TOPICS.SHOP_EVENTS, EVENT_TYPES.SHOP_UPDATED, {
    shopId: updatedShop._id,
    ownerId: updatedShop.ownerId,
    changes: Object.keys(req.body)
  });

  res.json({
    success: true,
    message: "Shop updated successfully",
    data: updatedShop
  });
});

// @desc    Update shop status
// @route   PATCH /api/shops/:id/status
// @access  Private (Admin)
export const updateShopStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

  const shop = await MedicalShop.findById(req.params.id);

  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  shop.status = status;
  await shop.save();

  // Publish shop status changed event
  await publishEvent(TOPICS.SHOP_EVENTS, EVENT_TYPES.SHOP_STATUS_CHANGED, {
    shopId: shop._id,
    ownerId: shop.ownerId,
    oldStatus: shop.status,
    newStatus: status,
    reason: reason
  });

  res.json({
    success: true,
    message: `Shop status updated to ${status}`,
    data: shop
  });
});

// @desc    Get shop inventory summary
// @route   GET /api/shops/:id/inventory
// @access  Private (Shop Owner/Admin)
export const getShopInventory = asyncHandler(async (req, res) => {
  const shop = await MedicalShop.findById(req.params.id);

  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  // Check ownership (unless admin)
  if (shop.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error("Not authorized to view this shop's inventory");
    error.statusCode = 403;
    throw error;
  }

  const inventorySummary = await Inventory.getInventorySummary(req.params.id);

  const lowStockItems = await Inventory.findLowStockItems(req.params.id);
  const expiringItems = await Inventory.findExpiringItems(req.params.id);

  res.json({
    success: true,
    data: {
      summary: inventorySummary,
      lowStockItems,
      expiringItems
    }
  });
});

// @desc    Get shop's available medicines
// @route   GET /api/shops/:id/medicines
// @access  Public
export const getShopMedicines = asyncHandler(async (req, res) => {
  const { category, prescriptionRequired, limit = 20, offset = 0 } = req.query;

  // First get all medicine IDs that are in stock at this shop
  const inventoryItems = await Inventory.find({
    shopId: req.params.id,
    status: "active",
    availableQuantity: { $gt: 0 }
  }).select("medicineId");

  const medicineIds = inventoryItems.map(item => item.medicineId);

  let filter = { _id: { $in: medicineIds } };

  if (category) {
    filter.category = category;
  }

  if (prescriptionRequired !== undefined) {
    filter.prescriptionRequired = prescriptionRequired === "true";
  }

  const medicines = await Medicine.find(filter)
    .populate("inventory", "pricing quantity availableQuantity")
    .limit(parseInt(limit))
    .skip(parseInt(offset));

  // Add inventory details to each medicine
  const medicinesWithInventory = await Promise.all(
    medicines.map(async (medicine) => {
      const inventory = await Inventory.findOne({
        shopId: req.params.id,
        medicineId: medicine._id,
        status: "active"
      }).select("pricing quantity availableQuantity");

      return {
        ...medicine.toObject(),
        inventory: inventory ? {
          quantity: inventory.quantity,
          availableQuantity: inventory.availableQuantity,
          pricing: inventory.pricing,
          finalPrice: inventory.finalPrice
        } : null
      };
    })
  );

  res.json({
    success: true,
    data: medicinesWithInventory,
    count: medicinesWithInventory.length
  });
});

// @desc    Get shop dashboard stats
// @route   GET /api/shops/:id/dashboard
// @access  Private (Shop Owner/Admin)
export const getShopDashboard = asyncHandler(async (req, res) => {
  const shop = await MedicalShop.findById(req.params.id);

  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  // Check ownership (unless admin)
  if (shop.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error("Not authorized to view this shop's dashboard");
    error.statusCode = 403;
    throw error;
  }

  // Get inventory stats
  const inventoryStats = await Inventory.aggregate([
    { $match: { shopId: shop._id } },
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalValue: { $sum: { $multiply: ["$quantity", "$pricing.costPrice"] } },
        lowStockItems: {
          $sum: {
            $cond: [
              { $lte: ["$availableQuantity", "$alerts.lowStockThreshold"] },
              1,
              0
            ]
          }
        },
        outOfStockItems: {
          $sum: {
            $cond: [
              { $eq: ["$availableQuantity", 0] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  // Get expiring items count
  const expiringCount = await Inventory.countDocuments({
    shopId: shop._id,
    expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    status: "active"
  });

  const stats = inventoryStats[0] || {
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  };

  res.json({
    success: true,
    data: {
      shop: {
        id: shop._id,
        name: shop.name,
        status: shop.status,
        verificationStatus: shop.verificationStatus,
        isOpen: shop.isOpenNow()
      },
      inventory: {
        totalItems: stats.totalItems,
        totalValue: stats.totalValue,
        lowStockItems: stats.lowStockItems,
        outOfStockItems: stats.outOfStockItems,
        expiringItems: expiringCount
      },
      alerts: {
        lowStockAlerts: stats.lowStockItems,
        expiryAlerts: expiringCount
      }
    }
  });
});
