import { z } from "zod";
export const cartSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(100),
      size: z.string().max(40),
      color: z.string().max(60),
      quantity: z.number().int().min(1).max(10),
    }),
  )
  .max(50);
export type CartItem = z.infer<typeof cartSchema>[number];
export const itemKey = (i: CartItem) => JSON.stringify([i.productId, i.size, i.color]);
export function mergeCart(a: CartItem[], b: CartItem[]) {
  const result = new Map<string, CartItem>();
  for (const i of [...a, ...b]) {
    const key = itemKey(i),
      old = result.get(key);
    result.set(key, { ...i, quantity: Math.min(10, i.quantity + (old?.quantity || 0)) });
  }
  if (result.size > 50) throw new Error("Your bag can hold up to 50 different styles.");
  return [...result.values()];
}
export const addressSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  line: z.string().trim().min(8).max(300),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pin: z.string().regex(/^\d{6}$/),
});
export type Customer = { id: string; name: string; email: string };
export async function request<T>(path: string, body?: unknown, method?: string): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: method || (body === undefined ? "GET" : "POST"),
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Please try again.");
  return data;
}
