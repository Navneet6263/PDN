import Link from "next/link";
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Youtube,
} from "lucide-react";
import { getStorefront } from "@/lib/api";
import { policyPages } from "@/lib/policies";
import { sectionVisible } from "@/lib/store-types";
import NewsletterForm from "./NewsletterForm";

function Pinterest({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.3-5.4s-.3-.7-.3-1.6c0-1.5.9-2.6 2-2.6.9 0 1.4.7 1.4 1.5 0 .9-.6 2.3-.9 3.6-.3 1.1.5 2 1.6 2 1.9 0 3.4-2 3.4-5 0-2.6-1.9-4.4-4.5-4.4-3.1 0-4.9 2.3-4.9 4.7 0 .9.4 1.9.8 2.5.1.1.1.2.1.3l-.3 1.3c0 .2-.2.3-.4.2-1.4-.6-2.2-2.6-2.2-4.3 0-3.5 2.5-6.7 7.3-6.7 3.8 0 6.8 2.7 6.8 6.4 0 3.8-2.4 6.9-5.8 6.9-1.1 0-2.2-.6-2.5-1.3l-.7 2.6c-.3 1-.9 2.2-1.4 2.9A10 10 0 1 0 12 2z" />
    </svg>
  );
}

export default async function Footer() {
  const store = await getStorefront();
  const { settings: s, categories } = store;
  const socials = [
    [s.instagramUrl, "Instagram", Instagram],
    [s.facebookUrl, "Facebook", Facebook],
    [s.youtubeUrl, "YouTube", Youtube],
    [s.pinterestUrl, "Pinterest", Pinterest],
  ].filter(([url]) => url) as [string, string, typeof Instagram][];
  const whatsapp = s.whatsappNumber?.replace(/\D/g, "");
  const payments = [
    ...(store.onlinePayments
      ? ["UPI", "Visa", "Mastercard", "RuPay", "Net banking"]
      : []),
    ...(s.codEnabled ? ["Cash on delivery"] : []),
  ];
  const heading =
    "mb-4 text-[11px] font-bold uppercase tracking-[.2em] text-[#3d1f35]";
  const link = "text-[13px] text-[#7a6573] transition hover:text-[#ff3f6c]";
  return (
    <footer className="mt-10 text-[#3d1f35]">
      {sectionVisible(s, "newsletter") && (
        <div className="shell">
          <div className="bg-workari relative -mb-16 overflow-hidden rounded-[32px] p-6 text-white shadow-[0_30px_60px_-30px_rgba(61,31,53,0.7)] sm:p-10 lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 lg:p-12">
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#ff3f6c]/30 blur-3xl"
            />
            <div className="relative mb-6 lg:mb-0">
              <p className="glass-chip mb-4 inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.2em] text-white">
                Newsletter
              </p>
              <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
                {s.newsletterTitle || "Be the first to know"}
              </h2>
              {s.newsletterText && (
                <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
                  {s.newsletterText}
                </p>
              )}
            </div>
            <div className="relative">
              <NewsletterForm storeName={s.storeName} />
            </div>
          </div>
        </div>
      )}
      <div
        className={`border-t border-[#f3e4e8] bg-gradient-to-b from-[#fff8fa] to-[#fdf3ee] ${sectionVisible(s, "newsletter") ? "pt-28" : "pt-14"}`}
      >
        <div className="shell grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="font-display flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff3f6c] via-[#c93f74] to-[#3d1f35] text-[28px] font-semibold italic text-white">
                {s.storeName.trim().charAt(0).toLowerCase()}
              </span>
              <span className="font-display text-3xl font-semibold">
                {s.storeName}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-[13px] leading-6 text-[#7a6573]">
              {s.footerText}
            </p>
            {socials.length > 0 && (
              <div className="mt-5 flex gap-2">
                {socials.map(([url, label, Icon]) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f0d7df] bg-white text-[#3d1f35] transition hover:-translate-y-0.5 hover:border-[#ff3f6c] hover:text-[#ff3f6c]"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>
            <h2 className={heading}>Shop</h2>
            <ul className="grid gap-2.5">
              <li>
                <Link className={link} href="/#catalog">
                  Shop all
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link className={link} href={`/?category=${c.slug}#catalog`}>
                    {c.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link className={link} href="/?sort=new#catalog">
                  New arrivals
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className={heading}>Help</h2>
            <ul className="grid gap-2.5">
              <li>
                <Link className={link} href="/orders">
                  Track my order
                </Link>
              </li>
              <li>
                <Link className={link} href="/account">
                  My account
                </Link>
              </li>
              {policyPages.map(([slug, label]) => (
                <li key={slug}>
                  <Link className={link} href={`/policies/${slug}`}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className={heading}>Talk to us</h2>
            <ul className="grid gap-3 text-[13px] text-[#7a6573]">
              {s.contactEmail && (
                <li>
                  <a
                    className="flex items-start gap-2 break-all hover:text-[#ff3f6c]"
                    href={`mailto:${s.contactEmail}`}
                  >
                    <Mail
                      size={16}
                      className="mt-0.5 shrink-0 text-[#e0315c]"
                    />
                    {s.contactEmail}
                  </a>
                </li>
              )}
              {s.contactPhone && (
                <li>
                  <a
                    className="flex items-start gap-2 hover:text-[#ff3f6c]"
                    href={`tel:${s.contactPhone.replace(/\s/g, "")}`}
                  >
                    <Phone
                      size={16}
                      className="mt-0.5 shrink-0 text-[#e0315c]"
                    />
                    {s.contactPhone}
                  </a>
                </li>
              )}
              {s.businessAddress && (
                <li className="flex items-start gap-2">
                  <MapPin
                    size={16}
                    className="mt-0.5 shrink-0 text-[#e0315c]"
                  />
                  {s.businessAddress}
                </li>
              )}
            </ul>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_-10px_#25d366] transition hover:-translate-y-0.5"
              >
                <MessageCircle size={16} /> Chat on WhatsApp
              </a>
            )}
          </div>
        </div>
        <div className="border-t border-[#f0dde3]">
          <div className="shell flex flex-col gap-4 pb-24 pt-6 text-[11px] text-[#9a8592] md:flex-row md:items-center md:justify-between xl:pb-6">
            <p>
              © {new Date().getFullYear()} {s.legalName || s.storeName}. All
              rights reserved.
            </p>
            {payments.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <ShieldCheck size={14} className="text-[#03a685]" />
                <span className="mr-1">Secure payments</span>
                {payments.map((p) => (
                  <span
                    key={p}
                    className="rounded-md border border-[#ecd9df] bg-white px-2 py-1 font-semibold text-[#5c4053]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
