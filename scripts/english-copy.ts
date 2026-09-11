import { readFile, writeFile } from "node:fs/promises";
const translations = new Map([
  ["Aapko kaise kapde pasand hain?", "What is your kind of style?"],
  [
    "Office, college ya weekend? Apna mood batao. Hum looks dikhate hain.",
    "Office, campus or weekend? Tell us your mood. Discover your next look.",
  ],
  ["Aaj kis mood mein shopping?", "What is your shopping mood today?"],
  [
    "Bas 3 quick steps. Phir looks jo aapke plans se match karein.",
    "Three quick steps to find looks that fit your plans.",
  ],
  ["Desi at heart", "Rooted in tradition"],
  ["Saturday bhi office hai?", "Working on Saturdays too?"],
  ["Saturday bhi open hai?", "Working on Saturdays too?"],
  ["Nahi, weekend mera hai!", "No, the weekend is mine!"],
  ["Haan yaar, Saturday bhi.", "Yes, Saturdays too."],
  [
    "Saturday attendance compulsory? Style optional nahi hai.",
    "Saturday attendance is mandatory. A great outfit makes it easier.",
  ],
  [
    "Five-day week. Weekend ke liye hum bhi happy hain!",
    "A five-day week. Now that is a weekend worth celebrating!",
  ],
  [
    "Apne office ka dress code\n                zaroor check karein.",
    "Please follow your workplace dress code.",
  ],
  [
    "Lecture, canteen, after-class plans — teen looks, your vibe.",
    "Lectures, lunch breaks and after-class plans — three looks, your style.",
  ],
  [
    "Family function ya festive photos — let’s find your celebration look.",
    "Family gatherings or festive photos — find your celebration look.",
  ],
  [
    "Inbox bhari ho sakti hai. Outfit ko simple rakho.",
    "Your inbox may be full. Keep your outfit effortless.",
  ],
  [
    "“You’re on mute” ho sakta hai. Style on mute nahi.",
    "Your microphone might be on mute. Your style does not have to be.",
  ],
  [
    "Half week done. Chai break toh banta hai.",
    "Halfway through the week. You have earned that tea break.",
  ],
  [
    "Weekend abhi door hai, good outfit bilkul paas.",
    "The weekend is still a little away. A great outfit is right here.",
  ],
  ["Last meeting ke baad seedha weekend mode.", "Last meeting done. Straight into weekend mode."],
  [
    "Saturday bhi office? Calendar ne dhokha diya, outfit nahi dega.",
    "Working on Saturday? Your calendar let you down. Your outfit will not.",
  ],
  ["Calendar ne dhokha diya", "Your calendar let you down"],
  [
    "Attendance ka pata nahi, outfit ki presence pakki.",
    "Attendance may be a question. Your outfit will make an appearance.",
  ],
  [
    "Family photos mein “ek aur” toh hoga. Outfit ready rakho.",
    "There is always one more family photo. Make it a good outfit day.",
  ],
  [
    "Plans simple hain. Style boring hona zaroori nahi.",
    "Simple plans deserve a little personality too.",
  ],
  [
    "Is mood aur budget mein abhi matching in-stock styles nahi hain. Budget ya mood badal\n            kar dekhein; unrelated products recommend nahi karenge.",
    "No available styles match this mood and budget yet. Try another mood or price range.",
  ],
]);
for (const path of [
  "components/style/StyleStudio.tsx",
  "components/style/StyleQuiz.tsx",
  "components/style/StyleResults.tsx",
  "lib/style-planner.ts",
  "e2e/style-studio.spec.ts",
  "scripts/capture-style.ts",
  "scripts/load-shopping-banners.ts",
]) {
  let content = await readFile(path, "utf8");
  for (const [from, to] of translations) content = content.replaceAll(from, to);
  await writeFile(path, content);
}
console.log("English storefront copy applied.");
