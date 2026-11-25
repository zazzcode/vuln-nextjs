import Link from 'next/link';
import LabLayout from '../components/LabLayout';
import catalog from '../lib/catalog.json';
export default function Home() {
  return <LabLayout title="A growing testbed for SAST and SCA">
    <p>Repeatable Next.js security scenarios with intentional flaws, safe comparisons, and documented expected findings.</p>
    <div className="cards">{catalog.filter((entry) => entry.status === 'active').map((entry) => <article key={entry.id}><span className="badge">{entry.id} · {entry.scanner}</span><h2><Link href={entry.route}>{entry.title}</Link></h2><p>{entry.flow}</p></article>)}</div>
    <h2>Explore the lab</h2><ul><li><Link href="/vulnerabilities">Complete scenario index and source locations</Link></li><li><Link href="/sql/login">SQL injection lab with safe comparisons</Link></li><li><Link href="/mongo/mongo-001">MongoDB lab</Link></li><li><Link href="/workshop/mongo-028">Workshop routes · second MongoDB batch</Link></li><li><Link href="/xss/unsafe/reflected">XSS lab with safe comparisons</Link></li><li><Link href="/secure/command-execution">Safe control · shell-free command execution</Link></li><li><Link href="/secure/file-access">Safe control · allowlisted file read</Link></li><li><Link href="/secure/sanitized-input">Safe input handling</Link></li><li><Link href="/secure/validated-form">Validated form</Link></li><li><Link href="/secure/protected-api">Safe API processing</Link></li><li><Link href="/secure/csp-enabled">Page-specific CSP example</Link></li></ul>
    <p>Documentation starts at <code>docs/README.md</code>. Scenario metadata lives in <code>lib/catalog.json</code>.</p>
  </LabLayout>;
}
