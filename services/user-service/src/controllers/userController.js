import UserPreferences from "../models/UserPreferences.js";
import UserProfile from "../models/UserProfile.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  updateProfileSchema,
  changePasswordSchema,
  updatePreferencesSchema,
  getUsersSchema,
  userIdSchema,
} from "../validators/userValidator.js";
import {
  getUserFromAuthService,
  updateUserInAuthService,
  deleteUserFromAuthService,
} from "../services/authService.js";
import {
  formatUserResponse,
  getPaginationInfo,
  buildSearchQuery,
} from "../utils/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get current user profile
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await getUserFromAuthService(req.user.id);
  const preferences = await UserPreferences.findOne({ userId: req.user.id }).lean();
  const profile = await UserProfile.findOne({ userId: req.user.id }).lean();

  res.json({
    success: true,
    user: formatUserResponse(user),
    preferences: preferences || {},
    profile: profile || {},
  });
});

/**
 * Update current user profile
 */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, mobile, countryCode } = updateProfileSchema.parse(req.body);

  const updatedUser = await updateUserInAuthService(req.user.id, {
    name,
    mobile,
    countryCode,
  });

  // Update profile last update time
  await UserProfile.findOneAndUpdate(
    { userId: req.user.id },
    { lastProfileUpdate: new Date() },
    { upsert: true, new: true }
  );

  res.json({
    success: true,
    message: "Profile updated successfully",
    user: formatUserResponse(updatedUser),
  });
});

/**
 * Upload/Update user avatar
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error("No file uploaded");
    error.statusCode = 400;
    throw error;
  }

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;

  // Update user avatar in auth service
  const updatedUser = await updateUserInAuthService(req.user.id, {
    avatar: avatarUrl,
  });

  res.json({
    success: true,
    message: "Avatar uploaded successfully",
    avatar: avatarUrl,
    user: formatUserResponse(updatedUser),
  });
});

/**
 * Delete user avatar
 */
export const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await getUserFromAuthService(req.user.id);

  if (user.avatar) {
    // Delete file from filesystem
    const filePath = path.join(__dirname, "../../", user.avatar);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update user avatar to empty in auth service
    await updateUserInAuthService(req.user.id, { avatar: "" });
  }

  res.json({
    success: true,
    message: "Avatar deleted successfully",
  });
});

/**
 * Get user preferences
 */
export const getMyPreferences = asyncHandler(async (req, res) => {
  const preferences = await UserPreferences.findOne({ userId: req.user.id }).lean();

  res.json({
    success: true,
    preferences: preferences || {},
  });
});

/**
 * Update user preferences
 */
export const updateMyPreferences = asyncHandler(async (req, res) => {
  const preferencesData = updatePreferencesSchema.parse(req.body);

  const preferences = await UserPreferences.findOneAndUpdate(
    { userId: req.user.id },
    preferencesData,
    { upsert: true, new: true }
  );

  res.json({
    success: true,
    message: "Preferences updated successfully",
    preferences,
  });
});

/**
 * Get extended user profile
 */
export const getMyExtendedProfile = asyncHandler(async (req, res) => {
  const profile = await UserProfile.findOne({ userId: req.user.id })
    .populate("userId", "name email")
    .lean();

  res.json({
    success: true,
    profile: profile || {},
  });
});

/**
 * Update extended user profile
 */
export const updateMyExtendedProfile = asyncHandler(async (req, res) => {
  const profileData = req.body;

  const profile = await UserProfile.findOneAndUpdate(
    { userId: req.user.id },
    profileData,
    { upsert: true, new: true }
  );

  res.json({
    success: true,
    message: "Extended profile updated successfully",
    profile,
  });
});

/**
 * Get user by ID (Admin only)
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { userId } = userIdSchema.parse(req.params);

  const user = await getUserFromAuthService(userId);
  const preferences = await UserPreferences.findOne({ userId }).lean();
  const profile = await UserProfile.findOne({ userId }).lean();

  res.json({
    success: true,
    user: formatUserResponse(user, true),
    preferences: preferences || {},
    profile: profile || {},
  });
});

/**
 * Get all users with pagination (Admin only)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, role, isActive } = getUsersSchema.parse(req.query);

  // Build filter
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive;

  // Note: For now, we'll return basic user data
  // In a real implementation, you might want to sync users to this service
  // or implement a more sophisticated cross-service query

  res.json({
    success: true,
    message: "This endpoint requires cross-service implementation",
    pagination: getPaginationInfo(page, limit, 0),
    users: [],
  });
});

/**
 * Update user (Admin only)
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { userId } = userIdSchema.parse(req.params);
  const updateData = req.body;

  const updatedUser = await updateUserInAuthService(userId, updateData);

  res.json({
    success: true,
    message: "User updated successfully",
    user: formatUserResponse(updatedUser, true),
  });
});

/**
 * Delete user (Admin only)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = userIdSchema.parse(req.params);

  // Delete user from auth service
  await deleteUserFromAuthService(userId);

  // Delete related data
  await UserPreferences.findOneAndDelete({ userId });
  await UserProfile.findOneAndDelete({ userId });

  res.json({
    success: true,
    message: "User deleted successfully",
  });
});

/**
 * Deactivate user account
 */
export const deactivateAccount = asyncHandler(async (req, res) => {
  await updateUserInAuthService(req.user.id, { isActive: false });

  res.json({
    success: true,
    message: "Account deactivated successfully",
  });
});

/**
 * Reactivate user account (Admin only)
 */
export const reactivateAccount = asyncHandler(async (req, res) => {
  const { userId } = userIdSchema.parse(req.params);

  await updateUserInAuthService(userId, { isActive: true });

  res.json({
    success: true,
    message: "Account reactivated successfully",
  });
});

/**
 * Get user statistics (Admin only)
 */
export const getUserStats = asyncHandler(async (req, res) => {
  // This would typically aggregate data from multiple sources
  // For now, return basic stats from this service

  const totalUsers = await UserProfile.countDocuments();
  const totalPreferences = await UserPreferences.countDocuments();
  const verifiedUsers = await UserProfile.countDocuments({ isVerified: true });

  res.json({
    success: true,
    stats: {
      totalProfiles: totalUsers,
      totalPreferences: totalPreferences,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
    },
  });
});
