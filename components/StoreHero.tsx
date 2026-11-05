"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { Storefront } from "@/lib/store-types";
import { bannerLink } from "@/lib/banner-link";
import GlassBanner from "./GlassBanner";

export default function StoreHero({ store }: { store: Storefront }) {
  const [index, setIndex] = useState(0);
  const s = store.settings;
  const banners = store.banners.filter((b) => b.slot === "hero");
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (
      paused ||
      hover ||
      banners.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = setInterval(() => {
      if (!document.hidden) setIndex((n) => (n + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [paused, hover, banners.length]);
  const b = banners[index] ||
    banners[0] || {
      id: "default",
      title: s.heroTitle,
      subtitle: s.heroSubtitle,
      eyebrow: s.heroEyebrow,
      image: s.heroImage,
      mobileImage: "",
      buttonLabel: s.heroButtonLabel,
      link: s.heroLink,
      layout: "left" as const,
      tone: "light" as const,
    };
  return (
    <section
      aria-label="Featured collection"
      className="shell pt-4 md:pt-6"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHover(false);
      }}
    >
      <div className="relative">
        <Link
          key={b.id}
          href={bannerLink(b)}
          aria-label={`Explore ${b.title}`}
          onClick={(e) => {
            if (
              bannerLink(b) === "/#style-studio" &&
              document.getElementById("style-studio")
            ) {
              e.preventDefault();
              window.dispatchEvent(new Event("terra-open-style"));
            }
          }}
          className="block rounded-[28px] focus-visible:outline-offset-4"
        >
          <GlassBanner banner={b} priority={index === 0} headingLevel={1} />
        </Link>
        {banners.length > 1 && (
          <div className="glass-light absolute right-4 top-4 flex items-center gap-1 rounded-full px-2 py-1.5 sm:right-6 sm:top-6">
            <button
              aria-label="Previous banner"
              onClick={() =>
                setIndex((index - 1 + banners.length) % banners.length)
              }
              className="rounded-full p-1.5 hover:bg-white/60"
            >
              <ChevronLeft size={16} />
            </button>
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                aria-label={`Show banner ${i + 1}: ${banner.title}`}
                aria-pressed={index === i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${index === i ? "w-6 bg-[#ff3f6c]" : "w-1.5 bg-[#3d1f35]/30"}`}
              />
            ))}
            <button
              aria-label="Next banner"
              onClick={() => setIndex((index + 1) % banners.length)}
              className="rounded-full p-1.5 hover:bg-white/60"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setPaused(!paused)}
              aria-label={paused ? "Play banners" : "Pause banners"}
              className="rounded-full p-1.5 hover:bg-white/60"
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
