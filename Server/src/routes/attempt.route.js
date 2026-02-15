import express from "express";
import { startAttempt, submitSection, submitTest, getResult } from "../controllers/attempt.controller.js";
// import { verifyToken } from "../middlewares/auth.middleware.js"; // To be implemented

const router = express.Router();

router.post("/start", startAttempt);
router.post("/submit-section", submitSection);
router.post("/submit", submitTest);
router.get("/result/:resultId", getResult);

export default router;
