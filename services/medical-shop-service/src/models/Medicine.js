import mongoose from "mongoose";

const dosageFormSchema = new mongoose.Schema({
  form: {
    type: String,
    required: true,
    enum: ["tablet", "capsule", "syrup", "injection", "cream", "ointment", "drops", "powder", "gel", "lozenge", "inhaler", "patch"]
  },
  strength: {
    type: String,
    required: true,
    trim: true
  },
  unit: {
    type: String,
    enum: ["mg", "ml", "mcg", "g", "IU", "%", "units"],
    default: "mg"
  }
});

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Medicine name is required"],
      trim: true,
      maxlength: [200, "Medicine name cannot exceed 200 characters"]
    },

    genericName: {
      type: String,
      trim: true,
      maxlength: [200, "Generic name cannot exceed 200 characters"]
    },

    brand: {
      type: String,
      trim: true,
      maxlength: [100, "Brand name cannot exceed 100 characters"]
    },

    manufacturer: {
      type: String,
      required: [true, "Manufacturer is required"],
      trim: true,
      maxlength: [100, "Manufacturer name cannot exceed 100 characters"]
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "analgesic", "antibiotic", "antiviral", "antifungal", "antihistamine",
        "antihypertensive", "antidiabetic", "cardiovascular", "respiratory",
        "gastrointestinal", "neurological", "psychiatric", "dermatological",
        "ophthalmic", "otolaryngology", "dental", "endocrine", "urological",
        "gynecological", "pediatric", "geriatric", "veterinary", "supplement",
        "herbal", "homeopathic", "ayurvedic", "other"
      ]
    },

    subcategory: {
      type: String,
      trim: true
    },

    dosageForms: [dosageFormSchema],

    composition: [{
      ingredient: {
        type: String,
        required: true,
        trim: true
      },
      strength: {
        type: String,
        trim: true
      },
      unit: {
        type: String,
        enum: ["mg", "ml", "mcg", "g", "IU", "%", "units"],
        default: "mg"
      }
    }],

    prescriptionRequired: {
      type: Boolean,
      default: false
    },

    schedule: {
      type: String,
      enum: ["schedule-h", "schedule-h1", "schedule-x", "otc"],
      default: "otc"
    },

    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      trim: true
    },

    indications: [{
      type: String,
      trim: true
    }],

    contraindications: [{
      type: String,
      trim: true
    }],

    sideEffects: [{
      type: String,
      trim: true
    }],

    dosageInstructions: {
      type: String,
      maxlength: [500, "Dosage instructions cannot exceed 500 characters"],
      trim: true
    },

    storageInstructions: {
      type: String,
      maxlength: [300, "Storage instructions cannot exceed 300 characters"],
      trim: true
    },

    shelfLife: {
      type: Number, // in months
      min: 1,
      max: 120
    },

    images: [{
      url: { type: String, required: true },
      alt: { type: String, default: "" },
      isPrimary: { type: Boolean, default: false }
    }],

    barcodes: [{
      type: String,
      trim: true,
      unique: true,
      sparse: true
    }],

    regulatoryInfo: {
      drugLicenseNumber: { type: String, trim: true },
      batchNumber: { type: String, trim: true },
      expiryDate: { type: Date },
      approvalDate: { type: Date },
      fdaApproved: { type: Boolean, default: false }
    },

    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],

    status: {
      type: String,
      enum: ["active", "discontinued", "out-of-stock"],
      default: "active"
    },

    metadata: {
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      verified: {
        type: Boolean,
        default: false
      },
      verificationDate: { type: Date }
    }
  },
  { timestamps: true }
);

// Indexes for better query performance
medicineSchema.index({ name: "text", genericName: "text", brand: "text" });
medicineSchema.index({ category: 1, subcategory: 1 });
medicineSchema.index({ manufacturer: 1 });
medicineSchema.index({ prescriptionRequired: 1 });
medicineSchema.index({ "barcodes": 1 });
medicineSchema.index({ status: 1 });

// Virtual for primary image
medicineSchema.virtual("primaryImage").get(function() {
  return this.images.find(img => img.isPrimary) || this.images[0];
});

// Instance method to check if medicine is expired
medicineSchema.methods.isExpired = function() {
  if (!this.regulatoryInfo.expiryDate) return false;
  return new Date() > this.regulatoryInfo.expiryDate;
};

// Instance method to get days until expiry
medicineSchema.methods.daysUntilExpiry = function() {
  if (!this.regulatoryInfo.expiryDate) return null;

  const today = new Date();
  const expiry = new Date(this.regulatoryInfo.expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Static method to find medicines by category
medicineSchema.statics.findByCategory = function(category, includeDiscontinued = false) {
  const query = { category };
  if (!includeDiscontinued) {
    query.status = { $ne: "discontinued" };
  }
  return this.find(query);
};

// Static method to search medicines
medicineSchema.statics.searchMedicines = function(searchTerm, limit = 20) {
  return this.find(
    {
      $text: { $search: searchTerm },
      status: { $ne: "discontinued" }
    },
    { score: { $meta: "textScore" } }
  )
  .sort({ score: { $meta: "textScore" } })
  .limit(limit);
};

// Static method to find prescription medicines
medicineSchema.statics.findPrescriptionMedicines = function() {
  return this.find({
    prescriptionRequired: true,
    status: "active"
  });
};

const Medicine = mongoose.model("Medicine", medicineSchema);
export default Medicine;
