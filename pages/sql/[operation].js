import { useState } from 'react';
import Link from 'next/link';
import LabLayout from '../../components/LabLayout';
const examples = {
  login: { id: 'SQL-001', title: 'Login bypass', defaults: { username: 'alice', password: 'alice-lab-only' }, payload: { username: "admin' --", password: 'wrong-password' } },
  products: { id: 'SQL-002', title: 'Product search', defaults: { q: 'mug' }, payload: { q: "' OR true --" } },
  notes: { id: 'SQL-003', title: 'Note creation', defaults: { body: 'A new lab note' }, payload: { body: "lab', 'public'); UPDATE products SET public = true; --" } },
};
export default function SqlLab({ operation }) {
  const example = examples[operation];
  const [mode, setMode] = useState('unsafe');
  const [values, setValues] = useState(example.defaults);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  async function request(event) {
    event.preventDefault(); setBusy(true);
    try {
      const url = `/api/sql/${mode}/${operation}`;
      const response = await fetch(operation === 'products' ? `${url}?${new URLSearchParams(values)}` : url,
        operation === 'products' ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      setResult({ status: response.status, body: await response.json() });
    } catch (error) { setResult({ error: error.message }); }
    finally { setBusy(false); }
  }
  async function reset() {
    setBusy(true);
    try {
      const response = await fetch('/api/lab/reset', { method: 'POST' });
      setResult({ status: response.status, body: await response.json() });
    } catch (error) { setResult({ error: error.message }); }
    finally { setBusy(false); }
  }
  return <LabLayout title={`${example.id} · ${example.title}`}>
    <nav className="tabs">{Object.keys(examples).map((key) => <Link key={key} href={`/sql/${key}`}>{examples[key].title}</Link>)}</nav>
    <p>Compare the same input against unsafe SQL interpolation and safe parameterized queries. Data is synthetic and held in server memory.</p>
    {operation === 'login' && <p>This checks a demo identity; it creates no session. Credentials: alice / alice-lab-only or admin / admin-lab-only.</p>}
    {operation === 'products' && <p>Two public products should be visible. The unsafe payload also reveals Internal prototype.</p>}
    {operation === 'notes' && <p>The unsafe sample makes the private product public through a second SQL statement. Check product search afterward, then reset the database.</p>}
    <form onSubmit={request}><label>Query mode<select value={mode} onChange={(e) => setMode(e.target.value)}><option value="unsafe">Unsafe · intentional SQL injection</option><option value="safe">Safe · parameterized SQL</option></select></label>
      {Object.entries(values).map(([key, value]) => <label key={key}>{key}<input value={value} autoComplete="off" onChange={(e) => setValues({ ...values, [key]: e.target.value })} /></label>)}
      <div className="actions"><button disabled={busy}>Run {mode} example</button><button type="button" onClick={() => setValues(example.payload)}>Load injection example</button><button type="button" onClick={() => setValues(example.defaults)}>Normal input</button><button type="button" disabled={busy} onClick={reset}>Reset SQL data</button></div>
    </form><p>Endpoint: <code>/api/sql/{mode}/{operation}</code></p>{result && <pre aria-live="polite">{JSON.stringify(result, null, 2)}</pre>}
  </LabLayout>;
}
export function getServerSideProps({ params }) {
  if (!Object.hasOwn(examples, params.operation)) return { notFound: true };
  return { props: { operation: params.operation } };
}
