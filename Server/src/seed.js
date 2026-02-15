import mongoose from "mongoose";
import TestSeries from "./models/testSeries.model.js";
import MockTest from "./models/mockTest.model.js";
import Question from "./models/question.model.js";
import _config from "./config/config.js";

const DB_URI = _config.MONGO_URI;

const seedData = async () => {
    try {
        console.log("Seeding to:", DB_URI);
        await mongoose.connect(DB_URI);
        console.log("Connected to MongoDB for seeding...");

        // Clear existing data
        await TestSeries.deleteMany({});
        await MockTest.deleteMany({});
        await Question.deleteMany({});
        console.log("Cleared existing data.");

        // 1. Create Test Series
        const sscSeries = await TestSeries.create({
            name: "SSC",
            description: "Staff Selection Commission Combined Graduate Level Examination",
            isActive: true,
        });

        const bankSeries = await TestSeries.create({
            name: "Banking",
            description: "IBPS PO and Clerk Examinations",
            isActive: true,
        });

        console.log("Created Test Series.");

        // 2. Create Mock Tests
        const sscMock = await MockTest.create({
            title: "SSC CGL Premier Mock 1",
            testSeriesId: sscSeries._id,
            totalTime: 60,
            price: 0,
            isActive: true,
            sections: [
                { name: "General Intelligence", duration: 15, totalQuestions: 5 },
                { name: "General Awareness", duration: 10, totalQuestions: 5 },
                { name: "Quantitative Aptitude", duration: 20, totalQuestions: 5 },
                { name: "English Comprehension", duration: 15, totalQuestions: 5 },
            ],
        });

        console.log("Created Mock Tests.");

        // 3. Create Questions for SSC Mock
        // Helper to generate dummy questions
        const createQuestions = async (mockId, sectionName, count) => {
            const questions = [];
            for (let i = 1; i <= count; i++) {
                questions.push({
                    mockTestId: mockId,
                    sectionName: sectionName,
                    text: `Sample Question ${i} for ${sectionName}?`,
                    options: ["Option A", "Option B", "Option C", "Option D"],
                    correctOptionIndex: Math.floor(Math.random() * 4),
                    marks: 2,
                    negativeMarks: 0.5,
                });
            }
            await Question.insertMany(questions);
        };

        await createQuestions(sscMock._id, "General Intelligence", 5);
        await createQuestions(sscMock._id, "General Awareness", 5);
        await createQuestions(sscMock._id, "Quantitative Aptitude", 5);
        await createQuestions(sscMock._id, "English Comprehension", 5);

        console.log("Created Questions.");

        console.log("Data Seeding Completed Successfully! 🌱");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding data:", error);
        process.exit(1);
    }
};

seedData();
