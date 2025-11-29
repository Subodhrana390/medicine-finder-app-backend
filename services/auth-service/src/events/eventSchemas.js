import { z } from "zod";

// Base event schema
const baseEventSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  timestamp: z.string().datetime(),
  service: z.string(),
  version: z.string().default("1.0"),
  data: z.any(),
  metadata: z.object({
    correlationId: z.string().optional(),
    userId: z.string().optional(),
    sessionId: z.string().optional()
  }).optional()
});

// User registered event
export const userRegisteredSchema = baseEventSchema.extend({
  type: z.literal("user.registered"),
  data: z.object({
    userId: z.string(),
    email: z.string().email(),
    name: z.string(),
    provider: z.enum(["local", "google", "github", "apple", "otp", "firebase"]),
    providerId: z.string().optional(),
    role: z.enum(["user", "shop-owner", "admin", "rider"]).default("user"),
    isActive: z.boolean().default(true),
    emailVerified: z.boolean().default(false)
  })
});

// User updated event
export const userUpdatedSchema = baseEventSchema.extend({
  type: z.literal("user.updated"),
  data: z.object({
    userId: z.string(),
    changes: z.record(z.any()),
    updatedBy: z.string().optional() // admin user ID if updated by admin
  })
});

// User deleted event
export const userDeletedSchema = baseEventSchema.extend({
  type: z.literal("user.deleted"),
  data: z.object({
    userId: z.string(),
    deletedBy: z.string().optional(),
    reason: z.string().optional()
  })
});

// User login event
export const userLoginSchema = baseEventSchema.extend({
  type: z.literal("user.login"),
  data: z.object({
    userId: z.string(),
    method: z.enum(["email", "google", "otp"]),
    device: z.string(),
    ipAddress: z.string(),
    userAgent: z.string(),
    sessionId: z.string()
  })
});

// User logout event
export const userLogoutSchema = baseEventSchema.extend({
  type: z.literal("user.logout"),
  data: z.object({
    userId: z.string(),
    sessionId: z.string(),
    reason: z.enum(["manual", "token_expired", "all_devices"]).default("manual")
  })
});

// Password changed event
export const passwordChangedSchema = baseEventSchema.extend({
  type: z.literal("user.password_changed"),
  data: z.object({
    userId: z.string(),
    changedAt: z.string().datetime()
  })
});

// Token refreshed event
export const tokenRefreshedSchema = baseEventSchema.extend({
  type: z.literal("auth.token_refreshed"),
  data: z.object({
    userId: z.string(),
    sessionId: z.string(),
    oldTokenId: z.string(),
    newTokenId: z.string()
  })
});

// Password reset events
export const passwordResetRequestedSchema = baseEventSchema.extend({
  type: z.literal("auth.password_reset_requested"),
  data: z.object({
    email: z.string().email(),
    resetTokenId: z.string(),
    expiresAt: z.string().datetime()
  })
});

export const passwordResetCompletedSchema = baseEventSchema.extend({
  type: z.literal("auth.password_reset_completed"),
  data: z.object({
    userId: z.string(),
    resetAt: z.string().datetime()
  })
});

// 2FA events
export const twoFaEnabledSchema = baseEventSchema.extend({
  type: z.literal("auth.two_fa_enabled"),
  data: z.object({
    userId: z.string(),
    enabledAt: z.string().datetime()
  })
});

export const twoFaDisabledSchema = baseEventSchema.extend({
  type: z.literal("auth.two_fa_disabled"),
  data: z.object({
    userId: z.string(),
    disabledAt: z.string().datetime()
  })
});

// System events
export const serviceStartedSchema = baseEventSchema.extend({
  type: z.literal("system.service_started"),
  data: z.object({
    serviceName: z.string(),
    version: z.string(),
    environment: z.string(),
    port: z.number()
  })
});

export const serviceStoppedSchema = baseEventSchema.extend({
  type: z.literal("system.service_stopped"),
  data: z.object({
    serviceName: z.string(),
    uptime: z.number(), // in milliseconds
    reason: z.string().optional()
  })
});

export const databaseConnectedSchema = baseEventSchema.extend({
  type: z.literal("system.database_connected"),
  data: z.object({
    serviceName: z.string(),
    databaseType: z.string(),
    connectionString: z.string().optional() // without sensitive data
  })
});
