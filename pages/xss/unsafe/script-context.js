import Link from 'next/link';
import LabLayout from '../../../components/LabLayout';
// No double quotes: JSON.stringify would escape them to \" and corrupt the
// handler after the HTML breakout. Single-quoted attribute + backtick string
// survive JSON escaping intact.
const sample = `</script><img src=x onerror='window.__zazzlesXss=\`script-marker\`'>`;
export default function ScriptContextUnsafe({ data }) {
  return <LabLayout title="XSS-003 · Script-context injection (SSR)">
    <p>Server-side rendering embeds this page's <code>data</code> prop into an inline <code>&lt;script&gt;</code> using <code>JSON.stringify</code>. JSON escaping handles quotes but not the HTML parser: the string <code>&lt;/script&gt;</code> terminates the script element no matter where it appears in the JSON, and everything after it is parsed as page markup.</p>
    <form method="GET">
      <label>data<input name="data" defaultValue={data} autoComplete="off" /></label>
      <div className="actions"><button>Reload with data</button><button type="button" onClick={() => { window.location.search = `?data=${encodeURIComponent(sample)}`; }}>Load breakout sample</button></div>
    </form>
    <h2>Embedded server data</h2>
    {/* XSS-003 / CWE-79: JSON embedded in a script context without escaping "</" for HTML. */}
    <script dangerouslySetInnerHTML={{ __html: `window.__labData = ${JSON.stringify({ data })};` }} />
    <p>Open the browser console and inspect <code>window.__labData</code> — then load the breakout sample and check <code>window.__zazzlesXss</code>.</p>
    <p>Safe comparison: <Link href="/xss/safe/script-context">the same JSON escaped for script embedding</Link>.</p>
  </LabLayout>;
}
export function getServerSideProps({ query }) {
  const data = typeof query.data === 'string' && query.data.length <= 2000 ? query.data : 'Hello lab';
  return { props: { data } };
}
