import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response, NextFunction } from "express";
import type { Database } from "./db";
import type { ServerConfig } from "./config";
const deriveKey = promisify(scrypt);
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
const cookieToken = (req: Request) =>
  (req.headers.cookie || "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("terra_session="))
    ?.slice(14) || "";
export function createAuth(db: Database, config: ServerConfig) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: config.secure,
    path: "/",
  };
  async function required(req: Request, res: Response, next: NextFunction) {
    const session = await db.session.findFirst({
      where: { token: digest(cookieToken(req)), expires: { gt: new Date() } },
      include: { member: true },
    });
    if (!session || (session.member && !session.member.active)) {
      res.status(401).json({ error: "Please sign in." });
      return;
    }
    res.locals.actor = session.member
      ? {
          id: session.member.id,
          name: session.member.name,
          email: session.member.email,
          role: session.member.role,
        }
      : { id: "owner", name: "Store owner", email: config.email, role: "admin" };
    next();
  }
  async function login(req: Request, res: Response) {
    const key = digest(req.ip || "unknown");
    await db.loginAttempt.deleteMany({
      where: { expires: { lt: new Date() } },
    });
    const attempt = await db.loginAttempt.upsert({
      where: { key },
      update: { count: { increment: 1 } },
      create: { key, count: 1, expires: new Date(Date.now() + 15 * 60000) },
    });
    if (attempt && attempt.count > 10) {
      res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
      return;
    }
    const { email, password } = req.body || {};
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const owner = normalizedEmail === config.email.toLowerCase();
    const member = owner
      ? null
      : await db.teamMember.findUnique({ where: { email: normalizedEmail } });
    const [salt, expected] = (member?.passwordHash || config.hash).split(":");
    const actual = (await deriveKey(
      typeof password === "string" ? password.slice(0, 500) : "",
      salt,
      64,
    )) as Buffer;
    const valid = timingSafeEqual(actual, Buffer.from(expected, "hex"));
    if (!valid || (!owner && !member?.active)) {
      res.status(401).json({ error: "Incorrect email or password." });
      return;
    }
    await db.loginAttempt.deleteMany({ where: { key } });
    const token = randomBytes(32).toString("hex");
    await db.session.deleteMany({ where: { expires: { lt: new Date() } } });
    await db.session.create({
      data: {
        token: digest(token),
        memberId: member?.id || null,
        expires: new Date(Date.now() + 8 * 3600000),
      },
    });
    res
      .cookie("terra_session", token, { ...cookieOptions, maxAge: 8 * 3600000 })
      .json(
        member
          ? { id: member.id, name: member.name, email: member.email, role: member.role }
          : { id: "owner", name: "Store owner", email: config.email, role: "admin" },
      );
  }
  async function logout(req: Request, res: Response) {
    await db.session.deleteMany({ where: { token: digest(cookieToken(req)) } });
    res.clearCookie("terra_session", cookieOptions).json({ ok: true });
  }
  return { required, login, logout };
}
