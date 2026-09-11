"use client";
import { useEffect, useState } from "react";
import { request } from "./api";
import type { RecordData } from "./ControlFields";
export default function SupportNotes({
  draft,
  onChange,
}: {
  draft: RecordData;
  onChange: (d: RecordData) => void;
}) {
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    request<typeof agents>("/admin/support/agents")
      .then(setAgents)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <section className="space-y-4 border-t pt-5">
      <label className="label">
        Assign to
        <select
          className="field"
          value={String(draft.assigneeId || "")}
          onChange={(e) => onChange({ ...draft, assigneeId: e.target.value || null })}
        >
          <option value="">Unassigned</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      {((draft.replies as { id: string; author: string; text: string }[]) || []).map((r) => (
        <p key={r.id} className="rounded-lg bg-cream p-4 text-sm">
          <strong>{r.author}</strong>
          <br />
          {r.text}
        </p>
      ))}
      {draft.id && (
        <>
          <label className="label">
            Internal conversation note
            <textarea className="field" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <button
            type="button"
            className="btn-outline"
            disabled={busy || !note.trim()}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await request(`/admin/support/${draft.id}/replies`, {
                  method: "POST",
                  body: JSON.stringify({ text: note }),
                });
                const rows = await request<RecordData[]>("/admin/support");
                const updated = rows.find((r) => r.id === draft.id);
                if (updated)
                  onChange({ ...draft, replies: updated.replies, status: updated.status });
                setNote("");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Save note
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
