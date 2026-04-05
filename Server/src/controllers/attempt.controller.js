import Attempt from "../models/attempt.model.js";
import Result from "../models/result.model.js";
import Question from "../models/question.model.js";
import MockTest from "../models/mockTest.model.js";
import _config from "../config/config.js";
import { userHasPaidAccess } from "../services/paymentAccess.service.js";

const shuffleArray = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const finalizeAttempt = async (attempt) => {
    if (attempt.status === "completed" && attempt.resultId) {
        const existingResult = await Result.findById(attempt.resultId);
        if (existingResult) return existingResult;
    }

    attempt.status = "completed";
    attempt.endTime = Date.now();
    await attempt.save();

    const questions = await Question.find({ mockTestId: attempt.mockTestId });
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

    let score = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalUnattempted = 0;
    const sectionAnalysis = new Map();

    questions.forEach(q => {
        if (!sectionAnalysis.has(q.sectionName)) {
            sectionAnalysis.set(q.sectionName, { score: 0, correct: 0, wrong: 0, unattempted: 0 });
        }
    });

    questions.forEach(question => {
        const questionId = question._id.toString();
        const response = attempt.responses.find(r => {
            if (!r.questionId) return false;
            const rId = r.questionId._id ? r.questionId._id.toString() : r.questionId.toString();
            return rId === questionId;
        });

        const sectionStats = sectionAnalysis.get(question.sectionName);

        if (response && response.selectedOptionIndex !== undefined && response.selectedOptionIndex !== null) {
            if (response.selectedOptionIndex === question.correctOptionIndex) {
                score += question.marks;
                totalCorrect++;
                sectionStats.score += question.marks;
                sectionStats.correct++;
            } else {
                score -= question.negativeMarks;
                totalWrong++;
                sectionStats.score -= question.negativeMarks;
                sectionStats.wrong++;
            }
        } else {
            totalUnattempted++;
            sectionStats.unattempted++;
        }
    });

    const result = await Result.create({
        attemptId: attempt._id,
        userId: attempt.userId,
        mockTestId: attempt.mockTestId,
        score,
        totalCorrect,
        totalWrong,
        totalUnattempted,
        sectionAnalysis: sectionAnalysis,
    });

    attempt.resultId = result._id;
    await attempt.save();

    return result;
};

export const startAttempt = async (req, res) => {
    try {
        const userId = req.user._id;
        const { mockTestId } = req.body;

        if (!mockTestId) {
            return res.status(400).json({ message: "mockTestId is required" });
        }

        const mockTest = await MockTest.findOne({ _id: mockTestId, isActive: true });
        if (!mockTest) {
            return res.status(404).json({ message: "Mock Test not found" });
        }

        const hasAccess = await userHasPaidAccess(userId, mockTest);
        if (!hasAccess) {
            return res.status(402).json({
                message: "Payment required to access this test",
                code: "PAYMENT_REQUIRED",
                mockTestId: mockTest._id.toString(),
                price: mockTest.price,
            });
        }

        const questions = await Question.find({ mockTestId }).select("-correctOptionIndex");
        if (!questions || questions.length === 0) {
            return res.status(404).json({ message: "No questions found for this test" });
        }

        let attempt = await Attempt.findOne({ userId, mockTestId, status: "started" });
        if (!attempt) {
            const orderedQuestionIds = shuffleArray(questions.map(q => q._id));
            const examEndsAt = new Date(Date.now() + mockTest.totalTime * 60 * 1000);
            attempt = await Attempt.create({
                userId,
                mockTestId,
                status: "started",
                orderedQuestionIds,
                currentQuestionIndex: 0,
                examEndsAt,
                perQuestionSeconds: _config.PER_QUESTION_SECONDS,
            });
        } else if (!attempt.orderedQuestionIds || attempt.orderedQuestionIds.length === 0) {
            attempt.orderedQuestionIds = shuffleArray(questions.map(q => q._id));
            attempt.currentQuestionIndex = 0;
            attempt.examEndsAt = attempt.examEndsAt || new Date(Date.now() + mockTest.totalTime * 60 * 1000);
            attempt.perQuestionSeconds = attempt.perQuestionSeconds || _config.PER_QUESTION_SECONDS;
            await attempt.save();
        }

        const currentQuestionId = attempt.orderedQuestionIds[attempt.currentQuestionIndex];
        const currentQuestion = await Question.findById(currentQuestionId).select("-correctOptionIndex");

        res.status(200).json({
            attempt: {
                _id: attempt._id,
                status: attempt.status,
                currentQuestionIndex: attempt.currentQuestionIndex,
                examEndsAt: attempt.examEndsAt,
                perQuestionSeconds: attempt.perQuestionSeconds,
            },
            test: mockTest,
            question: currentQuestion,
            questionIndex: attempt.currentQuestionIndex,
            totalQuestions: attempt.orderedQuestionIds.length,
        });
    } catch (error) {
        console.error("Error in startAttempt:", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

export const getAttemptState = async (req, res) => {
    try {
        const userId = req.user._id;
        const { attemptId } = req.params;

        const attempt = await Attempt.findOne({ _id: attemptId, userId });
        if (!attempt) {
            return res.status(404).json({ message: "Attempt not found" });
        }

        const mockTest = await MockTest.findById(attempt.mockTestId);
        if (!mockTest) {
            return res.status(404).json({ message: "Mock Test not found" });
        }

        const currentQuestionId = attempt.orderedQuestionIds?.[attempt.currentQuestionIndex];
        const currentQuestion = currentQuestionId
            ? await Question.findById(currentQuestionId).select("-correctOptionIndex")
            : null;

        res.status(200).json({
            attempt: {
                _id: attempt._id,
                status: attempt.status,
                currentQuestionIndex: attempt.currentQuestionIndex,
                examEndsAt: attempt.examEndsAt,
                perQuestionSeconds: attempt.perQuestionSeconds,
                warningCount: attempt.warningCount,
                tabSwitchCount: attempt.tabSwitchCount,
            },
            test: mockTest,
            question: currentQuestion,
            questionIndex: attempt.currentQuestionIndex,
            totalQuestions: attempt.orderedQuestionIds?.length || 0,
        });
    } catch (error) {
        console.error("Error in getAttemptState:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const submitAnswer = async (req, res) => {
    try {
        const userId = req.user._id;
        const { attemptId, questionId, selectedOptionIndex, timeSpentSeconds } = req.body;

        if (!attemptId || !questionId) {
            return res.status(400).json({ message: "attemptId and questionId are required" });
        }

        const attempt = await Attempt.findOne({ _id: attemptId, userId });
        if (!attempt) {
            return res.status(404).json({ message: "Attempt not found" });
        }

        if (attempt.status !== "started") {
            const result = attempt.resultId ? await Result.findById(attempt.resultId) : null;
            return res.status(409).json({ message: "Attempt already completed", result });
        }

        if (attempt.examEndsAt && Date.now() > new Date(attempt.examEndsAt).getTime()) {
            const result = await finalizeAttempt(attempt);
            return res.status(200).json({ isCompleted: true, result });
        }

        const expectedQuestionId = attempt.orderedQuestionIds?.[attempt.currentQuestionIndex]?.toString();
        if (!expectedQuestionId || expectedQuestionId !== questionId) {
            return res.status(409).json({ message: "Invalid question order" });
        }

        const existingIndex = attempt.responses.findIndex(r => r.questionId?.toString() === questionId);
        if (existingIndex >= 0) {
            attempt.responses[existingIndex].selectedOptionIndex = selectedOptionIndex;
            attempt.responses[existingIndex].timeTaken = timeSpentSeconds;
        } else {
            attempt.responses.push({
                questionId,
                selectedOptionIndex,
                timeTaken: timeSpentSeconds,
            });
        }

        attempt.currentQuestionIndex += 1;
        await attempt.save();

        if (attempt.currentQuestionIndex >= attempt.orderedQuestionIds.length) {
            const result = await finalizeAttempt(attempt);
            return res.status(200).json({ isCompleted: true, result });
        }

        const nextQuestionId = attempt.orderedQuestionIds[attempt.currentQuestionIndex];
        const nextQuestion = await Question.findById(nextQuestionId).select("-correctOptionIndex");

        res.status(200).json({
            isCompleted: false,
            question: nextQuestion,
            questionIndex: attempt.currentQuestionIndex,
            totalQuestions: attempt.orderedQuestionIds.length,
        });
    } catch (error) {
        console.error("Error in submitAnswer:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const submitSection = async (req, res) => {
    try {
        const userId = req.user._id;
        const { attemptId, responses } = req.body;
        // responses: [{ questionId, selectedOptionIndex, timeTaken }]

        const attempt = await Attempt.findOne({ _id: attemptId, userId });
        if (!attempt) {
            return res.status(404).json({ message: "Attempt not found" });
        }

        // Add new responses or update existing ones
        // Using a Map to ensure unique question responses
        const responseMap = new Map();
        attempt.responses.forEach(r => responseMap.set(r.questionId.toString(), r));

        responses.forEach(r => {
            responseMap.set(r.questionId.toString(), r);
        });

        attempt.responses = Array.from(responseMap.values());
        await attempt.save();

        res.status(200).json({ message: "Section submitted successfully" });

    } catch (error) {
        console.error("Error in submitSection:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const submitTest = async (req, res) => {
    try {
        const userId = req.user._id;
        const { attemptId } = req.body;

        const attempt = await Attempt.findOne({ _id: attemptId, userId }).populate("responses.questionId");
        if (!attempt) {
            return res.status(404).json({ message: "Attempt not found" });
        }

        const result = await finalizeAttempt(attempt);

        res.status(200).json({
            message: "Test submitted successfully",
            result
        });

    } catch (error) {
        console.error("Error in submitTest:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getResult = async (req, res) => {
    try {
        const { resultId } = req.params;
        const result = await Result.findById(resultId)
            .populate("userId", "fullname email")
            .populate("mockTestId", "title");

        if (!result) {
            return res.status(404).json({ message: "Result not found" });
        }
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getResult:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const recordWarning = async (req, res) => {
    try {
        const userId = req.user._id;
        const { attemptId, reason } = req.body;

        if (!attemptId) {
            return res.status(400).json({ message: "attemptId is required" });
        }

        const update = { $inc: { warningCount: 1 } };
        if (reason === "tab-switch") {
            update.$inc.tabSwitchCount = 1;
        }

        const attempt = await Attempt.findOneAndUpdate(
            { _id: attemptId, userId },
            update,
            { new: true }
        );

        if (!attempt) {
            return res.status(404).json({ message: "Attempt not found" });
        }

        res.status(200).json({
            warningCount: attempt.warningCount,
            tabSwitchCount: attempt.tabSwitchCount
        });
    } catch (error) {
        console.error("Error in recordWarning:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
