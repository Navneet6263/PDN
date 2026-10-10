import { randomBytes } from "node:crypto";
import { z } from "zod";
import { PaymentError, type PaymentProvider } from "./types";

// Development-only gateway so the full online flow can be tried without keys.
// index.ts refuses to enable it in production.
export function testGateway(): PaymentProvider {
  const schema = z.object({
    providerOrderId: z.string().regex(/^test_[a-f0-9]{24}$/),
    outcome: z.enum(["success", "failure"]),
  });
  return {
    id: "test",
    label: "Test payment (no money moves)",
    async create() {
      const providerOrderId = `test_${randomBytes(12).toString("hex")}`;
      return {
        providerOrderId,
        checkout: { provider: "test", providerOrderId },
      };
    },
    async verify(payload) {
      const parsed = schema.safeParse(payload);
      if (!parsed.success)
        throw new PaymentError("Payment confirmation is incomplete.");
      const { providerOrderId, outcome } = parsed.data;
      return {
        providerOrderId,
        providerPaymentId: `${providerOrderId}_pay`,
        status: outcome === "success" ? "paid" : "failed",
        reason: outcome === "failure" ? "Declined in test mode" : undefined,
      };
    },
  };
}
