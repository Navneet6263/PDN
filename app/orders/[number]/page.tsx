import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderDetail from "@/components/shop/OrderDetail";
export const metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  return (
    <div className="storefront min-h-screen">
      <Header />
      <main className="shell min-h-[60vh] py-8 md:py-12">
        <Suspense fallback={<p>Loading your order...</p>}>
          <OrderDetail number={number} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
