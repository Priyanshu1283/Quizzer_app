import mongoose from "mongoose";
import TestSeries from "./models/testSeries.model.js";
import MockTest from "./models/mockTest.model.js";
import _config from "./config/config.js";

const checkData = async () => {
    try {
        console.log("Connecting to:", _config.MONGO_URI);
        await mongoose.connect(_config.MONGO_URI);
        console.log("Connected.");

        const seriesCount = await TestSeries.countDocuments();
        const mockCount = await MockTest.countDocuments();

        console.log(`Test Series Count: ${seriesCount}`);
        console.log(`Mock Test Count: ${mockCount}`);

        if (seriesCount > 0) {
            const series = await TestSeries.find();
            console.log("Series found:", JSON.stringify(series, null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error("Error checking DB:", error);
        process.exit(1);
    }
};

checkData();
