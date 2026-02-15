import { body, validationResult } from 'express-validator'
import jwt from "jsonwebtoken";
import _config from "../config/config.js";
import userModel from "../models/user.model.js";

async function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()
    })
  }
  next()
}
export const registerUserValidationRule = [
  body('email')
    .isEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 character"),
  body('fullname.firstName')
    .notEmpty()
    .withMessage("First Name is require"),
  body('fullname.lastName')
    .notEmpty().withMessage("Last Name is require"),
  validate
]

export async function authenticateUser(req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, _config.JWT_SECRET);

    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; // attach user to request

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Soft authentication for /me endpoint to avoid 401 console errors
export async function getProfileUser(req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, _config.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  } catch (error) {
    // If token invalid, treat as logged out
    req.user = null;
    next();
  }
}