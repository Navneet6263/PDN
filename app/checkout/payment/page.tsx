import CheckoutHeader from "@/components/shop/CheckoutHeader";
import PaymentStep from "@/components/shop/PaymentStep";
export const metadata = {
  title: "Payment",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <div className="storefront min-h-screen bg-[#f7f7f8]">
      <CheckoutHeader current="payment" />
      <main className="mx-auto min-h-[70vh] max-w-[1200px] px-4 pb-5 sm:px-8 sm:pb-8">
        <PaymentStep />
      </main>
    </div>
  );
}
