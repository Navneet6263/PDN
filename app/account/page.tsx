import Header from "@/components/Header";
import Account from "@/components/shop/Account";
import Footer from "@/components/Footer";
export const metadata = { title: "My account", robots: { index: false, follow: false } };
export default function Page() {
  return (
    <div className="storefront min-h-screen">
      <Header />
      <main className="shell py-8 md:py-14">
        <div className="mx-auto grid max-w-4xl overflow-hidden rounded-2xl border border-[#e9ebef] md:grid-cols-2">
          <div className="relative hidden bg-[#f4eee8] md:block">
            <img
              src="/images/sample/office-thursday.webp"
              alt="An everyday look from our collection"
              className="h-full w-full object-cover object-top"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#302932]/85 to-transparent px-7 pb-8 pt-20 text-white">
              <p className="text-2xl font-bold">
                Your next chapter.
                <br />
                Your next favourite.
              </p>
              <p className="mt-3 text-sm text-white/85">
                Keep your bag, address and reviews in one place.
              </p>
            </div>
          </div>
          <div className="bg-white p-6 sm:p-9">
            <Account />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
