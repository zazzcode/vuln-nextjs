import LabLayout from '../../components/LabLayout';
import ApiConsole from '../../components/ApiConsole';
export default function Scenario() {
  return <LabLayout title="OS-001 \u00b7 Shell command execution"><p>The API sends command directly to a shell. This example prints a harmless marker. Commands execute with the server process permissions.</p><p>Endpoint: <code>/api/vulnerable-exec</code></p><ApiConsole endpoint="/api/vulnerable-exec" initialBody={{"command": "printf zazzles-command-marker"}} /></LabLayout>;
}
