import express from "express";
import { getTestSeries, getMockTests, getTestDetails, startTest } from "../controllers/test.controller.js";
// import { verifyToken } from "../middlewares/auth.middleware.js"; // To be implemented/verified

const router = express.Router();

// Public routes (or protected if needed)
router.get("/series", getTestSeries);
router.get("/series/:seriesId/tests", getMockTests);
router.get("/tests/:testId", getTestDetails);

// Protected route - User needs to be logged in to start
router.get("/tests/:testId/start", startTest);

export default router;
