import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  PaymentError,
  type PaymentProvider,
  type PaymentResult,
} from "./types";

const sha512 = (s: string) => createHash("sha512").update(s).digest("hex");
const same = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
// PayU rejects some punctuation in these fields; keep them plain.
const plain = (s: string, max: number) =>
  s
    .replace(/[^\p{L}\p{N} .@_-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const response = z.object({
  key: z.string(),
  txnid: z.string().min(1).max(40),
  status: z.string(),
  hash: z.string().regex(/^[a-f0-9]{128}$/i),
  amount: z.string(),
  productinfo: z.string(),
  firstname: z.string(),
  email: z.string(),
  mihpayid: z.string().optional(),
  error_Message: z.string().optional(),
  field9: z.string().optional(),
  additionalCharges: z.string().optional(),
  udf1: z.string().default(""),
  udf2: z.string().default(""),
  udf3: z.string().default(""),
  udf4: z.string().default(""),
  udf5: z.string().default(""),
});

// PayU Hosted Checkout: the browser posts a signed form to PayU, and PayU posts
// the signed result back to /api/payments/return/payu (and to the webhook).
export function payu(options: {
  key: string;
  salt: string;
  mode: "test" | "live";
  siteUrl: string;
}): PaymentProvider {
  const action =
    options.mode === "live"
      ? "https://secure.payu.in/_payment"
      : "https://test.payu.in/_payment";
  const returnUrl = `${new URL(options.siteUrl).origin}/api/payments/return/payu`;

  function check(payload: unknown): PaymentResult {
    const parsed = response.safeParse(payload);
    if (!parsed.success)
      throw new PaymentError("Payment confirmation is incomplete.");
    const r = parsed.data;
    if (r.key !== options.key)
      throw new PaymentError("Payment confirmation could not be verified.");
    // Reverse hash: SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
    const body = [
      options.salt,
      r.status,
      "",
      "",
      "",
      "",
      "",
      r.udf5,
      r.udf4,
      r.udf3,
      r.udf2,
      r.udf1,
      r.email,
      r.firstname,
      r.productinfo,
      r.amount,
      r.txnid,
      r.key,
    ].join("|");
    const expected = sha512(
      r.additionalCharges ? `${r.additionalCharges}|${body}` : body,
    );
    if (!same(expected, r.hash.toLowerCase()))
      throw new PaymentError("Payment confirmation could not be verified.");
    const status = r.status.toLowerCase();
    return {
      providerOrderId: r.txnid,
      providerPaymentId: r.mihpayid || `${r.txnid}-payu`,
      status:
        status === "success"
          ? "paid"
          : status === "pending"
            ? "pending"
            : "failed",
      reason:
        status === "success"
          ? undefined
          : r.error_Message || r.field9 || "Payment failed",
      amount: Number(r.amount),
    };
  }

  return {
    id: "payu",
    label: "UPI, cards, netbanking & wallets via PayU",
    async create(request) {
      const txnid = `PDN${randomBytes(9).toString("hex")}`;
      const fields: Record<string, string> = {
        key: options.key,
        txnid,
        amount: request.amount.toFixed(2),
        productinfo: plain(`Order ${request.orderNumber}`, 100),
        firstname: plain(request.customer.name, 60) || "Customer",
        email: request.customer.email,
        phone: request.customer.phone,
        surl: returnUrl,
        furl: returnUrl,
        udf1: request.orderNumber,
        udf2: "",
        udf3: "",
        udf4: "",
        udf5: "",
      };
      // key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
      fields.hash = sha512(
        [
          fields.key,
          fields.txnid,
          fields.amount,
          fields.productinfo,
          fields.firstname,
          fields.email,
          fields.udf1,
          fields.udf2,
          fields.udf3,
          fields.udf4,
          fields.udf5,
          "",
          "",
          "",
          "",
          "",
          options.salt,
        ].join("|"),
      );
      return {
        providerOrderId: txnid,
        checkout: { provider: "payu", action, fields },
      };
    },
    async verify(payload) {
      return check(payload);
    },
    async webhook(rawBody) {
      const text = rawBody.toString("utf8");
      const payload = text.trim().startsWith("{")
        ? JSON.parse(text)
        : Object.fromEntries(new URLSearchParams(text));
      return check(payload);
    },
  };
}
