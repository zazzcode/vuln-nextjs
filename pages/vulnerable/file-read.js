import Link from 'next/link';
import LabLayout from '../../components/LabLayout';
import ApiConsole from '../../components/ApiConsole';
export default function Scenario() {
  return <LabLayout title="FS-001 · Arbitrary file read"><p>The API reads a caller-controlled path without restricting it to a fixture directory. This example reads the lab package metadata.</p><p>Endpoint: <code>/api/vulnerable-file-read</code></p><ApiConsole endpoint="/api/vulnerable-file-read" initialBody={{"filePath": "./package.json"}} /><p>Safe comparison: <Link href="/secure/file-access">exact-string allowlist of published files</Link>.</p></LabLayout>;
}
