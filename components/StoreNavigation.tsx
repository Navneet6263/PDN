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
import type { Storefront } from "@/lib/store-types";
export default function StoreNavigation({ store }: { store: Storefront }) {
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const active = store.categories.find((c) => c.slug === open);
  return (
    <header
      className="sticky top-0 z-30 border-b border-[#ededf0] bg-white shadow-[0_3px_14px_#20243506]"
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
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff3f6c] text-2xl font-black italic text-white sm:h-10 sm:w-10 sm:text-3xl">
            t
          </span>
          <span className="text-base font-extrabold tracking-tight text-[#282c3f] sm:text-lg">
            {store.settings.storeName}
            <span className="hidden text-[8px] font-medium uppercase tracking-[.24em] text-[#777b8c] sm:block">
              Everyday. Elevated.
            </span>
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
                className={`flex items-center gap-1 border-b-2 text-[11px] font-bold uppercase tracking-wide ${open === c.slug ? "border-[#ff3f6c] text-[#ff3f6c]" : "border-transparent text-[#282c3f]"}`}
              >
                {c.label}
                <ChevronDown size={11} />
              </button>
            </div>
          ))}
        </nav>
        <SearchBox />
        <div className="ml-auto xl:ml-0">
          <BagLink />
        </div>
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
      </div>
      {active && (
        <div
          className="absolute inset-x-0 top-full hidden border-b bg-white shadow-xl xl:block"
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
      <MobileTabBar
        onCategories={() => {
          setMobile(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </header>
  );
}
