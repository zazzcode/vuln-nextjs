import { useState } from 'react';
import Link from 'next/link';
import LabLayout from '../../../components/LabLayout';
const sample = `<img src=x onerror="window.__zazzlesXss='reflected-marker'">`;
export default function ReflectedSafe({ payload }) {
  const [draft, setDraft] = useState(payload);
  return <LabLayout title="Safe control · Reflected output as text">
    <p>Safe comparison for <Link href="/xss/unsafe/reflected">XSS-001</Link>: the identical payload is rendered as a React text node. React escapes text content, so markup stays visible data and no event handler ever runs. No sanitizer is needed because untrusted text is never parsed as HTML.</p>
    <form method="GET">
      <label>Payload<textarea name="payload" rows={4} value={draft} autoComplete="off" onChange={(e) => setDraft(e.target.value)} /></label>
      <div className="actions"><button>Render payload</button><button type="button" onClick={() => setDraft(sample)}>Load XSS sample</button><button type="button" onClick={() => setDraft('Hello lab')}>Normal input</button></div>
    </form>
    <h2>Rendered output</h2>
    <div id="xss-output" className="xss-output">{payload}</div>
    <p>The sample above is displayed as literal text. <code>window.__zazzlesXss</code> stays undefined.</p>
  </LabLayout>;
}
export function getServerSideProps({ query }) {
  const payload = typeof query.payload === 'string' && query.payload.length <= 2000 ? query.payload : 'Hello lab';
  return { props: { payload } };
}
