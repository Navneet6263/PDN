import CheckoutHeader from "@/components/shop/CheckoutHeader";
import AddressStep from "@/components/shop/AddressStep";
export const metadata = {
  title: "Delivery address",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <div className="storefront min-h-screen bg-[#f7f7f8]">
      <CheckoutHeader current="address" />
      <main className="mx-auto min-h-[70vh] max-w-[1200px] px-4 py-5 sm:px-8 sm:py-8">
        <AddressStep />
      </main>
    </div>
  );
}
