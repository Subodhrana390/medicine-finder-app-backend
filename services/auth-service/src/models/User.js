import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const REFRESH_TOKEN_TTL_DAYS = 7;

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, select: false },
  sessionId: { type: String, unique: true, sparse: true },
  device: { type: String, default: "unknown" },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

refreshTokenSchema.pre("validate", function (next) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() - REFRESH_TOKEN_TTL_DAYS);
  if (this.createdAt < expiryDate) {
    this.remove();
  }
  next();
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      validate: {
        validator: function (v) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Invalid email format",
      },
    },

    password: {
      type: String,
      select: false,
      minlength: 6,
    },

    mobile: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    countryCode: {
      type: String,
      default: "+91",
    },

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    providerId: {
      type: String,
    },

    refreshTokens: [refreshTokenSchema],

    avatar: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["user", "shop-owner", "admin", "rider"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },

    loginCount: {
      type: Number,
      default: 0,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // 2FA fields
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorCode: String,
    twoFactorExpire: Date,
    twoFactorVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      provider: this.provider,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`,
  });
};

userSchema.methods.recordLogin = async function (device = "unknown") {
  this.lastLogin = new Date();
  this.loginCount += 1;
  await this.save();
};

userSchema.methods.addRefreshToken = async function (
  token,
  device = "unknown",
  ipAddress = "unknown",
  userAgent = "unknown"
) {
  const salt = await bcrypt.genSalt(10);
  const tokenHash = await bcrypt.hash(token, salt);
  const sessionId = crypto.randomUUID();

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() - REFRESH_TOKEN_TTL_DAYS);

  this.refreshTokens = this.refreshTokens.filter(
    (t) => t.createdAt > expiryDate
  );
  this.refreshTokens.push({
    tokenHash,
    sessionId,
    device,
    ipAddress,
    userAgent,
  });
  await this.save();

  return sessionId;
};

userSchema.methods.hasRefreshToken = async function (token) {
  for (const t of this.refreshTokens) {
    const isMatch = await bcrypt.compare(token, t.tokenHash);
    if (isMatch) return t;
  }
  return false;
};

userSchema.methods.revokeRefreshToken = async function (token) {
  const valid = [];
  for (const t of this.refreshTokens) {
    const isMatch = await bcrypt.compare(token, t.tokenHash);
    if (!isMatch) valid.push(t);
  }
  this.refreshTokens = valid;
  await this.save();
};

userSchema.methods.revokeSessionById = async function (sessionId) {
  this.refreshTokens = this.refreshTokens.filter(
    (t) => t.sessionId !== sessionId
  );
  await this.save();
};

userSchema.methods.revokeAllRefreshTokens = async function () {
  this.refreshTokens = [];
  await this.save();
};

userSchema.methods.getActiveSessions = function () {
  return this.refreshTokens.map((token) => ({
    sessionId: token.sessionId,
    device: token.device,
    ipAddress: token.ipAddress,
    userAgent: token.userAgent,
    createdAt: token.createdAt,
  }));
};

userSchema.methods.generatePasswordResetToken = function () {
  // Import utility function dynamically to avoid circular dependencies
  const { generateSecureToken, hashToken, getTokenExpiration } = require("../utils/index.js");

  const resetToken = generateSecureToken(16); // 32 hex chars
  this.resetPasswordToken = hashToken(resetToken);
  this.resetPasswordExpire = getTokenExpiration(1/6); // 10 minutes
  return resetToken;
};

userSchema.methods.generateTwoFactorCode = function () {
  // Import utility function dynamically to avoid circular dependencies
  const { generateTwoFactorCode, hashToken } = require("../utils/index.js");

  const code = generateTwoFactorCode();
  this.twoFactorCode = hashToken(code);
  this.twoFactorExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  this.twoFactorVerified = false;
  return code;
};

userSchema.methods.verifyTwoFactorCode = function (code) {
  // Import utility function dynamically to avoid circular dependencies
  const { hashToken, isExpired } = require("../utils/index.js");

  const hashedCode = hashToken(code);

  if (this.twoFactorCode === hashedCode && !isExpired(this.twoFactorExpire)) {
    this.twoFactorVerified = true;
    this.twoFactorCode = undefined;
    this.twoFactorExpire = undefined;
    return true;
  }
  return false;
};

userSchema.methods.enableTwoFactor = function () {
  this.twoFactorEnabled = true;
  this.twoFactorVerified = false;
};

userSchema.methods.disableTwoFactor = function () {
  this.twoFactorEnabled = false;
  this.twoFactorVerified = false;
  this.twoFactorCode = undefined;
  this.twoFactorExpire = undefined;
};

userSchema.post("init", function (doc) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() - REFRESH_TOKEN_TTL_DAYS);
  const beforeCount = doc.refreshTokens.length;
  doc.refreshTokens = doc.refreshTokens.filter((t) => t.createdAt > expiryDate);
  if (doc.refreshTokens.length !== beforeCount) {
    doc
      .save()
      .catch((err) => console.error("⚠️ Auto-prune failed:", err.message));
  }
});

userSchema.index({ "refreshTokens.createdAt": 1 });

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
