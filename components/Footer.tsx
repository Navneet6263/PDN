import { getStorefront } from "@/lib/api";
import Link from "next/link";
import { policyPages } from "@/lib/policies";
export default async function Footer() {
  const { settings: s, categories } = await getStorefront();
  return (
    <footer className="border-t bg-[#f8f8fa] text-[#282c3f]">
      <div className="shell grid gap-9 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
        <div>
          <Link href="/" className="text-2xl font-extrabold tracking-tight">
            {s.storeName}
            <span className="text-[#ff3f6c]">.</span>
          </Link>
          <p className="mt-4 max-w-xs text-xs leading-6 text-[#858896]">
            {s.footerText}
          </p>
        </div>
        <div>
          <h2 className="mb-5 text-[11px] font-bold uppercase tracking-widest">
            Explore the store
          </h2>
          <div className="grid gap-3">
            {categories.map((c) => (
              <Link
                className="text-xs text-[#727583]"
                key={c.id}
                href={`/?category=${c.slug}#catalog`}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-5 text-[11px] font-bold uppercase tracking-widest">
            Make it your own
          </h2>
          <div className="grid gap-3 text-xs text-[#727583]">
            <Link href="/#top-ten">The Top 10 edit</Link>
            <Link href="/#catalog">Explore all styles</Link>
            <Link href="/account">My account</Link>
            <Link href="/cart">My shopping bag</Link>
          </div>
        </div>
        <div>
          <h2 className="mb-5 text-[11px] font-bold uppercase tracking-widest">
            Here to help
          </h2>
          <p className="text-xs leading-6 text-[#727583]">
            Check each product for package details, available sizes and store
            policies.
          </p>
          {s.contactEmail && (
            <a
              className="mt-3 block break-all text-xs text-[#ff3f6c]"
              href={`mailto:${s.contactEmail}`}
            >
              {s.contactEmail}
            </a>
          )}
          {s.contactPhone && <p className="mt-3 text-xs">{s.contactPhone}</p>}
          {s.businessAddress && (
            <p className="mt-3 text-xs leading-5 text-[#727583]">
              {s.businessAddress}
            </p>
          )}
          <div className="mt-5 grid gap-2.5 text-xs text-[#727583]">
            {policyPages.map(([slug, label]) => (
              <Link
                key={slug}
                href={`/policies/${slug}`}
                className="hover:text-[#ff3f6c]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="shell border-t pb-24 pt-6 text-[10px] text-[#9294a0] xl:pb-6">
        © {new Date().getFullYear()} {s.storeName}. All rights reserved.
      </div>
    </footer>
  );
}
