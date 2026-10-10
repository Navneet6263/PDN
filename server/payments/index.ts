import { razorpay } from "./razorpay";
import { testGateway } from "./test-gateway";
import type { PaymentProvider } from "./types";
export type { PaymentProvider } from "./types";
export { PaymentError } from "./types";

// Picks the online gateway from environment variables. Cash on delivery needs
// no gateway and is controlled from Store Settings.
export function onlineProviderFromEnv(
  env = process.env,
): PaymentProvider | null {
  if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET)
    return razorpay({
      keyId: env.RAZORPAY_KEY_ID,
      keySecret: env.RAZORPAY_KEY_SECRET,
      webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
    });
  if (env.PAYMENT_TEST_MODE === "true") {
    if (env.NODE_ENV === "production")
      throw new Error("PAYMENT_TEST_MODE cannot be used in production.");
    return testGateway();
  }
  return null;
}
