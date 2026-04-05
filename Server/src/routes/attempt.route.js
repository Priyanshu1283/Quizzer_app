import express from "express";
import { startAttempt, getAttemptState, submitAnswer, submitSection, submitTest, getResult, recordWarning } from "../controllers/attempt.controller.js";
import { authenticateUser } from "../middlewares/validations.middleware.js";

const router = express.Router();

router.post("/start", authenticateUser, startAttempt);
router.get("/:attemptId", authenticateUser, getAttemptState);
router.post("/answer", authenticateUser, submitAnswer);
router.post("/warn", authenticateUser, recordWarning);
router.post("/submit-section", authenticateUser, submitSection);
router.post("/submit", authenticateUser, submitTest);
router.get("/result/:resultId", authenticateUser, getResult);

export default router;
