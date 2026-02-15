import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
    {
        mockTestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MockTest",
            required: true,
        },
        sectionName: {
            type: String,
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        options: [
            {
                type: String,
                required: true,
            },
        ],
        correctOptionIndex: {
            type: Number,
            required: true,
            validate: {
                validator: function (v) {
                    return v >= 0 && v < this.options.length;
                },
                message: "Correct option index must be within the range of options.",
            },
        },
        marks: {
            type: Number,
            default: 1,
        },
        negativeMarks: {
            type: Number,
            default: 0.25,
        },
    },
    { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);

export default Question;
