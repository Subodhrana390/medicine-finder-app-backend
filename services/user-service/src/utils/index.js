import crypto from "crypto";

/**
 * Generate a secure random token
 * @param {number} length - Length of the token in bytes (will be hex encoded, so double length)
 * @returns {string} - Hex encoded token
 */
export const generateSecureToken = (length = 16) => {
  return crypto.randomBytes(length).toString("hex");
};

/**
 * Hash a token using SHA-256
 * @param {string} token - Token to hash
 * @returns {string} - Hashed token
 */
export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Get token expiration date
 * @param {number} hours - Hours from now
 * @returns {Date} - Expiration date
 */
export const getTokenExpiration = (hours = 24) => {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

/**
 * Check if a date is expired
 * @param {Date} date - Date to check
 * @returns {boolean} - True if expired
 */
export const isExpired = (date) => {
  return new Date() > date;
};

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} - IP address
 */
export const getClientIP = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.connection?.socket?.remoteAddress ||
      "unknown";

  // Handle IPv4-mapped IPv6 addresses
  if (ip.includes("::ffff:")) {
    return ip.split("::ffff:")[1];
  }

  return ip;
};

/**
 * Parse user agent to determine device type
 * @param {string} userAgent - User agent string
 * @returns {string} - Device type
 */
export const parseUserAgent = (userAgent) => {
  if (!userAgent) return "unknown";

  const ua = userAgent.toLowerCase();

  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return "mobile";
  } else if (ua.includes("tablet") || ua.includes("ipad")) {
    return "tablet";
  } else {
    return "desktop";
  }
};

/**
 * Sanitize filename for safe storage
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
};

/**
 * Generate pagination info
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} - Pagination info
 */
export const getPaginationInfo = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNext,
    hasPrev,
  };
};

/**
 * Search query builder for MongoDB
 * @param {string} searchTerm - Search term
 * @param {Array} fields - Fields to search in
 * @returns {Object} - MongoDB search query
 */
export const buildSearchQuery = (searchTerm, fields = ["name", "email"]) => {
  if (!searchTerm) return {};

  const searchRegex = new RegExp(searchTerm, "i");
  const searchConditions = fields.map(field => ({
    [field]: searchRegex
  }));

  return { $or: searchConditions };
};

/**
 * Format user data for API response
 * @param {Object} user - User document
 * @param {boolean} includeSensitive - Include sensitive data
 * @returns {Object} - Formatted user data
 */
export const formatUserResponse = (user, includeSensitive = false) => {
  const baseData = {
    id: user._id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    countryCode: user.countryCode,
    avatar: user.avatar,
    role: user.role,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  if (includeSensitive) {
    return {
      ...baseData,
      loginCount: user.loginCount,
      provider: user.provider,
      providerId: user.providerId,
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }

  return baseData;
};
