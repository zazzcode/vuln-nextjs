import Link from 'next/link';
import LabLayout from '../../components/LabLayout';
export default function SsrfSafe({ url, status, contentType, excerpt, error, blocked }) {
  return <LabLayout title="Safe control · Same-origin allowlisted fetching">
    <p>Safe comparison for <Link href="/vulnerable/ssrf">SSRF-001</Link>: the page still fetches during SSR, but the target must resolve to this application's own origin and an allowlisted <code>/api/</code> path. Absolute URLs, other hosts, and scheme tricks are rejected before any request is made.</p>
    <form method="GET">
      <label>fetch target<input name="fetch" defaultValue={url} autoComplete="off" /></label>
      <div className="actions"><button>Fetch through the server</button></div>
    </form>
    <h2>Server-side response</h2>
    {blocked
      ? <p className="xss-output">Blocked by same-origin policy: {blocked}</p>
      : error
        ? <p className="xss-output">Request failed: {error}</p>
        : <pre>{`HTTP ${status} ${contentType}\n\n${excerpt}`}</pre>}
    <p>Allowed: <code>?fetch=/api/sql/safe/products</code>. Rejected: <code>?fetch=http://127.0.0.1:3001/</code>, <code>?fetch=//example.org</code>, or any absolute URL.</p>
  </LabLayout>;
}
export async function getServerSideProps({ req, query }) {
  const target = typeof query.fetch === 'string' && query.fetch.length <= 2000 ? query.fetch : '/api/sql/safe/products';
  try {
    // Resolve against this request's own origin, then enforce host + path prefix.
    const url = new URL(target, `http://${req.headers.host ?? '127.0.0.1:3000'}`);
    if (url.origin !== `http://${req.headers.host}`) return { props: { url: target, blocked: 'target resolves to a different origin' } };
    if (!url.pathname.startsWith('/api/')) return { props: { url: target, blocked: 'only /api/ paths are fetchable' } };
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
    const excerpt = (await response.text()).slice(0, 500);
    return { props: { url: target, status: response.status, contentType: response.headers.get('content-type') ?? '', excerpt } };
  } catch (error) {
    return { props: { url: target, error: error.message } };
  }
}
