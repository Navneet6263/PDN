"use client";
import { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowUpRight, X } from "lucide-react";
import type { Product } from "@/lib/types";
import {
  profileKey,
  parseProfile,
  type StyleProfile,
} from "@/lib/style-planner";
import StyleQuiz from "./StyleQuiz";
import StyleResults from "./StyleResults";
export default function StyleStudio({ products }: { products: Product[] }) {
  const [profile, setProfile] = useState<StyleProfile | null>(null);
  const [quiz, setQuiz] = useState(false),
    [results, setResults] = useState(false);
  const [rotation, setRotation] = useState(0),
    [note, setNote] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    try {
      setProfile(parseProfile(localStorage.getItem(profileKey)));
    } catch {}
    const open = () => {
      setResults(false);
      setQuiz(true);
      if (location.hash === "#style-studio")
        history.replaceState(null, "", location.pathname + location.search);
    };
    window.addEventListener("terra-open-style", open);
    const hashChange = () => {
      if (location.hash === "#style-studio") open();
    };
    window.addEventListener("hashchange", hashChange);
    if (location.hash === "#style-studio") open();
    return () => {
      window.removeEventListener("terra-open-style", open);
      window.removeEventListener("hashchange", hashChange);
    };
  }, []);
  useEffect(() => {
    if (!results) return;
    const element = dialog.current,
      previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [results]);
  function save(p: StyleProfile) {
    setProfile(p);
    setRotation(0);
    setQuiz(false);
    setResults(true);
    window.dispatchEvent(new CustomEvent("terra-style-updated", { detail: p }));
    try {
      localStorage.setItem(profileKey, JSON.stringify(p));
    } catch {
      setNote("Preferences apply for this visit only.");
    }
  }
  return (
    <section id="style-studio" className="shell scroll-mt-44 py-4">
      <button
        onClick={() => {
          let saved = profile;
          try {
            saved = parseProfile(localStorage.getItem(profileKey)) || profile;
          } catch {}
          if (saved) {
            setProfile(saved);
            setResults(true);
          } else setQuiz(true);
        }}
        className="flex w-full items-center justify-between gap-4 overflow-hidden rounded-xl bg-gradient-to-r from-[#402339] via-[#8c3c64] to-[#d96079] px-5 py-6 text-left text-white sm:px-9"
      >
        <span>
          <span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-pink-200">
            <Sparkles size={15} /> Your style, your rules
          </span>
          <span className="block text-xl font-extrabold sm:text-3xl">
            What is your kind of style?
          </span>
          <span className="mt-2 block text-xs text-pink-100">
            Office, campus or weekend? Tell us your mood. Discover your next
            look.
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-bold text-[#883957]">
          <span className="hidden sm:inline">
            {profile ? "View my picks" : "Find my style"}
          </span>
          <ArrowUpRight size={21} />
        </span>
      </button>
      {quiz && (
        <StyleQuiz
          initial={profile}
          onSave={save}
          onClose={() => setQuiz(false)}
        />
      )}
      {results && profile && (
        <dialog
          ref={dialog}
          onCancel={() => setResults(false)}
          className="max-h-[90dvh] w-[calc(100%-24px)] max-w-6xl overflow-y-auto rounded-2xl bg-white p-5 backdrop:bg-black/50 sm:p-8"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Your personal style edit</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setResults(false);
                  setQuiz(true);
                }}
                className="text-xs font-bold text-pink-600"
              >
                Change my style
              </button>
              <button
                onClick={() => {
                  setProfile(null);
                  setResults(false);
                  try {
                    localStorage.removeItem(profileKey);
                  } catch {}
                  window.dispatchEvent(
                    new CustomEvent("terra-style-updated", { detail: null }),
                  );
                }}
                className="text-xs underline"
              >
                Clear preferences
              </button>
              <button
                onClick={() => setResults(false)}
                aria-label="Close style picks"
              >
                <X size={22} />
              </button>
            </div>
          </div>
          <StyleResults
            profile={profile}
            products={products}
            rotation={rotation}
            onRotate={() => setRotation((n) => n + 1)}
          />
          {note && <p role="status">{note}</p>}
        </dialog>
      )}
    </section>
  );
}
