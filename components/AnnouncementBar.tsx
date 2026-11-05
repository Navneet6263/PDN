"use client";
import { useEffect, useState } from "react";

// Rotating top strip. Messages come from Admin → Homepage & Footer.
export default function AnnouncementBar({ messages }: { messages: string[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (messages.length < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % messages.length), 4000);
    return () => clearInterval(t);
  }, [messages.length, paused]);
  if (!messages.length) return null;
  return (
    <div
      className="bg-workari px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[.18em] text-white sm:text-[11px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-live="polite"
    >
      <p key={i} className="announce-in truncate">
        {messages[i % messages.length]}
      </p>
    </div>
  );
}
