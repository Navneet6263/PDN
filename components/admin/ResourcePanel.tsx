"use client";
import { useEffect, useState } from "react";
import ControlFields, { type RecordData } from "./ControlFields";
import { request } from "./api";
import { type ResourceConfig } from "./resource-config";
import SupportNotes from "./SupportNotes";
import SalesSummary from "./SalesSummary";
import BannerDestination from "./BannerDestination";
export default function ResourcePanel({ config }: { config: ResourceConfig }) {
  const [rows, setRows] = useState<RecordData[]>([]);
  const [draft, setDraft] = useState<RecordData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);
  async function refresh() {
    try {
      setRows(await request<RecordData[]>(`/admin/${config.path}`));
      setLoaded(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void refresh();
  }, [config.path]);
  async function save() {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const payload = { ...draft };
      for (const f of config.fields)
        if (f.type === "list")
          payload[f.key] = (payload[f.key] as string[]).map((s) => s.trim()).filter(Boolean);
      await request(`/admin/${config.path}${draft.id ? `/${draft.id}` : ""}`, {
        method: draft.id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setDraft(null);
      setNotice("Saved successfully.");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="serif text-4xl">{config.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{config.description}</p>
        </div>
        <button
          className="btn rounded-lg"
          onClick={() => {
            setDraft({ ...config.blank });
            setNotice("");
          }}
        >
          Add new
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}{" "}
          <button className="underline" onClick={() => void refresh()}>
            Retry
          </button>
        </p>
      )}
      {notice && (
        <p role="status" className="text-green-800">
          {notice}
        </p>
      )}
      {config.path === "sales" && <SalesSummary rows={rows} />}
      {draft ? (
        <form
          className="panel space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <h2 className="text-xl font-medium">{draft.id ? "Edit record" : "New record"}</h2>
          <fieldset disabled={busy || uploading}>
            <ControlFields
              onBusy={setUploading}
              fields={
                config.path === "banners" && draft.destination === "collection"
                  ? config.fields.filter((f) => f.key !== "link")
                  : config.fields
              }
              value={draft}
              onChange={setDraft}
            />
            {config.path === "banners" && <BannerDestination value={draft} onChange={setDraft} />}
          </fieldset>
          {config.path === "support" && <SupportNotes draft={draft} onChange={setDraft} />}
          <div className="flex gap-3">
            <button className="btn" disabled={busy || uploading}>
              {busy ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              disabled={busy || uploading}
              className="btn-outline"
              onClick={() => setDraft(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="panel">
          <input
            className="field mb-5"
            aria-label={`Search ${config.title}`}
            placeholder="Search records…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {config.columns.map((c) => (
                    <th key={c} className="border-b p-3 capitalize">
                      {c.replace(/([A-Z])/g, " $1")}
                    </th>
                  ))}
                  <th className="border-b p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((r) =>
                    config.columns.some((c) =>
                      String(r[c]).toLowerCase().includes(query.toLowerCase()),
                    ),
                  )
                  .map((r) => (
                    <tr key={r.id}>
                      {config.columns.map((c) => (
                        <td key={c} className="border-b p-3">
                          {typeof r[c] === "boolean"
                            ? r[c]
                              ? "Enabled"
                              : "Disabled"
                            : c === "soldAt"
                              ? new Date(String(r[c])).toLocaleDateString()
                              : String(r[c] ?? "—")}
                        </td>
                      ))}
                      <td className="whitespace-nowrap border-b p-3">
                        <button
                          className="mr-4 underline"
                          onClick={() => setDraft({ ...r, password: "" })}
                        >
                          Edit
                        </button>
                        {config.remove && (
                          <button
                            className="text-red-700 underline"
                            disabled={busy || uploading}
                            onClick={async () => {
                              if (!window.confirm("Delete this record permanently?")) return;
                              setBusy(true);
                              setError("");
                              try {
                                await request(`/admin/${config.path}/${r.id}`, {
                                  method: "DELETE",
                                });
                                await refresh();
                              } catch (e) {
                                setError((e as Error).message);
                              } finally {
                                setBusy(false);
                              }
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!rows.length && (
            <p className="py-10 text-center text-muted">
              {loaded ? "No records yet. Add your first record above." : "Loading…"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
