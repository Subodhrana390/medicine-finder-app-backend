import jwt from "jsonwebtoken";

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

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error("Not authorized to access this resource");
      error.statusCode = 401;
      throw error;
    }

    if (!roles.includes(req.user.role)) {
      const error = new Error("Not authorized to access this resource");
      error.statusCode = 403;
      throw error;
    }

    next();
  };
};
