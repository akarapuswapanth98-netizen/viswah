import { useState } from "react";
import subscriptionApi from "../../api/subscriptionApi";

import C from "../ui/colors";

export default function PaymentButton({ planId, planName, priceInr, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (priceInr === 0) return;
    setLoading(true);
    try {
      const checkout = await subscriptionApi.createCheckout(planId);
      if (checkout.provider === "dev") {
        const result = await subscriptionApi.verifyPayment({
          provider: "dev",
          order_id: checkout.order_id,
          plan_id: planId,
        });
        onSuccess?.(result);
      } else if (checkout.provider === "razorpay" && window.Razorpay) {
        const options = {
          key: checkout.key_id,
          amount: checkout.amount,
          currency: checkout.currency,
          name: "VISWAH",
          description: `${planName} Plan`,
          order_id: checkout.order_id,
          handler: async (response) => {
            try {
              const result = await subscriptionApi.verifyPayment({
                provider: "razorpay",
                order_id: checkout.order_id,
                plan_id: planId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              onSuccess?.(result);
            } catch (e) {
              onError?.(e);
            }
          },
          prefill: { name: "", email: "" },
          theme: { color: C.primary },
        };
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response) => onError?.(response.error));
        rzp.open();
      } else {
        onError?.(new Error("Payment provider not available"));
      }
    } catch (e) {
      onError?.(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading || priceInr === 0}
      style={{
        width: "100%", padding: "14px 0", borderRadius: 12,
        background: priceInr === 0 ? `${C.secondary}20` : `linear-gradient(135deg, ${C.primary}, ${C.primary}CC)`,
        color: priceInr === 0 ? C.secondary : "#0C0A14",
        border: "none", fontSize: 15, fontWeight: 700,
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.7 : 1,
        transition: "all 0.2s",
      }}
      aria-label={priceInr === 0 ? "Get started with free plan" : `Subscribe to ${planName} for \u20b9${priceInr}/month`}
    >
      {loading ? "Processing..." : priceInr === 0 ? "Get Started" : `Subscribe \u20b9${priceInr}/month`}
    </button>
  );
}
