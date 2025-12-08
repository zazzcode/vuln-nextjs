import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DynamicImportPage({ moduleName }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (moduleName) {
      // Vulnerable: Dynamic import with user-controlled input
      import(`../../components/${moduleName}`)
        .then(module => {
          setResult(`Module loaded: ${moduleName}`);
          if (module.default) {
            setResult(module.default.toString());
          }
        })
        .catch(err => {
          setError(err.message);
        });
    }
  }, [moduleName]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Link href="/">← Back to Home</Link>

      <h1 style={{ color: '#ff3333' }}>Vulnerable: Dynamic Import Vulnerability</h1>

      <div style={{ background: '#ff3333', color: '#000', padding: '1rem', margin: '1rem 0', borderRadius: '5px' }}>
        ⚠️ VULNERABILITY: This page dynamically imports modules based on user input!
      </div>

      <h2>How it works:</h2>
      <p>This page uses the <code>module</code> query parameter to dynamically import files.</p>

      <h3>Current Module Request:</h3>
      <div style={{ background: '#1a1a1a', padding: '1rem', borderRadius: '5px' }}>
        <code>{moduleName || 'No module specified'}</code>
      </div>

      {result && (
        <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px', margin: '1rem 0' }}>
          <h3>Result:</h3>
          <pre>{result}</pre>
        </div>
      )}

      {error && (
        <div style={{ background: '#ff3333', color: '#000', padding: '1rem', borderRadius: '5px', margin: '1rem 0' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <h3>Malicious Payloads:</h3>
      <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px', margin: '1rem 0' }}>
        <p><strong>Path Traversal Attacks:</strong></p>
        <ul>
          <li style={{ marginBottom: '0.5rem' }}>
            <code>/vulnerable/dynamic-import?module=../../../package.json</code>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <code>/vulnerable/dynamic-import?module=../../pages/api/vulnerable-exec</code>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <code>/vulnerable/dynamic-import?module=../../../.env</code>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <code>/vulnerable/dynamic-import?module=../../../../etc/passwd</code>
          </li>
        </ul>

        <p style={{ marginTop: '1rem' }}><strong>Module Injection:</strong></p>
        <ul>
          <li style={{ marginBottom: '0.5rem' }}>
            <code>/vulnerable/dynamic-import?module=child_process</code>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <code>/vulnerable/dynamic-import?module=fs</code>
          </li>
        </ul>
      </div>

      <h3>Vulnerable Code:</h3>
      <pre>{`useEffect(() => {
  if (moduleName) {
    // DANGEROUS: Dynamic import with user input
    import(\`../../components/\${moduleName}\`)
      .then(module => {
        // Use the module
        setResult(\`Module loaded: \${moduleName}\`);
      })
      .catch(err => {
        setError(err.message);
      });
  }
}, [moduleName]);

export async function getServerSideProps({ query }) {
  return {
    props: {
      moduleName: query.module || null
    }
  };
}`}</pre>

      <h3>Attack Vector:</h3>
      <p>
        Dynamic imports with user-controlled paths can lead to:
      </p>
      <ul>
        <li>Path traversal attacks</li>
        <li>Loading arbitrary modules</li>
        <li>Accessing sensitive files</li>
        <li>Remote code execution</li>
      </ul>
    </div>
  );
}

export async function getServerSideProps({ query }) {
  return {
    props: {
      moduleName: query.module || null
    }
  };
}
