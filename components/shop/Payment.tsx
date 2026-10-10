"use client";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { request } from "@/lib/shopping";
import { money } from "@/lib/types";
import type { Order, PaymentCheckout } from "@/lib/orders";

type RazorpayOptions = Record<string, unknown> & {
  handler: (r: Record<string, string>) => void;
  modal: { ondismiss: () => void };
};
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (
        event: string,
        cb: (r: { error?: { description?: string } }) => void,
      ) => void;
    };
  }
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(
        new Error("Could not load the payment window. Check your connection."),
      );
    document.body.appendChild(script);
  });
}

// Opens the gateway's payment window and resolves with the verified order, or
// null when the customer closes it. Each gateway is one branch here.
export function usePayment() {
  const [test, setTest] = useState<{
    checkout: NonNullable<PaymentCheckout>;
    amount: number;
    done: (outcome: "success" | "failure" | null) => void;
  } | null>(null);
  async function pay(
    number: string,
    checkout: PaymentCheckout,
    amount: number,
  ): Promise<Order | null> {
    if (!checkout) throw new Error("Online payment is not available.");
    const verify = (payload: unknown) =>
      request<Order>(
        `/customer/orders/${encodeURIComponent(number)}/verify`,
        payload,
      );
    if (checkout.provider === "razorpay") {
      await loadRazorpay();
      return new Promise((resolve, reject) => {
        const { provider: _p, orderId, ...rest } = checkout;
        // Razorpay keeps its window open after a failed attempt so the
        // customer can try another method; remember why it failed in case
        // they close the window instead.
        let failure = "";
        const rzp = new window.Razorpay!({
          ...rest,
          order_id: orderId,
          theme: { color: "#ff3f6c" },
          handler: (response) => verify(response).then(resolve, reject),
          modal: {
            ondismiss: () =>
              failure
                ? reject(new Error(`Payment failed: ${failure}`))
                : resolve(null),
          },
        });
        rzp.on("payment.failed", (r) => {
          failure = r.error?.description || "the bank declined the payment";
        });
        rzp.open();
      });
    }
    if (checkout.provider === "payu") {
      // PayU is a full-page redirect: post the signed form and leave the page.
      // PayU sends the customer back to their order page when done.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = String(checkout.action);
      for (const [name, value] of Object.entries(
        checkout.fields as Record<string, string>,
      )) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
      return new Promise<Order | null>(() => undefined);
    }
    if (checkout.provider === "test") {
      const outcome = await new Promise<"success" | "failure" | null>((done) =>
        setTest({ checkout, amount, done }),
      );
      setTest(null);
      if (!outcome) return null;
      return verify({ providerOrderId: checkout.providerOrderId, outcome });
    }
    throw new Error("This payment method is not supported.");
  }
  const dialog = test && (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="test-pay-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
        <ShieldCheck className="mx-auto text-[#03a685]" size={34} />
        <h2 id="test-pay-title" className="mt-3 text-lg font-bold">
          Test payment
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Development gateway. No money moves. Choose the result to simulate.
        </p>
        <p className="my-5 text-2xl font-bold">{money(test.amount)}</p>
        <div className="grid gap-2">
          <button
            autoFocus
            onClick={() => test.done("success")}
            className="rounded bg-[#03a685] p-3 text-sm font-bold text-white"
          >
            Simulate success
          </button>
          <button
            onClick={() => test.done("failure")}
            className="rounded border p-3 text-sm"
          >
            Simulate failure
          </button>
          <button
            onClick={() => test.done(null)}
            className="p-2 text-xs underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
  return { pay, dialog };
}
