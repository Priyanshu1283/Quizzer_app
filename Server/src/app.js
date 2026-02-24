import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import config from "./config/config.js";
import authRoutes from "./routes/auth.route.js";
import adminRoutes from "./routes/admin.route.js";
import testRoutes from "./routes/test.route.js";
import attemptRoutes from "./routes/attempt.route.js";
import rewardRoutes from "./routes/reward.route.js";
import cors from 'cors'


const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(passport.initialize());

// Configure passport to use Google OAuth 2.0 strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.CLIENT_ID,
      clientSecret: config.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      // You can log or store user data here
      console.log("Google profile:", profile);
      return done(null, profile);
    }
  )
);

// (Optional) serialize/deserialize user if using sessions
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});


app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/test", testRoutes);
app.use("/api/attempt", attemptRoutes);
app.use("/api/reward", rewardRoutes);

export default app;
