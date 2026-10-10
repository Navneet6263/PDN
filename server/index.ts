import "dotenv/config";
import { openDatabase } from "./db";
import { createApp } from "./app";
import { onlineProviderFromEnv } from "./payments";
import { expireStaleOrders } from "./orders";
const hash = process.env.ADMIN_PASSWORD_HASH || "";
const imageStorage =
  process.env.IMAGE_STORAGE === "local" ? "local" : "cloudinary";
if (!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash))
  throw new Error("Run npm run setup first to configure admin access.");
if (
  imageStorage === "cloudinary" &&
  ![
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ].every((key) => process.env[key])
) {
  throw new Error(
    "Set the three Cloudinary credentials in .env before using Cloudinary uploads.",
  );
}
const db = openDatabase();
try {
  await db.$connect();
  await db.$queryRaw`SELECT 1`;
} catch {
  await db.$disconnect();
  console.error(
    'Database is unavailable. Start it with "npm run db:dev" in another terminal, then restart the backend. For hosted PostgreSQL, check DATABASE_URL and network access.',
  );
  process.exit(1);
}
const app = createApp(db, {
  email: process.env.ADMIN_EMAIL || "admin@terra.local",
  hash,
  origin: new URL(process.env.SITE_URL || "http://localhost:3000").origin,
  secure: process.env.COOKIE_SECURE === "true",
  imageStorage,
  onlinePayment: onlineProviderFromEnv(),
});
// Release stock held by unpaid online orders.
const sweeper = setInterval(
  () => void expireStaleOrders(db).catch((e) => console.error(e.message)),
  5 * 60000,
);
const server = app.listen(
  Number(process.env.PORT || process.env.API_PORT || 4000),
  process.env.API_HOST || "127.0.0.1",
  () => console.log("Terra API connected to PostgreSQL through Prisma"),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(async () => {
      clearInterval(sweeper);
      await db.$disconnect();
      process.exit(0);
    }),
  );
