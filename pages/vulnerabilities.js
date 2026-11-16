import Link from 'next/link';
import LabLayout from '../components/LabLayout';
import catalog from '../lib/catalog.json';
export default function VulnerabilityIndex() {
  return <LabLayout title="Scenario index"><p>Active scenarios are intended findings. Demonstrations explain concepts without implementing an exploitable sink. Safe controls are negative cases for the named flaw.</p>
    <div className="table-scroll"><table><thead><tr><th>ID</th><th>Scenario</th><th>Status / scanner</th><th>Source</th></tr></thead><tbody>{catalog.map((entry) => <tr key={entry.id}><td>{entry.id}</td><td><Link href={entry.route}>{entry.title}</Link><p>{entry.cwe} · {entry.runtime}</p></td><td>{entry.status} / {entry.scanner}</td><td><code>{entry.source}</code>{entry.safeControl && <p>Safe: <code>{entry.safeControl}</code></p>}{entry.safeControls?.length > 0 && <p>Also: {entry.safeControls.map((file) => <code key={file}>{file}</code>)}</p>}</td></tr>)}</tbody></table></div>
  </LabLayout>;
}
