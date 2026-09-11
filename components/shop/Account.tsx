"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useShopping } from "./ShoppingProvider";
import { request } from "@/lib/shopping";
export default function Account() {
  const { customer, refresh, logout, error: bagError } = useShopping();
  const [showPassword, setShowPassword] = useState(false);
  const [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (customer)
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-bold">Hi, {customer.name}</h1>
        <p>{customer.email}</p>
        <p>Your bag is saved to your account.</p>
        {bagError && (
          <p role="alert">
            {bagError}
            <button onClick={() => void refresh()} className="ml-2 underline">
              Retry bag sync
            </button>
          </p>
        )}
        <Link href="/cart" className="btn-primary">
          Open my bag
        </Link>
        <Link href="/checkout" className="block text-pink-600 underline">
          Continue to checkout
        </Link>
        <button
          onClick={() => logout().catch((e) => setError(e.message))}
          className="block underline"
        >
          Sign out
        </button>
        {error && <p role="alert">{error}</p>}
      </div>
    );
  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const form = new FormData(e.currentTarget);
        try {
          await request(`/customer/${register ? "register" : "login"}`, Object.fromEntries(form));
          await refresh();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-xs font-bold uppercase tracking-widest text-pink-600">
        Your personal shopping space
      </p>
      <h1 className="text-3xl font-bold">{register ? "Create your account" : "Welcome back"}</h1>
      <p className="text-sm text-gray-500">
        The styles you added before signing in will stay in your bag.
      </p>
      {register && (
        <label className="block text-sm">
          Name
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            className="mt-2 w-full rounded-lg border border-[#e1e5eb] bg-[#fafbfc] p-3"
          />
        </label>
      )}
      <label className="block text-sm">
        Email
        <input
          name="email"
          required
          type="email"
          autoComplete="email"
          className="mt-2 w-full rounded-lg border border-[#e1e5eb] bg-[#fafbfc] p-3"
        />
      </label>
      <label className="relative block text-sm">
        Password
        <input
          name="password"
          required
          aria-label="Password"
          type={showPassword ? "text" : "password"}
          minLength={8}
          maxLength={128}
          autoComplete={register ? "new-password" : "current-password"}
          className="mt-2 w-full rounded-lg border border-[#e1e5eb] bg-[#fafbfc] p-3 pr-12"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute bottom-1 right-1 rounded-lg bg-[#fafbfc] p-3 text-gray-500"
        >
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </label>
      {(error || bagError) && (
        <p role="alert" className="text-sm text-red-700">
          {error || bagError}
        </p>
      )}
      <button
        disabled={busy}
        className="w-full rounded bg-[#ff3f6c] p-4 font-bold text-white disabled:opacity-50"
      >
        {busy ? "Please wait..." : register ? "Create account" : "Sign in"}
      </button>
      <button type="button" onClick={() => setRegister(!register)} className="text-sm underline">
        {register ? "Already registered? Sign in" : "New here? Create account"}
      </button>
    </form>
  );
}
