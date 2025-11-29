import mongoose from "mongoose";

const notificationTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    type: {
      type: String,
      enum: ["email", "in_app"],
      required: true
    },

    // Template content
    subject: {
      type: String,
      required: function() {
        return this.type === "email";
      }
    },

    body: {
      type: String,
      required: true
    },

    // HTML version for emails
    htmlBody: {
      type: String,
      required: function() {
        return this.type === "email";
      }
    },

    // Template variables (Handlebars style)
    variables: [{
      name: {
        type: String,
        required: true
      },
      description: String,
      required: {
        type: Boolean,
        default: false
      },
      defaultValue: String
    }],

    // Template metadata
    category: {
      type: String,
      enum: ["account", "security", "marketing", "transaction", "system", "reminder"],
      required: true
    },

    language: {
      type: String,
      default: "en",
      enum: ["en", "hi", "bn", "te", "mr", "ta", "gu"]
    },

    // Template status
    isActive: {
      type: Boolean,
      default: true
    },

    // Usage tracking
    usageCount: {
      type: Number,
      default: 0
    },

    lastUsed: {
      type: Date
    },

    // Version control
    version: {
      type: Number,
      default: 1
    },

    parentTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NotificationTemplate"
    },

    // Tags for organization
    tags: [{
      type: String,
      trim: true
    }],

    // Preview data for testing
    previewData: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

// Indexes
notificationTemplateSchema.index({ type: 1, category: 1 });
notificationTemplateSchema.index({ name: 1 });
notificationTemplateSchema.index({ isActive: 1, type: 1 });

// Pre-save middleware to increment version on updates
notificationTemplateSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

const NotificationTemplate = mongoose.model("NotificationTemplate", notificationTemplateSchema);
export default NotificationTemplate;
