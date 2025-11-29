import express from "express";
import {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  deleteAvatar,
  getMyPreferences,
  updateMyPreferences,
  getMyExtendedProfile,
  updateMyExtendedProfile,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  deactivateAccount,
  reactivateAccount,
  getUserStats,
} from "../controllers/userController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { uploadAvatar } from "../middlewares/uploadMiddleware.js";

const userRoutes = express.Router();

// All routes require authentication
userRoutes.use(protect);

// Current user routes
userRoutes.get("/profile", getMyProfile);
userRoutes.put("/profile", updateMyProfile);
userRoutes.post("/avatar", uploadAvatar, uploadAvatar);
userRoutes.delete("/avatar", deleteAvatar);
userRoutes.put("/deactivate", deactivateAccount);

// Preferences routes
userRoutes.get("/preferences", getMyPreferences);
userRoutes.put("/preferences", updateMyPreferences);

// Extended profile routes
userRoutes.get("/extended-profile", getMyExtendedProfile);
userRoutes.put("/extended-profile", updateMyExtendedProfile);

// Admin routes
userRoutes.get("/admin/stats", authorize("admin"), getUserStats);
userRoutes.get("/admin/users", authorize("admin"), getAllUsers);
userRoutes.get("/admin/users/:userId", authorize("admin"), getUserById);
userRoutes.put("/admin/users/:userId", authorize("admin"), updateUser);
userRoutes.delete("/admin/users/:userId", authorize("admin"), deleteUser);
userRoutes.put("/admin/users/:userId/reactivate", authorize("admin"), reactivateAccount);

export default userRoutes;
