"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Storefront } from "@/lib/store-types";
import { bannerLink } from "@/lib/banner-link";
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
      title: s.heroTitle,
      subtitle: s.heroSubtitle,
      eyebrow: s.heroEyebrow,
      image: s.heroImage,
      mobileImage: "",
      buttonLabel: s.heroButtonLabel,
      link: s.heroLink,
    };
  return (
    <section
      aria-label="Featured collection"
      className="shell pt-6 md:pt-8"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHover(false);
      }}
    >
      <Link
        href={bannerLink(b)}
        aria-label={`Explore ${b.title}`}
        onClick={(e) => {
          if (bannerLink(b) === "/#style-studio" && document.getElementById("style-studio")) {
            e.preventDefault();
            window.dispatchEvent(new Event("terra-open-style"));
          }
        }}
        className="relative grid overflow-hidden rounded-xl bg-[#faeee5] md:min-h-[450px] md:grid-cols-[.8fr_1.2fr] xl:min-h-[490px]"
      >
        <div className="relative z-10 flex flex-col justify-center px-6 py-7 md:px-10 md:py-10 lg:px-14">
          <p className="mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#ac5060]">
            <span className="h-px w-7 bg-[#ac5060]" />
            {b.eyebrow}
          </p>
          <h1 className="max-w-lg text-3xl font-extrabold leading-[1.1] tracking-[-.045em] text-[#39262f] sm:text-5xl xl:text-[52px]">
            {b.title}
          </h1>
          <p className="mb-7 mt-5 max-w-sm text-sm leading-6 text-[#775d61]">{b.subtitle}</p>
          {b.buttonLabel && (
            <span className="inline-flex w-fit items-center gap-7 rounded-md bg-[#ff3f6c] px-6 py-3.5 text-xs font-bold text-white transition hover:bg-[#e92b59]">
              {b.buttonLabel}
              <ArrowRight size={17} />
            </span>
          )}
          <p className="mt-7 hidden text-[10px] font-semibold uppercase tracking-widest text-[#9b7880] md:block">
            A little festive. A lot of you.
          </p>
        </div>
        <div className="relative order-first block min-h-64 md:order-last md:min-h-full">
          <picture>
            <source media="(max-width:640px)" srcSet={b.mobileImage || b.image} />
            <img
              src={b.image}
              alt={b.title}
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </picture>
        </div>
      </Link>
      <div className="flex h-10 items-center justify-center gap-2">
        {banners.length > 1 ? (
          <>
            <button
              onClick={() => setPaused(!paused)}
              aria-label={paused ? "Play banners" : "Pause banners"}
              className="mr-2 text-xs"
            >
              {paused ? "Play" : "Pause"}
            </button>
            <button
              aria-label="Previous banner"
              onClick={() => setIndex((index - 1 + banners.length) % banners.length)}
              className="mr-3"
            >
              <ChevronLeft size={16} />
            </button>
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                aria-label={`Show banner ${i + 1}: ${banner.title}`}
                aria-pressed={index === i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full ${index === i ? "w-7 bg-[#ff3f6c]" : "w-1.5 bg-[#d7d7de]"}`}
              />
            ))}
            <button
              aria-label="Next banner"
              onClick={() => setIndex((index + 1) % banners.length)}
              className="ml-3"
            >
              <ChevronRight size={16} />
            </button>
          </>
        ) : (
          <span className="h-1.5 w-7 rounded-full bg-[#ff3f6c]" />
        )}
      </div>
    </section>
  );
}
