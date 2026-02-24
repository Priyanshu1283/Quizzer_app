import Reward from "../models/reward.model.js";
import Result from "../models/result.model.js";

// Admin: Generate rewards for a specific mock test based on top ranks
export const generateRewards = async (req, res) => {
    try {
        const { mockTestId, prizeCount } = req.body;

        // Fetch top results for this test
        const topResults = await Result.find({ mockTestId })
            .sort({ score: -1, updatedAt: 1 }) // Highest score, then fastest completion
            .limit(prizeCount || 3);

        const rewards = [];
        for (let i = 0; i < topResults.length; i++) {
            const result = topResults[i];

            // Check if reward already exists
            const existingReward = await Reward.findOne({ userId: result.userId, mockTestId });
            if (!existingReward) {
                const reward = await Reward.create({
                    userId: result.userId,
                    mockTestId,
                    rank: i + 1,
                    rewardType: i < 3 ? "Prize" : "Certificate",
                    status: "eligible"
                });
                rewards.push(reward);
            }
        }

        res.status(201).json({ message: "Rewards generated successfully", rewards });
    } catch (error) {
        console.error("Error generating rewards:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Student: Get my rewards
export const getMyRewards = async (req, res) => {
    try {
        const userId = req.user._id;
        const rewards = await Reward.find({ userId })
            .populate("mockTestId", "title")
            .sort({ createdAt: -1 });
        res.status(200).json(rewards);
    } catch (error) {
        console.error("Error fetching rewards:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Student: Claim a reward
export const claimReward = async (req, res) => {
    try {
        const { rewardId } = req.params;
        const userId = req.user._id;

        const reward = await Reward.findOne({ _id: rewardId, userId });
        if (!reward) {
            return res.status(404).json({ message: "Reward not found or not yours" });
        }

        if (reward.status !== "eligible") {
            return res.status(400).json({ message: `Reward already ${reward.status}` });
        }

        reward.status = "claimed";
        reward.claimDate = Date.now();
        await reward.save();

        res.status(200).json({ message: "Reward claimed successfully", reward });
    } catch (error) {
        console.error("Error claiming reward:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Admin: Mark reward as distributed
export const distributeReward = async (req, res) => {
    try {
        const { rewardId } = req.params;

        const reward = await Reward.findById(rewardId);
        if (!reward) {
            return res.status(404).json({ message: "Reward not found" });
        }

        reward.status = "distributed";
        reward.distributionDate = Date.now();
        await reward.save();

        res.status(200).json({ message: "Reward marked as distributed", reward });
    } catch (error) {
        console.error("Error distributing reward:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
