import mongoose from "mongoose";

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true
    },

    // Global preferences
    notificationsEnabled: {
      type: Boolean,
      default: true
    },

    // Channel-specific preferences
    email: {
      enabled: { type: Boolean, default: true },
      frequency: {
        type: String,
        enum: ["immediate", "daily", "weekly", "never"],
        default: "immediate"
      },
      categories: {
        account: { type: Boolean, default: true },
        security: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false },
        transaction: { type: Boolean, default: true },
        system: { type: Boolean, default: true },
        reminder: { type: Boolean, default: true }
      }
    },


    inApp: {
      enabled: { type: Boolean, default: true },
      frequency: {
        type: String,
        enum: ["immediate", "daily", "weekly", "never"],
        default: "immediate"
      },
      categories: {
        account: { type: Boolean, default: true },
        security: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false },
        transaction: { type: Boolean, default: true },
        system: { type: Boolean, default: true },
        reminder: { type: Boolean, default: true }
      }
    },

    // Time-based preferences
    quietHours: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: "22:00" }, // 24-hour format
      endTime: { type: String, default: "08:00" },
      timezone: { type: String, default: "Asia/Kolkata" }
    },

    // Device-specific settings
    devices: [{
      deviceId: { type: String, required: true },
      deviceType: {
        type: String,
        enum: ["mobile", "desktop", "tablet"],
        required: true
      },
      pushToken: String, // FCM token for push notifications
      enabled: { type: Boolean, default: true },
      lastActive: { type: Date, default: Date.now }
    }],

    // Unsubscribe tracking
    unsubscribedCategories: [{
      category: {
        type: String,
        enum: ["account", "security", "marketing", "transaction", "system", "reminder"]
      },
      unsubscribedAt: { type: Date, default: Date.now },
      reason: String
    }],

    // Metadata
    lastUpdated: {
      type: Date,
      default: Date.now
    },

    // Version control for preferences
    version: {
      type: Number,
      default: 1
    }
  },
  { timestamps: true }
);

// Pre-save middleware to update version and lastUpdated
notificationPreferenceSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
    this.lastUpdated = new Date();
  }
  next();
});

// Instance method to check if a notification should be sent
notificationPreferenceSchema.methods.shouldSendNotification = function(type, category) {
  // Check global preference
  if (!this.notificationsEnabled) return false;

  // Check channel-specific preference
  const channelPrefs = this[type];
  if (!channelPrefs || !channelPrefs.enabled) return false;

  // Check category-specific preference
  if (!channelPrefs.categories[category]) return false;

  // Check quiet hours
  if (this.quietHours.enabled && this.isInQuietHours()) {
    return false;
  }

  // Check if category is unsubscribed
  const isUnsubscribed = this.unsubscribedCategories.some(
    item => item.category === category
  );
  if (isUnsubscribed) return false;

  return true;
};

// Helper method to check quiet hours
notificationPreferenceSchema.methods.isInQuietHours = function() {
  if (!this.quietHours.enabled) return false;

  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', {
    hour12: false,
    timeZone: this.quietHours.timezone
  });

  const startTime = this.quietHours.startTime;
  const endTime = this.quietHours.endTime;

  if (startTime < endTime) {
    // Same day range (e.g., 08:00 to 18:00)
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Overnight range (e.g., 22:00 to 08:00)
    return currentTime >= startTime || currentTime <= endTime;
  }
};

const NotificationPreference = mongoose.model("NotificationPreference", notificationPreferenceSchema);
export default NotificationPreference;
