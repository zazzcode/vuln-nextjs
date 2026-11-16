import Link from 'next/link';
import LabLayout from '../../components/LabLayout';
import ApiConsole from '../../components/ApiConsole';
export default function Scenario() {
  return <LabLayout title="Safe control · Allowlisted file read">
    <p>The safe control for <Link href="/vulnerable/file-read">FS-001</Link> accepts an exact filename from a fixed allowlist (<code>package.json</code>, <code>README.md</code>) and resolves it against the project root. Anything else — traversal sequences, absolute paths, partial matches — is rejected with 403 before any filesystem call.</p>
    <p>Endpoint: <code>/api/secure/file-read</code></p>
    <ApiConsole endpoint="/api/secure/file-read" initialBody={{ file: '../../../etc/passwd' }} />
    <p>Try <code>package.json</code> for the allowed case, then traversal or absolute paths to see the rejection.</p>
  </LabLayout>;
}
