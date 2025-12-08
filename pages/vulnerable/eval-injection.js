import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function VulnerableEvalPage({ userInput, rawQuery }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // ⚠️ EXTREMELY DANGEROUS: This eval() call is the vulnerability
      // Attacker can inject arbitrary JavaScript code via the 'input' query parameter
      eval(`setContent('${userInput}')`);
    } catch (e) {
      setError(e.message);
    }
  }, [userInput]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Link href="/">← Back to Home</Link>

      <h1 style={{ color: '#ff3333' }}>Vulnerable: Eval Injection via Query Parameters</h1>

      <div style={{ background: '#ff3333', color: '#000', padding: '1rem', margin: '1rem 0', borderRadius: '5px' }}>
        ⚠️ VULNERABILITY: This page uses eval() with unsanitized user input!
      </div>

      <h2>How it works:</h2>
      <p>This page takes the <code>input</code> query parameter and passes it directly to eval().</p>

      <h3>Vulnerable Code:</h3>
      <pre>{`useEffect(() => {
  // Dangerous: eval with user input
  eval(\`setContent('\${userInput}')\`);
}, [userInput]);

export async function getServerSideProps({ query }) {
  return {
    props: {
      userInput: query.input || 'Hello World'
    }
  };
}`}</pre>

      <h3>Current Input:</h3>
      <div style={{ background: '#1a1a1a', padding: '1rem', margin: '1rem 0', borderRadius: '5px' }}>
        <code>{rawQuery}</code>
      </div>

      <h3>Rendered Content:</h3>
      <div style={{ background: '#1a1a1a', padding: '1rem', margin: '1rem 0', borderRadius: '5px', minHeight: '50px' }}>
        {error ? <span style={{ color: '#ff3333' }}>Error: {error}</span> : content}
      </div>

      <h3>Test Payloads:</h3>
      <p>Try these URLs:</p>
      <ul style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px' }}>
        <li style={{ marginBottom: '0.5rem' }}>
          <strong>Basic XSS:</strong><br />
          <code style={{ fontSize: '0.9rem' }}>
            /vulnerable/eval-injection?input='); alert('XSS'); console.log('
          </code>
        </li>
        <li style={{ marginBottom: '0.5rem' }}>
          <strong>Console Access:</strong><br />
          <code style={{ fontSize: '0.9rem' }}>
            /vulnerable/eval-injection?input='); console.log(process.env); console.log('
          </code>
        </li>
        <li style={{ marginBottom: '0.5rem' }}>
          <strong>Module Require (Server-side):</strong><br />
          <code style={{ fontSize: '0.9rem' }}>
            /vulnerable/eval-injection?input='); require('child_process').exec('whoami'); console.log('
          </code>
        </li>
      </ul>

      <h3>Attack Vector:</h3>
      <p>
        An attacker can close the string in eval() and inject arbitrary JavaScript code.
        On the server side (during SSR), this can lead to Remote Code Execution.
      </p>
    </div>
  );
}

export async function getServerSideProps({ query }) {
  // This is where the vulnerability lies - unsanitized query parameters
  return {
    props: {
      userInput: query.input || 'Hello World',
      rawQuery: query.input || 'No input provided'
    }
  };
}
