import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  street: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country: { type: String, trim: true, default: "India" },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
});

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  relationship: { type: String, trim: true },
  mobile: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
});

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Personal Information
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer-not-to-say"],
    },

    // Contact Information
    alternateEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Invalid email format",
      },
    },

    // Address Information
    addresses: [addressSchema],
    defaultAddressIndex: {
      type: Number,
      default: 0,
    },

    // Emergency Contact
    emergencyContacts: [emergencyContactSchema],

    // Professional Information (for shop owners, riders)
    businessName: {
      type: String,
      trim: true,
    },
    businessType: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },

    // Medical Information (optional)
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    allergies: [{
      type: String,
      trim: true,
    }],
    medicalConditions: [{
      type: String,
      trim: true,
    }],

    // Social Links
    socialLinks: {
      facebook: { type: String, trim: true },
      twitter: { type: String, trim: true },
      instagram: { type: String, trim: true },
      linkedin: { type: String, trim: true },
    },

    // Verification Status
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationDocuments: [{
      type: {
        type: String,
        enum: ["aadhar", "pan", "license", "passport"],
      },
      documentId: { type: String },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      uploadedAt: { type: Date, default: Date.now },
    }],

    // Activity Tracking
    lastProfileUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes
userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ "addresses.city": 1 });
userProfileSchema.index({ "addresses.state": 1 });
userProfileSchema.index({ businessType: 1 });

// Pre-save middleware to update lastProfileUpdate
userProfileSchema.pre("save", function (next) {
  this.lastProfileUpdate = new Date();
  next();
});

const UserProfile = mongoose.model("UserProfile", userProfileSchema);
export default UserProfile;
