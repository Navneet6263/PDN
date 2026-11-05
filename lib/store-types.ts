export type StoreCategory = {
  id: string;
  slug: string;
  label: string;
  image: string;
  subCategories: string[];
  position: number;
  active: boolean;
};
export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  image: string;
  mobileImage: string;
  buttonLabel: string;
  link: string;
  destination?: "link" | "collection";
  productIds?: string[];
  slot: "hero" | "promo";
  layout?: "left" | "center" | "right";
  tone?: "light" | "dark";
  position: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
};
export type Identity = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "inventory" | "support";
};
export type TeamMember = Identity & { active: boolean };
export type Ticket = {
  id: string;
  customer: string;
  email: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  assigneeId: string | null;
  createdAt: string;
  replies: { id: string; author: string; text: string; createdAt: string }[];
};
export type Sale = {
  id: string;
  orderRef: string;
  customerEmail: string;
  region: string;
  amount: number;
  status: string;
  soldAt: string;
};
// Homepage blocks, in the order the admin arranges them.
export const homeSectionIds = [
  "hero",
  "trust",
  "categories",
  "newarrivals",
  "toppicks",
  "promos",
  "bestsellers",
  "style",
  "catalog",
  "story",
  "newsletter",
] as const;
export type HomeSectionId = (typeof homeSectionIds)[number];
export const homeSectionLabels: Record<HomeSectionId, string> = {
  hero: "Hero banners",
  trust: "Trust strip (delivery, COD, payments)",
  style: "My style quiz banner",
  categories: "Shop by category",
  newarrivals: "New arrivals (latest products)",
  toppicks: "Top picks (chosen in Top 10 & Search)",
  bestsellers: "Bestsellers (from real orders; hidden until there are sales)",
  promos: "Promotion banners",
  catalog: "Full collection with filters",
  story: "Brand story",
  newsletter: "Newsletter sign-up (above the footer)",
};
// The full collection is how shoppers reach every category, so it can be
// moved but not hidden.
export const requiredSections: HomeSectionId[] = ["catalog"];
// Saved order plus any sections added since, so new blocks appear by default.
export function homeLayout(s: {
  homeSections?: { id: string; visible: boolean }[];
}) {
  const saved = (s.homeSections || []).filter(
    (x): x is { id: HomeSectionId; visible: boolean } =>
      (homeSectionIds as readonly string[]).includes(x.id),
  );
  const missing = homeSectionIds
    .filter((id) => !saved.some((x) => x.id === id))
    .map((id) => ({ id, visible: true }));
  return [...saved, ...missing].map((x) =>
    requiredSections.includes(x.id) ? { ...x, visible: true } : x,
  );
}
export const sectionVisible = (
  s: { homeSections?: { id: string; visible: boolean }[] },
  id: HomeSectionId,
) => homeLayout(s).some((x) => x.id === id && x.visible);
export const trustIcons = [
  "truck",
  "cod",
  "secure",
  "track",
  "returns",
  "gift",
  "sparkle",
  "heart",
] as const;
export type TrustItem = {
  icon: (typeof trustIcons)[number];
  title: string;
  text: string;
};
export const defaultSettings = {
  storeName: "Workari",
  tagline: "Workwear for women",
  announcement: "ROOTED IN TRADITION. MADE FOR YOUR EVERYDAY.",
  heroTitle: "A little tradition. A little you.",
  heroSubtitle: "Discover pieces that tell your story.",
  heroEyebrow: "The new season edit",
  heroImage: "/images/women/emerald-embroidered-anarkali-set.webp",
  heroButtonLabel: "Explore the collection",
  heroLink: "/#catalog",
  catalogTitle: "Find your kind of beautiful.",
  catalogSubtitle: "The everyday, elevated",
  topTenTitle: "The Top 10 edit",
  showTopTen: true,
  showStory: true,
  storyTitle: "Feeling like yourself is timeless.",
  storyText: "Indian roots, a modern point of view.",
  footerText: "Thoughtful pieces. Meaningful moments.",
  contactEmail: "spoken.3764@gmail.com",
  contactPhone: "+91 70040 23078",
  seoTitle: "Workari | Workwear for women",
  seoDescription:
    "Workwear for women: kurta sets, co-ords and kurtis for your working week.",
  returnPolicy: "",
  exchangePolicy: "",
  shippingInfo: "",
  warrantyInfo: "",
  legalName: "",
  businessAddress: "",
  grievanceOfficer: "",
  aboutPage: "",
  termsPage: "",
  privacyPage: "",
  refundPage: "",
  shippingPage: "",
  shippingFee: 79,
  freeShippingAbove: 999,
  codEnabled: true,
  codFee: 0,
  codMaxOrder: 10000,
  // Rotating messages in the top strip. Empty uses `announcement`.
  announcements: [] as string[],
  homeSections: homeSectionIds.map((id) => ({
    id: id as HomeSectionId,
    visible: true,
  })),
  // Empty builds the strip from delivery/COD settings.
  trustItems: [] as TrustItem[],
  instagramUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
  pinterestUrl: "",
  whatsappNumber: "",
  newsletterTitle: "Be the first to know",
  newsletterText:
    "New arrivals, festive edits and members-only offers. No spam, unsubscribe anytime.",
};
export type StoreSettings = typeof defaultSettings;
export type Storefront = {
  settings: StoreSettings;
  categories: StoreCategory[];
  banners: Banner[];
  // True when an online payment gateway is configured on the server.
  onlinePayments?: boolean;
};
