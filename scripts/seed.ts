import "dotenv/config";
import { openDatabase } from "../server/db";
const db = openDatabase();
try {
  await db.$queryRaw`SELECT 1`;
  console.log(
    "Database ready. No demo products are added. Add your real catalog in /admin.",
  );
} finally {
  await db.$disconnect();
}
