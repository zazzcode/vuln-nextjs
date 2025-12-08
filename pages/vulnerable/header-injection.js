import Link from 'next/link';

export default function HeaderInjectionPage({ userAgent, customHeader, headers }) {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Link href="/">← Back to Home</Link>

      <h1 style={{ color: '#ff3333' }}>Vulnerable: Header Injection Attack</h1>

      <div style={{ background: '#ff3333', color: '#000', padding: '1rem', margin: '1rem 0', borderRadius: '5px' }}>
        ⚠️ VULNERABILITY: This page processes HTTP headers without validation!
      </div>

      <h2>How it works:</h2>
      <p>This page reads HTTP headers and uses them in server-side code without sanitization.</p>

      <h3>Detected Headers:</h3>
      <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px', margin: '1rem 0' }}>
        <p><strong>User-Agent:</strong></p>
        <code>{userAgent}</code>

        <p style={{ marginTop: '1rem' }}><strong>X-Custom-Header:</strong></p>
        <code>{customHeader || 'Not provided'}</code>

        <p style={{ marginTop: '1rem' }}><strong>All Headers:</strong></p>
        <pre style={{ fontSize: '0.85rem', maxHeight: '300px', overflow: 'auto' }}>
          {JSON.stringify(headers, null, 2)}
        </pre>
      </div>

      <h3>Test with curl:</h3>
      <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px', margin: '1rem 0' }}>
        <p><strong>Basic Header Injection:</strong></p>
        <pre style={{ fontSize: '0.9rem' }}>
{`curl -H "X-Custom-Header: normal value" \\
  http://localhost:3000/vulnerable/header-injection`}
        </pre>

        <p style={{ marginTop: '1rem' }}><strong>Malicious User-Agent:</strong></p>
        <pre style={{ fontSize: '0.9rem' }}>
{`curl -H "User-Agent: '); require('child_process').exec('whoami'); //" \\
  http://localhost:3000/vulnerable/header-injection`}
        </pre>

        <p style={{ marginTop: '1rem' }}><strong>Command Injection via Custom Header:</strong></p>
        <pre style={{ fontSize: '0.9rem' }}>
{`curl -H "X-Custom-Header: \$(whoami)" \\
  http://localhost:3000/vulnerable/header-injection`}
        </pre>

        <p style={{ marginTop: '1rem' }}><strong>CRLF Injection:</strong></p>
        <pre style={{ fontSize: '0.9rem' }}>
{`curl -H "X-Custom-Header: value\\r\\nX-Injected: malicious" \\
  http://localhost:3000/vulnerable/header-injection`}
        </pre>
      </div>

      <h3>Vulnerable Code:</h3>
      <pre>{`export async function getServerSideProps({ req }) {
  const headers = req.headers;

  // Vulnerable: Using headers without sanitization
  const userAgent = headers['user-agent'];
  const customHeader = headers['x-custom-header'];

  // In a real attack, these might be used in eval() or exec()
  // eval(\`processRequest('\${userAgent}')\`); // DANGEROUS!

  return {
    props: {
      userAgent,
      customHeader,
      headers
    }
  };
}`}</pre>

      <h3>Attack Vector:</h3>
      <p>
        HTTP headers can be controlled by the attacker. If headers are used in:
      </p>
      <ul>
        <li><code>eval()</code> - Code execution</li>
        <li><code>exec()</code> - System command execution</li>
        <li>SQL queries - SQL injection</li>
        <li>Response headers - Header injection</li>
      </ul>
    </div>
  );
}

export async function getServerSideProps({ req }) {
  const headers = req.headers;

  // Vulnerable: Using headers without sanitization
  const userAgent = headers['user-agent'] || 'Unknown';
  const customHeader = headers['x-custom-header'];

  // This is where exploitation could occur if headers are used unsafely
  // For example: eval(`logRequest('${userAgent}')`); would be extremely dangerous

  return {
    props: {
      userAgent,
      customHeader: customHeader || null,
      headers: Object.fromEntries(
        Object.entries(headers).map(([key, value]) => [
          key,
          typeof value === 'string' ? value : JSON.stringify(value)
        ])
      )
    }
  };
}
