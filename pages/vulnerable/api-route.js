import { useState } from 'react';
import Link from 'next/link';

export default function VulnerableAPIPage() {
  const [command, setCommand] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const executeCommand = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vulnerable-exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Link href="/">← Back to Home</Link>

      <h1 style={{ color: '#ff3333' }}>Vulnerable: API Route Exploitation</h1>

      <div style={{ background: '#ff3333', color: '#000', padding: '1rem', margin: '1rem 0', borderRadius: '5px' }}>
        ⚠️ VULNERABILITY: This API route executes arbitrary system commands!
      </div>

      <h2>How it works:</h2>
      <p>This page calls an API endpoint (<code>/api/vulnerable-exec</code>) that uses <code>child_process.exec()</code> with user input.</p>

      <h3>Command Executor:</h3>
      <div style={{ background: '#1a1a1a', padding: '2rem', borderRadius: '5px', margin: '2rem 0' }}>
        <label>Enter Command:</label><br />
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="e.g., whoami"
          style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', marginBottom: '1rem', background: '#0a0a0a', color: '#e0e0e0', border: '1px solid #333', fontSize: '1rem' }}
        />
        <button
          onClick={executeCommand}
          disabled={loading}
          style={{ padding: '0.75rem 2rem', background: loading ? '#666' : '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Executing...' : 'Execute Command'}
        </button>
      </div>

      {result && (
        <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px', marginBottom: '2rem' }}>
          <h3>Result:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <h3>Dangerous Commands to Test:</h3>
      <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px', margin: '1rem 0' }}>
        <p><strong>⚠️ Be careful - these run real system commands!</strong></p>
        <ul>
          <li><code>whoami</code> - Show current user</li>
          <li><code>pwd</code> - Show current directory</li>
          <li><code>ls -la</code> - List files</li>
          <li><code>cat /etc/passwd</code> - Read password file (Linux)</li>
          <li><code>env</code> - Show environment variables</li>
          <li><code>ps aux</code> - Show running processes</li>
          <li><code>id</code> - Show user ID and groups</li>
        </ul>
        <p style={{ color: '#ff3333', marginTop: '1rem' }}>
          <strong>Command Injection Examples:</strong>
        </p>
        <ul>
          <li><code>whoami; cat /etc/passwd</code> - Chain commands</li>
          <li><code>whoami &amp;&amp; ls -la</code> - Execute multiple commands</li>
          <li><code>whoami | base64</code> - Pipe output</li>
        </ul>
      </div>

      <h3>Vulnerable API Code:</h3>
      <pre>{`// API endpoint: /api/vulnerable-exec
import { exec } from 'child_process';

export default function handler(req, res) {
  const { command } = req.body;

  // EXTREMELY DANGEROUS: Executing user input directly!
  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({
        error: error.message,
        stderr: stderr
      });
    }

    res.status(200).json({
      output: stdout,
      stderr: stderr
    });
  });
}`}</pre>
    </div>
  );
}
