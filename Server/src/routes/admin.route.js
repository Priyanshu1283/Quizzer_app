import express from "express";
import {
    createTestSeries,
    createMockTest,
    updateMockTest,
    addQuestion,
    updateQuestion,
    getAllTestSeries,
    getAllMockTests,
    getMockTestDetailsWithCounts,
    getTopPerformers,
    getAdminLeaderboard,
    listQuestionsByMock,
    getUsersWithStats,
    getAdminRewards,
} from "../controllers/admin.controller.js";
import { authenticateUser, requireAdmin } from "../middlewares/validations.middleware.js";

const router = express.Router();

router.use(authenticateUser, requireAdmin);
router.post("/test-series", createTestSeries);
router.get("/test-series", getAllTestSeries);
router.post("/mock-test", createMockTest);
router.put("/mock-test/:mockTestId", updateMockTest);
router.post("/question", addQuestion);
router.put("/question/:questionId", updateQuestion);
router.get("/mock-test/:mockTestId/questions", listQuestionsByMock);
router.get("/mock-test/:mockTestId", getMockTestDetailsWithCounts);
router.get("/mock-tests", getAllMockTests);
router.get("/users-stats", getUsersWithStats);
router.get("/top-performers", getTopPerformers);
router.get("/leaderboard", getAdminLeaderboard);
router.get("/rewards", getAdminRewards);

export default router;
