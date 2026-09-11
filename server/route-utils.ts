import type { ZodType } from "zod";
import type { Request } from "express";
export function body<T>(schema: ZodType<T>, req: Request): T {
  const result = schema.safeParse(req.body);
  if (!result.success)
    throw Object.assign(
      new Error(result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")),
      { status: 400 },
    );
  return result.data;
}
export const fail = (message: string, status = 400) =>
  Object.assign(new Error(message), { status });
