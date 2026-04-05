import { config as dotenvConfig } from "dotenv";
dotenvConfig();

function parseAllowedOrigins() {
  const raw =
    process.env.ALLOWED_ORIGINS ||
    "http://localhost:5173,http://127.0.0.1:5173,https://quizzer-app-sooty.vercel.app";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins();

const _config = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  RABBITMQ_URI: process.env.RABBITMQ_URI,
  PORT: process.env.PORT || 3000,
  /** Allowed browser origins for CORS + validating OAuth ?redirect= */
  allowedOrigins,
  /** Default frontend base URL (redirects when OAuth state is missing) */
  CLIENT_URL: process.env.CLIENT_URL || allowedOrigins[0] || "http://localhost:5173",
  SERVER_URL: process.env.SERVER_URL || "http://localhost:3000",
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  PER_QUESTION_SECONDS: Number(process.env.PER_QUESTION_SECONDS || 60),
  RAZORPAY_KEY_ID:
    process.env.RAZORPAY_KEY_ID ||
    process.env.Razorpay_Key_Id ||
    process.env.RAZORPAY_KEYID,
  RAZORPAY_KEY_SECRET:
    process.env.RAZORPAY_KEY_SECRET ||
    process.env.Razorpay_Key_Secret ||
    process.env.RAZORPAY_SECRET,
  /** Cross-site cookies: localhost/Vercel → Render API (different site than API host) */
  COOKIE_SECURE:
    process.env.COOKIE_SECURE === "true" ||
    process.env.NODE_ENV === "production" ||
    process.env.RENDER === "true" ||
    (process.env.SERVER_URL && String(process.env.SERVER_URL).startsWith("https://")),
  COOKIE_SAMESITE:
    process.env.COOKIE_SAMESITE ||
    (process.env.NODE_ENV === "production" ||
    process.env.RENDER === "true" ||
    (process.env.SERVER_URL && String(process.env.SERVER_URL).startsWith("https://"))
      ? "none"
      : "lax"),
};

const sameSite = _config.COOKIE_SAMESITE;
const secure =
  sameSite === "none" ? true : _config.COOKIE_SECURE;

export const tokenCookieOptions = {
  httpOnly: true,
  maxAge: 2 * 24 * 60 * 60 * 1000,
  secure,
  sameSite,
};

export default _config;
