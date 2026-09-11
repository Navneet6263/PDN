import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { money, type Product } from "@/lib/types";
export default function ProductCard({ product: p }: { product: Product }) {
  const discount =
    p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
  return (
    <Link
      href={`/product/${p.slug}`}
      className="group block min-w-0 overflow-hidden rounded-xl bg-white transition-shadow duration-200 hover:shadow-[0_5px_20px_#282c3f0a]"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-[#f6f4f2]">
        <Image
          src={p.image}
          alt={p.name}
          fill
          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 20vw"
          className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
          unoptimized={p.image.startsWith("/media/")}
        />
        {p.stock === 0 ? (
          <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-1 text-[9px] font-bold">
            OUT OF STOCK
          </span>
        ) : (
          p.featured && (
            <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-1 text-[9px] font-bold tracking-wide text-[#cf345d]">
              THE STYLE EDIT
            </span>
          )
        )}
        <span className="absolute bottom-3 right-3 rounded-full bg-white p-2 opacity-0 transition group-hover:opacity-100">
          <ArrowUpRight size={16} />
        </span>
      </div>
      <div className="px-2 pb-4 pt-3">
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-[#9196a2]">
          {p.brand}
        </p>
        <h3 className="mt-1 min-h-10 line-clamp-2 text-xs font-medium leading-5 text-[#505867]">
          {p.name}
        </h3>
        {!!p.reviewCount && (
          <p className="mt-1 text-[10px] text-[#777b8b]">
            {p.ratingAverage?.toFixed(1)} ★ · {p.reviewCount} reviews
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-bold text-[#282c3f]">{money(p.price)}</span>
          {discount > 0 && (
            <>
              <s className="text-[10px] text-[#9799a3]">{money(p.originalPrice)}</s>
              <span className="text-[10px] font-medium text-[#618071]">({discount}% OFF)</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
