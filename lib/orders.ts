import { z } from "zod";
import { addressSchema } from "./shopping";

export const orderStatuses = [
  "pending_payment",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "cod" | "online";

export const statusLabels: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};
export const paymentLabels: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

// Allowed next steps for each status. Cancelled and returned are final.
export const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["out_for_delivery", "delivered", "returned"],
  out_for_delivery: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};
// The customer-facing progress line; cancelled/returned are shown separately.
export const progressSteps: OrderStatus[] = [
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];
export const customerCanCancel = (status: OrderStatus) =>
  status === "pending_payment" || status === "confirmed";

export type ChargeSettings = {
  shippingFee: number;
  freeShippingAbove: number;
  codEnabled: boolean;
  codFee: number;
  codMaxOrder: number;
};
const paise = (n: number) => Math.round(n * 100);
export function orderTotals(
  subtotal: number,
  settings: ChargeSettings,
  method: PaymentMethod,
) {
  const shippingFee =
    subtotal <= 0 ||
    (settings.freeShippingAbove > 0 && subtotal >= settings.freeShippingAbove)
      ? 0
      : settings.shippingFee;
  const codFee = method === "cod" ? settings.codFee : 0;
  return {
    subtotal,
    shippingFee,
    codFee,
    discount: 0,
    total: (paise(subtotal) + paise(shippingFee) + paise(codFee)) / 100,
  };
}
export type CouponRule = {
  code: string;
  description: string;
  type: "percent" | "flat" | "fixed_total";
  value: number;
  minOrder: number;
  maxDiscount: number;
};
// Discount for a coupon on already-computed totals. "fixed_total" makes the
// whole order cost exactly `value` (useful for live gateway tests).
export function couponDiscount(
  coupon: CouponRule,
  totals: { subtotal: number; total: number },
) {
  if (totals.subtotal < coupon.minOrder) return 0;
  let d =
    coupon.type === "percent"
      ? (totals.subtotal * coupon.value) / 100
      : coupon.type === "flat"
        ? Math.min(coupon.value, totals.subtotal)
        : Math.max(0, totals.total - coupon.value);
  if (coupon.type !== "fixed_total" && coupon.maxDiscount > 0)
    d = Math.min(d, coupon.maxDiscount);
  return paise(Math.min(d, totals.total)) / 100;
}
export function withCoupon<T extends { subtotal: number; total: number }>(
  totals: T,
  coupon: CouponRule | null,
) {
  const discount = coupon ? couponDiscount(coupon, totals) : 0;
  return {
    ...totals,
    discount,
    total: (paise(totals.total) - paise(discount)) / 100,
  };
}
export const codAllowed = (settings: ChargeSettings, total: number) =>
  settings.codEnabled &&
  (settings.codMaxOrder <= 0 || total <= settings.codMaxOrder);

export const placeOrderSchema = z.object({
  address: addressSchema,
  paymentMethod: z.enum(["cod", "online"]),
  idempotencyKey: z.string().uuid(),
  couponCode: z
    .string()
    .trim()
    .max(40)
    .transform((v) => v.toUpperCase())
    .default(""),
});

export type OrderLine = {
  id: string;
  productId: string | null;
  name: string;
  slug: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  mrp: number;
};
export type OrderEvent = {
  id: string;
  kind: string;
  status: string;
  message: string;
  actor: string;
  createdAt: string;
};
export type OrderPayment = {
  id: string;
  provider: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  providerPaymentId: string | null;
  failureReason: string;
  createdAt: string;
};
export type Order = {
  id: string;
  number: string;
  email: string;
  customerName: string;
  phone: string;
  address: {
    name: string;
    phone: string;
    line: string;
    city: string;
    state: string;
    pin: string;
  };
  region: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  currency: string;
  subtotal: number;
  shippingFee: number;
  codFee: number;
  discount: number;
  couponCode: string;
  total: number;
  courier: string;
  trackingNumber: string;
  trackingUrl: string;
  refundDue: boolean;
  placedAt: string;
  updatedAt: string;
  items: OrderLine[];
  payments?: OrderPayment[];
  events?: OrderEvent[];
};
// What the browser needs to open a provider's payment window.
export type PaymentCheckout = {
  provider: string;
  [key: string]: unknown;
} | null;
