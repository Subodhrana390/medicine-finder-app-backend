import express from "express";
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logout,
  logoutAll,
  refreshAccessToken,
  verifyTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  getTwoFactorStatus,
  forgotPassword,
  resetPassword,
  changePassword,
  getGeolocation,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const authRoutes = express.Router();

// Public routes
authRoutes.post("/register", registerWithEmail);
authRoutes.post("/login", loginWithEmail);
authRoutes.post("/google", loginWithGoogle);
authRoutes.post("/refresh", refreshAccessToken);
authRoutes.post("/2fa/verify", verifyTwoFactor);

// Protected routes
authRoutes.post("/logout", logout);
authRoutes.post("/logout/all", protect, logoutAll);
authRoutes.post("/2fa/enable", protect, enableTwoFactor);
authRoutes.post("/2fa/disable", protect, disableTwoFactor);
authRoutes.get("/2fa/status", protect, getTwoFactorStatus);

// Password management routes
authRoutes.post("/password/forgot", forgotPassword);
authRoutes.post("/password/reset/:token", resetPassword);
authRoutes.post("/password/change", protect, changePassword);

// Utility routes
authRoutes.get("/geolocation", getGeolocation);

export default authRoutes;
