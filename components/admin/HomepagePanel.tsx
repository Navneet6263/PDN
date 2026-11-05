"use client";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import {
  homeLayout,
  homeSectionLabels,
  requiredSections,
  trustIcons,
  type StoreSettings,
  type TrustItem,
} from "@/lib/store-types";
import { request } from "./api";

type Subscriber = { id: string; email: string; createdAt: string };
const iconLabels: Record<TrustItem["icon"], string> = {
  truck: "Delivery truck",
  cod: "Cash",
  secure: "Shield",
  track: "Parcel",
  returns: "Returns",
  gift: "Gift",
  sparkle: "Sparkle",
  heart: "Heart",
};

// Everything on the storefront that is not a product or banner: section
// order, top strip, trust strip, footer, social links and newsletter.
export default function HomepagePanel({
  onBanners,
}: {
  onBanners: () => void;
}) {
  const [value, setValue] = useState<StoreSettings | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    request<StoreSettings>("/admin/settings")
      .then((s) => setValue({ ...s, homeSections: homeLayout(s) }))
      .catch((e) => setError(e.message));
    request<Subscriber[]>("/admin/newsletter")
      .then(setSubscribers)
      .catch(() => undefined);
  }, []);
  if (!value)
    return (
      <p className="panel text-sm text-muted">
        {error || "Loading homepage settings…"}
      </p>
    );
  const set = <K extends keyof StoreSettings>(key: K, v: StoreSettings[K]) =>
    setValue({ ...value, [key]: v });
  const sections = value.homeSections;
  const move = (i: number, d: -1 | 1) => {
    const next = [...sections];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    set("homeSections", next);
  };
  async function save() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request("/admin/settings", {
        method: "PUT",
        body: JSON.stringify(value),
      });
      setNotice(
        "Saved. The storefront shows your changes on the next page load.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function exportCsv() {
    const rows = [
      ["Email", "Subscribed on"],
      ...subscribers.map((s) => [s.email, s.createdAt]),
    ];
    const blob = new Blob(
      [rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")],
      {
        type: "text/csv",
      },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  const text = "field";
  const card = "panel space-y-4";
  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3 text-olive">Storefront builder</p>
          <h1 className="serif text-4xl">Homepage & Footer</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Arrange the homepage, write the top strip and trust messages, and
            control the footer. Hero and promotion banners have their own editor
            with a live preview.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onBanners} className="btn-outline rounded-lg">
            <ImageIcon size={15} /> Edit banners
          </button>
          <a href="/" target="_blank" className="btn-outline rounded-lg">
            <ExternalLink size={15} /> View store
          </a>
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-green-50 p-4 text-sm text-green-800"
        >
          {notice}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <section className={card}>
          <div>
            <h2 className="font-medium">Homepage sections</h2>
            <p className="text-xs text-muted">
              Top to bottom, in the order shoppers see them. The eye hides a
              section.
            </p>
          </div>
          <ol className="divide-y rounded-xl border">
            {sections.map((sec, i) => {
              const locked = requiredSections.includes(sec.id);
              return (
                <li
                  key={sec.id}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm ${sec.visible ? "" : "bg-stone-50 text-muted"}`}
                >
                  <span className="w-5 text-xs text-muted">{i + 1}</span>
                  <span className="flex-1">
                    {homeSectionLabels[sec.id]}
                    {locked && (
                      <span className="ml-2 text-[10px] text-muted">
                        (always shown)
                      </span>
                    )}
                  </span>
                  <button
                    aria-label={`Move ${homeSectionLabels[sec.id]} up`}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    className="rounded p-1.5 hover:bg-cream"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    aria-label={`Move ${homeSectionLabels[sec.id]} down`}
                    disabled={i === sections.length - 1}
                    onClick={() => move(i, 1)}
                    className="rounded p-1.5 hover:bg-cream"
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    aria-label={`${sec.visible ? "Hide" : "Show"} ${homeSectionLabels[sec.id]}`}
                    aria-pressed={sec.visible}
                    disabled={locked}
                    onClick={() =>
                      set(
                        "homeSections",
                        sections.map((x) =>
                          x.id === sec.id ? { ...x, visible: !x.visible } : x,
                        ),
                      )
                    }
                    className="rounded p-1.5 hover:bg-cream"
                  >
                    {sec.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="space-y-6">
          <section className={card}>
            <h2 className="font-medium">Brand</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="label">
                Store name
                <input
                  className={text}
                  value={value.storeName}
                  onChange={(e) => set("storeName", e.target.value)}
                />
              </label>
              <label className="label">
                Tagline under the logo
                <input
                  className={text}
                  value={value.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                />
              </label>
            </div>
          </section>
          <section className={card}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-medium">Top strip messages</h2>
                <p className="text-xs text-muted">
                  Rotate every 4 seconds. Up to 6.
                </p>
              </div>
              <button
                disabled={value.announcements.length >= 6}
                onClick={() =>
                  set("announcements", [...value.announcements, ""])
                }
                className="btn-outline rounded-lg"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {!value.announcements.length && (
              <p className="text-xs text-muted">
                Using: “{value.announcement}”
              </p>
            )}
            {value.announcements.map((m, i) => (
              <div key={i} className="flex gap-2">
                <input
                  aria-label={`Message ${i + 1}`}
                  className={`${text} mt-0`}
                  value={m}
                  maxLength={160}
                  onChange={(e) =>
                    set(
                      "announcements",
                      value.announcements.map((x, j) =>
                        j === i ? e.target.value : x,
                      ),
                    )
                  }
                />
                <button
                  aria-label={`Remove message ${i + 1}`}
                  onClick={() =>
                    set(
                      "announcements",
                      value.announcements.filter((_, j) => j !== i),
                    )
                  }
                  className="rounded-lg border px-3 text-red-700"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </section>
        </div>
      </div>

      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium">Trust strip</h2>
            <p className="text-xs text-muted">
              {value.trustItems.length
                ? "Your own messages. Only promise what you deliver."
                : "Automatic: built from your delivery and COD settings. Add items to write your own."}
            </p>
          </div>
          <div className="flex gap-2">
            {value.trustItems.length > 0 && (
              <button
                onClick={() => set("trustItems", [])}
                className="btn-outline rounded-lg"
              >
                Use automatic
              </button>
            )}
            <button
              disabled={value.trustItems.length >= 6}
              onClick={() =>
                set("trustItems", [
                  ...value.trustItems,
                  { icon: "sparkle", title: "", text: "" },
                ])
              }
              className="btn-outline rounded-lg"
            >
              <Plus size={14} /> Add item
            </button>
          </div>
        </div>
        {value.trustItems.map((t, i) => {
          const update = (patch: Partial<TrustItem>) =>
            set(
              "trustItems",
              value.trustItems.map((x, j) =>
                j === i ? { ...x, ...patch } : x,
              ),
            );
          return (
            <div
              key={i}
              className="grid gap-2 sm:grid-cols-[160px_1fr_1fr_auto]"
            >
              <select
                aria-label={`Icon ${i + 1}`}
                className={`${text} mt-0`}
                value={t.icon}
                onChange={(e) =>
                  update({ icon: e.target.value as TrustItem["icon"] })
                }
              >
                {trustIcons.map((ic) => (
                  <option key={ic} value={ic}>
                    {iconLabels[ic]}
                  </option>
                ))}
              </select>
              <input
                aria-label={`Title ${i + 1}`}
                placeholder="Title"
                className={`${text} mt-0`}
                value={t.title}
                maxLength={60}
                onChange={(e) => update({ title: e.target.value })}
              />
              <input
                aria-label={`Detail ${i + 1}`}
                placeholder="Small detail"
                className={`${text} mt-0`}
                value={t.text}
                maxLength={80}
                onChange={(e) => update({ text: e.target.value })}
              />
              <button
                aria-label={`Remove item ${i + 1}`}
                onClick={() =>
                  set(
                    "trustItems",
                    value.trustItems.filter((_, j) => j !== i),
                  )
                }
                className="rounded-lg border px-3 text-red-700"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className={card}>
          <h2 className="font-medium">Footer & social</h2>
          <label className="label">
            Footer description
            <textarea
              className={text}
              rows={2}
              value={value.footerText}
              onChange={(e) => set("footerText", e.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["instagramUrl", "Instagram link"],
                ["facebookUrl", "Facebook link"],
                ["youtubeUrl", "YouTube link"],
                ["pinterestUrl", "Pinterest link"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="label">
                {label}
                <input
                  className={text}
                  type="url"
                  placeholder="https://"
                  value={value[key]}
                  onChange={(e) => set(key, e.target.value)}
                />
              </label>
            ))}
            <label className="label">
              WhatsApp number (with country code)
              <input
                className={text}
                inputMode="numeric"
                placeholder="917004023078"
                value={value.whatsappNumber}
                onChange={(e) =>
                  set("whatsappNumber", e.target.value.replace(/[^\d+]/g, ""))
                }
              />
            </label>
          </div>
          <p className="text-xs text-muted">
            Email, phone, address and policy pages are in Store Settings. Empty
            links are hidden.
          </p>
        </section>
        <section className={card}>
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Newsletter</h2>
            <span className="rounded-full bg-cream px-3 py-1 text-xs">
              {subscribers.length} subscriber
              {subscribers.length === 1 ? "" : "s"}
            </span>
          </div>
          <label className="label">
            Heading
            <input
              className={text}
              value={value.newsletterTitle}
              maxLength={80}
              onChange={(e) => set("newsletterTitle", e.target.value)}
            />
          </label>
          <label className="label">
            Text (say what people will receive)
            <textarea
              className={text}
              rows={2}
              maxLength={200}
              value={value.newsletterText}
              onChange={(e) => set("newsletterText", e.target.value)}
            />
          </label>
          <div className="max-h-48 overflow-y-auto rounded-xl border">
            {subscribers.length ? (
              <ul className="divide-y text-xs">
                {subscribers.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 px-3 py-2"
                  >
                    <span className="truncate">{s.email}</span>
                    <span className="flex items-center gap-2 text-muted">
                      {new Date(s.createdAt).toLocaleDateString("en-IN")}
                      <button
                        aria-label={`Remove ${s.email}`}
                        onClick={async () => {
                          await request(`/admin/newsletter/${s.id}`, {
                            method: "DELETE",
                          });
                          setSubscribers(
                            subscribers.filter((x) => x.id !== s.id),
                          );
                        }}
                        className="text-red-700"
                      >
                        <Trash2 size={13} />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-xs text-muted">No sign-ups yet.</p>
            )}
          </div>
          <button
            disabled={!subscribers.length}
            onClick={exportCsv}
            className="btn-outline rounded-lg"
          >
            <Download size={14} /> Export CSV
          </button>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/90 px-5 py-3 backdrop-blur lg:pl-64">
        <div className="mx-auto flex max-w-[1500px] items-center justify-end gap-3">
          <span className="text-xs text-muted">
            Changes go live when you save.
          </span>
          <button
            disabled={busy}
            onClick={() => void save()}
            className="btn rounded-lg"
          >
            {busy ? "Saving…" : "Save homepage & footer"}
          </button>
        </div>
      </div>
    </div>
  );
}
