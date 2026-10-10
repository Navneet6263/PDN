import CheckoutHeader from "@/components/shop/CheckoutHeader";
import Cart from "@/components/shop/Cart";
export const metadata = {
  title: "Shopping bag",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <div className="storefront min-h-screen bg-[#f7f7f8]">
      <CheckoutHeader current="bag" />
      <main className="mx-auto min-h-[70vh] max-w-[1200px] px-4 py-5 sm:px-8 sm:py-8">
        <Cart />
      </main>
    </div>
  );
}
