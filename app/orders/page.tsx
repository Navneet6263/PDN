import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderList from "@/components/shop/OrderList";
export const metadata = {
  title: "My orders",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <div className="storefront min-h-screen">
      <Header />
      <main className="shell min-h-[60vh] max-w-4xl py-8 md:py-12">
        <OrderList />
      </main>
      <Footer />
    </div>
  );
}
