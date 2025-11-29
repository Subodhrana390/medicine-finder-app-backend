import { asyncHandler } from "../middlewares/asyncHandler.js";
import Inventory from "../models/Inventory.js";
import MedicalShop from "../models/MedicalShop.js";
import Medicine from "../models/Medicine.js";
import { publishEvent } from "../events/kafka.js";
import { TOPICS, EVENT_TYPES } from "../events/eventTypes.js";

// @desc    Add inventory item to shop
// @route   POST /api/inventory
// @access  Private (Shop Owner)
export const addInventoryItem = asyncHandler(async (req, res) => {
  const { shopId, medicineId, batchNumber, quantity, pricing, manufacturingDate, expiryDate, ...otherData } = req.body;

  // Verify shop ownership
  const shop = await MedicalShop.findById(shopId);
  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  if (shop.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error("Not authorized to manage this shop's inventory");
    error.statusCode = 403;
    throw error;
  }

  // Verify medicine exists
  const medicine = await Medicine.findById(medicineId);
  if (!medicine) {
    const error = new Error("Medicine not found");
    error.statusCode = 404;
    throw error;
  }

  // Check if inventory item already exists for this medicine and batch
  const existingInventory = await Inventory.findOne({
    shopId,
    medicineId,
    batchNumber
  });

  if (existingInventory) {
    const error = new Error("Inventory item with this batch number already exists for this medicine");
    error.statusCode = 400;
    throw error;
  }

  const inventoryData = {
    shopId,
    medicineId,
    batchNumber,
    quantity,
    pricing,
    manufacturingDate: new Date(manufacturingDate),
    expiryDate: new Date(expiryDate),
    createdBy: req.user.id,
    ...otherData
  };

  const inventory = await Inventory.create(inventoryData);

  // Publish inventory added event
  await publishEvent(TOPICS.INVENTORY_EVENTS, EVENT_TYPES.INVENTORY_ADDED, {
    inventoryId: inventory._id,
    shopId: inventory.shopId,
    medicineId: inventory.medicineId,
    batchNumber: inventory.batchNumber,
    quantity: inventory.quantity,
    medicineName: medicine.name
  });

  // Populate medicine details in response
  await inventory.populate("medicineId", "name genericName brand manufacturer");

  res.status(201).json({
    success: true,
    message: "Inventory item added successfully",
    data: inventory
  });
});

// @desc    Get shop inventory
// @route   GET /api/inventory/shop/:shopId
// @access  Private (Shop Owner/Admin)
export const getShopInventory = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const {
    medicineId,
    status,
    lowStockOnly,
    expiringSoon,
    daysAhead = 30,
    limit = 20,
    offset = 0,
    sortBy = "expiryDate",
    sortOrder = "asc"
  } = req.query;

  // Verify shop ownership
  const shop = await MedicalShop.findById(shopId);
  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  if (shop.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error("Not authorized to view this shop's inventory");
    error.statusCode = 403;
    throw error;
  }

  let filter = { shopId };

  // Add filters
  if (medicineId) {
    filter.medicineId = medicineId;
  }

  if (status) {
    filter.status = status;
  }

  if (lowStockOnly === "true") {
    // This will be handled in the aggregation or separate query
  }

  if (expiringSoon === "true") {
    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + parseInt(daysAhead));
    filter.expiryDate = { $lte: alertDate, $gt: new Date() };
    filter.status = "active";
  }

  let inventoryQuery = Inventory.find(filter)
    .populate("medicineId", "name genericName brand manufacturer category prescriptionRequired")
    .populate("createdBy", "name")
    .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));

  let inventory = await inventoryQuery;

  // Filter low stock items if requested
  if (lowStockOnly === "true") {
    inventory = inventory.filter(item => item.isLowStock());
  }

  const totalCount = await Inventory.countDocuments(filter);

  res.json({
    success: true,
    data: inventory,
    pagination: {
      total: totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: offset + inventory.length < totalCount
    }
  });
});

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private (Shop Owner)
export const updateInventoryItem = asyncHandler(async (req, res) => {
  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    const error = new Error("Inventory item not found");
    error.statusCode = 404;
    throw error;
  }

  // Verify shop ownership
  const shop = await MedicalShop.findById(inventory.shopId);
  if (shop.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error("Not authorized to update this inventory item");
    error.statusCode = 403;
    throw error;
  }

  const updatedInventory = await Inventory.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate("medicineId", "name genericName brand manufacturer");

  // Publish inventory updated event
  await publishEvent(TOPICS.INVENTORY_EVENTS, EVENT_TYPES.INVENTORY_UPDATED, {
    inventoryId: updatedInventory._id,
    shopId: updatedInventory.shopId,
    medicineId: updatedInventory.medicineId,
    changes: Object.keys(req.body)
  });

  res.json({
    success: true,
    message: "Inventory item updated successfully",
    data: updatedInventory
  });
});

// @desc    Add stock movement (in/out/adjustment)
// @route   POST /api/inventory/:id/movement
// @access  Private (Shop Owner)
export const addStockMovement = asyncHandler(async (req, res) => {
  const { type, quantity, reason, reference, notes } = req.body;

  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    const error = new Error("Inventory item not found");
    error.statusCode = 404;
    throw error;
  }

  // Verify shop ownership
  const shop = await MedicalShop.findById(inventory.shopId);
  if (shop.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error("Not authorized to modify this inventory item");
    error.statusCode = 403;
    throw error;
  }

  // Add stock movement
  await inventory.addStockMovement(type, quantity, reason, req.user.id, reference, notes);

  // Populate medicine details
  await inventory.populate("medicineId", "name genericName brand manufacturer");

  // Publish stock movement event
  await publishEvent(TOPICS.INVENTORY_EVENTS, EVENT_TYPES.STOCK_MOVEMENT, {
    inventoryId: inventory._id,
    shopId: inventory.shopId,
    medicineId: inventory.medicineId,
    type,
    quantity,
    reason,
    performedBy: req.user.id,
    newQuantity: inventory.quantity,
    newAvailableQuantity: inventory.availableQuantity
  });

  res.json({
    success: true,
    message: `Stock ${type} movement recorded successfully`,
    data: inventory
  });
});

// @desc    Get inventory alerts (low stock, expiring)
// @route   GET /api/inventory/:shopId/alerts
// @access  Private (Shop Owner)
export const getInventoryAlerts = asyncHandler(async (req, res) => {
  const { shopId } = req.params;

  // Verify shop ownership
  const shop = await MedicalShop.findById(shopId);
  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  if (shop.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error("Not authorized to view this shop's alerts");
    error.statusCode = 403;
    throw error;
  }

  // Get low stock items
  const lowStockItems = await Inventory.findLowStockItems(shopId);

  // Get expiring items (next 30 days)
  const expiringItems = await Inventory.findExpiringItems(shopId, 30);

  // Get expired items
  const expiredItems = await Inventory.find({
    shopId,
    expiryDate: { $lt: new Date() },
    status: "active"
  }).populate("medicineId", "name genericName brand");

  res.json({
    success: true,
    data: {
      lowStock: {
        count: lowStockItems.length,
        items: lowStockItems
      },
      expiring: {
        count: expiringItems.length,
        items: expiringItems
      },
      expired: {
        count: expiredItems.length,
        items: expiredItems
      }
    }
  });
});

// @desc    Bulk update inventory
// @route   POST /api/inventory/bulk-update
// @access  Private (Shop Owner)
export const bulkUpdateInventory = asyncHandler(async (req, res) => {
  const { shopId, items } = req.body;

  // Verify shop ownership
  const shop = await MedicalShop.findById(shopId);
  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  if (shop.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error("Not authorized to update this shop's inventory");
    error.statusCode = 403;
    throw error;
  }

  const results = {
    successful: [],
    failed: []
  };

  for (const item of items) {
    try {
      const inventory = await Inventory.findOne({
        shopId,
        medicineId: item.medicineId,
        batchNumber: item.batchNumber
      });

      if (!inventory) {
        results.failed.push({
          medicineId: item.medicineId,
          batchNumber: item.batchNumber,
          error: "Inventory item not found"
        });
        continue;
      }

      // Update inventory
      Object.assign(inventory, item);
      await inventory.save();

      results.successful.push({
        inventoryId: inventory._id,
        medicineId: item.medicineId,
        batchNumber: item.batchNumber
      });
    } catch (error) {
      results.failed.push({
        medicineId: item.medicineId,
        batchNumber: item.batchNumber,
        error: error.message
      });
    }
  }

  // Publish bulk update event
  await publishEvent(TOPICS.INVENTORY_EVENTS, EVENT_TYPES.INVENTORY_BULK_UPDATED, {
    shopId,
    successfulCount: results.successful.length,
    failedCount: results.failed.length,
    performedBy: req.user.id
  });

  res.json({
    success: true,
    message: `Bulk update completed: ${results.successful.length} successful, ${results.failed.length} failed`,
    data: results
  });
});

// @desc    Get inventory summary for shop
// @route   GET /api/inventory/:shopId/summary
// @access  Private (Shop Owner)
export const getInventorySummary = asyncHandler(async (req, res) => {
  const { shopId } = req.params;

  // Verify shop ownership
  const shop = await MedicalShop.findById(shopId);
  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  if (shop.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error("Not authorized to view this shop's inventory summary");
    error.statusCode = 403;
    throw error;
  }

  const summary = await Inventory.getInventorySummary(shopId);

  res.json({
    success: true,
    data: summary[0] || {
      totalItems: 0,
      totalValue: 0,
      lowStockItems: 0,
      expiredItems: 0
    }
  });
});

// @desc    Update inventory alert settings
// @route   PUT /api/inventory/:id/alerts
// @access  Private (Shop Owner)
export const updateAlertSettings = asyncHandler(async (req, res) => {
  const { lowStockThreshold, expiryAlertDays } = req.body;

  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    const error = new Error("Inventory item not found");
    error.statusCode = 404;
    throw error;
  }

  // Verify shop ownership
  const shop = await MedicalShop.findById(inventory.shopId);
  if (shop.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error("Not authorized to update this inventory item");
    error.statusCode = 403;
    throw error;
  }

  inventory.alerts.lowStockThreshold = lowStockThreshold;
  inventory.alerts.expiryAlertDays = expiryAlertDays;
  await inventory.save();

  res.json({
    success: true,
    message: "Alert settings updated successfully",
    data: inventory.alerts
  });
});
