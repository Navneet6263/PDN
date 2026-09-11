"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="shell py-32 text-center">
      <h1 className="serif text-4xl">We’ll be right back.</h1>
      <p className="my-5 text-muted">The catalog is temporarily unavailable. Please try again.</p>
      <button className="btn" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
