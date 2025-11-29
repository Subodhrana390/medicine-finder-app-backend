import AuditLog from "../models/AuditLog.js";

// In-memory cache for IP geolocation (simple implementation)
const geoCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Helper function to extract device info from user agent
const parseUserAgent = (userAgent) => {
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

// Helper to get client IP address
const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    "unknown"
  );
};

// Enhanced IP geolocation using ipapi.co
const getLocationFromIP = async (ip) => {
  // Handle local/private IPs
  if (ip === "unknown" || ip === "::1" || ip === "127.0.0.1" ||
      ip.startsWith("192.168.") || ip.startsWith("10.") ||
      ip.startsWith("172.")) {
    return {
      country: "Local",
      region: "Local",
      city: "Local",
      timezone: "Local",
      isp: "Local Network"
    };
  }

  // Check cache first
  const cached = geoCache.get(ip);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const url = `https://ipapi.co/${ip}/json/`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Auth-Service/1.0',
        'Accept': 'application/json',
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();

      if (data.error) {
        console.warn(`ipapi.co error for IP ${ip}:`, data.reason);
        return getFallbackLocation(ip);
      }

      const locationData = {
        country: data.country_name || data.country || "Unknown",
        region: data.region || "Unknown",
        city: data.city || "Unknown",
        timezone: data.timezone || "Unknown",
        isp: data.org || data.asn || "Unknown",
      };

      geoCache.set(ip, {
        data: locationData,
        timestamp: Date.now()
      });

      return locationData;
    } else {
      console.warn(`ipapi.co HTTP error for IP ${ip}:`, response.status);
      return getFallbackLocation(ip);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`ipapi.co timeout for IP ${ip}`);
    } else {
      console.warn(`ipapi.co network error for IP ${ip}:`, error.message);
    }
    return getFallbackLocation(ip);
  }
};

// Fallback location data when API fails
const getFallbackLocation = (ip) => {
  return {
    country: "Unknown",
    region: "Unknown",
    city: "Unknown",
    timezone: "Unknown",
    isp: "Unknown"
  };
};

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of geoCache.entries()) {
    if (now - data.timestamp > CACHE_DURATION) {
      geoCache.delete(ip);
    }
  }
}, 60 * 60 * 1000); // Clean every hour

export class AuditService {
  static async logEvent({
    userId,
    action,
    success = true,
    req,
    sessionId,
    refreshTokenId,
    metadata = {},
    errorMessage,
  }) {
    try {
      const ipAddress = getClientIP(req);
      const location = await getLocationFromIP(ipAddress);

      const auditEntry = {
        userId,
        action,
        success,
        ipAddress,
        userAgent: req.headers["user-agent"] || "unknown",
        device: parseUserAgent(req.headers["user-agent"]),
        location: {
          country: location.country,
          region: location.region,
          city: location.city,
          timezone: location.timezone,
          isp: location.isp,
        },
        sessionId,
        refreshTokenId,
        metadata,
      };

      if (errorMessage) {
        auditEntry.errorMessage = errorMessage;
      }

      await AuditLog.create(auditEntry);
    } catch (error) {
      console.error("Auth Service - Audit logging failed:", error.message);
    }
  }

  // Utility function to get location data for any IP
  static async getLocationData(ip) {
    return await getLocationFromIP(ip);
  }

  // Get cache statistics
  static getCacheStats() {
    return {
      size: geoCache.size,
      entries: Array.from(geoCache.keys())
    };
  }

  // Clear cache (useful for maintenance)
  static clearGeoCache() {
    geoCache.clear();
    return { message: "Geolocation cache cleared" };
  }
}
