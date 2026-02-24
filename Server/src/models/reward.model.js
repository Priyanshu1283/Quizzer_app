import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        mockTestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MockTest",
            required: true,
        },
        rank: {
            type: Number,
            required: true,
        },
        rewardType: {
            type: String,
            enum: ["Prize", "Certificate", "Badge"],
            default: "Certificate",
        },
        status: {
            type: String,
            enum: ["eligible", "claimed", "distributed"],
            default: "eligible",
        },
        claimDate: {
            type: Date,
        },
        distributionDate: {
            type: Date,
        },
    },
    { timestamps: true }
);

const Reward = mongoose.model("Reward", rewardSchema);

export default Reward;
