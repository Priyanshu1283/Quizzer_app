import app from "./src/app.js";
import connectDB from "./src/db/db.js";
import _config from "./src/config/config.js";
// import { connectRabbit } from "./src/broker/rabbit.js";

(async () => {
  try {
    await connectDB();
    // await connectRabbit();
    app.listen(_config.PORT, () => {
      console.log(`Auth server running on port ${_config.PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err?.message || err);
    console.error(
      "Fix: set MONGO_URI in Server/.env, check internet/VPN, and MongoDB Atlas → Network Access (allow your IP or 0.0.0.0/0 for dev)."
    );
    process.exit(1);
  }
})();
