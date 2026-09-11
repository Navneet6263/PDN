"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { LockKeyhole, ArrowLeft, ArrowRight } from "lucide-react";
import { request } from "./api";
export default function Login({ onLogin }: { onLogin: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    try {
      await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
      onLogin();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div
        className="relative hidden items-end bg-olive p-16 lg:flex"
        style={{
          backgroundImage:
            "linear-gradient(0deg,rgba(30,35,25,.85),rgba(30,35,25,.1)),url(/images/about-bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-white">
          <p className="eyebrow mb-6">Behind the collection</p>
          <h1 className="serif text-6xl">
            Good things
            <br />
            start here.
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-white/70">
            Your pieces, your stories, your store.
            <br />
            Welcome to the Terra workspace.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="serif text-4xl">
            terra.
          </Link>
          <div className="mb-6 mt-12 flex h-11 w-11 items-center justify-center rounded-full bg-cream">
            <LockKeyhole size={20} />
          </div>
          <h2 className="serif text-3xl">Welcome back.</h2>
          <p className="mb-8 mt-3 text-sm text-muted">Sign in to manage your collection.</p>
          <form onSubmit={submit} className="space-y-5">
            <label className="label">
              Email address
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                className="field"
                placeholder="admin@terra.local"
              />
            </label>
            <label className="label">
              Password
              <input
                name="password"
                type="password"
                required
                maxLength={500}
                autoComplete="current-password"
                className="field"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <button disabled={busy} className="btn w-full">
              {busy ? "Signing in…" : "Sign in"}
              <ArrowRight size={15} />
            </button>
          </form>
          <Link href="/" className="mt-8 flex items-center gap-2 text-xs text-muted">
            <ArrowLeft size={14} /> Back to storefront
          </Link>
        </div>
      </div>
    </main>
  );
}
