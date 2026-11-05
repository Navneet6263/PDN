import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { money, type Product } from "@/lib/types";
export default function ProductCard({ product: p }: { product: Product }) {
  const discount =
    p.originalPrice > p.price
      ? Math.round((1 - p.price / p.originalPrice) * 100)
      : 0;
  return (
    <Link
      href={`/product/${p.slug}`}
      className="group block min-w-0 rounded-3xl p-1.5 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_24px_40px_-28px_rgba(61,31,53,0.55)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-[#f6efeb]">
        <Image
          src={p.image}
          alt={p.name}
          fill
          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 20vw"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
          unoptimized={p.image.startsWith("/media/")}
        />
        {p.stock === 0 ? (
          <span className="glass-light absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[9px] font-bold tracking-wide">
            OUT OF STOCK
          </span>
        ) : (
          discount > 0 && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-[#ff3f6c] px-2.5 py-1 text-[10px] font-bold text-white shadow-[0_6px_14px_-6px_#ff3f6c]">
              {discount}% OFF
            </span>
          )
        )}
        <span className="glass-light absolute bottom-3 right-3 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight size={16} />
        </span>
      </div>
      <div className="px-2 pb-3 pt-3">
        <h3 className="line-clamp-2 min-h-10 text-[13px] font-semibold leading-5 text-[#3d1f35]">
          {p.name}
        </h3>
        {p.colors.length > 0 && (
          <p className="mt-1 truncate text-[11px] text-[#9a8592]">
            {p.colors.length === 1 ? p.colors[0] : `${p.colors.length} colours`}
          </p>
        )}
        {!!p.reviewCount && (
          <p className="mt-1 text-[11px] text-[#7a6573]">
            {p.ratingAverage?.toFixed(1)} ★ · {p.reviewCount} reviews
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
          <span className="text-sm font-bold text-[#3d1f35]">
            {money(p.price)}
          </span>
          {discount > 0 && (
            <s className="text-[11px] text-[#a996a2]">
              {money(p.originalPrice)}
            </s>
          )}
        </div>
      </div>
    </Link>
  );
}
