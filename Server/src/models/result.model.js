import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
    {
        attemptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Attempt",
            required: true,
        },
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
        score: {
            type: Number,
            required: true,
        },
        totalCorrect: {
            type: Number,
            required: true,
        },
        totalWrong: {
            type: Number,
            required: true,
        },
        totalUnattempted: {
            type: Number,
            required: true,
        },
        sectionAnalysis: {
            type: Map,
            of: new mongoose.Schema({
                score: Number,
                correct: Number,
                wrong: Number,
                unattempted: Number,
            }),
        },
        rank: {
            type: Number,
        },
    },
    { timestamps: true }
);

const Result = mongoose.model("Result", resultSchema);

export default Result;
