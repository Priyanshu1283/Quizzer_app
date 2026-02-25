import { config as dotenvConfig } from "dotenv";
dotenvConfig();

const _config = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  RABBITMQ_URI: process.env.RABBITMQ_URI,
  // Base URL of this backend (e.g. https://quizz-4c67.onrender.com in prod, http://localhost:3000 in dev)
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  // Base URL of the frontend (e.g. your Vercel URL in prod, http://localhost:5173 in dev)
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};

export default _config;
