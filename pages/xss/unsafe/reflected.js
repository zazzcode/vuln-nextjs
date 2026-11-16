import { useState } from 'react';
import Link from 'next/link';
import LabLayout from '../../../components/LabLayout';
const sample = `<img src=x onerror="window.__zazzlesXss='reflected-marker'">`;
export default function ReflectedUnsafe({ payload }) {
  const [draft, setDraft] = useState(payload);
  return <LabLayout title="XSS-001 · Reflected XSS (unsafe)">
    <p>The <code>payload</code> query parameter is rendered as raw HTML through <code>dangerouslySetInnerHTML</code>. Script tags inserted via innerHTML do not run, but event-handler attributes such as <code>onerror</code> execute immediately. This is browser-side JavaScript execution, not server RCE.</p>
    <form method="GET">
      <label>Payload<textarea name="payload" rows={4} value={draft} autoComplete="off" onChange={(e) => setDraft(e.target.value)} /></label>
      <div className="actions"><button>Render payload</button><button type="button" onClick={() => setDraft(sample)}>Load XSS sample</button><button type="button" onClick={() => setDraft('Hello lab')}>Normal input</button></div>
    </form>
    <h2>Rendered output</h2>
    {/* XSS-001 / CWE-79: attacker-controlled string rendered as raw HTML. */}
    <div id="xss-output" className="xss-output" dangerouslySetInnerHTML={{ __html: payload }} />
    <p>Safe comparison: <Link href="/xss/safe/reflected">the same payload rendered as React text</Link>.</p>
  </LabLayout>;
}
export function getServerSideProps({ query }) {
  const payload = typeof query.payload === 'string' && query.payload.length <= 2000 ? query.payload : 'Hello lab';
  return { props: { payload } };
}
