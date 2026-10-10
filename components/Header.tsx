import { getStorefront } from "@/lib/api";
import StoreNavigation from "./StoreNavigation";
export default async function Header() {
  const store = await getStorefront();
  return (
    <>
      <div className="truncate bg-[#fff0f3] px-4 py-1.5 text-center text-[9px] font-semibold tracking-widest text-[#c63360] sm:py-2 sm:text-xs">
        {store.settings.announcement}
      </div>
      <StoreNavigation store={store} />
    </>
  );
}
