import { z } from "zod";

// Pricing validation schema
const pricingSchema = z.object({
  costPrice: z.number().min(0.01, "Cost price must be greater than 0"),
  sellingPrice: z.number().min(0.01, "Selling price must be greater than 0"),
  mrp: z.number().min(0.01, "MRP must be greater than 0"),
  discountPercentage: z.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%").default(0),
  taxPercentage: z.number().min(0, "Tax cannot be negative").max(100, "Tax cannot exceed 100%").default(0)
});

// Supplier validation schema
const supplierSchema = z.object({
  name: z.string().min(2, "Supplier name must be at least 2 characters").max(100, "Supplier name cannot exceed 100 characters"),
  contact: z.string().min(10, "Contact must be at least 10 characters").optional(),
  invoiceNumber: z.string().min(1, "Invoice number is required").optional()
});

// Location validation schema
const locationSchema = z.object({
  rack: z.string().max(20, "Rack identifier cannot exceed 20 characters").optional(),
  shelf: z.string().max(20, "Shelf identifier cannot exceed 20 characters").optional(),
  bin: z.string().max(20, "Bin identifier cannot exceed 20 characters").optional()
});

// Inventory creation validation schema
export const createInventorySchema = z.object({
  medicineId: z.string().min(1, "Medicine ID is required"),
  batchNumber: z.string().min(1, "Batch number is required").max(50, "Batch number cannot exceed 50 characters"),
  quantity: z.number().min(0, "Quantity cannot be negative"),
  unit: z.enum(["tablets", "capsules", "bottles", "tubes", "packs", "strips", "vials", "pieces"]).default("pieces"),
  pricing: pricingSchema,
  supplier: supplierSchema.optional(),
  manufacturingDate: z.string().transform(str => new Date(str)),
  expiryDate: z.string().transform(str => new Date(str)),
  location: locationSchema.optional(),
  alerts: z.object({
    lowStockThreshold: z.number().min(0, "Low stock threshold cannot be negative").default(10),
    expiryAlertDays: z.number().min(0, "Expiry alert days cannot be negative").default(30)
  }).optional()
}).refine(data => data.expiryDate > data.manufacturingDate, {
  message: "Expiry date must be after manufacturing date",
  path: ["expiryDate"]
}).refine(data => data.pricing.sellingPrice <= data.pricing.mrp, {
  message: "Selling price cannot exceed MRP",
  path: ["pricing", "sellingPrice"]
});

// Inventory update validation schema
export const updateInventorySchema = z.object({
  quantity: z.number().min(0).optional(),
  pricing: pricingSchema.optional(),
  supplier: supplierSchema.optional(),
  location: locationSchema.optional(),
  alerts: z.object({
    lowStockThreshold: z.number().min(0).default(10),
    expiryAlertDays: z.number().min(0).default(30)
  }).optional(),
  status: z.enum(["active", "expired", "damaged", "returned"]).optional()
});

// Stock movement validation schema
export const stockMovementSchema = z.object({
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  reason: z.enum(["purchase", "sale", "damage", "expiry", "correction", "transfer"]),
  reference: z.string().optional(),
  notes: z.string().max(200, "Notes cannot exceed 200 characters").optional()
});

// Bulk inventory update validation schema
export const bulkInventoryUpdateSchema = z.object({
  items: z.array(z.object({
    medicineId: z.string().min(1, "Medicine ID is required"),
    batchNumber: z.string().min(1, "Batch number is required"),
    quantity: z.number().min(0),
    pricing: pricingSchema.optional()
  })).min(1, "At least one item is required").max(50, "Cannot update more than 50 items at once")
});

// Inventory search/query validation schema
export const inventorySearchSchema = z.object({
  medicineId: z.string().optional(),
  status: z.enum(["active", "expired", "damaged", "returned", "low-stock"]).optional(),
  lowStockOnly: z.boolean().optional(),
  expiringSoon: z.boolean().optional(),
  daysAhead: z.number().min(1).max(365).default(30),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(["quantity", "expiryDate", "createdAt"]).default("expiryDate"),
  sortOrder: z.enum(["asc", "desc"]).default("asc")
});

// Inventory alert settings validation schema
export const updateAlertSettingsSchema = z.object({
  lowStockThreshold: z.number().min(0, "Low stock threshold cannot be negative"),
  expiryAlertDays: z.number().min(0, "Expiry alert days cannot be negative")
});
