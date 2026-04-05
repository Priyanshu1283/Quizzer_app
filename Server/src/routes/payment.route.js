import express from "express";
import { createOrder, verifyPayment, getMyPurchases } from "../controllers/payment.controller.js";
import { authenticateUser } from "../middlewares/validations.middleware.js";

const router = express.Router();

router.post("/create-order", authenticateUser, createOrder);
router.post("/verify", authenticateUser, verifyPayment);
router.get("/purchases", authenticateUser, getMyPurchases);

export default router;
