import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { openDatabase } from "../server/db";
const db = openDatabase();
try {
  const previous = await db.banner.findMany();
  await mkdir("data/backups", { recursive: true });
  await writeFile(
    `data/backups/before-shopping-banners-${Date.now()}.json`,
    JSON.stringify(previous, null, 2),
  );
  const banners = [
    {
      id: "shopping-family-hero",
      title: "A little festive. A lot of you.",
      subtitle: "Sarees, kurtas and little celebrations. Find a favourite for everyone.",
      eyebrow: "The family edit",
      image: "/images/sample/festive-family.png",
      link: "/?category=women#catalog",
      buttonLabel: "Explore ethnic styles",
    },
    {
      id: "shopping-office-hero",
      title: "Monday meetings. Friday energy.",
      subtitle:
        "Easy office looks, picked around your mood. Working on Saturdays too? We've got a style for that.",
      eyebrow: "Meet your workday wardrobe",
      image: "/images/sample/office-thursday.webp",
      link: "/#style-studio",
      buttonLabel: "Find my style",
    },
    {
      id: "shopping-kids-hero",
      title: "Little outfits. Big personality.",
      subtitle: "Playful colours and celebration-ready styles for their next big day.",
      eyebrow: "The little ones edit",
      image: "/images/sample/girls-lehenga.png",
      link: "/?category=kids#catalog",
      buttonLabel: "Explore kidswear",
    },
  ];
  for (const [position, b] of banners.entries())
    await db.banner.upsert({
      where: { id: b.id },
      create: { ...b, slot: "hero", active: true, position: position + 100, mobileImage: b.image },
      update: {},
    });
  console.log("Three editable rotating hero banners are ready. Existing banners were preserved.");
} finally {
  await db.$disconnect();
}
