import express from "express";
import * as rewardController from "../controllers/reward.controller.js";
import { authenticateUser } from "../middlewares/validations.middleware.js";

const router = express.Router();

// Student routes
router.get("/my-rewards", authenticateUser, rewardController.getMyRewards);
router.post("/claim/:rewardId", authenticateUser, rewardController.claimReward);

// Admin routes (Ideally protected by isAdmin middleware)
router.post("/generate", authenticateUser, rewardController.generateRewards);
router.post("/distribute/:rewardId", authenticateUser, rewardController.distributeReward);

export default router;
