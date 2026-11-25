import { useState } from 'react';
import Link from 'next/link';
import LabLayout from '../../components/LabLayout';
import cases from '../../lib/workshop-cases.json';

function Console({ endpoint, method, input, headers, cookies }) {
  const [text, setText] = useState(method === 'GET' ? input : JSON.stringify(input, null, 2));
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    try {
      if (cookies) for (const [name, value] of Object.entries(cookies)) document.cookie = `${name}=${encodeURIComponent(value)}; path=/`;
      const response = method === 'GET'
        ? await fetch(`${endpoint}${text ? `?${text}` : ''}`, { headers: headers ?? {} })
        : await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(JSON.parse(text)) });
      setResult({ status: response.status, body: await response.json() });
    } catch (error) { setResult({ error: error.message }); }
    finally { setBusy(false); }
  }
  return <><h2><code>{method} {endpoint}</code></h2>
    {headers && <p className="note">Sent headers: <code>{Object.entries(headers).map(([name, value]) => `${name}: ${value}`).join(' · ')}</code></p>}
    {cookies && <p className="note">Sent cookies: <code>{Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join(' · ')}</code></p>}
    <form onSubmit={submit}><label>{method === 'GET' ? 'Query string' : 'JSON request body'}<textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} /></label><button disabled={busy}>{busy ? 'Sending…' : 'Send request'}</button></form>
    {result && <pre aria-live="polite">{JSON.stringify(result, null, 2)}</pre>}</>;
}

export default function WorkshopLab({ scenario }) {
  const { method, endpoints, input, headers, cookies } = cases[scenario];
  return <LabLayout title={scenario.toUpperCase()}>
    <nav className="tabs">{Object.keys(cases).map((key) => <Link key={key} href={`/workshop/${key}`}>{key.slice(-3)}</Link>)}</nav>
    <p>Send the same input to every route and compare the responses. The answers and the reasons are in <code>docs/vulnerabilities/workshop.md</code>.</p>
    {endpoints.map((endpoint) => <Console key={endpoint} endpoint={endpoint} method={method} input={input} headers={headers} cookies={cookies} />)}
  </LabLayout>;
}

export function getServerSideProps({ params }) {
  if (!Object.hasOwn(cases, params.scenario)) return { notFound: true };
  return { props: { scenario: params.scenario } };
}
