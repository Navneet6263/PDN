"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight, LogOut } from "lucide-react";
import type { Identity } from "@/lib/store-types";
export const sections = [
  "Overview",
  "Products",
  "Top 10 & Search",
  "Banners",
  "Categories",
  "Inventory",
  "Sales & Regions",
  "Support",
  "Team & Roles",
  "Store Settings",
];
export function allowedSections(role: Identity["role"]) {
  return role === "admin" ? sections : role === "inventory" ? ["Inventory"] : ["Support"];
}
export default function AdminFrame({
  actor,
  page,
  onPage,
  onLogout,
  children,
}: {
  actor: Identity;
  page: string;
  onPage: (s: string) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [mobile, setMobile] = useState(false);
  return (
    <div className="min-h-screen bg-[#f6f7f4]">
      <button
        aria-label="Open admin menu"
        className="fixed left-4 top-5 z-30 rounded-lg border bg-white p-2 lg:hidden"
        onClick={() => setMobile(true)}
      >
        <Menu size={18} />
      </button>
      {mobile && (
        <button
          aria-label="Close menu overlay"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col overflow-y-auto border-r bg-white px-4 py-6 transition-transform lg:translate-x-0 ${mobile ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-8 flex justify-between px-3">
          <Link href="/" className="serif text-3xl">
            Store studio.
          </Link>
          <button
            aria-label="Close admin menu"
            className="lg:hidden"
            onClick={() => setMobile(false)}
          >
            <X size={18} />
          </button>
        </div>
        <p className="eyebrow mb-3 px-3 text-muted">Store workspace</p>
        <nav className="space-y-1">
          {allowedSections(actor.role).map((label, i) => (
            <button
              key={label}
              onClick={() => {
                onPage(label);
                setMobile(false);
              }}
              aria-current={page === label ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm ${page === label ? "bg-olive text-white" : "text-muted hover:bg-cream"}`}
            >
              <span aria-hidden="true" className="text-[10px] opacity-60">
                {String(i + 1).padStart(2, "0")}
              </span>
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-4 border-t pt-5">
          <Link
            href="/"
            target="_blank"
            className="mt-6 flex items-center justify-between px-3 text-xs"
          >
            View storefront
            <ArrowUpRight size={15} />
          </Link>
          <button onClick={onLogout} className="flex items-center gap-3 px-3 text-xs">
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="lg:pl-60">
        <header className="flex min-h-20 items-center justify-between gap-4 border-b bg-white py-4 pl-16 pr-5 lg:px-10">
          <p className="text-xs text-muted">
            Workspace / <span className="text-ink">{page}</span>
          </p>
          <p className="text-right text-xs">
            {actor.name}
            <span className="mt-1 block capitalize text-muted">{actor.role}</span>
          </p>
        </header>
        <main className="mx-auto max-w-[1500px] p-5 md:p-10">{children}</main>
      </div>
    </div>
  );
}
