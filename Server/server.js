import app from "./src/app.js";
import connectDB from "./src/db/db.js";
import _config from "./src/config/config.js";
// import { connectRabbit } from "./src/broker/rabbit.js";

(async () => {
  try {
    await connectDB();
    // await connectRabbit();
    app.listen(3000, () => {
      console.log(`Auth server running on port 3000`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
})();
