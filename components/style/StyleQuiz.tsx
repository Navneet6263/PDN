"use client";
import { useEffect, useRef, useState } from "react";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { initialProfile, moodLabels, moods, type StyleProfile } from "@/lib/style-planner";
type Props = {
  initial: StyleProfile | null;
  onSave: (profile: StyleProfile) => void;
  onClose: () => void;
};
export default function StyleQuiz({ initial, onSave, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initial || initialProfile);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  const choice = <K extends keyof StyleProfile>(key: K, value: StyleProfile[K]) =>
    setDraft((p) => ({ ...p, [key]: value }));
  const options = (
    key: keyof StyleProfile,
    items: { value: string | number | boolean; label: string; hint?: string }[],
  ) => (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <button
          type="button"
          key={String(item.value)}
          onClick={() => {
            choice(key, item.value as never);
            if (key === "audience" && item.value === "kids")
              setDraft((p) => ({ ...p, mood: "festive" }));
          }}
          aria-pressed={draft[key] === item.value}
          className={`rounded-xl border-2 p-4 text-left transition ${draft[key] === item.value ? "border-[#ff3f6c] bg-[#fff2f5]" : "border-[#eeedf1] bg-white hover:border-[#ffacc0]"}`}
        >
          <span className="text-sm font-bold">{item.label}</span>
          {item.hint && (
            <span className="mt-1 block text-xs leading-5 text-[#818493]">{item.hint}</span>
          )}
        </button>
      ))}
    </div>
  );
  return (
    <dialog
      ref={dialog}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="style-quiz-title"
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl bg-white p-0 text-[#282c3f] shadow-2xl backdrop:bg-[#232433]/60"
    >
      <div className="p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#ff3f6c]">
            <Sparkles size={16} />
            Your personal style break
          </span>
          <button
            aria-label="Close style quiz"
            onClick={onClose}
            className="rounded-full bg-[#f6f5f8] p-2"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mb-6 flex gap-2" aria-label={`Step ${step + 1} of 3`}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded ${i <= step ? "bg-[#ff3f6c]" : "bg-[#eeeef2]"}`}
            />
          ))}
        </div>
        <h2 id="style-quiz-title" className="text-2xl font-extrabold tracking-tight">
          {
            [
              "What is your shopping mood today?",
              "Your style, your rules.",
              "Let’s make it your kind of week.",
            ][step]
          }
        </h2>
        <p className="mb-6 mt-2 text-sm leading-6 text-[#828492]">
          {
            [
              "Three quick steps to find looks that fit your plans.",
              "Choose what feels like you. You can always change it.",
              "One last thing before your outfit picks are ready.",
            ][step]
          }
        </p>
        {step === 0 && (
          <div className="space-y-6">
            <fieldset>
              <legend className="mb-3 text-xs font-bold">Who are we styling?</legend>
              {options("audience", [
                { value: "women", label: "Women" },
                { value: "men", label: "Men" },
                { value: "kids", label: "Little ones" },
              ])}
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-xs font-bold">What are you dressing for?</legend>
              {options(
                "mood",
                moods
                  .filter((m) => draft.audience !== "kids" || !["office", "college"].includes(m))
                  .map((value) => ({ value, label: moodLabels[value] })),
              )}
            </fieldset>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-6">
            <fieldset>
              <legend className="mb-3 text-xs font-bold">Your style preference</legend>
              {options("style", [
                {
                  value: "ethnic",
                  label: "Rooted in tradition",
                  hint: "Kurtas, prints & Indian wear",
                },
                {
                  value: "minimal",
                  label: "Keep it minimal",
                  hint: "Easy silhouettes & simple details",
                },
                { value: "bold", label: "A little extra", hint: "Prints, colour & personality" },
              ])}
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-xs font-bold">Budget per product</legend>
              {options("budget", [
                { value: 1000, label: "Up to ₹1,000" },
                { value: 2500, label: "Up to ₹2,500" },
                { value: 5000, label: "Up to ₹5,000" },
                { value: 10000000, label: "Show all budgets" },
              ])}
            </fieldset>
          </div>
        )}
        {step === 2 &&
          (draft.mood === "office" ? (
            <fieldset>
              <legend className="mb-4 text-lg font-bold">Working on Saturdays too? 👀</legend>
              {options("saturday", [
                {
                  value: false,
                  label: "No, the weekend is mine!",
                  hint: "Monday–Friday outfit plan",
                },
                {
                  value: true,
                  label: "Yes, Saturdays too.",
                  hint: "An extra stylish pick + a little sympathy",
                },
              ])}
              <p className="mt-5 rounded-lg bg-[#fff7e9] p-4 text-xs leading-6">
                {draft.saturday
                  ? "Saturday attendance is mandatory. A great outfit makes it easier. 😅"
                  : "A five-day week. Now that is a weekend worth celebrating!"}
                <br />
                Suggestions are for a relaxed / smart-casual office. Please follow your workplace
                dress code.
              </p>
            </fieldset>
          ) : (
            <div className="rounded-xl bg-[#fff2f5] p-5">
              <p className="text-lg font-bold">{moodLabels[draft.mood]} it is! ✨</p>
              <p className="mt-3 text-sm leading-6">
                {draft.mood === "college"
                  ? "Lectures, lunch breaks and after-class plans — three looks, your style."
                  : draft.mood === "festive"
                    ? "Family gatherings or festive photos — find your celebration look."
                    : "Coffee, errands, catch-ups — easy looks for your everyday plans."}
              </p>
            </div>
          ))}
        <div className="mt-7 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 text-xs font-bold"
            >
              <ArrowLeft size={15} />
              Back
            </button>
          ) : (
            <button onClick={onClose} className="text-xs text-[#858896] underline">
              Just browsing
            </button>
          )}
          <button
            onClick={() => (step < 2 ? setStep(step + 1) : onSave(draft))}
            className="flex items-center gap-3 rounded-lg bg-[#ff3f6c] px-5 py-3 text-xs font-bold text-white"
          >
            {step < 2 ? "Continue" : "Show my style plan"}
            <ArrowRight size={16} />
          </button>
        </div>
        <p className="mt-5 text-[10px] leading-5 text-[#999ba6]">
          No login needed. Your choices stay in this browser. Change or clear them anytime.
        </p>
      </div>
    </dialog>
  );
}
