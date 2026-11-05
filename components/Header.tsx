import { getStorefront } from "@/lib/api";
import StoreNavigation from "./StoreNavigation";
import AnnouncementBar from "./AnnouncementBar";
export default async function Header() {
  const store = await getStorefront();
  const s = store.settings;
  const messages = (
    s.announcements?.length ? s.announcements : [s.announcement]
  ).filter(Boolean);
  return (
    <>
      <AnnouncementBar messages={messages} />
      <StoreNavigation store={store} />
    </>
  );
}
