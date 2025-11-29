import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "REGISTER",
        "REGISTER_FAILED",
        "LOGIN",
        "LOGIN_FAILED",
        "LOGIN_2FA_REQUIRED",
        "GOOGLE_LOGIN",
        "LOGOUT",
        "LOGOUT_ALL",
        "TOKEN_REFRESH",
        "ENABLE_2FA",
        "DISABLE_2FA",
        "VERIFY_2FA_SUCCESS",
        "VERIFY_2FA_FAILED",
      ],
    },
    success: {
      type: Boolean,
      default: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    device: {
      type: String,
      default: "unknown",
    },
    location: {
      country: String,
      region: String,
      city: String,
      timezone: String,
      isp: String,
    },
    sessionId: {
      type: String,
      index: true,
    },
    refreshTokenId: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
    // Keep logs for 90 days
    expires: 90 * 24 * 60 * 60, // 90 days in seconds
  }
);

// Compound indexes for efficient queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
