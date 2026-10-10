"use client";
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import AdminFrame, { allowedSections } from "./AdminFrame";
import Merchandising from "./Merchandising";
import InventoryPanel from "./InventoryPanel";
import ResourcePanel from "./ResourcePanel";
import SettingsPanel from "./SettingsPanel";
import { resources } from "./resource-config";
import type { Identity } from "@/lib/store-types";
import type { Product } from "@/lib/types";
import { request } from "./api";
import Login from "./Login";
import ProductForm from "./ProductForm";
import ProductTable from "./ProductTable";
import AdminStats from "./AdminStats";
import Dashboard from "./Dashboard";
import OrdersPanel from "./OrdersPanel";
export default function AdminApp() {
  const [actor, setActor] = useState<Identity | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState("Overview");
  const [editor, setEditor] = useState<Product | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [orderFilter, setOrderFilter] = useState("");
  useEffect(() => {
    request<Identity>("/auth/me")
      .then((identity) => {
        setActor(identity);
        setAuthenticated(true);
        setPage(
          allowedSections(identity.role).find(
            (p) =>
              p === new URLSearchParams(window.location.search).get("section"),
          ) || allowedSections(identity.role)[0],
        );
      })
      .catch(() => setAuthenticated(false));
    const expired = () => {
      setAuthenticated(false);
      setProducts([]);
      setEditor(undefined);
    };
    window.addEventListener("terra-session-expired", expired);
    return () => window.removeEventListener("terra-session-expired", expired);
  }, []);
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setProducts(await request<Product[]>("/admin/products"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (authenticated)
      void request<Identity>("/auth/me")
        .then((identity) => {
          setActor(identity);
          setPage(
            allowedSections(identity.role).find(
              (p) =>
                p ===
                new URLSearchParams(window.location.search).get("section"),
            ) || allowedSections(identity.role)[0],
          );
          if (identity.role !== "support") void refresh();
        })
        .catch((e) => setError(e.message));
  }, [authenticated]);
  async function logout() {
    try {
      await request("/auth/logout", { method: "POST" });
      setAuthenticated(false);
      setProducts([]);
      setEditor(undefined);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await request(`/admin/products/${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      setNotice("Product deleted.");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  }
  if (authenticated === null)
    return (
      <p className="p-16 text-center text-sm text-muted">
        Opening your workspace…
      </p>
    );
  if (!authenticated) return <Login onLogin={() => setAuthenticated(true)} />;

  if (!actor) return <p className="p-10">Loading workspace…</p>;
  const go = (p: string) => {
    window.history.replaceState(
      null,
      "",
      `/admin?section=${encodeURIComponent(p)}`,
    );
    setPage(p);
    setEditor(undefined);
    setError("");
    setNotice("");
  };
  return (
    <AdminFrame
      actor={actor!}
      page={page}
      onPage={(p) => {
        setOrderFilter("");
        go(p);
      }}
      onLogout={() => void logout()}
    >
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
          <button onClick={() => void refresh()} className="underline">
            Retry
          </button>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="mb-5 flex justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          {notice}
          <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {page === "Orders" ? (
        <OrdersPanel
          key={orderFilter}
          actor={actor}
          initialStatus={orderFilter}
        />
      ) : resources[page] ? (
        <ResourcePanel key={page} config={resources[page]} />
      ) : page === "Store Settings" ? (
        <SettingsPanel />
      ) : page === "Top 10 & Search" ? (
        <Merchandising products={products} refresh={refresh} />
      ) : page === "Inventory" ? (
        <InventoryPanel products={products} refresh={refresh} />
      ) : editor !== undefined ? (
        <ProductForm
          product={editor}
          onClose={() => setEditor(undefined)}
          onSaved={() => {
            setEditor(undefined);
            setNotice(
              "Product saved. Published changes are now visible on the storefront.",
            );
            void refresh();
          }}
        />
      ) : (
        <>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow mb-3 text-olive">
                {page === "Overview"
                  ? new Date().toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                  : "Catalog"}
              </p>
              <h1 className="serif text-3xl md:text-4xl">
                {page === "Overview"
                  ? `Hello${actor.id === "owner" ? "" : ` ${actor.name.split(" ")[0]}`}, let’s make it a good day.`
                  : page}
              </h1>
              <p className="mt-3 text-xs text-muted">
                {page === "Overview"
                  ? "Sales, orders to fulfil and stock to watch, in one place."
                  : "Manage the pieces that make your collection."}
              </p>
            </div>
            <button
              onClick={() => {
                // New products are edited on the Products page so the saved row is visible.
                if (page === "Overview") go("Products");
                setEditor(null);
                setNotice("");
              }}
              className="btn rounded-lg"
            >
              <Plus size={16} /> Add product
            </button>
          </div>
          {page === "Overview" && (
            <>
              <Dashboard
                onOrders={(status) => {
                  setOrderFilter(status);
                  go("Orders");
                }}
              />
              <h2 className="mb-4 text-sm font-medium text-muted">
                Catalog health
              </h2>
              <AdminStats products={products} />
            </>
          )}
          {page === "Overview" ? null : loading ? (
            <p className="panel text-sm text-muted">Loading your products…</p>
          ) : (
            <ProductTable
              products={products}
              onEdit={(p) => {
                setEditor(p);
                setNotice("");
              }}
              onDelete={setDeleting}
              inventory={page === "Inventory"}
            />
          )}
        </>
      )}

      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-7">
            <h2 id="delete-title" className="serif text-2xl">
              Delete this product?
            </h2>
            <p className="my-5 text-sm leading-6 text-muted">
              “{deleting.name}” will be removed from your catalog. This cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                autoFocus
                disabled={busy}
                onClick={() => setDeleting(null)}
                className="btn-outline rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={() => void remove()}
                className="btn rounded-lg bg-red-700"
              >
                {busy ? "Deleting…" : "Delete product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminFrame>
  );
}
