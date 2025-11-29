import express from "express";
import {
  createShop,
  getShops,
  getShopById,
  updateShop,
  updateShopStatus,
  getShopInventory,
  getShopMedicines,
  getShopDashboard
} from "../controllers/shopController.js";
import {
  addInventoryItem,
  getShopInventory,
  updateInventoryItem,
  addStockMovement,
  getInventoryAlerts,
  bulkUpdateInventory,
  getInventorySummary,
  updateAlertSettings
} from "../controllers/inventoryController.js";
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
import { protect, requireShopOwner, requireShopOwnership } from "../middlewares/authMiddleware.js";
import { validateUploads, handleMulterError } from "../middlewares/uploadMiddleware.js";
import { uploadShopImages, uploadMedicineImages } from "../middlewares/uploadMiddleware.js";
import {
  createShopSchema,
  updateShopSchema,
  updateShopStatusSchema,
  shopSearchSchema
} from "../validators/shopValidator.js";
import {
  createInventorySchema,
  updateInventorySchema,
  stockMovementSchema,
  bulkInventoryUpdateSchema,
  inventorySearchSchema,
  updateAlertSettingsSchema
} from "../validators/inventoryValidator.js";
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

// ========== SHOP MANAGEMENT ROUTES ==========

// @route   POST /api/shops
// @desc    Create a new medical shop
// @access  Private (Shop Owner)
router.post(
  "/",
  protect,
  requireShopOwner,
  validate(createShopSchema),
  createShop
);

// @route   GET /api/shops
// @desc    Get all shops with filtering and pagination
// @access  Public
router.get(
  "/",
  validateQuery(shopSearchSchema),
  getShops
);

// @route   GET /api/shops/:id
// @desc    Get single shop by ID
// @access  Public
router.get("/:id", getShopById);

// @route   PUT /api/shops/:id
// @desc    Update shop details
// @access  Private (Shop Owner/Admin)
router.put(
  "/:id",
  protect,
  requireShopOwnership(),
  validate(updateShopSchema),
  updateShop
);

// @route   PATCH /api/shops/:id/status
// @desc    Update shop status (Admin only)
// @access  Private (Admin)
router.patch(
  "/:id/status",
  protect,
  (req, res, next) => {
    if (req.user.role !== "admin") {
      const error = new Error("Admin access required");
      error.statusCode = 403;
      throw error;
    }
    next();
  },
  validate(updateShopStatusSchema),
  updateShopStatus
);

// @route   POST /api/shops/:id/images
// @desc    Upload shop images
// @access  Private (Shop Owner)
router.post(
  "/:id/images",
  protect,
  requireShopOwnership(),
  uploadShopImages.array("images", 5),
  validateUploads,
  (req, res) => {
    // Handle successful upload
    const imageUrls = req.files.map(file => ({
      url: `/uploads/shops/${file.filename}`,
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

// ========== SHOP INVENTORY ROUTES ==========

// @route   GET /api/shops/:id/inventory
// @desc    Get shop inventory summary
// @access  Private (Shop Owner/Admin)
router.get(
  "/:id/inventory",
  protect,
  requireShopOwnership(),
  getShopInventory
);

// @route   GET /api/shops/:id/medicines
// @desc    Get shop's available medicines
// @access  Public
router.get("/:id/medicines", getShopMedicines);

// @route   GET /api/shops/:id/dashboard
// @desc    Get shop dashboard stats
// @access  Private (Shop Owner/Admin)
router.get(
  "/:id/dashboard",
  protect,
  requireShopOwnership(),
  getShopDashboard
);

// ========== INVENTORY MANAGEMENT ROUTES ==========

// @route   POST /api/shops/inventory
// @desc    Add inventory item to shop
// @access  Private (Shop Owner)
router.post(
  "/inventory",
  protect,
  validate(createInventorySchema),
  addInventoryItem
);

// @route   GET /api/shops/inventory/shop/:shopId
// @desc    Get shop inventory with filters
// @access  Private (Shop Owner/Admin)
router.get(
  "/inventory/shop/:shopId",
  protect,
  requireShopOwnership("shopId"),
  validateQuery(inventorySearchSchema),
  getShopInventory
);

// @route   PUT /api/shops/inventory/:id
// @desc    Update inventory item
// @access  Private (Shop Owner)
router.put(
  "/inventory/:id",
  protect,
  validate(updateInventorySchema),
  updateInventoryItem
);

// @route   POST /api/shops/inventory/:id/movement
// @desc    Add stock movement (in/out/adjustment)
// @access  Private (Shop Owner)
router.post(
  "/inventory/:id/movement",
  protect,
  validate(stockMovementSchema),
  addStockMovement
);

// @route   GET /api/shops/inventory/:shopId/alerts
// @desc    Get inventory alerts (low stock, expiring)
// @access  Private (Shop Owner)
router.get(
  "/inventory/:shopId/alerts",
  protect,
  requireShopOwnership("shopId"),
  getInventoryAlerts
);

// @route   POST /api/shops/inventory/bulk-update
// @desc    Bulk update inventory
// @access  Private (Shop Owner)
router.post(
  "/inventory/bulk-update",
  protect,
  validate(bulkInventoryUpdateSchema),
  bulkUpdateInventory
);

// @route   GET /api/shops/inventory/:shopId/summary
// @desc    Get inventory summary for shop
// @access  Private (Shop Owner)
router.get(
  "/inventory/:shopId/summary",
  protect,
  requireShopOwnership("shopId"),
  getInventorySummary
);

// @route   PUT /api/shops/inventory/:id/alerts
// @desc    Update inventory alert settings
// @access  Private (Shop Owner)
router.put(
  "/inventory/:id/alerts",
  protect,
  validate(updateAlertSettingsSchema),
  updateAlertSettings
);

// ========== MEDICINE CATALOG MANAGEMENT ROUTES ==========

// @route   POST /api/shops/medicines
// @desc    Create a new medicine
// @access  Private (Admin/Shop Owner)
router.post(
  "/medicines",
  protect,
  validate(createMedicineSchema),
  createMedicine
);

// @route   GET /api/shops/medicines
// @desc    Get all medicines with filtering and search
// @access  Public
router.get(
  "/medicines",
  validateQuery(medicineSearchSchema),
  getMedicines
);

// @route   GET /api/shops/medicines/search
// @desc    Search medicines with advanced filters
// @access  Public
router.get(
  "/medicines/search",
  validateQuery(medicineSearchSchema),
  searchMedicines
);

// @route   GET /api/shops/medicines/:id
// @desc    Get single medicine by ID
// @access  Public
router.get("/medicines/:id", getMedicineById);

// @route   PUT /api/shops/medicines/:id
// @desc    Update medicine details
// @access  Private (Admin)
router.put(
  "/medicines/:id",
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

// @route   DELETE /api/shops/medicines/:id
// @desc    Delete/discontinue medicine
// @access  Private (Admin)
router.delete(
  "/medicines/:id",
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

// @route   GET /api/shops/medicines/category/:category
// @desc    Get medicines by category
// @access  Public
router.get("/medicines/category/:category", getMedicinesByCategory);

// @route   GET /api/shops/medicines/prescription
// @desc    Get prescription medicines
// @access  Public
router.get("/medicines/prescription", getPrescriptionMedicines);

// @route   POST /api/shops/medicines/:id/images
// @desc    Upload medicine images
// @access  Private (Admin)
router.post(
  "/medicines/:id/images",
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

// @route   POST /api/shops/medicines/bulk-import
// @desc    Bulk import medicines
// @access  Private (Admin)
router.post(
  "/medicines/bulk-import",
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

// @route   GET /api/shops/medicines/stats
// @desc    Get medicine statistics
// @access  Private (Admin)
router.get(
  "/medicines/stats",
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
