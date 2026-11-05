// Sets the store up as a women-only fashion store with the HD launch catalog.
//
//   npx tsx scripts/load-women-store.ts
//
// - Backs up products, categories, banners and settings to data/backups.
// - Removes the earlier demo listings (men, kids, low-resolution photos).
//   Products you created yourself are never deleted; if they sit in a
//   department that is no longer used, that department is hidden instead.
// - Adds 11 women's products, three departments, hero banners, promotions,
//   a Workwear collection and Top picks, and women-focused store copy.
// Safe to re-run: existing launch products are refreshed, nothing duplicates.
import "dotenv/config";
import { access, mkdir, writeFile } from "node:fs/promises";
import { openDatabase } from "../server/db";
import { defaultSettings } from "../lib/store-types";
import { womenDepartments, womenProducts } from "./women-catalog";

const exists = (path: string) =>
  path.startsWith("/images/")
    ? access(`public${path}`).then(
        () => true,
        () => false,
      )
    : Promise.resolve(true);

const db = openDatabase();
try {
  for (const p of womenProducts)
    for (const g of p.gallery)
      if (!(await exists(g)))
        throw new Error(`Missing image ${g}. Run git pull first.`);

  await mkdir("data/backups", { recursive: true });
  await writeFile(
    `data/backups/before-women-store-${Date.now()}.json`,
    JSON.stringify(
      {
        settings: await db.storeSettings.findUnique({ where: { id: "main" } }),
        categories: await db.storeCategory.findMany(),
        banners: await db.banner.findMany(),
        products: await db.product.findMany({
          include: { packageContents: true },
        }),
      },
      null,
      2,
    ),
  );

  const keep = new Set(womenProducts.map((p) => p.slug));
  const all = await db.product.findMany({
    select: { id: true, slug: true, image: true },
  });
  const demo: string[] = [];
  for (const p of all)
    if (
      !keep.has(p.slug) &&
      (/^(sample-|c-|studio-office-)/.test(p.slug) || !(await exists(p.image)))
    )
      demo.push(p.id);

  const summary = await db.$transaction(
    async (tx) => {
      // Order history keeps its own copy of names and prices, so removing
      // demo listings never changes past orders.
      const removed = await tx.product.deleteMany({
        where: { id: { in: demo } },
      });
      await tx.product.updateMany({
        where: { topTenRank: { not: null } },
        data: { topTenRank: null },
      });

      for (const [position, d] of womenDepartments.entries())
        await tx.storeCategory.upsert({
          where: { slug: d.slug },
          create: { ...d, position },
          update: { ...d, position },
        });

      const ids: Record<string, string> = {};
      for (const p of womenProducts) {
        const { packageContents, ...data } = p;
        const items = packageContents.map((item, position) => ({
          ...item,
          position,
        }));
        const row = await tx.product.upsert({
          where: { slug: p.slug },
          create: { ...data, packageContents: { create: items } },
          update: {
            ...data,
            packageContents: { deleteMany: {}, create: items },
          },
          select: { id: true },
        });
        ids[p.slug] = row.id;
      }

      // Departments from the old mixed catalog: delete when empty, otherwise
      // hide them (their products are your own and stay in admin).
      let hidden = 0;
      const departments = new Set(womenDepartments.map((d) => d.slug));
      for (const c of await tx.storeCategory.findMany({
        include: { _count: { select: { products: true } } },
      })) {
        if (departments.has(c.slug)) continue;
        if (c._count.products) {
          await tx.storeCategory.update({
            where: { id: c.id },
            data: { active: false },
          });
          hidden++;
        } else await tx.storeCategory.delete({ where: { id: c.id } });
      }

      // Banners whose photos were removed go; launch banners are refreshed.
      const oldDemo = /^(sample-|shopping-)/;
      for (const b of await tx.banner.findMany())
        if (
          oldDemo.test(b.id) ||
          !(await exists(b.image)) ||
          (b.mobileImage && !(await exists(b.mobileImage)))
        )
          await tx.banner.delete({ where: { id: b.id } });
      const img = (slug: string, n = "") => `/images/women/${slug}${n}.webp`;
      // Earlier festive/bridal banners do not fit Workari's workwear focus.
      await tx.banner.deleteMany({
        where: {
          id: {
            in: [
              "women-hero-festive",
              "women-hero-bridal",
              "women-promo-jewellery",
            ],
          },
        },
      });
      const week = [
        "powder-blue-chikan-kurta-set",
        "sage-straight-kurta-set",
        "rose-block-print-kurta-set",
        "ivory-shirt-and-trouser-set",
        "navy-geometric-kurta-set",
        "teal-asymmetric-tunic-set",
      ].map((s) => ids[s]);
      const banners = [
        {
          id: "women-hero-workwear",
          slot: "hero",
          position: 0,
          layout: "left",
          tone: "light",
          eyebrow: "Workwear for women",
          title: "Dressed for the meeting. Comfortable till the commute home.",
          subtitle:
            "Kurta sets, co-ords and kurtis made for your working week.",
          image: img("ivory-shirt-and-trouser-set"),
          buttonLabel: "Shop workwear",
          link: "/?category=workwear-sets#catalog",
        },
        {
          id: "women-hero-week",
          slot: "hero",
          position: 1,
          layout: "right",
          tone: "light",
          eyebrow: "The workwear week",
          title: "Monday to Saturday, sorted.",
          subtitle:
            "Six easy sets that take you from first meeting to last call.",
          image: img("powder-blue-chikan-kurta-set"),
          buttonLabel: "See the week",
          destination: "collection",
          productIds: week,
        },
        {
          id: "women-hero-kurtis",
          slot: "hero",
          position: 2,
          layout: "left",
          tone: "dark",
          eyebrow: "Everyday cotton",
          title: "Easy kurtis for long days.",
          subtitle: "Breathable cotton in soft pastel shades.",
          image: img("teal-asymmetric-tunic-set"),
          buttonLabel: "Shop kurtis",
          link: "/?category=kurtis#catalog",
        },
        {
          id: "women-promo-kurtis",
          slot: "promo",
          position: 0,
          layout: "left",
          tone: "light",
          eyebrow: "Everyday cotton",
          title: "Kurtis under ₹999",
          subtitle: "Block prints in blush, mint and lemon.",
          image: img("pastel-block-print-kurti-set"),
          buttonLabel: "Shop kurtis",
          link: "/product/pastel-block-print-kurti-set",
        },
        {
          id: "women-promo-coords",
          slot: "promo",
          position: 1,
          layout: "left",
          tone: "dark",
          eyebrow: "Boardroom ready",
          title: "Shirt & trouser sets",
          subtitle: "Two pieces you'll wear separately all week.",
          image: img("ivory-shirt-and-trouser-set"),
          buttonLabel: "Shop the set",
          link: "/product/ivory-shirt-and-trouser-set",
        },
      ];
      for (const b of banners) {
        const data = {
          mobileImage: "",
          destination: "link",
          productIds: [] as string[],
          link: "/#catalog",
          active: true,
          startsAt: null,
          endsAt: null,
          ...b,
        };
        await tx.banner.upsert({
          where: { id: b.id },
          create: data,
          update: data,
        });
      }

      const row = await tx.storeSettings.findUnique({ where: { id: "main" } });
      const current = {
        ...defaultSettings,
        ...((row?.content as object) || {}),
      };
      // The strip only promises what the store's own settings deliver.
      const strip = [
        current.freeShippingAbove > 0
          ? `FREE DELIVERY ON ORDERS ABOVE ₹${current.freeShippingAbove.toLocaleString("en-IN")}`
          : current.shippingFee === 0
            ? "FREE DELIVERY ON EVERY ORDER"
            : "",
        current.codEnabled
          ? "CASH ON DELIVERY AVAILABLE"
          : "SECURE ONLINE PAYMENT",
      ].filter(Boolean);
      const content = {
        ...current,
        storeName: "Workari",
        tagline: "Workwear for women",
        announcement: strip.join(" · "),
        announcements: strip,
        heroTitle:
          "Dressed for the meeting. Comfortable till the commute home.",
        heroSubtitle:
          "Kurta sets, co-ords and kurtis made for your working week.",
        heroEyebrow: "Workwear for women",
        heroImage: img("ivory-shirt-and-trouser-set"),
        heroButtonLabel: "Shop workwear",
        heroLink: "/?category=workwear-sets#catalog",
        catalogTitle: "Shop all workwear",
        catalogSubtitle: "Kurta sets, co-ords & kurtis",
        topTenTitle: "Top picks this week",
        showTopTen: true,
        showStory: true,
        storyTitle: "Made for the woman who works.",
        storyText:
          "Workari makes clothing for office days and everyday work: easy silhouettes, breathable fabrics and outfits that stay put from your first meeting to your commute home.",
        footerText:
          "Workwear for women: kurta sets, co-ords and kurtis for your working week.",
        newsletterTitle: "Be the first to know",
        newsletterText:
          "Hear about new arrivals and workwear edits first. No spam, unsubscribe anytime.",
        seoTitle: "Workari | Workwear for Women: Kurta Sets, Co-ords & Kurtis",
        seoDescription:
          "Shop women's workwear from Workari: office kurta sets, shirt and trouser co-ords and everyday cotton kurtis, delivered across India.",
      };
      await tx.storeSettings.upsert({
        where: { id: "main" },
        update: { content },
        create: { id: "main", content },
      });
      return { removed: removed.count, hidden };
    },
    { timeout: 120000 },
  );
  console.log(
    `Workari store ready: ${womenProducts.filter((p) => p.published).length} workwear products live (${womenProducts.filter((p) => !p.published).length} occasion pieces kept as drafts), ${womenDepartments.filter((d) => d.active).length} departments, 3 hero banners, 2 promotions. Removed ${summary.removed} old demo listings${summary.hidden ? `; hid ${summary.hidden} old department(s) that still hold your own products` : ""}. Backup saved in data/backups.`,
  );
} finally {
  await db.$disconnect();
}
