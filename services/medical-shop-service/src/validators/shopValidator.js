import { z } from "zod";

// Address validation schema
const addressSchema = z.object({
  street: z.string().min(5, "Street address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  zipCode: z.string().regex(/^\d{6}$/, "ZIP code must be 6 digits"),
  country: z.string().default("India"),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional()
});

// Operating hours validation schema
const operatingHoursSchema = z.object({
  monday: z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    isOpen: z.boolean()
  }),
  tuesday: z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    isOpen: z.boolean()
  }),
  wednesday: z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    isOpen: z.boolean()
  }),
  thursday: z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    isOpen: z.boolean()
  }),
  friday: z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    isOpen: z.boolean()
  }),
  saturday: z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    isOpen: z.boolean()
  }),
  sunday: z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    isOpen: z.boolean()
  })
});

// Shop creation validation schema
export const createShopSchema = z.object({
  name: z.string().min(3, "Shop name must be at least 3 characters").max(100, "Shop name cannot exceed 100 characters"),
  licenseNumber: z.string().min(5, "License number must be at least 5 characters").max(50, "License number cannot exceed 50 characters"),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST number format").optional(),
  contactInfo: z.object({
    phone: z.string().regex(/^\+91[6-9]\d{9}$/, "Invalid Indian mobile number format"),
    alternatePhone: z.string().regex(/^\+91[6-9]\d{9}$/, "Invalid Indian mobile number format").optional(),
    email: z.string().email("Invalid email format").optional()
  }),
  address: addressSchema,
  operatingHours: operatingHoursSchema,
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  services: z.array(z.enum(["24/7", "home-delivery", "online-ordering", "prescription-upload", "teleconsultation"])).optional(),
  deliveryRadius: z.number().min(1, "Delivery radius must be at least 1 km").max(50, "Delivery radius cannot exceed 50 km").optional(),
  deliveryFee: z.number().min(0, "Delivery fee cannot be negative").optional(),
  minimumOrder: z.number().min(0, "Minimum order cannot be negative").optional(),
  paymentMethods: z.array(z.enum(["cash", "card", "upi", "net-banking", "wallet"])).min(1, "At least one payment method required")
});

// Shop update validation schema
export const updateShopSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  contactInfo: z.object({
    phone: z.string().regex(/^\+91[6-9]\d{9}$/).optional(),
    alternatePhone: z.string().regex(/^\+91[6-9]\d{9}$/).optional(),
    email: z.string().email().optional()
  }).optional(),
  address: addressSchema.optional(),
  operatingHours: operatingHoursSchema.optional(),
  description: z.string().max(500).optional(),
  services: z.array(z.enum(["24/7", "home-delivery", "online-ordering", "prescription-upload", "teleconsultation"])).optional(),
  deliveryRadius: z.number().min(1).max(50).optional(),
  deliveryFee: z.number().min(0).optional(),
  minimumOrder: z.number().min(0).optional(),
  paymentMethods: z.array(z.enum(["cash", "card", "upi", "net-banking", "wallet"])).min(1).optional()
});

// Shop search/query validation schema
export const shopSearchSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  category: z.string().optional(),
  services: z.array(z.string()).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(1).max(50).default(10),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(["distance", "rating", "name"]).default("distance"),
  sortOrder: z.enum(["asc", "desc"]).default("asc")
});

// Shop status update schema
export const updateShopStatusSchema = z.object({
  status: z.enum(["active", "inactive", "suspended"]),
  reason: z.string().min(10, "Reason must be at least 10 characters").optional()
});
