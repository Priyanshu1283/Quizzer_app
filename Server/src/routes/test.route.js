import express from "express";
import {
    getTestSeries,
    getMocksCatalog,
    getMockTests,
    getTestDetails,
    startTest,
    getLeaderboard,
} from "../controllers/test.controller.js";
import { authenticateUser } from "../middlewares/validations.middleware.js";

const router = express.Router();

// Public routes
router.get("/series", getTestSeries);
router.get("/mocks-catalog", getMocksCatalog);
router.get("/series/:seriesId/tests", getMockTests);
router.get("/tests/:testId", getTestDetails);
router.get("/leaderboard", getLeaderboard);

// Protected route - requires login to start a test
router.get("/tests/:testId/start", authenticateUser, startTest);

export default router;
