import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, default: "India" },
  coordinates: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 }
  }
});

const operatingHoursSchema = new mongoose.Schema({
  monday: {
    open: { type: String, default: "09:00" },
    close: { type: String, default: "21:00" },
    isOpen: { type: Boolean, default: true }
  },
  tuesday: {
    open: { type: String, default: "09:00" },
    close: { type: String, default: "21:00" },
    isOpen: { type: Boolean, default: true }
  },
  wednesday: {
    open: { type: String, default: "09:00" },
    close: { type: String, default: "21:00" },
    isOpen: { type: Boolean, default: true }
  },
  thursday: {
    open: { type: String, default: "09:00" },
    close: { type: String, default: "21:00" },
    isOpen: { type: Boolean, default: true }
  },
  friday: {
    open: { type: String, default: "09:00" },
    close: { type: String, default: "21:00" },
    isOpen: { type: Boolean, default: true }
  },
  saturday: {
    open: { type: String, default: "09:00" },
    close: { type: String, default: "21:00" },
    isOpen: { type: Boolean, default: true }
  },
  sunday: {
    open: { type: String, default: "10:00" },
    close: { type: String, default: "18:00" },
    isOpen: { type: Boolean, default: false }
  }
});

const medicalShopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
      maxlength: [100, "Shop name cannot exceed 100 characters"]
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required"]
    },

    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
      trim: true
    },

    gstNumber: {
      type: String,
      trim: true,
      sparse: true
    },

    contactInfo: {
      phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true
      },
      alternatePhone: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
          validator: function (v) {
            return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: "Invalid email format"
        }
      }
    },

    address: addressSchema,

    operatingHours: operatingHoursSchema,

    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      trim: true
    },

    images: [{
      url: { type: String, required: true },
      alt: { type: String, default: "" },
      isPrimary: { type: Boolean, default: false }
    }],

    services: [{
      type: String,
      enum: ["24/7", "home-delivery", "online-ordering", "prescription-upload", "teleconsultation"],
      trim: true
    }],

    ratings: {
      average: { type: Number, min: 0, max: 5, default: 0 },
      count: { type: Number, default: 0 }
    },

    status: {
      type: String,
      enum: ["pending", "active", "inactive", "suspended"],
      default: "pending"
    },

    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified"
    },

    documents: {
      license: { type: String }, // File path/URL
      gstCertificate: { type: String },
      addressProof: { type: String }
    },

    deliveryRadius: {
      type: Number, // in kilometers
      default: 5,
      min: 1,
      max: 50
    },

    deliveryFee: {
      type: Number, // in rupees
      default: 0,
      min: 0
    },

    minimumOrder: {
      type: Number, // in rupees
      default: 0,
      min: 0
    },

    paymentMethods: [{
      type: String,
      enum: ["cash", "card", "upi", "net-banking", "wallet"],
      default: ["cash"]
    }],

    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  },
  { timestamps: true }
);

// Indexes for better query performance
medicalShopSchema.index({ "address.coordinates": "2dsphere" });
medicalShopSchema.index({ name: "text", description: "text" });
medicalShopSchema.index({ ownerId: 1 });
medicalShopSchema.index({ status: 1 });
medicalShopSchema.index({ verificationStatus: 1 });
medicalShopSchema.index({ "ratings.average": -1 });

// Virtual for full address
medicalShopSchema.virtual("fullAddress").get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Instance method to check if shop is currently open
medicalShopSchema.methods.isOpenNow = function() {
  const now = new Date();
  const dayName = now.toLocaleLowerCase('en-US', { weekday: 'long' });
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  const todayHours = this.operatingHours[dayName];
  if (!todayHours || !todayHours.isOpen) return false;

  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

// Instance method to calculate distance from coordinates
medicalShopSchema.methods.calculateDistance = function(lat, lng) {
  if (!this.address.coordinates) return null;

  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat - this.address.coordinates.latitude) * Math.PI / 180;
  const dLng = (lng - this.address.coordinates.longitude) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.address.coordinates.latitude * Math.PI / 180) *
    Math.cos(lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

// Static method to find nearby shops
medicalShopSchema.statics.findNearby = function(lat, lng, maxDistance = 10) {
  return this.find({
    "address.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    },
    status: "active",
    verificationStatus: "verified"
  });
};

const MedicalShop = mongoose.model("MedicalShop", medicalShopSchema);
export default MedicalShop;
