import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  refreshSchema,
  twoFactorVerifySchema,
} from "../validators/authValidator.js";
import UserModel from "../models/User.js";
import { AuditService } from "../services/auditService.js";
import { sendPasswordResetEmail, sendTwoFactorCodeEmail } from "../services/emailService.js";
import initializeGoogleOAuth from "../config/google.js";
import {
  parseUserAgent,
  getClientIP,
  generateTwoFactorCode,
  hashToken,
  getTokenExpiration,
  isExpired
} from "../utils/index.js";
import { publishEvent } from "../events/kafka.js";
import { TOPICS, EVENT_TYPES } from "../events/eventTypes.js";

/**
 * Register with Email & Password
 */
export const registerWithEmail = asyncHandler(async (req, res) => {
  const { name, email, password } = registerSchema.parse(req.body);

  let user = await User.findOne({ email });
  if (user) {
    await AuditService.logEvent({
      userId: null,
      action: "REGISTER_FAILED",
      req,
      errorMessage: "Email already exists"
    });
    const error = new Error("Email already exists");
    error.statusCode = 400;
    throw error;
  }

  user = await User.create({ name, email, password, provider: "local" });

  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  const sessionId = await user.addRefreshToken(
    refreshToken,
    parseUserAgent(req.headers["user-agent"]),
    getClientIP(req),
    req.headers["user-agent"]
  );
  await user.recordLogin(req.headers["user-agent"]);

  // Publish user registered event
  await publishEvent(TOPICS.USER_EVENTS, EVENT_TYPES.USER_REGISTERED, {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    provider: user.provider,
    role: user.role,
    isActive: user.isActive
  }, {
    userId: user._id.toString(),
    sessionId
  });

  await AuditService.logEvent({
    userId: user._id,
    action: "REGISTER",
    req,
    sessionId
  });

  res.status(201).json({ token, refreshToken, user });
});

/**
 * Login with Email & Password
 */
export const loginWithEmail = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await UserModel.findOne({ email }).select("+password");
  if (!user) {
    await AuditService.logEvent({
      userId: null,
      action: "LOGIN_FAILED",
      req,
      errorMessage: "User not found"
    });
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    await AuditService.logEvent({
      userId: user._id,
      action: "LOGIN_FAILED",
      req,
      errorMessage: "Invalid password"
    });
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    // Generate and send 2FA code
    const twoFactorCode = user.generateTwoFactorCode();
    await user.save({ validateBeforeSave: false });

    try {
      // Send 2FA code via email
      await sendTwoFactorCodeEmail(user.email, twoFactorCode, user.name);

      await AuditService.logEvent({
        userId: user._id,
        action: "LOGIN_2FA_REQUIRED",
        req
      });

      return res.json({
        message: "2FA code sent to your email",
        requiresTwoFactor: true,
        userId: user._id,
      });
    } catch (emailError) {
      console.error("2FA Email failed:", emailError);
      // Reset 2FA data on email failure
      user.twoFactorCode = undefined;
      user.twoFactorExpire = undefined;
      await user.save({ validateBeforeSave: false });

      await AuditService.logEvent({
        userId: user._id,
        action: "LOGIN_2FA_EMAIL_FAILED",
        req,
        errorMessage: "Failed to send 2FA email"
      });

      const error = new Error("Failed to send 2FA code. Please try again.");
      error.statusCode = 500;
      throw error;
    }
  }

  // No 2FA - proceed with normal login
  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  const sessionId = await user.addRefreshToken(
    refreshToken,
    parseUserAgent(req.headers["user-agent"]),
    getClientIP(req),
    req.headers["user-agent"]
  );
  await user.recordLogin(req.headers["user-agent"]);

  // Publish user login event
  await publishEvent(TOPICS.USER_EVENTS, EVENT_TYPES.USER_LOGIN, {
    userId: user._id.toString(),
    method: "email",
    device: parseUserAgent(req.headers["user-agent"]),
    ipAddress: getClientIP(req),
    userAgent: req.headers["user-agent"],
    sessionId
  }, {
    userId: user._id.toString(),
    sessionId
  });

  await AuditService.logEvent({
    userId: user._id,
    action: "LOGIN",
    req,
    sessionId
  });

  res.json({ token, refreshToken, user });
});

/**
 * Login with Google OAuth
 */
export const loginWithGoogle = asyncHandler(async (req, res) => {
  const { idToken } = googleLoginSchema.parse(req.body);

  const oauthClient = initializeGoogleOAuth();
  if (!oauthClient) {
    const error = new Error("Google OAuth not configured");
    error.statusCode = 500;
    throw error;
  }

  const ticket = await oauthClient.verifyIdToken({
    idToken,
    audience: process.env.WEB_CLIENT_ID ? [process.env.GOOGLE_CLIENT_ID, process.env.WEB_CLIENT_ID] : process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { sub, email, name } = payload;

  let user = await UserModel.findOne({ provider: "google", providerId: sub });
  if (!user) {
    user = await User.create({
      name,
      email,
      provider: "google",
      providerId: sub,
    });
  }

  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  const sessionId = await user.addRefreshToken(
    refreshToken,
    parseUserAgent(req.headers["user-agent"]),
    getClientIP(req),
    req.headers["user-agent"]
  );
  await user.recordLogin(req.headers["user-agent"]);

  await AuditService.logEvent({
    userId: user._id,
    action: "GOOGLE_LOGIN",
    req,
    sessionId
  });

  res.json({ token, refreshToken, user });
});

/**
 * Logout - Revoke specific refresh token
 */
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    const error = new Error("Refresh token required for logout");
    error.statusCode = 400;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    const error = new Error("Invalid or expired token");
    error.statusCode = 401;
    throw error;
  }

  const user = await UserModel.findById(decoded.id);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const tokenData = await user.hasRefreshToken(refreshToken);
  if (!tokenData) {
    const error = new Error("Invalid refresh token");
    error.statusCode = 401;
    throw error;
  }

  await user.revokeRefreshToken(refreshToken);

  // Publish user logout event
  await publishEvent(TOPICS.USER_EVENTS, EVENT_TYPES.USER_LOGOUT, {
    userId: user._id.toString(),
    sessionId: tokenData.sessionId,
    reason: "manual"
  }, {
    userId: user._id.toString(),
    sessionId: tokenData.sessionId
  });

  await AuditService.logEvent({
    userId: user._id,
    action: "LOGOUT",
    req,
    sessionId: tokenData.sessionId
  });

  res.json({ message: "Logged out successfully" });
});

/**
 * Logout from all devices - Revoke all refresh tokens
 */
export const logoutAll = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  await user.revokeAllRefreshTokens();

  await AuditService.logEvent({
    userId: user._id,
    action: "LOGOUT_ALL",
    req
  });

  res.json({ message: "Logged out from all devices" });
});

/**
 * Verify 2FA Code and Complete Login
 */
export const verifyTwoFactor = asyncHandler(async (req, res) => {
  const { userId, code } = twoFactorVerifySchema.parse(req.body);

  const user = await UserModel.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const isValid = user.verifyTwoFactorCode(code);
  if (!isValid) {
    await AuditService.logEvent({
      userId: user._id,
      action: "VERIFY_2FA_FAILED",
      req,
      errorMessage: "Invalid 2FA code"
    });
    const error = new Error("Invalid or expired 2FA code");
    error.statusCode = 401;
    throw error;
  }

  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  const sessionId = await user.addRefreshToken(
    refreshToken,
    parseUserAgent(req.headers["user-agent"]),
    getClientIP(req),
    req.headers["user-agent"]
  );
  await user.recordLogin(req.headers["user-agent"]);
  await user.save();

  await AuditService.logEvent({
    userId: user._id,
    action: "VERIFY_2FA_SUCCESS",
    req,
    sessionId
  });

  await AuditService.logEvent({
    userId: user._id,
    action: "LOGIN",
    req,
    sessionId
  });

  res.json({
    message: "Login successful",
    token,
    refreshToken,
    user,
  });
});

/**
 * Enable 2FA for User
 */
export const enableTwoFactor = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  user.enableTwoFactor();
  await user.save();

  await AuditService.logEvent({
    userId: user._id,
    action: "ENABLE_2FA",
    req
  });

  res.json({
    success: true,
    message: "Two-factor authentication enabled",
  });
});

/**
 * Disable 2FA for User
 */
export const disableTwoFactor = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  user.disableTwoFactor();
  await user.save();

  await AuditService.logEvent({
    userId: user._id,
    action: "DISABLE_2FA",
    req
  });

  res.json({
    success: true,
    message: "Two-factor authentication disabled",
  });
});

/**
 * Get 2FA Status for User
 */
export const getTwoFactorStatus = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    twoFactorEnabled: user.twoFactorEnabled,
    twoFactorVerified: user.twoFactorVerified,
  });
});

/**
 * Forgot Password — Send Reset Token via Email
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await UserModel.findOne({ email });
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    // Send password reset email using Brevo
    await sendPasswordResetEmail(user.email, resetToken, user.name);

    await AuditService.logEvent({
      userId: user._id,
      action: "PASSWORD_RESET_REQUEST",
      req
    });

    res.json({
      message: "Password reset link sent successfully to your email",
    });
  } catch (emailError) {
    console.error("Password reset email failed:", emailError);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    await AuditService.logEvent({
      userId: user._id,
      action: "PASSWORD_RESET_EMAIL_FAILED",
      req,
      errorMessage: "Failed to send password reset email"
    });

    const error = new Error("Failed to send password reset email. Please try again.");
    error.statusCode = 500;
    throw error;
  }
});

/**
 * Reset Password — Verify token and set new password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = hashToken(token);

  const user = await UserModel.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    const error = new Error("Invalid or expired password reset token");
    error.statusCode = 400;
    throw error;
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  await AuditService.logEvent({
    userId: user._id,
    action: "PASSWORD_RESET_SUCCESS",
    req
  });

  res.json({ message: "Password reset successful. You can now log in." });
});

/**
 * Change Password (Authenticated User)
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await UserModel.findById(req.user.id).select("+password");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    await AuditService.logEvent({
      userId: user._id,
      action: "PASSWORD_CHANGE_FAILED",
      req,
      errorMessage: "Current password is incorrect"
    });
    const error = new Error("Current password is incorrect");
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  await user.save();

  // Publish password changed event
  await publishEvent(TOPICS.USER_EVENTS, EVENT_TYPES.USER_PASSWORD_CHANGED, {
    userId: user._id.toString(),
    changedAt: new Date().toISOString()
  }, {
    userId: user._id.toString()
  });

  await AuditService.logEvent({
    userId: user._id,
    action: "PASSWORD_CHANGE_SUCCESS",
    req
  });

  res.json({ success: true, message: "Password updated successfully" });
});

/**
 * Get Geolocation Data for Current IP
 */
export const getGeolocation = asyncHandler(async (req, res) => {
  const ip = getClientIP(req);

  try {
    const locationData = await AuditService.getLocationData(ip);

    res.json({
      success: true,
      ip,
      location: locationData,
      cached: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get geolocation data",
      ip,
    });
  }
});

/**
 * Refresh Access Token - Rotate refresh tokens for security
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = refreshSchema.parse(req.body);

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    const error = new Error("Invalid or expired refresh token");
    error.statusCode = 403;
    throw error;
  }

  const user = await UserModel.findById(decoded.id);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const tokenData = await user.hasRefreshToken(refreshToken);
  if (!tokenData) {
    const error = new Error("Refresh token not recognized or already revoked");
    error.statusCode = 403;
    throw error;
  }

  const newAccess = user.generateAuthToken();
  const newRefresh = user.generateRefreshToken();

  await user.revokeRefreshToken(refreshToken);
  const newSessionId = await user.addRefreshToken(
    newRefresh,
    tokenData.device,
    tokenData.ipAddress,
    tokenData.userAgent
  );

  await AuditService.logEvent({
    userId: user._id,
    action: "TOKEN_REFRESH",
    req,
    sessionId: newSessionId,
    refreshTokenId: tokenData.sessionId
  });

  res.json({
    message: "Token refreshed successfully",
    token: newAccess,
    refreshToken: newRefresh,
  });
});
