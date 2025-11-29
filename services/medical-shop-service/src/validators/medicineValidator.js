import { z } from "zod";

// Dosage form validation schema
const dosageFormSchema = z.object({
  form: z.enum(["tablet", "capsule", "syrup", "injection", "cream", "ointment", "drops", "powder", "gel", "lozenge", "inhaler", "patch"]),
  strength: z.string().min(1, "Strength is required"),
  unit: z.enum(["mg", "ml", "mcg", "g", "IU", "%", "units"]).default("mg")
});

// Composition validation schema
const compositionSchema = z.object({
  ingredient: z.string().min(1, "Ingredient name is required"),
  strength: z.string().optional(),
  unit: z.enum(["mg", "ml", "mcg", "g", "IU", "%", "units"]).default("mg")
});

// Medicine creation validation schema
export const createMedicineSchema = z.object({
  name: z.string().min(2, "Medicine name must be at least 2 characters").max(200, "Medicine name cannot exceed 200 characters"),
  genericName: z.string().max(200, "Generic name cannot exceed 200 characters").optional(),
  brand: z.string().max(100, "Brand name cannot exceed 100 characters").optional(),
  manufacturer: z.string().min(2, "Manufacturer is required").max(100, "Manufacturer name cannot exceed 100 characters"),
  category: z.enum([
    "analgesic", "antibiotic", "antiviral", "antifungal", "antihistamine",
    "antihypertensive", "antidiabetic", "cardiovascular", "respiratory",
    "gastrointestinal", "neurological", "psychiatric", "dermatological",
    "ophthalmic", "otolaryngology", "dental", "endocrine", "urological",
    "gynecological", "pediatric", "geriatric", "veterinary", "supplement",
    "herbal", "homeopathic", "ayurvedic", "other"
  ]),
  subcategory: z.string().optional(),
  dosageForms: z.array(dosageFormSchema).min(1, "At least one dosage form is required"),
  composition: z.array(compositionSchema).optional(),
  prescriptionRequired: z.boolean().default(false),
  schedule: z.enum(["schedule-h", "schedule-h1", "schedule-x", "otc"]).default("otc"),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
  indications: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),
  sideEffects: z.array(z.string()).optional(),
  dosageInstructions: z.string().max(500, "Dosage instructions cannot exceed 500 characters").optional(),
  storageInstructions: z.string().max(300, "Storage instructions cannot exceed 300 characters").optional(),
  shelfLife: z.number().min(1, "Shelf life must be at least 1 month").max(120, "Shelf life cannot exceed 120 months").optional(),
  barcodes: z.array(z.string()).optional(),
  regulatoryInfo: z.object({
    drugLicenseNumber: z.string().optional(),
    batchNumber: z.string().optional(),
    expiryDate: z.string().transform(str => new Date(str)).optional(),
    approvalDate: z.string().transform(str => new Date(str)).optional(),
    fdaApproved: z.boolean().default(false)
  }).optional(),
  tags: z.array(z.string()).optional()
});

// Medicine update validation schema
export const updateMedicineSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  genericName: z.string().max(200).optional(),
  brand: z.string().max(100).optional(),
  manufacturer: z.string().min(2).max(100).optional(),
  category: z.enum([
    "analgesic", "antibiotic", "antiviral", "antifungal", "antihistamine",
    "antihypertensive", "antidiabetic", "cardiovascular", "respiratory",
    "gastrointestinal", "neurological", "psychiatric", "dermatological",
    "ophthalmic", "otolaryngology", "dental", "endocrine", "urological",
    "gynecological", "pediatric", "geriatric", "veterinary", "supplement",
    "herbal", "homeopathic", "ayurvedic", "other"
  ]).optional(),
  subcategory: z.string().optional(),
  dosageForms: z.array(dosageFormSchema).min(1).optional(),
  composition: z.array(compositionSchema).optional(),
  prescriptionRequired: z.boolean().optional(),
  schedule: z.enum(["schedule-h", "schedule-h1", "schedule-x", "otc"]).optional(),
  description: z.string().max(1000).optional(),
  indications: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),
  sideEffects: z.array(z.string()).optional(),
  dosageInstructions: z.string().max(500).optional(),
  storageInstructions: z.string().max(300).optional(),
  shelfLife: z.number().min(1).max(120).optional(),
  barcodes: z.array(z.string()).optional(),
  regulatoryInfo: z.object({
    drugLicenseNumber: z.string().optional(),
    batchNumber: z.string().optional(),
    expiryDate: z.string().transform(str => new Date(str)).optional(),
    approvalDate: z.string().transform(str => new Date(str)).optional(),
    fdaApproved: z.boolean().default(false)
  }).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["active", "discontinued", "out-of-stock"]).optional()
});

// Medicine search/query validation schema
export const medicineSearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
  prescriptionRequired: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc")
});

// Medicine bulk import validation schema
export const bulkImportSchema = z.object({
  medicines: z.array(createMedicineSchema).min(1, "At least one medicine is required").max(100, "Cannot import more than 100 medicines at once")
});
