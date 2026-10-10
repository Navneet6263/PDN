import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { PaymentError, type PaymentProvider } from "./types";

const sign = (secret: string, data: string | Buffer) =>
  createHmac("sha256", secret).update(data).digest("hex");
const same = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

const callback = z.object({
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/),
});

// Razorpay Standard Checkout: create a gateway order on the server, open
// checkout.js in the browser, then verify the returned signature.
export function razorpay(options: {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
  apiBase?: string;
}): PaymentProvider {
  const api = options.apiBase || "https://api.razorpay.com/v1";
  const auth = `Basic ${Buffer.from(`${options.keyId}:${options.keySecret}`).toString("base64")}`;
  return {
    id: "razorpay",
    label: "UPI, cards, netbanking & wallets",
    async create(request) {
      const paise = Math.round(request.amount * 100);
      if (paise < 100)
        throw new PaymentError("Online payments must be at least ₹1.");
      const response = await fetch(`${api}/orders`, {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: paise,
          currency: request.currency,
          receipt: request.paymentId,
          notes: { order: request.orderNumber },
        }),
        signal: AbortSignal.timeout(15000),
      });
      const data = (await response.json().catch(() => ({}))) as {
        id?: string;
        error?: { description?: string };
      };
      if (!response.ok || !data.id) {
        // Log the real cause for the store owner; customers get a plain message.
        console.error(
          response.status === 401
            ? "Razorpay rejected the API keys (401). Check RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET and that test keys are not mixed with live mode."
            : `Razorpay order creation failed (${response.status}): ${data.error?.description || "no details"}`,
        );
        throw Object.assign(
          new PaymentError(
            "Online payment is temporarily unavailable. Please try again or choose cash on delivery.",
          ),
          { status: 502 },
        );
      }
      return {
        providerOrderId: data.id,
        checkout: {
          provider: "razorpay",
          key: options.keyId,
          orderId: data.id,
          amount: paise,
          currency: request.currency,
          name: request.storeName,
          description: `Order ${request.orderNumber}`,
          prefill: {
            name: request.customer.name,
            email: request.customer.email,
            contact: request.customer.phone,
          },
        },
      };
    },
    async verify(payload) {
      const parsed = callback.safeParse(payload);
      if (!parsed.success)
        throw new PaymentError("Payment confirmation is incomplete.");
      const p = parsed.data;
      const expected = sign(
        options.keySecret,
        `${p.razorpay_order_id}|${p.razorpay_payment_id}`,
      );
      if (!same(expected, p.razorpay_signature))
        throw new PaymentError("Payment confirmation could not be verified.");
      return {
        providerOrderId: p.razorpay_order_id,
        providerPaymentId: p.razorpay_payment_id,
        status: "paid",
      };
    },
    async webhook(rawBody, headers) {
      const signature = String(headers["x-razorpay-signature"] || "");
      if (
        !options.webhookSecret ||
        !same(sign(options.webhookSecret, rawBody), signature)
      )
        throw new PaymentError("Invalid webhook signature.");
      const event = JSON.parse(rawBody.toString("utf8"));
      const payment = event?.payload?.payment?.entity;
      if (!payment?.order_id || !payment?.id) return null;
      if (event.event === "payment.captured" || event.event === "order.paid")
        return {
          providerOrderId: payment.order_id,
          providerPaymentId: payment.id,
          status: "paid",
        };
      if (event.event === "payment.failed")
        return {
          providerOrderId: payment.order_id,
          providerPaymentId: payment.id,
          status: "failed",
          reason: String(payment.error_description || "Payment failed"),
        };
      return null;
    },
  };
}
