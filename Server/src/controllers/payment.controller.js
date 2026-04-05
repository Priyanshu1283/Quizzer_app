import crypto from "crypto";
import Razorpay from "razorpay";
import MockTest from "../models/mockTest.model.js";
import Purchase from "../models/purchase.model.js";
import _config from "../config/config.js";

function getRazorpay() {
    if (!_config.RAZORPAY_KEY_ID || !_config.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay keys are not configured");
    }
    return new Razorpay({
        key_id: _config.RAZORPAY_KEY_ID,
        key_secret: _config.RAZORPAY_KEY_SECRET,
    });
}

export const createOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { mockTestId } = req.body;

        if (!mockTestId) {
            return res.status(400).json({ message: "mockTestId is required" });
        }

        const mockTest = await MockTest.findOne({ _id: mockTestId, isActive: true });
        if (!mockTest) {
            return res.status(404).json({ message: "Mock test not found" });
        }

        const priceRupee = Number(mockTest.price);
        if (!Number.isFinite(priceRupee) || priceRupee <= 0) {
            return res.status(400).json({ message: "This test is free; no payment is required" });
        }

        const amountPaise = Math.round(priceRupee * 100);
        if (amountPaise < 100) {
            return res.status(400).json({ message: "Minimum payable amount is ₹1" });
        }

        const existing = await Purchase.findOne({
            userId,
            mockTestId,
            status: "completed",
        });
        if (existing) {
            return res.status(409).json({ message: "You already own this test", alreadyOwned: true });
        }

        const razorpay = getRazorpay();
        const order = await razorpay.orders.create({
            amount: amountPaise,
            currency: "INR",
            receipt: `mt_${mockTestId.toString().slice(-8)}_${userId.toString().slice(-6)}`,
            notes: {
                mockTestId: mockTestId.toString(),
                userId: userId.toString(),
            },
        });

        await Purchase.create({
            userId,
            mockTestId,
            amountPaise,
            currency: "INR",
            razorpayOrderId: order.id,
            status: "pending",
        });

        res.status(200).json({
            orderId: order.id,
            amount: amountPaise,
            currency: "INR",
            keyId: _config.RAZORPAY_KEY_ID,
            mockTestId: mockTestId.toString(),
            title: mockTest.title,
        });
    } catch (error) {
        console.error("createOrder:", error.message);
        if (error.message === "Razorpay keys are not configured") {
            return res.status(503).json({ message: "Payments are not configured on the server" });
        }
        res.status(500).json({ message: "Could not create payment order" });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const userId = req.user._id;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, mockTestId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !mockTestId) {
            return res.status(400).json({ message: "Missing payment verification fields" });
        }

        if (!_config.RAZORPAY_KEY_SECRET) {
            return res.status(503).json({ message: "Payments are not configured on the server" });
        }

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expected = crypto
            .createHmac("sha256", _config.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expected !== razorpay_signature) {
            await Purchase.updateOne(
                { razorpayOrderId: razorpay_order_id, userId },
                { status: "failed" }
            );
            return res.status(400).json({ message: "Invalid payment signature" });
        }

        const purchase = await Purchase.findOne({
            razorpayOrderId: razorpay_order_id,
            userId,
            mockTestId,
        });

        if (!purchase) {
            return res.status(404).json({ message: "Payment record not found" });
        }

        if (purchase.status === "completed") {
            return res.status(200).json({ message: "Payment already verified", success: true });
        }

        const mockTest = await MockTest.findById(mockTestId);
        if (!mockTest) {
            return res.status(404).json({ message: "Mock test not found" });
        }

        const expectedAmount = Math.round(Number(mockTest.price) * 100);
        if (purchase.amountPaise !== expectedAmount) {
            return res.status(400).json({ message: "Amount mismatch" });
        }

        const razorpay = getRazorpay();
        const order = await razorpay.orders.fetch(razorpay_order_id);
        if (order.status !== "paid") {
            return res.status(400).json({ message: "Order is not paid yet" });
        }
        if (Number(order.amount_paid) !== purchase.amountPaise) {
            return res.status(400).json({ message: "Paid amount does not match" });
        }

        purchase.razorpayPaymentId = razorpay_payment_id;
        purchase.status = "completed";
        await purchase.save();

        res.status(200).json({
            success: true,
            message: "Payment successful",
            mockTestId: mockTestId.toString(),
        });
    } catch (error) {
        console.error("verifyPayment:", error.message);
        res.status(500).json({ message: "Payment verification failed" });
    }
};

export const getMyPurchases = async (req, res) => {
    try {
        const userId = req.user._id;
        const rows = await Purchase.find({ userId, status: "completed" })
            .select("mockTestId")
            .lean();

        const mockTestIds = rows.map((r) => r.mockTestId.toString());
        res.status(200).json({ mockTestIds });
    } catch (error) {
        console.error("getMyPurchases:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
