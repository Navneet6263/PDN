import Header from "@/components/Header";
import Checkout from "@/components/shop/Checkout";
import Footer from "@/components/Footer";
import ShoppingSteps from "@/components/shop/ShoppingSteps";
export const metadata = { title: "Checkout", robots: { index: false, follow: false } };
export default function Page() {
  return (
    <div className="storefront min-h-screen">
      <Header />
      <main className="shell min-h-[60vh] py-8 md:py-12">
        <ShoppingSteps current="address" />
        <Checkout />
      </main>
      <Footer />
    </div>
  );
}
