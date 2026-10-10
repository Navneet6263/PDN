// Creates (or refreshes) a coupon that makes any order cost a fixed amount,
// for a real payment-gateway test. Kept deliberately limited because anyone
// who knows the code can use it.
//
//   npx tsx scripts/create-test-coupon.ts                      NAVNEET, ₹1, 5 uses, 7 days
//   npx tsx scripts/create-test-coupon.ts --email you@mail.in  only that account can use it
//   npx tsx scripts/create-test-coupon.ts --off                 switch it off
import "dotenv/config";
import { openDatabase } from "../server/db";

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const code = flag("code", "NAVNEET").toUpperCase();
const total = Number(flag("total", "1"));
const uses = Number(flag("uses", "5"));
const days = Number(flag("days", "7"));
const emails = args.includes("--email")
  ? [flag("email", "").toLowerCase()]
  : [];
if (!(total >= 1) || !(uses >= 1) || !(days > 0))
  throw new Error("Check --total, --uses and --days.");

const db = openDatabase();
try {
  if (args.includes("--off")) {
    await db.coupon.updateMany({ where: { code }, data: { active: false } });
    console.log(`${code} switched off.`);
  } else {
    const data = {
      description: `Test: whole order costs ₹${total}`,
      type: "fixed_total" as const,
      value: total,
      minOrder: 0,
      maxDiscount: 0,
      maxUses: uses,
      perCustomer: 0,
      allowedEmails: emails,
      active: true,
      startsAt: null,
      endsAt: new Date(Date.now() + days * 86400000),
    };
    await db.coupon.upsert({
      where: { code },
      update: data,
      create: { code, ...data },
    });
    console.log(
      `${code} ready: whole order = ₹${total}, ${uses} uses, expires ${data.endsAt.toLocaleString("en-IN")}` +
        (emails.length
          ? `, only for ${emails[0]}`
          : ", any signed-in customer") +
        ". Switch off after testing: npx tsx scripts/create-test-coupon.ts --off",
    );
  }
} finally {
  await db.$disconnect();
}
