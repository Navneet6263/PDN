import type { Banner } from "./store-types";
export function bannerLink(banner: Pick<Banner, "link" | "destination"> & { id?: string }) {
  return banner.destination === "collection" && banner.id
    ? `/collection/${banner.id}`
    : banner.link;
}
