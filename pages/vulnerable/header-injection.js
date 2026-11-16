import LabLayout from '../../components/LabLayout';
export default function HeaderReflection({ headers }) {
  return <LabLayout title="DEMO-001 · Request header reflection"><p>This is a demonstration, not a working header injection flaw. Headers are rendered as escaped React text. They are not evaluated, queried, or copied into response headers.</p><p>Returning every request header can disclose request metadata, including cookies and authorization headers. Use only lab credentials.</p><pre>{JSON.stringify(headers, null, 2)}</pre></LabLayout>;
}
export function getServerSideProps({ req, res }) {
  res.setHeader('Cache-Control', 'no-store');
  return { props: { headers: req.headers } };
}
