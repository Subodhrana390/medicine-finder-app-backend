export const errorHandler = (err, req, res, next) => {
  console.error("🔥 User Service Error:", err);

  // Zod validation error
  if (err.name === "ZodError") {
    const firstIssue = err.issues?.[0]?.message || "Validation failed";
    return res.status(400).json({ message: firstIssue });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `${field} already exists` });
  }

  // JWT or general authorization errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  // Multer file upload errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large" });
    }
    return res.status(400).json({ message: err.message });
  }

  // Default fallback
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(status).json({ message });
};
