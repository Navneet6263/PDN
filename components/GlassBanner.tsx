import { ArrowRight } from "lucide-react";

export type GlassBannerContent = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  image: string;
  mobileImage?: string;
  buttonLabel?: string;
  layout?: "left" | "center" | "right";
  tone?: "light" | "dark";
};

// A full-bleed photo with a frosted-glass text panel. Used for hero and
// promotion banners on the storefront and as the live preview in admin, so
// what the admin sees is what shoppers get. Wrap it in a link to make it
// clickable; it renders no interactive elements of its own.
export default function GlassBanner({
  banner: b,
  variant = "hero",
  priority = false,
  headingLevel = 2,
}: {
  banner: GlassBannerContent;
  variant?: "hero" | "promo";
  priority?: boolean;
  headingLevel?: 1 | 2 | 3;
}) {
  const hero = variant === "hero";
  const layout = b.layout || "left";
  const tone = b.tone || "light";
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";
  const place =
    layout === "center"
      ? "md:items-center md:justify-center md:text-center"
      : layout === "right"
        ? "md:items-center md:justify-end"
        : "md:items-center md:justify-start";
  return (
    <div
      className={`group relative isolate flex overflow-hidden rounded-[28px] bg-[#f3e7e2] ${hero ? "min-h-[520px] sm:min-h-[540px] md:min-h-[560px] lg:min-h-[600px]" : "min-h-[340px] md:min-h-[380px]"} items-end p-3 sm:p-5 md:p-10 ${place}`}
    >
      <picture className="absolute inset-0 -z-10">
        {b.mobileImage && (
          <source media="(max-width:640px)" srcSet={b.mobileImage} />
        )}
        <img
          src={b.image}
          alt=""
          fetchPriority={priority ? "high" : undefined}
          loading={priority ? "eager" : "lazy"}
          className={`h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03] ${hero ? "hero-zoom" : ""}`}
        />
      </picture>
      {/* Soft wash so text stays readable over any photo. */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 -z-10 ${
          tone === "dark"
            ? "bg-gradient-to-t from-black/45 via-black/10 to-transparent"
            : "bg-gradient-to-t from-[#3d1f35]/25 via-transparent to-transparent"
        }`}
      />
      <div
        className={`${tone === "dark" ? "glass-dark" : "glass-light"} w-full rounded-3xl p-5 sm:p-7 ${hero ? "md:max-w-[460px] lg:max-w-[500px] md:p-9" : "md:max-w-[360px]"} ${layout === "center" ? "md:mx-auto" : ""}`}
      >
        {b.eyebrow && (
          <p
            className={`glass-chip mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.2em] ${layout === "center" ? "md:mx-auto" : ""}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff3f6c]" />
            {b.eyebrow}
          </p>
        )}
        <Heading
          className={`font-display font-semibold leading-[1.02] ${hero ? "text-[34px] sm:text-5xl lg:text-[58px]" : "text-3xl md:text-[34px]"}`}
        >
          {b.title}
        </Heading>
        {b.subtitle && (
          <p
            className={`mt-3 text-sm leading-6 ${tone === "dark" ? "text-white/85" : "text-[#5c4053]"} ${hero ? "md:text-[15px]" : ""}`}
          >
            {b.subtitle}
          </p>
        )}
        {b.buttonLabel && (
          <span
            className={`mt-6 inline-flex items-center gap-3 rounded-full bg-[#ff3f6c] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-[0_10px_25px_-8px_#ff3f6c] transition group-hover:gap-4 group-hover:bg-[#e0315c] ${hero ? "sm:text-[13px]" : ""}`}
          >
            {b.buttonLabel}
            <ArrowRight size={16} />
          </span>
        )}
      </div>
    </div>
  );
}
