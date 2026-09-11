import Header from "@/components/Header";
import Cart from "@/components/shop/Cart";
import Footer from "@/components/Footer";
import ShoppingSteps from "@/components/shop/ShoppingSteps";
export const metadata = { title: "Shopping bag", robots: { index: false, follow: false } };
export default function Page() {
  return (
    <div className="storefront min-h-screen">
      <Header />
      <main className="shell min-h-[60vh] py-8 md:py-12">
        <ShoppingSteps current="bag" />
        <Cart />
      </main>
      <Footer />
    </div>
  );
}
