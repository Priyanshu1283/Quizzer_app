import dns from "dns";
import mongoose from "mongoose";
import _config from "../config/config.js";

// Helps Atlas SRV resolution on some Windows / DNS setups (avoids querySrv ECONNREFUSED)
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

async function connectDB() {
  if (!_config.MONGO_URI) {
    throw new Error("MONGO_URI is not set. Add it to Server/.env");
  }

  mongoose.set("bufferCommands", false);

  await mongoose.connect(_config.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
  });

  console.log("✅ Connected to MongoDB");
}

export default connectDB;
