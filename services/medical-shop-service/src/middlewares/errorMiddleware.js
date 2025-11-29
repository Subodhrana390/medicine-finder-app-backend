export const errorHandler = (err, req, res, next) => {
  console.error("🔥 Medical Shop Service Error:", err);

  // Zod validation error
  if (err.name === "ZodError") {
    const firstIssue = err.issues?.[0]?.message || "Validation failed";
    return res.status(400).json({
      success: false,
      message: firstIssue,
      errors: err.issues
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: messages
    });
  }

  // JWT or general authorization errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }

  // Cast errors (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid resource ID format"
    });
  }

  // File upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size allowed is 5MB"
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "Unexpected file field"
    });
  }

  // Default fallback
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};
