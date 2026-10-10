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
export const defaultSettings = {
  storeName: "Terra Studios",
  announcement: "ROOTED IN TRADITION. MADE FOR YOUR EVERYDAY.",
  heroTitle: "A little tradition. A little you.",
  heroSubtitle: "Discover pieces that tell your story.",
  heroEyebrow: "The new season edit",
  heroImage: "/images/hero-bg.jpg",
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
  contactEmail: "",
  contactPhone: "",
  seoTitle: "Terra Studios | Fashion collection",
  seoDescription: "Explore our latest fashion collection.",
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
};
export type StoreSettings = typeof defaultSettings;
export type Storefront = {
  settings: StoreSettings;
  categories: StoreCategory[];
  banners: Banner[];
};
