"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Boxes,
  FolderTree,
  Gauge,
  Image as ImageIcon,
  LifeBuoy,
  LogOut,
  Menu,
  Package,
  Settings,
  Shirt,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Identity } from "@/lib/store-types";
import { request } from "./api";

const groups: { title: string; items: [string, LucideIcon][] }[] = [
  {
    title: "Sell",
    items: [
      ["Overview", Gauge],
      ["Orders", Package],
      ["Sales & Regions", BarChart3],
    ],
  },
  {
    title: "Catalog",
    items: [
      ["Products", Shirt],
      ["Inventory", Boxes],
      ["Categories", FolderTree],
      ["Top 10 & Search", Sparkles],
    ],
  },
  { title: "Marketing", items: [["Banners", ImageIcon]] },
  {
    title: "Team",
    items: [
      ["Support", LifeBuoy],
      ["Team & Roles", Users],
      ["Store Settings", Settings],
    ],
  },
];
export const sections = groups.flatMap((g) => g.items.map(([label]) => label));
export function allowedSections(role: Identity["role"]) {
  return role === "admin"
    ? sections
    : role === "inventory"
      ? ["Orders", "Inventory"]
      : ["Orders", "Support"];
}
// Orders waiting on the team: to pack, to ship, or owed a refund.
export const ORDERS_CHANGED = "terra-orders-changed";
function useOrderBadge() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let live = true;
    const load = () =>
      request<{ counts: Record<string, number> }>(
        "/admin/orders?status=__counts",
      )
        .then(({ counts }) => {
          if (live)
            setCount(
              (counts.confirmed || 0) +
                (counts.packed || 0) +
                (counts.refund_due || 0),
            );
        })
        .catch(() => undefined);
    void load();
    const timer = setInterval(load, 60000);
    window.addEventListener(ORDERS_CHANGED, load);
    return () => {
      live = false;
      clearInterval(timer);
      window.removeEventListener(ORDERS_CHANGED, load);
    };
  }, []);
  return count;
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
  const pending = useOrderBadge();
  const allowed = allowedSections(actor.role);
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
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto border-r bg-white px-4 py-6 transition-transform lg:translate-x-0 ${mobile ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-7 flex items-center justify-between px-3">
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
        <nav className="space-y-6">
          {groups.map((g) => {
            const items = g.items.filter(([label]) => allowed.includes(label));
            if (!items.length) return null;
            return (
              <div key={g.title}>
                <p className="eyebrow mb-2 px-3 text-muted">{g.title}</p>
                <div className="space-y-0.5">
                  {items.map(([label, Icon]) => (
                    <button
                      key={label}
                      onClick={() => {
                        onPage(label);
                        setMobile(false);
                      }}
                      aria-current={page === label ? "page" : undefined}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${page === label ? "bg-olive text-white" : "text-[#4d4b45] hover:bg-cream"}`}
                    >
                      <Icon
                        size={16}
                        aria-hidden="true"
                        className="shrink-0 opacity-80"
                      />
                      <span className="flex-1">{label}</span>
                      {label === "Orders" && pending > 0 && (
                        <span
                          aria-label={`${pending} orders need action`}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${page === label ? "bg-white text-olive" : "bg-[#ff3f6c] text-white"}`}
                        >
                          {pending}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
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
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 text-xs"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b bg-white py-3 pl-16 pr-5 lg:px-10">
          <p className="text-xs text-muted">
            Workspace / <span className="text-ink">{page}</span>
          </p>
          <div className="flex items-center gap-3">
            <p className="text-right text-xs">
              {actor.name}
              <span className="mt-0.5 block capitalize text-muted">
                {actor.role}
              </span>
            </p>
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-xs font-semibold text-olive"
            >
              {actor.name
                .split(/\s+/)
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-5 md:p-10">{children}</main>
      </div>
    </div>
  );
}
