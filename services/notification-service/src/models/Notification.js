import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: ["email", "in_app"],
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true
    },

    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NotificationTemplate"
    },

    // Template variables/data
    templateData: {
      type: mongoose.Schema.Types.Mixed
    },

    // Delivery information
    recipient: {
      type: String,
      required: true, // email, phone, or device token
      index: true
    },

    // Status tracking
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed", "cancelled"],
      default: "pending"
    },

    // Provider information (for tracking)
    provider: {
      type: String,
      enum: ["brevo", "nodemailer", "twilio", "fcm"],
      required: true
    },

    providerMessageId: {
      type: String // ID from the provider for tracking
    },

    // Scheduling
    scheduledAt: {
      type: Date
    },

    sentAt: {
      type: Date
    },

    deliveredAt: {
      type: Date
    },

    // Error information
    errorMessage: {
      type: String
    },

    retryCount: {
      type: Number,
      default: 0,
      max: 3
    },

    // Priority
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal"
    },

    // Categorization
    category: {
      type: String,
      enum: ["account", "security", "marketing", "transaction", "system", "reminder"],
      default: "system"
    },

    // Metadata
    metadata: {
      correlationId: String,
      sourceEvent: String,
      campaignId: String,
      userAgent: String,
      ipAddress: String
    },

    // Read status (for in-app notifications)
    isRead: {
      type: Boolean,
      default: false
    },

    readAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ status: 1, scheduledAt: 1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ category: 1, createdAt: -1 });

// Pre-save middleware to update sentAt when status changes to sent
notificationSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "sent" && !this.sentAt) {
    this.sentAt = new Date();
  }
  if (this.isModified("status") && this.status === "delivered" && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  next();
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
