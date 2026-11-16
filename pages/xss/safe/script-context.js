import Link from 'next/link';
import LabLayout from '../../../components/LabLayout';
// Safe control for XSS-003: escape "<" (and line separators) so the JSON can
// never terminate the host <script> element. This is the standard fix for
// embedding server data in an inline script context.
function jsonForScriptEmbedding(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, '\\u2028');
}
export default function ScriptContextSafe({ data }) {
  return <LabLayout title="Safe control · JSON escaped for script embedding">
    <p>Safe comparison for <Link href="/xss/unsafe/script-context">XSS-003</Link>: identical data, identical inline script, but the JSON is escaped with <code>\u003c</code> before embedding. The HTML parser can no longer find <code>&lt;/script&gt;</code> inside the payload, so it stays a JavaScript string.</p>
    <form method="GET">
      <label>data<input name="data" defaultValue={data} autoComplete="off" /></label>
      <div className="actions"><button>Reload with data</button></div>
    </form>
    <h2>Embedded server data</h2>
    <script dangerouslySetInnerHTML={{ __html: `window.__labData = ${jsonForScriptEmbedding({ data })};` }} />
    <p><code>window.__labData.data</code> contains the payload verbatim; <code>window.__zazzlesXss</code> stays undefined. Try the breakout sample from the unsafe page in the URL here.</p>
  </LabLayout>;
}
export function getServerSideProps({ query }) {
  const data = typeof query.data === 'string' && query.data.length <= 2000 ? query.data : 'Hello lab';
  return { props: { data } };
}
