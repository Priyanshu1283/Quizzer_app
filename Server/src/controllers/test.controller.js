import TestSeries from "../models/testSeries.model.js";
import MockTest from "../models/mockTest.model.js";
import Question from "../models/question.model.js";

export const getTestSeries = async (req, res) => {
    try {
        const series = await TestSeries.find({ isActive: true });
        res.status(200).json(series);
    } catch (error) {
        console.error("Error in getTestSeries:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getMockTests = async (req, res) => {
    try {
        const { seriesId } = req.params;

        // Check if series exists and is active
        const series = await TestSeries.findOne({ _id: seriesId, isActive: true });
        if (!series) {
            return res.status(404).json({ message: "Test Series not found" });
        }

        const mockTests = await MockTest.find({ testSeriesId: seriesId, isActive: true })
            .select("-sections.questions"); // Exclude questions if they were embedded (they are not, but good practice)

        res.status(200).json(mockTests);
    } catch (error) {
        console.error("Error in getMockTests:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getTestDetails = async (req, res) => {
    try {
        const { testId } = req.params;

        const mockTest = await MockTest.findOne({ _id: testId, isActive: true });

        if (!mockTest) {
            return res.status(404).json({ message: "Mock Test not found" });
        }

        res.status(200).json(mockTest);
    } catch (error) {
        console.error("Error in getTestDetails:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const startTest = async (req, res) => {
    try {
        const { testId } = req.params;

        // Fetch test to ensure it exists
        const mockTest = await MockTest.findOne({ _id: testId, isActive: true });
        if (!mockTest) {
            return res.status(404).json({ message: "Mock Test not found" });
        }

        // Fetch all questions for this test
        // Note: In a real app with many questions, we might want to paginate or optimize this.
        // For client-side test taking, sending all questions (without answers) is common.
        const questions = await Question.find({ mockTestId: testId })
            .select("-correctOptionIndex"); // CRITICAL: Do not send answers to client

        if (!questions || questions.length === 0) {
            return res.status(404).json({ message: "No questions found for this test" });
        }

        res.status(200).json({
            test: mockTest,
            questions: questions
        });

    } catch (error) {
        console.error("Error in startTest:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
