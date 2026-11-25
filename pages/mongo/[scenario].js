import { useState } from 'react';
import Link from 'next/link';
import LabLayout from '../../components/LabLayout';
import cases from '../../lib/mongo-cases.json';
function Console({ endpoint, method, input }) {
  const [text, setText] = useState(method === 'GET' ? input : JSON.stringify(input, null, 2));
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    try {
      const response = method === 'GET' ? await fetch(`${endpoint}?${text}`)
        : await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(JSON.parse(text)) });
      setResult({ status: response.status, body: await response.json() });
    } catch (error) { setResult({ error: error.message }); }
    finally { setBusy(false); }
  }
  return <><h2><code>{method} {endpoint}</code></h2><form onSubmit={submit}><label>{method === 'GET' ? 'Query string' : 'JSON request body'}<textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} /></label><button disabled={busy}>{busy ? 'Sending…' : 'Send request'}</button></form>{result && <pre aria-live="polite">{JSON.stringify(result, null, 2)}</pre>}</>;
}
export default function MongoLab({ scenario }) {
  const { method, endpoints, input } = cases[scenario];
  return <LabLayout title={scenario.toUpperCase()}>
    <nav className="tabs">{Object.keys(cases).map((key) => <Link key={key} href={`/mongo/${key}`}>{key.slice(-3)}</Link>)}</nav>
    <p>Send the same input to every route and compare the responses. The answers and the reasons are in <code>docs/vulnerabilities/mongodb.md</code>.</p>
    {endpoints.map((endpoint) => <Console key={endpoint} endpoint={endpoint} method={method} input={input} />)}
  </LabLayout>;
}
export function getServerSideProps({ params }) {
  if (!Object.hasOwn(cases, params.scenario)) return { notFound: true };
  return { props: { scenario: params.scenario } };
}
