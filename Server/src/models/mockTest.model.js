import mongoose from "mongoose";

const mockTestSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        testSeriesId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TestSeries",
            required: true,
        },
        totalTime: {
            type: Number, // in minutes
            required: true,
        },
        price: {
            type: Number,
            default: 0,
            min: [0, "Price cannot be negative"],
        },
        sections: [
            {
                name: {
                    type: String,
                    required: true,
                },
                duration: {
                    type: Number, // in minutes
                    required: true,
                },
                totalQuestions: {
                    type: Number,
                    required: true,
                },
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const MockTest = mongoose.model("MockTest", mockTestSchema);

export default MockTest;
