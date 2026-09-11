"use client";
import { useEffect, useState } from "react";
import { defaultSettings, type StoreSettings } from "@/lib/store-types";
import ControlFields, { type Field } from "./ControlFields";
import { request } from "./api";
const groups: { title: string; keys: (keyof StoreSettings)[] }[] = [
  {
    title: "Brand & contact",
    keys: ["storeName", "announcement", "footerText", "contactEmail", "contactPhone"],
  },
  {
    title: "Default hero (when no scheduled hero banner is active)",
    keys: ["heroTitle", "heroSubtitle", "heroEyebrow", "heroImage", "heroButtonLabel", "heroLink"],
  },
  {
    title: "Homepage sections",
    keys: [
      "catalogTitle",
      "catalogSubtitle",
      "showTopTen",
      "topTenTitle",
      "showStory",
      "storyTitle",
      "storyText",
    ],
  },
  { title: "Search engine metadata", keys: ["seoTitle", "seoDescription"] },
  {
    title: "Default product policies",
    keys: ["returnPolicy", "exchangePolicy", "shippingInfo", "warrantyInfo"],
  },
];
export default function SettingsPanel() {
  const [value, setValue] = useState<StoreSettings | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    request<StoreSettings>("/admin/settings")
      .then(setValue)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        setNotice("");
        try {
          await request("/admin/settings", { method: "PUT", body: JSON.stringify(value) });
          setNotice("Store settings saved. Refresh the storefront to see your changes.");
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1 className="serif text-4xl">Store Settings</h1>
      <p className="text-sm text-muted">
        Product-specific policies override these defaults. Search engine metadata does not guarantee
        a Google ranking.
      </p>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-green-800">
          {notice}
        </p>
      )}
      {value &&
        groups.map((g) => (
          <fieldset disabled={busy || uploading} className="panel" key={g.title}>
            <h2 className="mb-5 font-medium">{g.title}</h2>
            <ControlFields
              onBusy={setUploading}
              value={value}
              onChange={(v) => setValue(v as StoreSettings)}
              fields={g.keys.map(
                (key) =>
                  ({
                    key,
                    label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
                    type:
                      typeof defaultSettings[key] === "boolean"
                        ? "checkbox"
                        : key === "heroImage"
                          ? "image"
                          : /Policy|Info|Text|Description|Subtitle/.test(key)
                            ? "textarea"
                            : "text",
                  }) as Field,
              )}
            />
          </fieldset>
        ))}
      <button className="btn" disabled={busy || uploading || !value}>
        {busy ? "Saving…" : "Save store settings"}
      </button>
    </form>
  );
}
