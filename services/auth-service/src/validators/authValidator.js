import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(10),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const twoFactorVerifySchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  code: z.string().min(6, "Verification code must be 6 digits").max(6, "Verification code must be 6 digits"),
});
