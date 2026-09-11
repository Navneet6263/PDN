import { getStorefront } from "@/lib/api";
import StoreNavigation from "./StoreNavigation";
export default async function Header() {
  const store = await getStorefront();
  return (
    <>
      <div className="bg-[#fff0f3] px-4 py-2 text-center text-[10px] font-semibold tracking-widest text-[#c63360] sm:text-xs">
        {store.settings.announcement}
      </div>
      <StoreNavigation store={store} />
    </>
  );
}
