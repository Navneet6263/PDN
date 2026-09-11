"use client";
import { useState } from "react";
import { Upload, X, ImagePlus } from "lucide-react";
import { request } from "./api";
export default function ImageFields({
  images,
  onChange,
  onBusy,
}: {
  images: string[];
  onChange: (value: string[]) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    if (images.length + files.length > 8) {
      setError("Use up to 8 photos per product.");
      return;
    }
    setBusy(true);
    onBusy(true);
    const uploaded = [...images];
    try {
      for (const file of Array.from(files)) {
        if (
          file.size > 5 * 1024 * 1024 ||
          !["image/jpeg", "image/png", "image/webp"].includes(file.type)
        )
          throw new Error("Each photo must be JPEG, PNG or WebP, up to 5 MB.");
        const result = await request<{ url: string }>("/admin/uploads", {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        uploaded.push(result.url);
        onChange([...uploaded]);
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2 className="mb-2 flex items-center gap-2 font-medium">
        <ImagePlus size={18} /> Product photos
      </h2>
      <p className="mb-5 text-xs text-muted">The first photo is the cover. Add up to 8 photos.</p>
      <div className="grid grid-cols-3 gap-3">
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="relative aspect-[3/4] overflow-hidden rounded-lg bg-cream"
          >
            <img src={src} alt={`Product photo ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute bottom-2 left-2 rounded bg-white px-2 py-1 text-[9px]">
                Cover
              </span>
            )}
            <button
              type="button"
              disabled={busy}
              aria-label={`Remove photo ${i + 1}`}
              onClick={() => onChange(images.filter((_, index) => index !== i))}
              className="absolute right-1 top-1 rounded-full bg-white p-1.5"
            >
              <X size={13} />
            </button>
            {i > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onChange([src, ...images.filter((_, index) => index !== i)])}
                className="absolute bottom-2 left-2 rounded bg-white px-2 py-1 text-[9px]"
              >
                Set cover
              </button>
            )}
          </div>
        ))}
      </div>
      <label
        className={`mt-4 flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed p-7 text-center text-xs ${busy ? "opacity-50" : ""}`}
      >
        <Upload size={21} className="text-olive" />
        <span>{busy ? "Uploading & optimizing…" : "Choose product photos"}</span>
        <span className="text-[10px] text-muted">JPEG, PNG, WebP · max 5 MB each</span>
        <input
          aria-label="Upload product photos"
          className="sr-only"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={busy || images.length >= 8}
          onChange={(e) => {
            void upload(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {error && (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
