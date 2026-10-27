import Link from "next/link";
import { RefreshCw, ArrowUpRight } from "lucide-react";
import { money, type Product } from "@/lib/types";
import {
  moodLabels,
  plannerDays,
  styleMatches,
  planProducts,
  type StyleProfile,
} from "@/lib/style-planner";
export default function StyleResults({
  profile,
  products,
  rotation,
  onRotate,
}: {
  profile: StyleProfile;
  products: Product[];
  rotation: number;
  onRotate: () => void;
}) {
  const pool = styleMatches(products, profile);
  const picks = planProducts(products, profile, rotation);
  const days = plannerDays(profile);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-extrabold">
            {profile.mood === "office"
              ? "Your workweek, styled."
              : `Your ${moodLabels[profile.mood].toLowerCase()} edit.`}
          </h3>
          <p className="mt-2 text-xs leading-5 text-[#777b8b]">
            {profile.mood === "office"
              ? `Monday–${profile.saturday ? "Saturday" : "Friday"} · relaxed / smart-casual picks`
              : "Three ideas for your next plans"}{" "}
            ·{" "}
            {profile.budget === 10000000
              ? "all budgets"
              : `up to ${money(profile.budget)} per product`}
          </p>
        </div>
        <button
          disabled={pool.length < 2}
          onClick={onRotate}
          className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-xs font-bold"
        >
          <RefreshCw size={14} />
          Remix my picks
        </button>
      </div>
      {!pool.length ? (
        <div className="rounded-xl border border-dashed border-[#efbbc8] bg-white p-8 text-center">
          <h4 className="font-bold">Your vibe deserves the right match.</h4>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#818493]">
            No available styles match this mood and budget yet. Try another mood
            or price range.
          </p>
          <Link
            href="/#catalog"
            className="mt-5 inline-block text-xs font-bold text-[#ff3f6c]"
          >
            Browse the collection →
          </Link>
        </div>
      ) : (
        <>
          <div
            className={`grid gap-4 sm:grid-cols-2 ${days.length === 3 ? "lg:grid-cols-3" : "xl:grid-cols-3"}`}
          >
            {days.map((day, index) => {
              const p = picks[index];
              return (
                <article
                  key={day.day}
                  className="overflow-hidden rounded-xl border border-[#f0e4e9] bg-white"
                >
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#c4486b]">
                      {day.day}
                    </span>
                    <span className="text-[10px] text-[#9395a1]">
                      {index >= pool.length ? "Repeat & restyle" : day.title}
                    </span>
                  </div>
                  <div className="grid grid-cols-[105px_1fr] gap-4 border-t p-4">
                    <Link href={`/product/${p.slug}`}>
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        className="h-36 w-full rounded-lg object-cover object-top"
                      />
                    </Link>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold leading-5">{p.name}</h4>
                      <p className="mt-2 text-xs font-bold">{money(p.price)}</p>
                      <p className="mt-2 text-[10px] leading-5 text-[#90929f]">
                        {p.subCategory} · Includes{" "}
                        {p.packageContents.map((item) => item.name).join(", ")}
                      </p>
                      <Link
                        href={`/product/${p.slug}`}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#ff3f6c]"
                      >
                        See this style
                        <ArrowUpRight size={13} />
                      </Link>
                    </div>
                  </div>
                  <p
                    className={`min-h-16 border-t px-4 py-3 text-xs leading-5 ${day.day === "Saturday" ? "bg-[#fff0ce] text-[#795c23]" : "bg-[#faf8fb] text-[#82717d]"}`}
                  >
                    {day.note}
                  </p>
                </article>
              );
            })}
          </div>
          {pool.length < days.length && (
            <p className="mt-4 text-[11px] text-[#868391]">
              {pool.length} matching styles available, so some days repeat a
              pick. Rewearing is a style choice too.
            </p>
          )}
        </>
      )}
    </div>
  );
}
