import TestSeries from "../models/testSeries.model.js";
import MockTest from "../models/mockTest.model.js";
import Question from "../models/question.model.js";
import Result from "../models/result.model.js";
import Attempt from "../models/attempt.model.js";
import { userHasPaidAccess } from "../services/paymentAccess.service.js";

function buildMockPricingMeta(mockDocs) {
    const bySeries = new Map();
    for (const m of mockDocs) {
        const sid = m.testSeriesId.toString();
        if (!bySeries.has(sid)) {
            bySeries.set(sid, { freeCount: 0, paidCount: 0, minPaidPrice: null });
        }
        const agg = bySeries.get(sid);
        const p = Number(m.price);
        if (Number.isFinite(p) && p > 0) {
            agg.paidCount += 1;
            agg.minPaidPrice =
                agg.minPaidPrice == null ? p : Math.min(agg.minPaidPrice, p);
        } else {
            agg.freeCount += 1;
        }
    }
    return bySeries;
}

export const getTestSeries = async (req, res) => {
    try {
        const series = await TestSeries.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
        const mocks = await MockTest.find({ isActive: true }).select("testSeriesId price").lean();
        const bySeries = buildMockPricingMeta(mocks);

        const enriched = series.map((s) => {
            const meta = bySeries.get(s._id.toString()) || {
                freeCount: 0,
                paidCount: 0,
                minPaidPrice: null,
            };
            let mixLabel = "No mocks yet";
            if (meta.freeCount > 0 && meta.paidCount > 0) mixLabel = "Free & paid";
            else if (meta.paidCount > 0) mixLabel = "Paid mocks";
            else if (meta.freeCount > 0) mixLabel = "Free mocks";

            return {
                ...s,
                mockPricing: {
                    freeCount: meta.freeCount,
                    paidCount: meta.paidCount,
                    minPaidPrice: meta.minPaidPrice,
                    hasFree: meta.freeCount > 0,
                    hasPaid: meta.paidCount > 0,
                    mixLabel,
                },
            };
        });

        res.status(200).json(enriched);
    } catch (error) {
        console.error("Error in getTestSeries:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

/** Catalog of all active mocks for dashboards (title, series, free vs paid). */
export const getMocksCatalog = async (req, res) => {
    try {
        const mocks = await MockTest.find({ isActive: true })
            .select("title price totalTime testSeriesId")
            .populate("testSeriesId", "name")
            .sort({ title: 1 })
            .lean();

        const data = mocks.map((m) => {
            const price = Number(m.price);
            const isPaid = Number.isFinite(price) && price > 0;
            return {
                _id: m._id,
                title: m.title,
                price: isPaid ? price : 0,
                totalTime: m.totalTime,
                isPaid,
                seriesId: m.testSeriesId?._id,
                seriesName: m.testSeriesId?.name || "Series",
            };
        });

        res.status(200).json(data);
    } catch (error) {
        console.error("Error in getMocksCatalog:", error);
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
        const userId = req.user?._id;

        // Fetch test to ensure it exists
        const mockTest = await MockTest.findOne({ _id: testId, isActive: true });
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

export const getLeaderboard = async (req, res) => {
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
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
