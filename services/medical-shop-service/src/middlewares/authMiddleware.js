import jwt from "jsonwebtoken";
import axios from "axios";

export const protect = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    const error = new Error("No token provided");
    error.statusCode = 401;
    throw error;
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    err.statusCode = 401;
    throw err;
  }
};

// Middleware to verify user has shop-owner role
export const requireShopOwner = (req, res, next) => {
  if (req.user.role !== "shop-owner" && req.user.role !== "admin") {
    const error = new Error("Access denied. Shop owner privileges required.");
    error.statusCode = 403;
    throw error;
  }
  next();
};

// Middleware to verify user owns the shop or is admin
export const requireShopOwnership = (shopIdParam = "shopId") => {
  return async (req, res, next) => {
    try {
      const shopId = req.params[shopIdParam];

      // If user is admin, allow access
      if (req.user.role === "admin") {
        req.isAdminOverride = true;
        return next();
      }

      // For shop owners, verify they own the shop
      if (req.user.role === "shop-owner") {
        // This would need to be implemented to check shop ownership
        // For now, we'll assume the shop ownership check passes
        req.shopOwnerVerified = true;
        return next();
      }

      const error = new Error("Access denied. Not authorized to manage this shop.");
      error.statusCode = 403;
      throw error;
    } catch (err) {
      next(err);
    }
  };
};

// Middleware to validate shop access for customers
export const validateShopAccess = async (req, res, next) => {
  try {
    const shopId = req.params.shopId;

    // Call auth service to validate shop access
    const authResponse = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/validate-shop/${shopId}`, {
      headers: {
        Authorization: req.headers.authorization
      }
    });

    if (authResponse.data.success) {
      req.shop = authResponse.data.data;
      next();
    } else {
      const error = new Error("Shop access validation failed");
      error.statusCode = 403;
      throw error;
    }
  } catch (err) {
    if (err.response?.status === 403) {
      err.statusCode = 403;
    }
    next(err);
  }
};
