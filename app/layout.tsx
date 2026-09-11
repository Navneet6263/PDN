import type { Metadata } from "next";
import { siteUrl } from "@/lib/api";
import "./globals.css";
import ShoppingProvider from "@/components/shop/ShoppingProvider";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Terra Studios | A little tradition. A little you.",
    template: "%s | Terra Studios",
  },
  description:
    "Discover thoughtfully selected Indian ethnic wear for women, men and little ones. Explore sarees, kurta sets, festive wear and accessories at Terra Studios.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Terra Studios",
    images: ["/images/hero-bg.jpg"],
  },
  twitter: { card: "summary_large_image" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ShoppingProvider>{children}</ShoppingProvider>
      </body>
    </html>
  );
}
