import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import LabLayout from '../../../components/LabLayout';
const sample = `<img src=x onerror="window.__zazzlesXss='stored-marker'">`;
export default function StoredSafe() {
  const [notes, setNotes] = useState(null);
  const [draft, setDraft] = useState('A friendly note');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch('/api/sql/safe/notes');
    setNotes((await response.json()).notes);
  }, []);
  useEffect(() => { load(); }, [load]);
  async function save(event) {
    event.preventDefault(); setBusy(true);
    try {
      await fetch('/api/sql/safe/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: draft }) });
      await load();
    } finally { setBusy(false); }
  }
  async function reset() {
    setBusy(true);
    try { await fetch('/api/lab/reset', { method: 'POST' }); await load(); }
    finally { setBusy(false); }
  }
  return <LabLayout title="Safe control · Stored output as text">
    <p>Safe comparison for <Link href="/xss/unsafe/stored">XSS-002</Link>: identical storage and identical payloads, but each body renders as a React text node. Saved markup stays visible text for every visitor and <code>window.__zazzlesXss</code> stays undefined.</p>
    <form onSubmit={save}>
      <label>Note<textarea rows={3} value={draft} autoComplete="off" onChange={(e) => setDraft(e.target.value)} /></label>
      <div className="actions"><button disabled={busy}>Save note</button><button type="button" onClick={() => setDraft(sample)}>Load XSS sample</button><button type="button" disabled={busy} onClick={reset}>Reset SQL data</button></div>
    </form>
    <h2>Stored notes</h2>
    {notes === null ? <p>Loading…</p> : notes.map((note) => (
      <div key={note.id} className="xss-output note">{note.body}</div>
    ))}
  </LabLayout>;
}
