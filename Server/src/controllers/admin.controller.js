import mongoose from "mongoose";
import TestSeries from "../models/testSeries.model.js";
import MockTest from "../models/mockTest.model.js";
import Question from "../models/question.model.js";
import Result from "../models/result.model.js";
import Attempt from "../models/attempt.model.js";
import userModel from "../models/user.model.js";
import Reward from "../models/reward.model.js";

export const createTestSeries = async (req, res) => {
    try {
        const { name, description, sortOrder, category } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Name is required" });
        }

        const existingSeries = await TestSeries.findOne({ name });
        if (existingSeries) {
            return res.status(400).json({ message: "Test Series with this name already exists" });
        }

        const order =
            sortOrder === undefined || sortOrder === null ? 0 : Number(sortOrder);
        const series = await TestSeries.create({
            name,
            description,
            category: category != null ? String(category).trim() : "",
            sortOrder: Number.isFinite(order) ? order : 0,
        });

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
        const { title, testSeriesId, totalTime, price, sections, description } = req.body;

        // Basic validation
        if (!title || !testSeriesId || !totalTime || !sections) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!mongoose.Types.ObjectId.isValid(testSeriesId)) {
            return res.status(400).json({ message: "Invalid series selected" });
        }

        const seriesExists = await TestSeries.findById(testSeriesId);
        if (!seriesExists) {
            return res.status(404).json({ message: "Test series not found" });
        }

        const priceNum = price === undefined || price === null ? 0 : Number(price);
        if (!Number.isFinite(priceNum) || priceNum < 0) {
            return res.status(400).json({ message: "Price must be a non-negative number" });
        }
        if (priceNum > 0 && priceNum < 1) {
            return res.status(400).json({ message: "Paid tests must cost at least ₹1" });
        }

        const mockTest = await MockTest.create({
            title,
            testSeriesId,
            totalTime,
            price: priceNum,
            sections,
            description: description != null ? String(description).trim() : "",
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

        if (!mockTestId || !sectionName || !text || !Array.isArray(options)) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (!mongoose.Types.ObjectId.isValid(mockTestId)) {
            return res.status(400).json({ message: "Invalid mock test id" });
        }

        const mockTest = await MockTest.findById(mockTestId);
        if (!mockTest) {
            return res.status(404).json({ message: "Mock test not found" });
        }

        const sectionTrim = String(sectionName).trim();
        const sectionNames = new Set(mockTest.sections.map((s) => s.name));
        if (!sectionNames.has(sectionTrim)) {
            return res.status(400).json({
                message: `Section must match the mock: ${[...sectionNames].join(", ")}`,
            });
        }

        const textTrim = String(text).trim();
        if (!textTrim) {
            return res.status(400).json({ message: "Question text cannot be empty" });
        }

        const opts = options.map((o) => String(o ?? "").trim());
        if (opts.length < 2 || opts.some((o) => !o)) {
            return res.status(400).json({ message: "Provide at least two non-empty options; all option fields must be filled" });
        }

        const idx = Number(correctOptionIndex);
        if (!Number.isInteger(idx) || idx < 0 || idx >= opts.length) {
            return res.status(400).json({
                message: `correctOptionIndex must be an integer from 0 to ${opts.length - 1}`,
            });
        }

        const marksNum = marks === undefined || marks === null ? 1 : Number(marks);
        const negNum =
            negativeMarks === undefined || negativeMarks === null ? 0.25 : Number(negativeMarks);

        const question = await Question.create({
            mockTestId,
            sectionName: sectionTrim,
            text: textTrim,
            options: opts,
            correctOptionIndex: idx,
            marks: Number.isFinite(marksNum) ? marksNum : 1,
            negativeMarks: Number.isFinite(negNum) ? negNum : 0.25,
        });

        res.status(201).json({
            message: "Question added successfully",
            question,
        });
    } catch (error) {
        console.error("Error in addQuestion:", error);
        if (error.name === "ValidationError") {
            const msgs = Object.values(error.errors || {}).map((e) => e.message);
            return res.status(400).json({ message: msgs.join(" ") || "Validation failed" });
        }
        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid data format" });
        }
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getAllTestSeries = async (req, res) => {
    try {
        const series = await TestSeries.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
        res.status(200).json(series);
    } catch (error) {
        console.error("Error fetching test series:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getAllMockTests = async (req, res) => {
    try {
        const { q, seriesId } = req.query;
        const filter = { isActive: true };
        if (q) {
            filter.title = { $regex: q, $options: "i" };
        }
        if (seriesId && mongoose.Types.ObjectId.isValid(seriesId)) {
            filter.testSeriesId = seriesId;
        }
        const mockTests = await MockTest.find(filter)
            .select("title _id testSeriesId totalTime price sections description")
            .sort({ title: 1 })
            .lean();

        const ids = mockTests.map((m) => m._id);
        let countMap = new Map();
        if (ids.length > 0) {
            const qCounts = await Question.aggregate([
                { $match: { mockTestId: { $in: ids } } },
                { $group: { _id: "$mockTestId", n: { $sum: 1 } } },
            ]);
            countMap = new Map(qCounts.map((c) => [c._id.toString(), c.n]));
        }

        const enriched = mockTests.map((m) => {
            const expectedQuestionCount = Array.isArray(m.sections)
                ? m.sections.reduce((acc, s) => acc + (s.totalQuestions || 0), 0)
                : 0;
            return {
                ...m,
                questionCount: countMap.get(m._id.toString()) || 0,
                expectedQuestionCount,
            };
        });

        res.status(200).json(enriched);
    } catch (error) {
        console.error("Error fetching all mock tests:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const listQuestionsByMock = async (req, res) => {
    try {
        const { mockTestId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(mockTestId)) {
            return res.status(400).json({ message: "Invalid mock test id" });
        }
        const mock = await MockTest.findById(mockTestId);
        if (!mock) {
            return res.status(404).json({ message: "Mock test not found" });
        }
        const questions = await Question.find({ mockTestId })
            .sort({ sectionName: 1, createdAt: 1 })
            .lean();
        res.status(200).json(questions);
    } catch (error) {
        console.error("Error in listQuestionsByMock:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const updateQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { sectionName, text, options, correctOptionIndex, marks, negativeMarks } = req.body;

        if (!mongoose.Types.ObjectId.isValid(questionId)) {
            return res.status(400).json({ message: "Invalid question id" });
        }

        const existing = await Question.findById(questionId);
        if (!existing) {
            return res.status(404).json({ message: "Question not found" });
        }

        const mockTest = await MockTest.findById(existing.mockTestId);
        if (!mockTest) {
            return res.status(404).json({ message: "Mock test not found" });
        }

        const sectionTrim = String(sectionName ?? existing.sectionName).trim();
        const sectionNames = new Set(mockTest.sections.map((s) => s.name));
        if (!sectionNames.has(sectionTrim)) {
            return res.status(400).json({
                message: `Section must match the mock: ${[...sectionNames].join(", ")}`,
            });
        }

        const textTrim = String(text ?? existing.text).trim();
        if (!textTrim) {
            return res.status(400).json({ message: "Question text cannot be empty" });
        }

        const opts = (options || existing.options).map((o) => String(o ?? "").trim());
        if (opts.length < 2 || opts.some((o) => !o)) {
            return res.status(400).json({ message: "All options must be non-empty" });
        }

        const idx =
            correctOptionIndex !== undefined && correctOptionIndex !== null
                ? Number(correctOptionIndex)
                : existing.correctOptionIndex;
        if (!Number.isInteger(idx) || idx < 0 || idx >= opts.length) {
            return res.status(400).json({
                message: `correctOptionIndex must be an integer from 0 to ${opts.length - 1}`,
            });
        }

        const marksNum = marks === undefined || marks === null ? existing.marks : Number(marks);
        const negNum =
            negativeMarks === undefined || negativeMarks === null
                ? existing.negativeMarks
                : Number(negativeMarks);

        existing.sectionName = sectionTrim;
        existing.text = textTrim;
        existing.options = opts;
        existing.correctOptionIndex = idx;
        existing.marks = Number.isFinite(marksNum) ? marksNum : existing.marks;
        existing.negativeMarks = Number.isFinite(negNum) ? negNum : existing.negativeMarks;
        await existing.save();

        res.status(200).json({ message: "Question updated", question: existing });
    } catch (error) {
        console.error("Error in updateQuestion:", error);
        if (error.name === "ValidationError") {
            const msgs = Object.values(error.errors || {}).map((e) => e.message);
            return res.status(400).json({ message: msgs.join(" ") || "Validation failed" });
        }
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getUsersWithStats = async (req, res) => {
    try {
        const attemptStats = await Attempt.aggregate([
            {
                $lookup: {
                    from: "mocktests",
                    localField: "mockTestId",
                    foreignField: "_id",
                    as: "mt",
                },
            },
            { $unwind: { path: "$mt", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$userId",
                    testsGiven: { $sum: 1 },
                    paidTestsGiven: {
                        $sum: {
                            $cond: [{ $gt: [{ $ifNull: ["$mt.price", 0] }, 0] }, 1, 0],
                        },
                    },
                },
            },
        ]);

        const statsMap = new Map(attemptStats.map((s) => [s._id.toString(), s]));

        const rewardAgg = await Reward.aggregate([
            { $group: { _id: "$userId", rewardsCount: { $sum: 1 } } },
        ]);
        const rewardMap = new Map(rewardAgg.map((r) => [r._id.toString(), r.rewardsCount]));

        const users = await userModel.find().select("-password").sort({ createdAt: -1 }).lean();

        const rows = users.map((u) => {
            const st = statsMap.get(u._id.toString()) || {
                testsGiven: 0,
                paidTestsGiven: 0,
            };
            return {
                _id: u._id,
                email: u.email,
                fullname: u.fullname,
                role: u.role,
                testsGiven: st.testsGiven,
                paidTestsGiven: st.paidTestsGiven,
                rewardsCount: rewardMap.get(u._id.toString()) || 0,
                createdAt: u.createdAt,
            };
        });

        res.status(200).json(rows);
    } catch (error) {
        console.error("Error in getUsersWithStats:", error);
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

        // Map counts to sections (embedded sections may be subdocs or plain objects)
        const sectionsWithCounts = mockTest.sections.map((section) => {
            const plain =
                section && typeof section.toObject === "function"
                    ? section.toObject()
                    : { ...section };
            const name = plain.name;
            const countObj = questionCounts.find((c) => c._id === name);
            return {
                ...plain,
                addedQuestions: countObj ? countObj.count : 0,
            };
        });

        res.status(200).json({
            ...mockTest.toObject(),
            sections: sectionsWithCounts,
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

/** Leaderboard with optional mock filter + time taken (from attempt). */
export const getAdminLeaderboard = async (req, res) => {
    try {
        const { mockTestId, limit = "100" } = req.query;
        const q = {};
        if (mockTestId && mongoose.Types.ObjectId.isValid(mockTestId)) {
            q.mockTestId = mockTestId;
        }
        const lim = Math.min(Math.max(Number(limit) || 100, 1), 200);
        const results = await Result.find(q)
            .sort({ score: -1 })
            .limit(lim)
            .populate("userId", "fullname email")
            .populate("mockTestId", "title")
            .populate("attemptId", "startTime endTime");

        const leaderboard = results.map((r, i) => {
            let timeTakenMs = null;
            const att = r.attemptId;
            if (att?.endTime && att?.startTime) {
                timeTakenMs =
                    new Date(att.endTime).getTime() - new Date(att.startTime).getTime();
            }
            return {
                rank: i + 1,
                _id: r._id,
                score: r.score,
                userId: r.userId,
                mockTestId: r.mockTestId,
                timeTakenMs,
                createdAt: r.createdAt,
            };
        });

        res.status(200).json({ leaderboard });
    } catch (error) {
        console.error("Error in getAdminLeaderboard:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const updateMockTest = async (req, res) => {
    try {
        const { mockTestId } = req.params;
        const { title, totalTime, price, description, sections } = req.body;

        if (!mongoose.Types.ObjectId.isValid(mockTestId)) {
            return res.status(400).json({ message: "Invalid mock test id" });
        }

        const mock = await MockTest.findById(mockTestId);
        if (!mock) {
            return res.status(404).json({ message: "Mock test not found" });
        }

        if (title != null) mock.title = String(title).trim();
        if (totalTime != null) mock.totalTime = Number(totalTime);
        if (price !== undefined && price !== null) {
            const priceNum = Number(price);
            if (!Number.isFinite(priceNum) || priceNum < 0) {
                return res.status(400).json({ message: "Invalid price" });
            }
            if (priceNum > 0 && priceNum < 1) {
                return res.status(400).json({ message: "Paid tests must cost at least ₹1" });
            }
            mock.price = priceNum;
        }
        if (description !== undefined) {
            mock.description = String(description ?? "").trim();
        }
        if (sections != null && Array.isArray(sections) && sections.length > 0) {
            mock.sections = sections;
        }

        await mock.save();

        res.status(200).json({ message: "Mock test updated", mockTest: mock });
    } catch (error) {
        console.error("Error in updateMockTest:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getAdminRewards = async (req, res) => {
    try {
        const { mockTestId } = req.query;
        const filter = {};
        if (mockTestId && mongoose.Types.ObjectId.isValid(String(mockTestId))) {
            filter.mockTestId = mockTestId;
        }

        const rewards = await Reward.find(filter)
            .populate("userId", "fullname email")
            .populate("mockTestId", "title")
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ rewards });
    } catch (error) {
        console.error("Error in getAdminRewards:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

