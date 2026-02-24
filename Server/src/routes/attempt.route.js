import express from "express";
import { startAttempt, submitSection, submitTest, getResult } from "../controllers/attempt.controller.js";
import { authenticateUser } from "../middlewares/validations.middleware.js";

const router = express.Router();

router.post("/start", authenticateUser, startAttempt);
router.post("/submit-section", authenticateUser, submitSection);
router.post("/submit", authenticateUser, submitTest);
router.get("/result/:resultId", authenticateUser, getResult);

export default router;
