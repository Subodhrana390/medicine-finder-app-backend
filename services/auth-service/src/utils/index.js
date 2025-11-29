/**
 * Utility functions for the Auth Service
 */

/**
 * Parse user agent string to determine device type
 * @param {string} userAgent - User agent string from request headers
 * @returns {string} Device type: 'mobile', 'tablet', or 'desktop'
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
 * Extract client IP address from request headers
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
export const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    "unknown"
  );
};

/**
 * Generate a secure random token
 * @param {number} length - Length of the token in bytes (default: 32)
 * @returns {string} Hex-encoded random token
 */
export const generateSecureToken = (length = 32) => {
  return require("crypto").randomBytes(length).toString("hex");
};

/**
 * Hash a token using SHA-256
 * @param {string} token - Token to hash
 * @returns {string} SHA-256 hash of the token
 */
export const hashToken = (token) => {
  return require("crypto").createHash("sha256").update(token).digest("hex");
};

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize user input by trimming whitespace
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return "";
  return input.trim();
};

/**
 * Check if a password meets minimum requirements
 * @param {string} password - Password to check
 * @returns {Object} Validation result with isValid and errors array
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format user agent for storage (truncate if too long)
 * @param {string} userAgent - Raw user agent string
 * @param {number} maxLength - Maximum length (default: 500)
 * @returns {string} Formatted user agent string
 */
export const formatUserAgent = (userAgent, maxLength = 500) => {
  if (!userAgent) return "unknown";
  if (userAgent.length > maxLength) {
    return userAgent.substring(0, maxLength - 3) + "...";
  }
  return userAgent;
};

/**
 * Get current timestamp in ISO format
 * @returns {string} ISO timestamp string
 */
export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Calculate token expiration time
 * @param {number} hours - Hours from now
 * @returns {Date} Expiration date
 */
export const getTokenExpiration = (hours = 24) => {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + hours);
  return expiration;
};

/**
 * Check if a date is expired
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if expired
 */
export const isExpired = (date) => {
  return new Date(date) < new Date();
};

/**
 * Generate a random 6-digit code for 2FA
 * @returns {string} 6-digit code
 */
export const generateTwoFactorCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
