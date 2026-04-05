import { body, validationResult } from 'express-validator'
import jwt from "jsonwebtoken";
import _config from "../config/config.js";
import userModel from "../models/user.model.js";

/** Cookie (httpOnly) or `Authorization: Bearer <jwt>` — needed when SPA and API are on different origins. */
export function getTokenFromRequest(req) {
  const fromCookie = req.cookies?.token;
  if (fromCookie) return fromCookie;
  const auth = req.headers?.authorization;
  if (auth && /^Bearer\s+/i.test(auth)) {
    return auth.replace(/^Bearer\s+/i, "").trim();
  }
  return null;
}

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
    const token = getTokenFromRequest(req);

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

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
}

// Soft authentication for /me endpoint to avoid 401 console errors
export async function getProfileUser(req, res, next) {
  try {
    const token = getTokenFromRequest(req);

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