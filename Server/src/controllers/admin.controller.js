import TestSeries from "../models/testSeries.model.js";
import MockTest from "../models/mockTest.model.js";
import Question from "../models/question.model.js";
import Result from "../models/result.model.js";
import Attempt from "../models/attempt.model.js";

export const createTestSeries = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Name is required" });
        }

        const existingSeries = await TestSeries.findOne({ name });
        if (existingSeries) {
            return res.status(400).json({ message: "Test Series with this name already exists" });
        }

        const series = await TestSeries.create({ name, description });

        res.status(201).json({
            message: "Test Series created successfully",
            series,
        });
    } catch (error) {
        console.error("Error in createTestSeries:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const createMockTest = async (req, res) => {
    try {
        const { title, testSeriesId, totalTime, price, sections } = req.body;

        // Basic validation
        if (!title || !testSeriesId || !totalTime || !sections) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const mockTest = await MockTest.create({
            title,
            testSeriesId,
            totalTime,
            price,
            sections,
        });

        res.status(201).json({
            message: "Mock Test created successfully",
            mockTest,
        });
    } catch (error) {
        console.error("Error in createMockTest:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const addQuestion = async (req, res) => {
    try {
        const { mockTestId, sectionName, text, options, correctOptionIndex, marks, negativeMarks } = req.body;

        if (!mockTestId || !sectionName || !text || !options || correctOptionIndex === undefined) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const question = await Question.create({
            mockTestId,
            sectionName,
            text,
            options,
            correctOptionIndex,
            marks,
            negativeMarks,
        });

        res.status(201).json({
            message: "Question added successfully",
            question,
        });
    } catch (error) {
        console.error("Error in addQuestion:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getAllTestSeries = async (req, res) => {
    try {
        const series = await TestSeries.find({ isActive: true });
        res.status(200).json(series);
    } catch (error) {
        console.error("Error fetching test series:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }

};

export const getMockTestDetailsWithCounts = async (req, res) => {
    try {
        const { mockTestId } = req.params;

        const mockTest = await MockTest.findById(mockTestId);
        if (!mockTest) {
            return res.status(404).json({ message: "Mock Test not found" });
        }

        // Aggregate question counts per section
        const questionCounts = await Question.aggregate([
            { $match: { mockTestId: mockTest._id } },
            { $group: { _id: "$sectionName", count: { $sum: 1 } } }
        ]);

        // Map counts to sections
        const sectionsWithCounts = mockTest.sections.map(section => {
            const countObj = questionCounts.find(c => c._id === section.name);
            return {
                ...section.toObject(),
                addedQuestions: countObj ? countObj.count : 0
            };
        });

        res.status(200).json({
            ...mockTest.toObject(),
            sections: sectionsWithCounts
        });

    } catch (error) {
        console.error("Error fetching mock test details:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getTopPerformers = async (req, res) => {
    try {
        const leaderboard = await Result.find()
            .sort({ score: -1 })
            .limit(10)
            .populate('userId', 'fullname email')
            .populate('mockTestId', 'title');

        const totalAttempts = await Attempt.countDocuments();
        const uniqueUsers = await Attempt.distinct('userId');

        res.status(200).json({
            leaderboard,
            stats: {
                totalAttempts,
                uniqueUsers: uniqueUsers.length
            }
        });
    } catch (error) {
        console.error("Error fetching top performers:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

