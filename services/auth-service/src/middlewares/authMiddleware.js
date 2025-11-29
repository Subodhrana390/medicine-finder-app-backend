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
