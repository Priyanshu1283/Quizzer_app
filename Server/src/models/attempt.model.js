import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
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
        startTime: {
            type: Date,
            default: Date.now,
        },
        endTime: {
            type: Date,
        },
        status: {
            type: String,
            enum: ["started", "completed", "abandoned"],
            default: "started",
        },
        responses: [
            {
                questionId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Question",
                },
                selectedOptionIndex: {
                    type: Number,
                },
                timeTaken: {
                    type: Number, // in seconds
                },
            },
        ],
    },
    { timestamps: true }
);

const Attempt = mongoose.model("Attempt", attemptSchema);

export default Attempt;
