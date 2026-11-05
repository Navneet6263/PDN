import type { Metadata } from "next";
import { getStorefront, siteUrl } from "@/lib/api";
import "./globals.css";
import ShoppingProvider from "@/components/shop/ShoppingProvider";
// Site-wide titles and sharing previews follow the store name and SEO text
// set in admin, so a rename never leaves an old brand behind.
export async function generateMetadata(): Promise<Metadata> {
  const { settings: s } = await getStorefront().catch(() => ({
    settings: {
      storeName: "Workari",
      seoTitle: "Workari",
      seoDescription: "",
      heroImage: "",
    },
  }));
  return {
    metadataBase: new URL(siteUrl),
    title: { default: s.seoTitle, template: `%s | ${s.storeName}` },
    description: s.seoDescription,
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: s.storeName,
      images: s.heroImage ? [s.heroImage] : [],
    },
    twitter: { card: "summary_large_image" },
  };
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ShoppingProvider>{children}</ShoppingProvider>
      </body>
    </html>
  );
}
