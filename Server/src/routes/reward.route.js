import express from "express";
import * as rewardController from "../controllers/reward.controller.js";
import { authenticateUser, requireAdmin } from "../middlewares/validations.middleware.js";

const router = express.Router();

// Student routes
router.get("/my-rewards", authenticateUser, rewardController.getMyRewards);
router.post("/claim/:rewardId", authenticateUser, rewardController.claimReward);

// Admin routes
router.post("/generate", authenticateUser, requireAdmin, rewardController.generateRewards);
router.post("/distribute/:rewardId", authenticateUser, requireAdmin, rewardController.distributeReward);

export default router;
