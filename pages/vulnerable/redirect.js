import Link from 'next/link';
import LabLayout from '../../components/LabLayout';
export default function RedirectUnsafe({ to }) {
  return <LabLayout title="REDIR-001 · Open redirect (SSR)">
    <p>This page redirects during server-side rendering to whatever <code>to</code> says — including absolute URLs on other origins. Open redirects lend credibility to phishing links (the victim sees your trusted host first) and can leak tokens in URLs.</p>
    <form method="GET">
      <label>to<input name="to" defaultValue={to} autoComplete="off" /></label>
      <div className="actions"><button>Redirect</button></div>
    </form>
    <p>Relative demo: <code>?to=/sql/login</code> · absolute demo: <code>?to=https://example.org/</code> (watch the <code>Location</code> header — no request to the target is made by this test).</p>
    <p>Safe comparison: <Link href="/secure/redirect">relative-path-only redirects</Link>.</p>
  </LabLayout>;
}
export function getServerSideProps({ query }) {
  // REDIR-001 / CWE-601: destination taken verbatim from the query string,
  // including absolute and protocol-relative URLs on other origins.
  const to = typeof query.to === 'string' && query.to.length <= 2000 ? query.to : '/sql/login';
  return { redirect: { destination: to, permanent: false } };
}
