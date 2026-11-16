import { useState } from 'react';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import LabLayout from '../../../components/LabLayout';
const sample = `<img src=x onerror="window.__zazzlesXss='reflected-marker'">`;
export default function ReflectedSanitized({ payload, clean }) {
  const [draft, setDraft] = useState(payload);
  return <LabLayout title="Safe control · DOMPurify-sanitized HTML">
    <p>Library comparison for <Link href="/xss/unsafe/reflected">XSS-001</Link>: when a page genuinely must render untrusted markup, sanitize it with <a href="https://github.com/cure53/DOMPurify">DOMPurify</a> before it reaches <code>dangerouslySetInnerHTML</code>. Event handlers and scripts are stripped; benign tags survive. Note for SAST ground truth: the raw sink is still present — it is safe by construction (sanitizer directly upstream), which many tools report differently from the unsanitized sink.</p>
    <form method="GET">
      <label>Payload<textarea name="payload" rows={4} value={draft} autoComplete="off" onChange={(e) => setDraft(e.target.value)} /></label>
      <div className="actions"><button>Render payload</button><button type="button" onClick={() => setDraft(sample)}>Load XSS sample</button><button type="button" onClick={() => setDraft('<b>bold</b> and <i>italic</i> markup')}>Load benign markup</button></div>
    </form>
    <h2>Rendered output</h2>
    {/* XSS-001 library control: DOMPurify.sanitize() applied before raw rendering. */}
    <div id="xss-output" className="xss-output" dangerouslySetInnerHTML={{ __html: clean }} />
    <p>Text comparison: <Link href="/xss/safe/reflected">plain React text rendering</Link> needs no sanitizer at all.</p>
  </LabLayout>;
}
export function getServerSideProps({ query }) {
  const payload = typeof query.payload === 'string' && query.payload.length <= 2000 ? query.payload : 'Hello lab';
  return { props: { payload, clean: DOMPurify.sanitize(payload) } };
}
