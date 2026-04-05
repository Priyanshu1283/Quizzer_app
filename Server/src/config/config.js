import { config as dotenvConfig } from "dotenv";
dotenvConfig();

const _config = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  RABBITMQ_URI: process.env.RABBITMQ_URI,
  PORT: process.env.PORT || 3000,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
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
};

export default _config;
