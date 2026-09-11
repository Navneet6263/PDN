import { Router } from "express";
import type { Database } from "./db";
import { body, fail } from "./route-utils";
import { ticketSchema, replySchema } from "./admin-schemas";
export function supportRoutes(db: Database) {
  const router = Router();
  const include = { replies: { orderBy: { createdAt: "asc" as const } } };
  const validateAssignee = async (id: string | null) => {
    if (
      id &&
      !(await db.teamMember.findFirst({
        where: { id, active: true, role: { in: ["admin", "support"] } },
      }))
    )
      throw fail("Choose an active support or admin team member.");
  };
  router.get("/support/agents", async (_req, res) =>
    res.json(
      await db.teamMember.findMany({
        where: { active: true, role: { in: ["admin", "support"] } },
        select: { id: true, name: true },
      }),
    ),
  );
  router.get("/support", async (_req, res) =>
    res.json(await db.supportTicket.findMany({ include, orderBy: { updatedAt: "desc" } })),
  );
  router.post("/support", async (req, res) => {
    const data = body(ticketSchema, req);
    await validateAssignee(data.assigneeId);
    res.status(201).json(await db.supportTicket.create({ data, include }));
  });
  router.put("/support/:id", async (req, res) => {
    const data = body(ticketSchema, req);
    await validateAssignee(data.assigneeId);
    res.json(
      await db.supportTicket.update({ where: { id: String(req.params.id) }, data, include }),
    );
  });
  router.post("/support/:id/replies", async (req, res) => {
    const { text } = body(replySchema, req);
    const id = String(req.params.id);
    const ticket = await db.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw fail("Ticket not found.", 404);
    res.status(201).json(
      await db.supportTicket.update({
        where: { id },
        data: {
          status: ticket.status === "open" ? "pending" : ticket.status,
          replies: { create: { text, author: res.locals.actor.name } },
        },
        include,
      }),
    );
  });
  return router;
}
