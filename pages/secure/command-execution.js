import Link from 'next/link';
import LabLayout from '../../components/LabLayout';
import ApiConsole from '../../components/ApiConsole';
export default function Scenario() {
  return <LabLayout title="Safe control · Shell-free command execution">
    <p>The safe control for <Link href="/vulnerable/api-route">OS-001</Link> runs a fixed executable (<code>/bin/echo</code>) through <code>execFile</code> with an argument vector and <code>shell: false</code>. The text you send becomes one argument; shell metacharacters are echoed back as data.</p>
    <p>Endpoint: <code>/api/secure/command</code></p>
    <ApiConsole endpoint="/api/secure/command" initialBody={{ text: 'hello; rm -rf / && echo pwned | wc -c' }} />
    <p>The response contains the literal string you sent — proof the metacharacters never reached a shell.</p>
  </LabLayout>;
}
