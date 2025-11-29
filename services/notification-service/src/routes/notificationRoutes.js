import express from "express";
import {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotificationById,
  getStats,
  sendTestNotification,
  getPreferences,
  updatePreferences,
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  previewTemplateById,
  validateTemplateById,
  getAnalytics
} from "../controllers/notificationController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const notificationRoutes = express.Router();

// All routes require authentication
notificationRoutes.use(protect);

// User notification routes
notificationRoutes.get("/", getNotifications);
notificationRoutes.get("/stats", getStats);
notificationRoutes.put("/mark-all-read", markAllAsRead);

// Single notification routes
notificationRoutes.get("/:id", getNotificationById);
notificationRoutes.put("/:id/read", markAsRead);
notificationRoutes.delete("/:id", deleteNotificationById);

// Preferences routes
notificationRoutes.get("/preferences/manage", getPreferences);
notificationRoutes.put("/preferences/manage", updatePreferences);

// Test notification route (for development)
notificationRoutes.post("/test", authorize("admin"), sendTestNotification);

// Template management routes (Admin only)
notificationRoutes.post("/templates", authorize("admin"), createTemplate);
notificationRoutes.get("/templates", authorize("admin"), getTemplates);
notificationRoutes.get("/templates/:id", authorize("admin"), getTemplateById);
notificationRoutes.put("/templates/:id", authorize("admin"), updateTemplate);
notificationRoutes.delete("/templates/:id", authorize("admin"), deleteTemplate);

// Template utilities (Admin only)
notificationRoutes.post("/templates/:id/preview", authorize("admin"), previewTemplateById);
notificationRoutes.post("/templates/:id/validate", authorize("admin"), validateTemplateById);

// Analytics routes (Admin only)
notificationRoutes.get("/analytics/overview", authorize("admin"), getAnalytics);

export default notificationRoutes;
