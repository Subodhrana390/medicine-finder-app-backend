import express from "express";
import {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  searchMedicines,
  getMedicinesByCategory,
  getPrescriptionMedicines,
  bulkImportMedicines,
  getMedicineStats
} from "../controllers/medicineController.js";
import { protect, requireShopOwner } from "../middlewares/authMiddleware.js";
import { validateUploads, handleMulterError } from "../middlewares/uploadMiddleware.js";
import { uploadMedicineImages } from "../middlewares/uploadMiddleware.js";
import {
  createMedicineSchema,
  updateMedicineSchema,
  medicineSearchSchema,
  bulkImportSchema
} from "../validators/medicineValidator.js";

const router = express.Router();

// Validation middleware wrapper
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    const err = new Error("Validation failed");
    err.statusCode = 400;
    err.details = error.errors;
    next(err);
  }
};

// Query validation middleware
const validateQuery = (schema) => (req, res, next) => {
  try {
    schema.parse(req.query);
    next();
  } catch (error) {
    const err = new Error("Query validation failed");
    err.statusCode = 400;
    err.details = error.errors;
    next(err);
  }
};

// ========== MEDICINE CATALOG MANAGEMENT ROUTES ==========

// @route   POST /api/medicines
// @desc    Create a new medicine
// @access  Private (Admin/Shop Owner)
router.post(
  "/",
  protect,
  validate(createMedicineSchema),
  createMedicine
);

// @route   GET /api/medicines
// @desc    Get all medicines with filtering and search
// @access  Public
router.get(
  "/",
  validateQuery(medicineSearchSchema),
  getMedicines
);

// @route   GET /api/medicines/search
// @desc    Search medicines with advanced filters
// @access  Public
router.get(
  "/search",
  validateQuery(medicineSearchSchema),
  searchMedicines
);

// @route   GET /api/medicines/:id
// @desc    Get single medicine by ID
// @access  Public
router.get("/:id", getMedicineById);

// @route   PUT /api/medicines/:id
// @desc    Update medicine details
// @access  Private (Admin)
router.put(
  "/:id",
  protect,
  (req, res, next) => {
    if (req.user.role !== "admin") {
      const error = new Error("Admin access required");
      error.statusCode = 403;
      throw error;
    }
    next();
  },
  validate(updateMedicineSchema),
  updateMedicine
);

// @route   DELETE /api/medicines/:id
// @desc    Delete/discontinue medicine
// @access  Private (Admin)
router.delete(
  "/:id",
  protect,
  (req, res, next) => {
    if (req.user.role !== "admin") {
      const error = new Error("Admin access required");
      error.statusCode = 403;
      throw error;
    }
    next();
  },
  deleteMedicine
);

// ========== MEDICINE CATEGORY ROUTES ==========

// @route   GET /api/medicines/category/:category
// @desc    Get medicines by category
// @access  Public
router.get("/category/:category", getMedicinesByCategory);

// @route   GET /api/medicines/prescription
// @desc    Get prescription medicines
// @access  Public
router.get("/prescription", getPrescriptionMedicines);

// ========== MEDICINE IMAGE MANAGEMENT ROUTES ==========

// @route   POST /api/medicines/:id/images
// @desc    Upload medicine images
// @access  Private (Admin)
router.post(
  "/:id/images",
  protect,
  (req, res, next) => {
    if (req.user.role !== "admin") {
      const error = new Error("Admin access required");
      error.statusCode = 403;
      throw error;
    }
    next();
  },
  uploadMedicineImages.array("images", 3),
  validateUploads,
  (req, res) => {
    // Handle successful upload
    const imageUrls = req.files.map(file => ({
      url: `/uploads/medicines/${file.filename}`,
      alt: req.body.alt || "",
      isPrimary: req.body.isPrimary === "true"
    }));

    res.json({
      success: true,
      message: "Images uploaded successfully",
      data: imageUrls
    });
  }
);

// ========== MEDICINE BULK OPERATIONS ==========

// @route   POST /api/medicines/bulk-import
// @desc    Bulk import medicines
// @access  Private (Admin)
router.post(
  "/bulk-import",
  protect,
  (req, res, next) => {
    if (req.user.role !== "admin") {
      const error = new Error("Admin access required");
      error.statusCode = 403;
      throw error;
    }
    next();
  },
  validate(bulkImportSchema),
  bulkImportMedicines
);

// ========== MEDICINE ANALYTICS ROUTES ==========

// @route   GET /api/medicines/stats
// @desc    Get medicine statistics
// @access  Private (Admin)
router.get(
  "/stats",
  protect,
  (req, res, next) => {
    if (req.user.role !== "admin") {
      const error = new Error("Admin access required");
      error.statusCode = 403;
      throw error;
    }
    next();
  },
  getMedicineStats
);

// Handle multer errors
router.use(handleMulterError);

export default router;
