import { Router } from "express";
import { randomBytes, scryptSync } from "node:crypto";
import type { Database } from "./db";
import { memberSchema } from "./admin-schemas";
import { body, fail } from "./route-utils";
const select = { id: true, name: true, email: true, role: true, active: true } as const;
export const passwordHash = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
};
export function teamRoutes(db: Database, ownerEmail: string) {
  const router = Router();
  router.get("/team", async (_req, res) =>
    res.json(await db.teamMember.findMany({ select, orderBy: { name: "asc" } })),
  );
  router.post("/team", async (req, res) => {
    const { password, ...data } = body(memberSchema, req);
    if (!password) throw fail("Set an initial password of at least 8 characters.");
    if (data.email === ownerEmail.toLowerCase())
      throw fail("This email belongs to the store owner.", 409);
    res.status(201).json(
      await db.teamMember.create({
        data: { ...data, passwordHash: passwordHash(password) },
        select,
      }),
    );
  });
  router.put("/team/:id", async (req, res) => {
    const id = String(req.params.id);
    const { password, ...data } = body(memberSchema, req);
    if (data.email === ownerEmail.toLowerCase())
      throw fail("This email belongs to the store owner.", 409);
    if (res.locals.actor.id === id && (!data.active || data.role !== "admin"))
      throw fail("You cannot disable or demote your own account.");
    const member = await db.$transaction(async (tx) => {
      const updated = await tx.teamMember.update({
        where: { id },
        data: { ...data, ...(password ? { passwordHash: passwordHash(password) } : {}) },
        select,
      });
      await tx.session.deleteMany({ where: { memberId: id } });
      return updated;
    });
    res.json(member);
  });
  router.delete("/team/:id", async (req, res) => {
    const id = String(req.params.id);
    if (res.locals.actor.id === id) throw fail("You cannot remove your own account.");
    await db.teamMember.delete({ where: { id } });
    res.json({ ok: true });
  });
  return router;
}
