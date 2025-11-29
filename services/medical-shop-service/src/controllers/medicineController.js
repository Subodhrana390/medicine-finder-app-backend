import { asyncHandler } from "../middlewares/asyncHandler.js";
import Medicine from "../models/Medicine.js";
import { publishEvent } from "../events/kafka.js";
import { TOPICS, EVENT_TYPES } from "../events/eventTypes.js";

// @desc    Create a new medicine
// @route   POST /api/medicines
// @access  Private (Admin/Shop Owner)
export const createMedicine = asyncHandler(async (req, res) => {
  const medicineData = {
    ...req.body,
    metadata: {
      ...req.body.metadata,
      createdBy: req.user.id
    }
  };

  // Check if medicine with same name and manufacturer already exists
  const existingMedicine = await Medicine.findOne({
    name: req.body.name,
    manufacturer: req.body.manufacturer
  });

  if (existingMedicine) {
    const error = new Error("Medicine with this name and manufacturer already exists");
    error.statusCode = 400;
    throw error;
  }

  const medicine = await Medicine.create(medicineData);

  // Publish medicine created event
  await publishEvent(TOPICS.MEDICINE_EVENTS, EVENT_TYPES.MEDICINE_CREATED, {
    medicineId: medicine._id,
    name: medicine.name,
    manufacturer: medicine.manufacturer,
    category: medicine.category,
    prescriptionRequired: medicine.prescriptionRequired
  });

  res.status(201).json({
    success: true,
    message: "Medicine created successfully",
    data: medicine
  });
});

// @desc    Get all medicines with filtering and search
// @route   GET /api/medicines
// @access  Public
export const getMedicines = asyncHandler(async (req, res) => {
  const {
    query,
    category,
    manufacturer,
    prescriptionRequired,
    limit = 20,
    offset = 0,
    sortBy = "name",
    sortOrder = "asc"
  } = req.query;

  let filter = { status: "active" };

  // Text search
  if (query) {
    filter.$text = { $search: query };
  }

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Manufacturer filter
  if (manufacturer) {
    filter.manufacturer = new RegExp(manufacturer, "i");
  }

  // Prescription required filter
  if (prescriptionRequired !== undefined) {
    filter.prescriptionRequired = prescriptionRequired === "true";
  }

  const medicines = await Medicine.find(filter)
    .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));

  const totalCount = await Medicine.countDocuments(filter);

  res.json({
    success: true,
    data: medicines,
    pagination: {
      total: totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: offset + medicines.length < totalCount
    }
  });
});

// @desc    Get single medicine by ID
// @route   GET /api/medicines/:id
// @access  Public
export const getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    const error = new Error("Medicine not found");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: medicine
  });
});

// @desc    Update medicine details
// @route   PUT /api/medicines/:id
// @access  Private (Admin)
export const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    const error = new Error("Medicine not found");
    error.statusCode = 404;
    throw error;
  }

  const updatedMedicine = await Medicine.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  // Publish medicine updated event
  await publishEvent(TOPICS.MEDICINE_EVENTS, EVENT_TYPES.MEDICINE_UPDATED, {
    medicineId: updatedMedicine._id,
    name: updatedMedicine.name,
    changes: Object.keys(req.body)
  });

  res.json({
    success: true,
    message: "Medicine updated successfully",
    data: updatedMedicine
  });
});

// @desc    Delete medicine
// @route   DELETE /api/medicines/:id
// @access  Private (Admin)
export const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    const error = new Error("Medicine not found");
    error.statusCode = 404;
    throw error;
  }

  // Soft delete by changing status
  medicine.status = "discontinued";
  await medicine.save();

  // Publish medicine discontinued event
  await publishEvent(TOPICS.MEDICINE_EVENTS, EVENT_TYPES.MEDICINE_DISCONTINUED, {
    medicineId: medicine._id,
    name: medicine.name,
    reason: "Manually discontinued"
  });

  res.json({
    success: true,
    message: "Medicine discontinued successfully"
  });
});

// @desc    Search medicines with advanced filters
// @route   GET /api/medicines/search
// @access  Public
export const searchMedicines = asyncHandler(async (req, res) => {
  const {
    q: searchTerm,
    category,
    manufacturer,
    prescriptionRequired,
    limit = 20
  } = req.query;

  if (!searchTerm) {
    const error = new Error("Search term is required");
    error.statusCode = 400;
    throw error;
  }

  let filter = { status: "active" };

  // Add category filter
  if (category) {
    filter.category = category;
  }

  // Add manufacturer filter
  if (manufacturer) {
    filter.manufacturer = new RegExp(manufacturer, "i");
  }

  // Add prescription filter
  if (prescriptionRequired !== undefined) {
    filter.prescriptionRequired = prescriptionRequired === "true";
  }

  const medicines = await Medicine.searchMedicines(searchTerm, parseInt(limit));

  // Filter additional criteria if provided
  let filteredMedicines = medicines;
  if (category || manufacturer || prescriptionRequired !== undefined) {
    filteredMedicines = medicines.filter(medicine => {
      if (category && medicine.category !== category) return false;
      if (manufacturer && !medicine.manufacturer.match(new RegExp(manufacturer, "i"))) return false;
      if (prescriptionRequired !== undefined && medicine.prescriptionRequired !== (prescriptionRequired === "true")) return false;
      return true;
    });
  }

  res.json({
    success: true,
    data: filteredMedicines,
    count: filteredMedicines.length
  });
});

// @desc    Get medicines by category
// @route   GET /api/medicines/category/:category
// @access  Public
export const getMedicinesByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { limit = 50, includeDiscontinued = false } = req.query;

  const medicines = await Medicine.findByCategory(category, includeDiscontinued === "true");

  // Limit results
  const limitedMedicines = medicines.slice(0, parseInt(limit));

  res.json({
    success: true,
    data: limitedMedicines,
    count: limitedMedicines.length,
    category: category
  });
});

// @desc    Get prescription medicines
// @route   GET /api/medicines/prescription
// @access  Public
export const getPrescriptionMedicines = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;

  const medicines = await Medicine.findPrescriptionMedicines();

  // Limit results
  const limitedMedicines = medicines.slice(0, parseInt(limit));

  res.json({
    success: true,
    data: limitedMedicines,
    count: limitedMedicines.length
  });
});

// @desc    Bulk import medicines
// @route   POST /api/medicines/bulk-import
// @access  Private (Admin)
export const bulkImportMedicines = asyncHandler(async (req, res) => {
  const { medicines } = req.body;

  const createdMedicines = [];
  const errors = [];

  for (let i = 0; i < medicines.length; i++) {
    try {
      const medicineData = {
        ...medicines[i],
        metadata: {
          ...medicines[i].metadata,
          createdBy: req.user.id
        }
      };

      const medicine = await Medicine.create(medicineData);
      createdMedicines.push(medicine);
    } catch (error) {
      errors.push({
        index: i,
        name: medicines[i].name,
        error: error.message
      });
    }
  }

  // Publish bulk import event
  await publishEvent(TOPICS.MEDICINE_EVENTS, EVENT_TYPES.MEDICINE_BULK_IMPORTED, {
    importedCount: createdMedicines.length,
    errorCount: errors.length,
    performedBy: req.user.id
  });

  res.json({
    success: true,
    message: `Successfully imported ${createdMedicines.length} medicines`,
    data: {
      imported: createdMedicines,
      errors: errors
    },
    summary: {
      total: medicines.length,
      successful: createdMedicines.length,
      failed: errors.length
    }
  });
});

// @desc    Get medicine statistics
// @route   GET /api/medicines/stats
// @access  Private (Admin)
export const getMedicineStats = asyncHandler(async (req, res) => {
  const stats = await Medicine.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        prescriptionRequired: {
          $sum: { $cond: ["$prescriptionRequired", 1, 0] }
        },
        active: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  const totalMedicines = await Medicine.countDocuments();
  const prescriptionMedicines = await Medicine.countDocuments({ prescriptionRequired: true });
  const activeMedicines = await Medicine.countDocuments({ status: "active" });

  res.json({
    success: true,
    data: {
      totalMedicines,
      prescriptionMedicines,
      activeMedicines,
      otcMedicines: totalMedicines - prescriptionMedicines,
      categoryBreakdown: stats
    }
  });
});
