import type { Product } from "./types";
export const moods = ["office", "college", "everyday", "festive"] as const;
export type Mood = (typeof moods)[number];
export type StyleProfile = {
  audience: "women" | "men" | "kids";
  mood: Mood;
  style: "ethnic" | "minimal" | "bold";
  budget: number;
  saturday: boolean;
};
export const profileKey = "terra-style-profile-v1";
export const skipKey = "terra-style-skip-v1";
export const initialProfile: StyleProfile = {
  audience: "women",
  mood: "office",
  style: "ethnic",
  budget: 2500,
  saturday: false,
};
export const moodLabels: Record<Mood, string> = {
  office: "Office mood",
  college: "Campus cool",
  everyday: "Everyday easy",
  festive: "Celebration mode",
};
export function parseProfile(raw: string | null): StyleProfile | null {
  try {
    const p = JSON.parse(raw || "null");
    if (
      p &&
      ["women", "men", "kids"].includes(p.audience) &&
      moods.includes(p.mood) &&
      ["ethnic", "minimal", "bold"].includes(p.style) &&
      [1000, 2500, 5000, 10000000].includes(p.budget) &&
      typeof p.saturday === "boolean" &&
      !(p.audience === "kids" && ["office", "college"].includes(p.mood))
    )
      return {
        audience: p.audience,
        mood: p.mood,
        style: p.style,
        budget: p.budget,
        saturday: p.saturday,
      };
  } catch {}
  return null;
}
const casual = /kurti|kurtis|t-shirt|jeans|shirt|trouser|top|dress|co-ord|cotton|straight/;
const ethnic = /saree|kurta|kurti|lehenga|anarkali|ethnic|sherwani|nehru/;
const occasion = /lehenga|sherwani|anarkali|wedding|bridal|zari|celebration|festive/;
export function styleMatches(products: Product[], profile: StyleProfile): Product[] {
  return products
    .filter((p) => {
      if (
        !p.published ||
        p.stock <= 0 ||
        p.category !== profile.audience ||
        p.price > profile.budget
      )
        return false;
      const words = `${p.name} ${p.subCategory}`.toLowerCase();
      const tags = p.searchKeywords.map((k) => k.toLowerCase().trim());
      if (tags.some((tag) => tag.startsWith("mood:"))) return tags.includes(`mood:${profile.mood}`);
      if (profile.mood === "festive") return ethnic.test(words);
      return casual.test(words) && !occasion.test(words);
    })
    .sort((a, b) => {
      const score = (p: Product) => {
        const text = `${p.name} ${p.subCategory}`.toLowerCase();
        return (
          (p.searchKeywords.includes(`style:${profile.style}`) ? 20 : 0) +
          (profile.style === "ethnic" && ethnic.test(text)
            ? 10
            : profile.style === "minimal" &&
                /plain|solid|essential|classic|straight|cotton/.test(text)
              ? 10
              : profile.style === "bold" && /print|floral|embroidered|colour/.test(text)
                ? 10
                : 0)
        );
      };
      return score(b) - score(a) || a.displayOrder - b.displayOrder || a.id.localeCompare(b.id);
    });
}
export const officeDays = [
  {
    day: "Monday",
    title: "Fresh start energy",
    note: "Your inbox may be full. Keep your outfit effortless.",
  },
  {
    day: "Tuesday",
    title: "Meeting-ready mood",
    note: "Your microphone might be on mute. Your style does not have to be.",
  },
  {
    day: "Wednesday",
    title: "Midweek, made easy",
    note: "Halfway through the week. You have earned that tea break.",
  },
  {
    day: "Thursday",
    title: "Almost-Friday feeling",
    note: "The weekend is still a little away. A great outfit is right here.",
  },
  {
    day: "Friday",
    title: "Desk to dinner",
    note: "Last meeting done. Straight into weekend mode.",
  },
  {
    day: "Saturday",
    title: "Overtime, but make it style",
    note: "Working on Saturday? Your calendar let you down. Your outfit will not. 😅",
  },
];
export function plannerDays(profile: StyleProfile) {
  return profile.mood === "office"
    ? officeDays.slice(0, profile.saturday ? 6 : 5)
    : Array.from({ length: 3 }, (_, i) => ({
        day: `Look ${i + 1}`,
        title:
          profile.mood === "college"
            ? ["First lecture, fresh look", "Canteen catch-up", "After-class plans"][i]
            : profile.mood === "festive"
              ? ["The family get-together", "A little extra sparkle", "Photo-ready moments"][i]
              : ["Coffee-run comfort", "Errands, but stylish", "Slow-day favourites"][i],
        note:
          profile.mood === "college"
            ? "Attendance may be a question. Your outfit will make an appearance."
            : profile.mood === "festive"
              ? "There is always one more family photo. Make it a good outfit day."
              : "Simple plans deserve a little personality too.",
      }));
}

export function planProducts(products: Product[], profile: StyleProfile, rotation = 0) {
  const pool = styleMatches(products, profile);
  if (!pool.length) return [];
  const days = plannerDays(profile);
  if (profile.mood !== "office" || !profile.saturday)
    return days.map((_, i) => pool[(i + rotation) % pool.length]);
  const bold = styleMatches(products, { ...profile, style: "bold" });
  const saturday = bold[rotation % bold.length];
  const other = pool.filter((p) => p.id !== saturday.id);
  const weekdays = other.length ? other : pool;
  return days.map((day, i) =>
    day.day === "Saturday" ? saturday : weekdays[(i + rotation) % weekdays.length],
  );
}
