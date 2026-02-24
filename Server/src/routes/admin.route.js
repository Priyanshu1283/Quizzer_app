import express from "express";
import { createTestSeries, createMockTest, addQuestion, getAllTestSeries, getAllMockTests, getMockTestDetailsWithCounts, getTopPerformers } from "../controllers/admin.controller.js";
// import { verifyAdmin } from "../middlewares/auth.middleware.js"; // To be implemented/verified

const router = express.Router();

// TODO: Add admin protection middleware
router.post("/test-series", createTestSeries);
router.get("/test-series", getAllTestSeries); // Public for now, or move to test routes
router.post("/mock-test", createMockTest);
router.post("/question", addQuestion);
router.get("/mock-test/:mockTestId", getMockTestDetailsWithCounts);
router.get("/mock-tests", getAllMockTests);
router.get("/top-performers", getTopPerformers);

export default router;
