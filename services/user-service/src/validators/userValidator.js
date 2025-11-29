import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be less than 50 characters").optional(),
  mobile: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid mobile number format").optional(),
  countryCode: z.string().min(1, "Country code is required").max(5, "Invalid country code").optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Current password must be at least 6 characters"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const updatePreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  language: z.enum(["en", "hi", "bn", "te", "mr", "ta", "gu"]).optional(),
  timezone: z.string().optional(),
});

export const getUsersSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  role: z.enum(["user", "shop-owner", "admin", "rider"]).optional(),
  isActive: z.string().transform(val => val === "true").optional(),
});

export const userIdSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
});
