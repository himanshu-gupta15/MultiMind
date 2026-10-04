import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSelector, useDispatch } from "react-redux";
import { Crown, X } from "lucide-react";
import { createOrder } from "../features/createOrder";
import { verifyPayment } from "../features/verifyPayment";
import getCurrentUser from "../features/getCurrentUser";
import { setUserdata } from "../redux/userSlice";
import { setBillingOpen } from "../redux/uiSlice";

function BillingDraw() {
    const { userData } = useSelector((state) => state.user);
    const open = useSelector((state) => state.ui.billingOpen);
    const dispatch = useDispatch();
    const onClose = () => dispatch(setBillingOpen(false));

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
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SyOUwg44vZwY2T",

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
                    color: "#c67139",
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

    const credits = userData?.credits || 0;
    const totalCredits = userData?.totalCredits || 100;
    const currentPlan = userData?.plan || "free";
    const plans = [
        { id: "starter", name: "Starter", price: "₹199", credits: "500 credits" },
        { id: "pro", name: "Pro", price: "₹499", credits: "1,000 credits", featured: true }
    ];

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-60 bg-sand-900/45"
                    />

                    <motion.aside
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.25 }}
                        className="fixed right-0 top-0 bottom-0 z-61 w-full max-w-105 p-6.5 bg-canvas rounded-l-panel shadow-soft-lg flex flex-col gap-4.5 overflow-y-auto"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-col gap-1">
                                <h2 className="m-0 font-display text-[26px] leading-tight">Plans &amp; credits</h2>
                                <p className="m-0 text-sm text-sand-700">Every message, file and image uses credits.</p>
                            </div>
                            <button
                                onClick={onClose}
                                title="Close"
                                className="w-9 h-9 rounded-full grid place-items-center text-sand-700 hover:bg-ink/7 cursor-pointer shrink-0"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 p-4.5 rounded-[32px] bg-surface">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-clay-700">Current plan</span>
                                    <span className="font-display text-[22px] leading-tight capitalize">{currentPlan}</span>
                                </div>
                                <span className="w-11 h-11 rounded-full grid place-items-center bg-clay-200 text-clay-800">
                                    <Crown size={19} />
                                </span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-[13px]">
                                    <span className="font-semibold">Credits left</span>
                                    <span className="text-sand-700">{credits} / {totalCredits}</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-sage-200 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-sage-600 transition-[width] duration-500"
                                        style={{ width: `${Math.min((credits / totalCredits) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {plans.map((plan) => {
                                const isCurrent = currentPlan === plan.id;
                                return (
                                    <div
                                        key={plan.id}
                                        className={`flex flex-col gap-3 p-4.5 rounded-panel border-2 bg-sand-100 ${plan.featured ? "border-sage-400" : "border-transparent"}`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-base font-bold">{plan.name}</span>
                                            {plan.featured && (
                                                <span className="px-2.5 py-0.75 rounded-full bg-sage-100 text-sage-800 text-[11px] font-bold">Best value</span>
                                            )}
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-display text-[34px] leading-none">{plan.price}</span>
                                            <span className="text-sm text-sand-700">{plan.credits}</span>
                                        </div>
                                        <button
                                            onClick={() => handleUpgrade(plan.id)}
                                            disabled={isCurrent}
                                            className={`h-10.5 rounded-full text-sm font-semibold cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${plan.featured
                                                ? "bg-clay hover:bg-clay-600 active:bg-clay-700 text-canvas"
                                                : "border border-line hover:bg-ink/7"
                                                }`}
                                        >
                                            {isCurrent ? "Current plan" : `Upgrade to ${plan.name}`}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="m-0 text-xs text-sand-700">Payments are processed securely by Razorpay.</p>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

export default BillingDraw;
