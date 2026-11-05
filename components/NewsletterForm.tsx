"use client";
import { useState } from "react";
import { Check, Send } from "lucide-react";

// Footer sign-up. Consent is an explicit, unticked checkbox; the address is
// stored in Admin → Homepage & Footer → Subscribers.
export default function NewsletterForm({ storeName }: { storeName: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");
  if (state === "done")
    return (
      <p
        role="status"
        className="flex items-center gap-3 rounded-2xl bg-white/15 p-4 text-sm font-semibold"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#03a685]">
          <Check size={16} />
        </span>
        You're on the list. Watch your inbox.
      </p>
    );
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy");
        setError("");
        const email = String(new FormData(e.currentTarget).get("email") || "");
        try {
          const r = await fetch("/api/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const data = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(data.error || "Please try again.");
          setState("done");
        } catch (err) {
          setError((err as Error).message);
          setState("idle");
        }
      }}
    >
      <div className="glass-dark flex items-center gap-2 rounded-full p-1.5 pl-5">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white placeholder:text-white/60 focus:outline-none"
        />
        <button
          disabled={state === "busy"}
          className="flex items-center gap-2 rounded-full bg-[#ff3f6c] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#e0315c]"
        >
          {state === "busy" ? "…" : "Subscribe"}
          <Send size={14} />
        </button>
      </div>
      <label className="flex items-start gap-2 text-[11px] leading-5 text-white/75">
        <input
          type="checkbox"
          required
          className="mt-1 h-3.5 w-3.5 accent-[#ff3f6c]"
        />
        I agree to receive marketing emails from {storeName}. I can unsubscribe
        at any time.
      </label>
      {error && (
        <p role="alert" className="text-xs text-[#ffd0dc]">
          {error}
        </p>
      )}
    </form>
  );
}
