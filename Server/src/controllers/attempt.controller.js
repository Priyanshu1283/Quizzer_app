import Attempt from "../models/attempt.model.js";
import Result from "../models/result.model.js";
import Question from "../models/question.model.js";
import MockTest from "../models/mockTest.model.js";

export const startAttempt = async (req, res) => {
    try {
        // userId comes from the authenticated JWT, not from client body (security fix)
        const userId = req.user._id;
        const { mockTestId } = req.body;

        if (!mockTestId) {
            return res.status(400).json({ message: "mockTestId is required" });
        }

        // Resume existing active attempt if it exists
        const existingAttempt = await Attempt.findOne({ userId, mockTestId, status: "started" });
        if (existingAttempt) {
            return res.status(200).json({ attempt: existingAttempt, message: "Resuming existing attempt" });
        }

        const attempt = await Attempt.create({
            userId,
            mockTestId,
            status: "started",
        });

        res.status(201).json({ attempt });
    } catch (error) {
        console.error("Error in startAttempt:", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

export const submitSection = async (req, res) => {
    try {
        const { attemptId, responses } = req.body;
        // responses: [{ questionId, selectedOptionIndex, timeTaken }]

        const attempt = await Attempt.findById(attemptId);
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
        const { attemptId } = req.body;

        const attempt = await Attempt.findById(attemptId).populate("responses.questionId");
        if (!attempt) {
            return res.status(404).json({ message: "Attempt not found" });
        }

        // Mark attempt as completed
        attempt.status = "completed";
        attempt.endTime = Date.now();
        await attempt.save();

        // Calculate Result
        const questions = await Question.find({ mockTestId: attempt.mockTestId });
        // Create a map for quick lookup
        const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

        let score = 0;
        let totalCorrect = 0;
        let totalWrong = 0;
        let totalUnattempted = 0;
        const sectionAnalysis = new Map(); // sectionName -> { score, correct, wrong, unattempted }

        // Initialize section analysis
        questions.forEach(q => {
            if (!sectionAnalysis.has(q.sectionName)) {
                sectionAnalysis.set(q.sectionName, { score: 0, correct: 0, wrong: 0, unattempted: 0 });
            }
        });

        // Process all questions to calculate score
        // Iterate over ALL questions in the test to account for unattempted ones
        questions.forEach(question => {
            const questionId = question._id.toString();
            // After populate, r.questionId is a full object; use _id to compare
            const response = attempt.responses.find(r => {
                if (!r.questionId) return false;
                const rId = r.questionId._id ? r.questionId._id.toString() : r.questionId.toString();
                return rId === questionId;
            });

            const sectionStats = sectionAnalysis.get(question.sectionName);

            if (response && response.selectedOptionIndex !== undefined && response.selectedOptionIndex !== null) {
                if (response.selectedOptionIndex === question.correctOptionIndex) {
                    // Correct
                    score += question.marks;
                    totalCorrect++;
                    sectionStats.score += question.marks;
                    sectionStats.correct++;
                } else {
                    // Wrong
                    score -= question.negativeMarks;
                    totalWrong++;
                    sectionStats.score -= question.negativeMarks;
                    sectionStats.wrong++;
                }
            } else {
                // Unattempted
                totalUnattempted++;
                sectionStats.unattempted++;
            }
        });

        const result = await Result.create({
            attemptId,
            userId: attempt.userId,
            mockTestId: attempt.mockTestId,
            score,
            totalCorrect,
            totalWrong,
            totalUnattempted,
            sectionAnalysis: sectionAnalysis,
        });

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
