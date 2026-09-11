"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { request } from "@/lib/shopping";
import { useShopping } from "./ShoppingProvider";
type Review = {
  id: string;
  rating: number;
  text: string;
  photos: string[];
  createdAt: string;
  customer: { name: string };
};
type Reviews = { reviews: Review[]; average: number | null; count: number };
export default function ProductReviews({ productId }: { productId: string }) {
  const { customer } = useShopping();
  const [data, setData] = useState<Reviews | null>(null),
    [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]),
    [busy, setBusy] = useState(false),
    [note, setNote] = useState("");
  const load = () => request<Reviews>(`/reviews/${productId}`).then(setData);
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [productId]);
  return (
    <section id="reviews" className="scroll-mt-44 border-t py-12">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Ratings & customer photos</h2>
        <p className="text-sm">
          {data?.count
            ? `${data.average?.toFixed(1)} / 5 ★ · ${data.count} reviews`
            : "No reviews yet"}
        </p>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {data?.reviews.map((r) => (
            <article key={r.id} className="rounded-xl border p-5">
              <p className="text-sm font-bold">
                <span className="mr-3 rounded bg-green-700 px-2 py-1 text-white">{r.rating} ★</span>
                {r.customer.name}
              </p>
              <p className="my-4 whitespace-pre-line break-words text-sm leading-6">{r.text}</p>
              <div className="flex flex-wrap gap-2">
                {r.photos.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt={`Photo shared by ${r.customer.name}`}
                      loading="lazy"
                      className="h-28 w-24 rounded object-cover"
                    />
                  </a>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500">
                {new Date(r.createdAt).toLocaleDateString("en-IN")} · Customer review
              </p>
            </article>
          ))}
          {data && !data.count && (
            <p className="rounded-xl bg-pink-50 p-7 text-sm">
              Tried this style? Share the fit, fabric and a photo to help the next shopper.
            </p>
          )}
        </div>
        {customer ? (
          <form
            className="space-y-4 rounded-xl border bg-white p-5"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget,
                values = new FormData(form);
              setBusy(true);
              setError("");
              setNote("");
              try {
                const photos: string[] = [];
                for (const file of files) {
                  const response = await fetch("/api/reviews/photos", {
                    method: "POST",
                    headers: { "Content-Type": file.type },
                    body: file,
                  });
                  const result = await response.json();
                  if (!response.ok) throw new Error(result.error);
                  photos.push(result.url);
                }
                await request(`/reviews/${productId}`, {
                  rating: Number(values.get("rating")),
                  text: values.get("text"),
                  photos,
                });
                await load();
                setFiles([]);
                form.reset();
                setNote("Your review is live. Thank you for sharing!");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <h3 className="font-bold">Write or update your review</h3>
            <label className="block text-sm">
              Rating
              <select
                name="rating"
                aria-label="Rating"
                required
                defaultValue=""
                className="mt-2 w-full rounded border p-3"
              >
                <option value="" disabled>
                  Select stars
                </option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} stars
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Your experience
              <textarea
                name="text"
                required
                minLength={10}
                maxLength={2000}
                rows={4}
                className="mt-2 w-full rounded border p-3"
                placeholder="How was the fit and fabric?"
              />
            </label>
            <label className="block text-sm">
              Add up to 3 photos
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="mt-2 w-full text-xs"
                onChange={(e) => {
                  const chosen = [...(e.target.files || [])];
                  if (
                    chosen.length > 3 ||
                    chosen.some(
                      (f) =>
                        f.size > 5 * 1024 * 1024 ||
                        !["image/jpeg", "image/png", "image/webp"].includes(f.type),
                    )
                  ) {
                    setError("Choose up to 3 JPEG, PNG or WebP photos, each under 5 MB.");
                    e.target.value = "";
                    setFiles([]);
                  } else {
                    setFiles(chosen);
                    setError("");
                  }
                }}
              />
            </label>
            <p className="text-xs text-gray-500">
              Your name and review photos will be public. One review per product; submitting again
              replaces it.
            </p>
            <button
              disabled={busy}
              className="w-full rounded bg-[#ff3f6c] p-3 text-sm font-bold text-white"
            >
              {busy ? "Publishing..." : "Publish review"}
            </button>
          </form>
        ) : (
          <div className="rounded-xl bg-pink-50 p-6">
            <h3 className="font-bold">Your opinion helps</h3>
            <p className="my-3 text-sm">Sign in to share your rating and photos.</p>
            <Link href="/account" className="text-sm font-bold text-pink-600 underline">
              Sign in to write a review
            </Link>
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {note && (
        <p role="status" className="mt-4 text-sm text-green-700">
          {note}
        </p>
      )}
    </section>
  );
}
