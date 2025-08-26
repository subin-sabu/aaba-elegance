// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import AppError from "../utils/AppError.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) throw new AppError("Not authorized, token missing", 401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new AppError("User not found", 404);

    req.user = { id: user._id, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return next(new AppError("Admin access only", 403));
  }
  next();
};
