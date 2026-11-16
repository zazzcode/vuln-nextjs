import Link from 'next/link';
import LabLayout from '../../components/LabLayout';
export default function SsrfUnsafe({ url, status, contentType, excerpt, error }) {
  return <LabLayout title="SSRF-001 · Server-side request forgery (SSR)">
    <p>During server-side rendering this page fetches whatever absolute URL is in the <code>fetch</code> query parameter and renders the response. The server — with its loopback and internal network position — makes the request, not the visitor's browser.</p>
    <form method="GET">
      <label>fetch URL<input name="fetch" defaultValue={url} autoComplete="off" /></label>
      <div className="actions"><button>Fetch through the server</button></div>
    </form>
    <h2>Server-side response</h2>
    {error
      ? <p className="xss-output">Request failed: {error}</p>
      : <pre>{`HTTP ${status} ${contentType}\n\n${excerpt}`}</pre>}
    <p>Try the page's own internal API — a URL a browser on another network could never reach directly: <code>?fetch=http://127.0.0.1:3000/api/sql/safe/products</code>.</p>
    <p>Safe comparison: <Link href="/secure/ssrf">same-origin allowlisted fetching</Link>.</p>
  </LabLayout>;
}
export async function getServerSideProps({ query }) {
  // SSRF-001 / CWE-918: attacker-controlled absolute URL fetched server-side.
  const url = typeof query.fetch === 'string' && /^https?:\/\//.test(query.fetch) && query.fetch.length <= 2000 ? query.fetch : 'http://127.0.0.1:3000/api/sql/safe/products';
  try {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
    const excerpt = (await response.text()).slice(0, 500);
    return { props: { url, status: response.status, contentType: response.headers.get('content-type') ?? '', excerpt } };
  } catch (error) {
    return { props: { url, error: error.message } };
  }
}
