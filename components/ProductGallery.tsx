"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";
export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0),
    [zoom, setZoom] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = images[index] || images[0];
  useEffect(() => {
    if (!zoom) return;
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
  }, [zoom]);
  const move = (delta: number) => setIndex((n) => (n + delta + images.length) % images.length);
  return (
    <div className="min-w-0 lg:sticky lg:top-36">
      <button
        onClick={() => setZoom(true)}
        aria-label="Enlarge product image"
        className="group relative block aspect-[3/4] max-h-[760px] w-full overflow-hidden rounded-2xl bg-[#f6f5f3]"
      >
        <Image
          src={selected}
          alt={name}
          fill
          priority
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-contain"
          unoptimized={selected.startsWith("/media/")}
        />
        <span className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-[11px] text-[#606675] shadow-sm">
          <ZoomIn size={15} />
          Take a closer look
        </span>
      </button>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto p-1">
          {images.map((src, i) => (
            <button
              key={src}
              aria-label={`View photo ${i + 1}`}
              aria-pressed={index === i}
              onClick={() => setIndex(i)}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${index === i ? "border-[#535e71]" : "border-transparent"}`}
            >
              <Image
                src={src}
                alt={`${name}, photo ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
                unoptimized={src.startsWith("/media/")}
              />
            </button>
          ))}
        </div>
      )}
      {zoom && (
        <dialog
          ref={dialog}
          aria-label="Product photo viewer"
          onCancel={() => setZoom(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") move(1);
            if (e.key === "ArrowLeft") move(-1);
          }}
          className="m-auto h-[92dvh] w-[calc(100%-24px)] max-w-5xl overflow-hidden rounded-2xl bg-[#f6f5f3] p-4 backdrop:bg-[#202534]/70"
        >
          <div className="relative flex h-full flex-col">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="truncate text-sm font-semibold">{name}</p>
              <button
                onClick={() => setZoom(false)}
                aria-label="Close photo viewer"
                className="rounded-full bg-white p-2"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
              <Image
                src={selected}
                alt={`${name}, enlarged photo ${index + 1}`}
                fill
                sizes="90vw"
                className="object-contain"
                unoptimized={selected.startsWith("/media/")}
              />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex items-center justify-center gap-6">
                <button
                  onClick={() => move(-1)}
                  aria-label="Previous photo"
                  className="rounded-full bg-white p-3"
                >
                  <ChevronLeft size={18} />
                </button>
                <p className="text-xs">
                  {index + 1} / {images.length}
                </p>
                <button
                  onClick={() => move(1)}
                  aria-label="Next photo"
                  className="rounded-full bg-white p-3"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </dialog>
      )}
    </div>
  );
}
