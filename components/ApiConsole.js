import { useState } from 'react';
export default function ApiConsole({ endpoint, initialBody, label = 'Send request' }) {
  const [body, setBody] = useState(JSON.stringify(initialBody, null, 2));
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(JSON.parse(body)) });
      setResult({ status: response.status, body: await response.json() });
    } catch (error) { setResult({ error: error.message }); }
    finally { setBusy(false); }
  }
  return <><form onSubmit={submit}><label>JSON request body<textarea rows={7} value={body} onChange={(e) => setBody(e.target.value)} /></label><button disabled={busy}>{busy ? 'Sending…' : label}</button></form>{result && <pre aria-live="polite">{JSON.stringify(result, null, 2)}</pre>}</>;
}
