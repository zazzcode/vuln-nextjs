import LabLayout from '../../components/LabLayout';
import ApiConsole from '../../components/ApiConsole';
export default function Scenario() {
  return <LabLayout title="FS-001 \u00b7 Arbitrary file read"><p>The API reads a caller-controlled path without restricting it to a fixture directory. This example reads the lab package metadata.</p><p>Endpoint: <code>/api/vulnerable-file-read</code></p><ApiConsole endpoint="/api/vulnerable-file-read" initialBody={{"filePath": "./package.json"}} /></LabLayout>;
}
