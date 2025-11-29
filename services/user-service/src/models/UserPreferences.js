import mongoose from "mongoose";

const userPreferencesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Notification preferences
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: false,
    },

    // App preferences
    language: {
      type: String,
      enum: ["en", "hi", "bn", "te", "mr", "ta", "gu"],
      default: "en",
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    // UI preferences
    theme: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: "auto",
    },

    // Location preferences
    locationSharing: {
      type: Boolean,
      default: false,
    },

    // Privacy settings
    profileVisibility: {
      type: String,
      enum: ["public", "private", "friends"],
      default: "public",
    },

    // Marketing preferences
    marketingEmails: {
      type: Boolean,
      default: false,
    },
    promotionalSMS: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
userPreferencesSchema.index({ userId: 1 });

const UserPreferences = mongoose.model("UserPreferences", userPreferencesSchema);
export default UserPreferences;
