"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  ArrowUpRight,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import SearchBox from "./SearchBox";
import BagLink from "./shop/BagLink";
import MobileTabBar from "./MobileTabBar";
import { sectionVisible, type Storefront } from "@/lib/store-types";
export default function StoreNavigation({ store }: { store: Storefront }) {
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const active = store.categories.find((c) => c.slug === open);
  const styleOn = sectionVisible(store.settings, "style");
  // The tab bar sits outside the header: the header's backdrop blur would
  // otherwise turn it into the containing block for the bar's fixed position.
  return (
    <>
      <header
        className="sticky top-0 z-30 border-b border-white/70 bg-white/80 shadow-[0_10px_30px_-18px_rgba(61,31,53,0.35)] backdrop-blur-xl backdrop-saturate-150"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(null);
            setMobile(false);
          }
        }}
      >
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:py-4 xl:flex-nowrap xl:px-10">
          <button
            className="xl:hidden"
            aria-label={mobile ? "Close categories" : "Open categories"}
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X size={21} /> : <Menu size={21} />}
          </button>
          <Link
            href="/"
            aria-label={`${store.settings.storeName} home`}
            className="flex shrink-0 items-center gap-2.5"
          >
            <span className="font-display flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff3f6c] via-[#c93f74] to-[#3d1f35] text-2xl font-semibold italic text-white shadow-[0_8px_18px_-8px_#ff3f6c] sm:h-10 sm:w-10 sm:text-[28px]">
              {store.settings.storeName.trim().charAt(0).toLowerCase() || "t"}
            </span>
            <span className="font-display text-xl font-semibold leading-none tracking-tight text-[#3d1f35] sm:text-2xl">
              {store.settings.storeName}
              {store.settings.tagline && (
                <span className="mt-1 hidden font-sans text-[8px] font-semibold uppercase tracking-[.26em] text-[#9a7a8c] sm:block">
                  {store.settings.tagline}
                </span>
              )}
            </span>
          </Link>
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-5 self-stretch xl:flex"
          >
            {store.categories.map((c) => (
              <div
                key={c.id}
                className="flex"
                onMouseEnter={() => setOpen(c.slug)}
              >
                <button
                  onClick={() => setOpen(open === c.slug ? null : c.slug)}
                  aria-expanded={open === c.slug}
                  className={`flex items-center gap-1 border-b-2 text-[11px] font-bold uppercase tracking-[.12em] transition-colors ${open === c.slug ? "border-[#ff3f6c] text-[#ff3f6c]" : "border-transparent text-[#3d1f35] hover:text-[#ff3f6c]"}`}
                >
                  {c.label}
                  <ChevronDown size={11} />
                </button>
              </div>
            ))}
            <Link
              href="/?sort=new#catalog"
              onMouseEnter={() => setOpen(null)}
              className="flex items-center border-b-2 border-transparent text-[11px] font-bold uppercase tracking-[.12em] text-[#3d1f35] hover:text-[#ff3f6c]"
            >
              New arrivals
            </Link>
            <Link
              href="/policies/about-us"
              onMouseEnter={() => setOpen(null)}
              className="flex items-center border-b-2 border-transparent text-[11px] font-bold uppercase tracking-[.12em] text-[#3d1f35] hover:text-[#ff3f6c]"
            >
              About {store.settings.storeName}
            </Link>
          </nav>
          <SearchBox />
          <div className="ml-auto xl:ml-0">
            <BagLink />
          </div>
          {styleOn && (
            <button
              onClick={() => {
                window.location.hash = "style-studio";
                window.dispatchEvent(new Event("terra-open-style"));
                if (!document.getElementById("style-studio"))
                  window.location.href = "/#style-studio";
              }}
              className="hidden shrink-0 flex-col items-center gap-1 text-[10px] font-semibold xl:flex"
            >
              <Sparkles size={20} />
              <span>My style</span>
            </button>
          )}
        </div>
        {active && (
          <div
            className="absolute inset-x-0 top-full hidden border-b border-white/70 bg-white/90 shadow-[0_30px_60px_-30px_rgba(61,31,53,0.4)] backdrop-blur-xl xl:block"
            onMouseLeave={() => setOpen(null)}
          >
            <div className="shell grid grid-cols-[1fr_2fr_1fr] gap-10 py-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#ff3f6c]">
                  Explore {active.label}
                </p>
                <Link
                  href={`/?category=${active.slug}#catalog`}
                  onClick={() => setOpen(null)}
                  className="mt-5 flex items-center gap-3 text-xl font-semibold"
                >
                  Shop all {active.label}
                  <ArrowUpRight size={18} />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {active.subCategories.map((type) => (
                  <Link
                    key={type}
                    href={`/?category=${active.slug}&type=${encodeURIComponent(type)}#catalog`}
                    onClick={() => setOpen(null)}
                    className="text-sm text-[#626577] hover:text-[#ff3f6c]"
                  >
                    {type}
                  </Link>
                ))}
              </div>
              {active.image && (
                <img
                  src={active.image}
                  alt={active.label}
                  className="h-44 w-full rounded-lg object-cover object-top"
                />
              )}
            </div>
          </div>
        )}
        {mobile && (
          <nav
            aria-label="Mobile categories"
            className="max-h-[65vh] overflow-y-auto border-t px-5 py-4 xl:hidden"
          >
            {store.categories.map((c) => (
              <details key={c.id} className="border-b py-3">
                <summary className="cursor-pointer text-sm font-bold">
                  {c.label}
                </summary>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <Link
                    onClick={() => setMobile(false)}
                    href={`/?category=${c.slug}#catalog`}
                    className="text-xs font-bold text-[#ff3f6c]"
                  >
                    Shop all
                  </Link>
                  {c.subCategories.map((type) => (
                    <Link
                      key={type}
                      onClick={() => setMobile(false)}
                      href={`/?category=${c.slug}&type=${encodeURIComponent(type)}#catalog`}
                      className="text-xs"
                    >
                      {type}
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </nav>
        )}
      </header>
      <MobileTabBar
        styleOn={styleOn}
        onCategories={() => {
          setMobile(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </>
  );
}
