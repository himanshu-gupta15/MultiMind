import { PLANS } from "../config/Plans.js";
import Payment from "../models/payment.model.js";
import razorpay from "../config/razorpay.js";
import axios from "axios";
import crypto from "crypto";

export const createOrder = async (req, res) => {
    try {
        const { plan } = req.body;

        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(401).json({
                message: "User ID is required",
            });
        }

        // Find selected plan
        const selectedPlan = PLANS[plan];

        if (!selectedPlan) {
            return res.status(404).json({
                message: "Plan not found",
            });
        }

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: selectedPlan.amount * 100,
            currency: "INR",
            receipt: `receipt-${Date.now()}`,
        });

        // Store payment in database
        await Payment.create({
            userId,
            orderId: order.id,
            amount: selectedPlan.amount,
            credits: selectedPlan.credits,
            plan: selectedPlan.id,
            currency: order.currency,
            status: "created",
        });

        return res.status(200).json({
            order,
            plan: selectedPlan,
        });
    } catch (error) {
        console.error("Create Order Error:", error);

        return res.status(500).json({
            message: error.message,
        });
    }
};


export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                message: "Missing payment details",
            });
        }

        // Find payment from database
        const payment = await Payment.findOne({
            orderId: razorpay_order_id,
        });

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found",
            });
        }

        // Generate signature
        const generatedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(
                `${payment.orderId}|${razorpay_payment_id}`
            )
            .digest("hex");

        // Verify signature
        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                message: "Payment Verification Failed",
            });
        }

        // Prevent duplicate verification
        if (payment.status === "paid") {
            return res.status(200).json({
                message: "Payment already verified",
            });
        }

        // Update payment
        payment.status = "paid";
        payment.paymentId = razorpay_payment_id;

        await payment.save();

        // Update user's plan and credits
        await axios.post(
            `${process.env.AUTH_SERVICE_URL}/update-plan`,
            {
                userId: payment.userId,
                plan: payment.plan,
                credits: payment.credits,
            }
        );

        return res.status(200).json({
            message: "Payment Verified",
        });
    } catch (error) {
        console.error("Verify Payment Error:", error);

        return res.status(500).json({
            message: error.message,
        });
    }
};