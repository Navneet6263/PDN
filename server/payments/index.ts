import { payu } from "./payu";
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
  if (env.PAYU_MERCHANT_KEY && env.PAYU_MERCHANT_SALT) {
    if (env.PAYU_MODE === "live" && !env.SITE_URL?.startsWith("https://"))
      throw new Error(
        "Set SITE_URL to your https:// address before using live PayU.",
      );
    return payu({
      key: env.PAYU_MERCHANT_KEY,
      salt: env.PAYU_MERCHANT_SALT,
      mode: env.PAYU_MODE === "live" ? "live" : "test",
      siteUrl: env.SITE_URL || "http://localhost:3000",
    });
  }
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
