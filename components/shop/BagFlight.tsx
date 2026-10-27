"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";

export type BagAdded = {
  image: string;
  name: string;
  detail: string;
  from?: DOMRect | null;
};
export const BAG_ADDED = "terra-bag-added";

// The visible bag icon to fly into: header on desktop, tab bar on phones.
function bagTarget() {
  return [...document.querySelectorAll<HTMLElement>("[data-bag-target]")].find(
    (el) => {
      const r = el.getBoundingClientRect();
      return (
        r.width > 0 &&
        r.height > 0 &&
        getComputedStyle(el).visibility !== "hidden"
      );
    },
  );
}

// Confirms every add-to-bag: the product photo flies into the bag icon, the
// icon bounces, and a toast offers a shortcut to the bag.
export default function BagFlight() {
  const [toast, setToast] = useState<BagAdded | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    const onAdded = (e: Event) => {
      const added = (e as CustomEvent<BagAdded>).detail;
      const target = bagTarget();
      const calm = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const bump = () => {
        target?.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.35)" },
            { transform: "scale(0.92)" },
            { transform: "scale(1)" },
          ],
          { duration: 450, easing: "ease-out" },
        );
      };
      if (!calm && target && added.from) {
        const to = target.getBoundingClientRect();
        const from = added.from;
        const size = Math.min(from.width, from.height, 260);
        const ghost = document.createElement("img");
        ghost.src = added.image;
        ghost.alt = "";
        ghost.setAttribute("aria-hidden", "true");
        Object.assign(ghost.style, {
          position: "fixed",
          left: `${from.left + from.width / 2 - size / 2}px`,
          top: `${from.top + from.height / 2 - size / 2}px`,
          width: `${size}px`,
          height: `${size}px`,
          objectFit: "cover",
          borderRadius: "16px",
          zIndex: "60",
          pointerEvents: "none",
          boxShadow: "0 12px 30px rgba(40,44,63,.25)",
        });
        document.body.appendChild(ghost);
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        const flight = ghost.animate(
          [
            {
              transform: "translate(0,0) scale(1)",
              opacity: 1,
              borderRadius: "16px",
            },
            {
              transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 80}px) scale(0.45)`,
              opacity: 0.95,
              borderRadius: "50%",
              offset: 0.6,
            },
            {
              transform: `translate(${dx}px, ${dy}px) scale(0.08)`,
              opacity: 0.4,
              borderRadius: "50%",
            },
          ],
          { duration: 750, easing: "cubic-bezier(.45,.05,.55,.95)" },
        );
        flight.onfinish = () => {
          ghost.remove();
          bump();
        };
      } else bump();
      setToast(added);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(null), 4500);
    };
    window.addEventListener(BAG_ADDED, onAdded);
    return () => {
      window.removeEventListener(BAG_ADDED, onAdded);
      clearTimeout(timer.current);
    };
  }, []);
  if (!toast) return null;
  return (
    <div
      role="status"
      className="bag-toast fixed inset-x-3 bottom-24 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl bg-[#282c3f] p-3 pr-4 text-white shadow-2xl sm:bottom-auto sm:left-auto sm:right-6 sm:top-24 sm:mx-0"
    >
      <span className="relative shrink-0">
        <img
          src={toast.image}
          alt=""
          className="h-14 w-11 rounded-lg object-cover"
        />
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#03a685] ring-2 ring-[#282c3f]">
          <Check size={12} strokeWidth={3} />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">Added to bag</span>
        <span className="block truncate text-xs text-white/70">
          {toast.name} · {toast.detail}
        </span>
      </span>
      <Link
        href="/cart"
        onClick={() => setToast(null)}
        className="shrink-0 rounded-lg bg-[#ff3f6c] px-3 py-2 text-xs font-bold"
      >
        View bag
      </Link>
      <button
        aria-label="Dismiss"
        onClick={() => setToast(null)}
        className="shrink-0 text-white/60"
      >
        <X size={16} />
      </button>
    </div>
  );
}
