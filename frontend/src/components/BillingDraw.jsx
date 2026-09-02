import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSelector, useDispatch } from "react-redux";
import { Crown, X } from "lucide-react";
import { createOrder } from "../features/createOrder";
import { verifyPayment } from "../features/verifyPayment";
import getCurrentUser from "../features/getCurrentUser";
import { setUserdata } from "../redux/userSlice";

function BillingDraw({ open, onClose }) {
    const { userData } = useSelector((state) => state.user);
    const dispatch = useDispatch();

    const handleUpgrade = async (plan) => {
        try {
            // 1. Create Razorpay order from backend
            const data = await createOrder({ plan });

            console.log("Create Order Response:", data);

            if (!data?.order?.id) {
                console.error("Order creation failed:", data);
                return;
            }

            // 2. Razorpay Checkout options
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,

                // IMPORTANT
                amount: data.order.amount,
                currency: data.order.currency,
                order_id: data.order.id,

                name: "MultiMind",
                description: `${data.plan?.name || plan} Plan`,

                prefill: {
                    name: userData?.name || "User",
                    email: userData?.email || "user@example.com",
                    contact: userData?.phone || "9999999999",
                },

                theme: {
                    color: "#6366f1",
                },

                handler: async (response) => {
                    console.log("Razorpay Payment Response:", response);

                    try {
                        // 3. Verify payment from backend
                        const verifyData = await verifyPayment(response);

                        console.log(
                            "Payment Verification Response:",
                            verifyData
                        );

                        if (verifyData?.message === "Payment Verified") {
                            // Re-fetch latest user data and update Redux
                            const freshUser = await getCurrentUser();
                            if (freshUser?.userData) dispatch(setUserdata(freshUser.userData));

                            alert("Payment successful! Your credits have been added.");
                            onClose();
                        }
                    } catch (error) {
                        console.error(
                            "Payment verification failed:",
                            error
                        );
                    }
                },

                modal: {
                    ondismiss: () => {
                        console.log("Razorpay checkout closed");
                    },
                },
            };

            console.log("Razorpay Options:", options);

            // 4. Create Razorpay instance
            const razorpay = new window.Razorpay(options);

            // 5. Payment failed event
            razorpay.on("payment.failed", (response) => {
                console.error(
                    "Payment Failed:",
                    response.error
                );

                alert(
                    response.error?.description ||
                    "Payment failed. Please try again."
                );
            });

            // 6. Open Razorpay Checkout
            razorpay.open();
        } catch (error) {
            console.error("Upgrade error:", error);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.25 }}
                        className="fixed right-0 top-0 z-50 h-screen w-[380px] border-l border-white/10 shadow-2xl flex flex-col"
                        style={{
                            background:
                                "radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.38) 0%, rgba(59, 130, 246, 0.18) 40%, rgba(10, 11, 15, 0) 75%), #0a0b0e",
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/10">
                            <div>
                                <div className="text-white text-lg font-semibold">
                                    Billing
                                </div>

                                <div className="text-slate-400 text-sm">
                                    Plans & Credits
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border-none cursor-pointer"
                            >
                                <X
                                    size={18}
                                    className="text-slate-300"
                                />
                            </button>
                        </div>

                        {/* Current Plan */}
                        <div className="p-5">
                            <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-slate-400 text-sm">
                                            Current Plan
                                        </p>

                                        <h3 className="text-white capitalize font-semibold">
                                            {userData?.plan || "free"}
                                        </h3>
                                    </div>

                                    <Crown className="text-yellow-400" />
                                </div>

                                <div className="mt-5">
                                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                                        <span>Credits</span>

                                        <span>
                                            {userData?.credits || 0}/
                                            {userData?.totalCredits || 100}
                                        </span>
                                    </div>

                                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 transition-all duration-500"
                                            style={{
                                                width: `${Math.min(
                                                    ((userData?.credits || 0) /
                                                        (userData?.totalCredits ||
                                                            100)) *
                                                    100,
                                                    100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Plans */}
                        <div className="px-5 flex-1 overflow-auto space-y-4">
                            {/* Starter */}
                            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
                                <h3 className="text-white font-semibold">
                                    Starter Plan
                                </h3>

                                <p className="text-indigo-400 text-2xl font-bold mt-2">
                                    ₹199
                                </p>

                                <p className="text-slate-400 text-sm mt-1">
                                    500 Credits
                                </p>

                                <button
                                    onClick={() =>
                                        handleUpgrade("starter")
                                    }
                                    className="mt-4 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 py-2 text-white border-none cursor-pointer font-medium transition-colors"
                                >
                                    Upgrade
                                </button>
                            </div>

                            {/* Pro */}
                            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
                                <h3 className="text-white font-semibold">
                                    Pro Plan
                                </h3>

                                <p className="text-indigo-400 text-2xl font-bold mt-2">
                                    ₹499
                                </p>

                                <p className="text-slate-400 text-sm mt-1">
                                    1000 Credits
                                </p>

                                <button
                                    onClick={() =>
                                        handleUpgrade("pro")
                                    }
                                    className="mt-4 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 py-2 text-white border-none cursor-pointer font-medium transition-colors"
                                >
                                    Upgrade
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default BillingDraw;