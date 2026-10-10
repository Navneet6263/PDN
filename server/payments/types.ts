import type { PaymentCheckout } from "../../lib/orders";

export type PaymentRequest = {
  orderNumber: string;
  paymentId: string;
  amount: number;
  currency: string;
  storeName: string;
  customer: { name: string; email: string; phone: string };
};
export type CreatedPayment = {
  providerOrderId: string;
  checkout: NonNullable<PaymentCheckout>;
};
export type PaymentResult = {
  providerOrderId: string;
  providerPaymentId: string;
  status: "paid" | "failed";
  reason?: string;
};

// Every online gateway implements this contract. Order code never talks to a
// gateway directly, so adding Stripe, PhonePe or Cashfree is one new file.
export interface PaymentProvider {
  id: string;
  label: string;
  // Registers the attempt with the gateway and returns what the browser needs.
  create(request: PaymentRequest): Promise<CreatedPayment>;
  // Checks the browser's success callback. Must reject forged payloads.
  verify(payload: unknown): Promise<PaymentResult>;
  // Server-to-server confirmation. Return null for events that can be ignored.
  webhook?(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<PaymentResult | null>;
}

export class PaymentError extends Error {
  status = 400;
}
