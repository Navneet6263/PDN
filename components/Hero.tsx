import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, PackageCheck, Sparkles, Leaf } from "lucide-react";
export default function Hero() {
  return (
    <>
      <section className="relative flex min-h-[540px] items-end overflow-hidden bg-[#6b6558] md:min-h-[650px]">
        <Image
          src="/images/hero-bg.jpg"
          alt="Terra Studios new season fashion collection"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_40%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <div className="shell relative flex items-end justify-between pb-14 pt-24 text-white md:pb-20">
          <div>
            <p className="eyebrow mb-6 text-white/80">The new season edit / 2026</p>
            <h1 className="serif max-w-xl text-5xl leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
              A little tradition.
              <br />
              <em>A little you.</em>
            </h1>
            <p className="mb-8 mt-6 max-w-sm text-sm leading-6 text-white/85">
              For everyday rituals and extraordinary moments.
              <br />
              Discover pieces that tell your story.
            </p>
            <Link
              href="#catalog"
              className="inline-flex items-center gap-10 bg-[#fcfbf8] px-6 py-4 text-xs text-ink"
            >
              Explore the collection <ArrowUpRight size={17} />
            </Link>
          </div>
          <span className="hidden items-center gap-3 text-[10px] uppercase tracking-widest md:flex">
            Scroll to discover <ArrowDown size={16} />
          </span>
        </div>
        <span className="absolute right-8 top-8 rounded-full border border-white/50 px-4 py-2 text-[9px] uppercase tracking-widest text-white">
          The Terra Edit
        </span>
      </section>
      <div className="border-b bg-cream">
        <div className="shell grid grid-cols-1 gap-5 py-6 text-[11px] sm:grid-cols-3">
          {[
            [Sparkles, "Thoughtfully selected pieces"],
            [PackageCheck, "Know exactly what’s in your package"],
            [Leaf, "Style beyond the season"],
          ].map(([Icon, label], i) => {
            const I = Icon as typeof Sparkles;
            return (
              <div key={i} className="flex items-center justify-center gap-3">
                <I size={17} strokeWidth={1.3} />
                {label as string}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
