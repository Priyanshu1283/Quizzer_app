import mongoose from "mongoose";
import _config from "../config/config.js";

async function connectDB() {
  try {
    await mongoose.connect(_config.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting DB:", error.message);
  }
}

export default connectDB;
