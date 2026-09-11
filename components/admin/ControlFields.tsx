"use client";
import { useState } from "react";
import { request } from "./api";
export type Field = {
  key: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "checkbox"
    | "select"
    | "image"
    | "datetime"
    | "password"
    | "email"
    | "list";
  options?: string[];
  required?: boolean;
  hint?: string;
};
export type RecordData = { id?: string; [key: string]: unknown };
export function ImageControl({
  value,
  onChange,
  id,
  onBusy,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
  onBusy?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-2">
      {value && (
        <img src={value} alt="Image preview" className="h-28 w-full rounded-lg object-cover" />
      )}
      <input id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)} />
      <input
        aria-label="Upload image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setError("");
          if (file.size > 5 * 1024 * 1024) {
            setError("Maximum image size is 5 MB.");
            return;
          }
          setBusy(true);
          onBusy?.(true);
          try {
            const result = await request<{ url: string }>("/admin/uploads", {
              method: "POST",
              headers: { "Content-Type": file.type },
              body: file,
            });
            onChange(result.url);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
            onBusy?.(false);
          }
        }}
      />
      {busy && <p role="status">Uploading… Save after the preview updates.</p>}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
function localDate(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export default function ControlFields({
  fields,
  value,
  onChange,
  onBusy,
}: {
  fields: Field[];
  value: RecordData;
  onChange: (value: RecordData) => void;
  onBusy?: (busy: boolean) => void;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {fields.map((f) => {
        const v = value[f.key];
        const set = (next: unknown) => onChange({ ...value, [f.key]: next });
        return (
          <div
            key={f.key}
            className={["textarea", "image"].includes(f.type || "") ? "md:col-span-2" : ""}
          >
            <label className="label" htmlFor={`control-${f.key}`}>
              {f.label}
            </label>
            {f.type === "image" ? (
              <ImageControl
                id={`control-${f.key}`}
                value={String(v || "")}
                onChange={set}
                onBusy={onBusy}
              />
            ) : f.type === "checkbox" ? (
              <input
                id={`control-${f.key}`}
                type="checkbox"
                checked={Boolean(v)}
                onChange={(e) => set(e.target.checked)}
                className="h-5 w-5 accent-olive"
              />
            ) : f.type === "select" ? (
              <select
                id={`control-${f.key}`}
                className="field"
                value={String(v ?? "")}
                onChange={(e) => set(e.target.value)}
              >
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                id={`control-${f.key}`}
                required={f.required}
                rows={4}
                className="field"
                value={String(v ?? "")}
                onChange={(e) => set(e.target.value)}
              />
            ) : (
              <input
                id={`control-${f.key}`}
                required={f.required}
                className="field"
                step={f.type === "number" ? "any" : undefined}
                type={
                  f.type === "datetime"
                    ? "datetime-local"
                    : ["number", "password", "email"].includes(f.type || "")
                      ? f.type
                      : "text"
                }
                value={
                  f.type === "list"
                    ? ((v as string[]) || []).join(",")
                    : f.type === "datetime"
                      ? localDate(v)
                      : String(v ?? "")
                }
                onChange={(e) =>
                  set(
                    f.type === "number"
                      ? Number(e.target.value)
                      : f.type === "list"
                        ? e.target.value.split(",")
                        : f.type === "datetime"
                          ? e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null
                          : e.target.value,
                  )
                }
              />
            )}
            {f.hint && <p className="mt-2 text-xs leading-5 text-muted">{f.hint}</p>}
          </div>
        );
      })}
    </div>
  );
}
