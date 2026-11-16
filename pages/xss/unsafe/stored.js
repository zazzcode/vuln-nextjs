import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import LabLayout from '../../../components/LabLayout';
const sample = `<img src=x onerror="window.__zazzlesXss='stored-marker'">`;
export default function StoredUnsafe() {
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
  return <LabLayout title="XSS-002 · Stored XSS (unsafe)">
    <p>Notes are written through the parameterized endpoint from <Link href="/sql/notes">SQL-003</Link>, so storage is not the flaw. Rendering is: each stored body is emitted as raw HTML through <code>dangerouslySetInnerHTML</code>, so a payload saved once executes for every visitor.</p>
    <form onSubmit={save}>
      <label>Note<textarea rows={3} value={draft} autoComplete="off" onChange={(e) => setDraft(e.target.value)} /></label>
      <div className="actions"><button disabled={busy}>Save note</button><button type="button" onClick={() => setDraft(sample)}>Load XSS sample</button><button type="button" disabled={busy} onClick={reset}>Reset SQL data</button></div>
    </form>
    <h2>Stored notes</h2>
    {notes === null ? <p>Loading…</p> : notes.map((note) => (
      // XSS-002 / CWE-79: stored attacker-controlled strings rendered as raw HTML.
      <div key={note.id} className="xss-output note" dangerouslySetInnerHTML={{ __html: note.body }} />
    ))}
    <p>Safe comparison: <Link href="/xss/safe/stored">the same notes rendered as React text</Link>.</p>
  </LabLayout>;
}
