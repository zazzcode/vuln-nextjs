import { useState } from 'react';
import Link from 'next/link';

export default function ProtectedAPIPage() {
  const [command, setCommand] = useState('');
  const [result, setResult] = useState(null);

  const submitRequest = async () => {
    try {
      const response = await fetch('/api/protected-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'API Test',
          message: command
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Link href="/">← Back to Home</Link>

      <h1 style={{ color: '#00ff00' }}>✅ Secure: Protected API Route</h1>

      <div style={{ background: '#00ff00', color: '#000', padding: '1rem', margin: '1rem 0', borderRadius: '5px' }}>
        ✅ SECURE: This API endpoint has proper validation and sanitization!
      </div>

      <h2>Security Implementation:</h2>
      <ul>
        <li>Type checking for all inputs</li>
        <li>Character whitelist validation</li>
        <li>Length limits enforced</li>
        <li>No eval(), no exec(), no dynamic code execution</li>
        <li>Proper error handling</li>
        <li>HTTP method validation</li>
      </ul>

      <h3>Test the Protected API:</h3>
      <div style={{ background: '#1a1a1a', padding: '2rem', borderRadius: '5px', margin: '2rem 0' }}>
        <label>Enter Message:</label><br />
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Try entering malicious payloads..."
          style={{
            width: '100%',
            padding: '0.75rem',
            marginTop: '0.5rem',
            marginBottom: '1rem',
            background: '#0a0a0a',
            color: '#e0e0e0',
            border: '1px solid #333',
            fontSize: '1rem'
          }}
        />
        <button
          onClick={submitRequest}
          style={{
            padding: '0.75rem 2rem',
            background: '#00aa00',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Submit to Protected API
        </button>
      </div>

      {result && (
        <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px', marginBottom: '2rem' }}>
          <h3>API Response:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <h3>Secure API Implementation:</h3>
      <pre>{`// pages/api/protected-example.js
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, message } = req.body;

  // Validate inputs
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid name' });
  }

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message' });
  }

  // Sanitize inputs - only allow alphanumeric and basic punctuation
  const sanitizedName = name.replace(/[^a-zA-Z0-9\\s\\-_.]/g, '');
  const sanitizedMessage = message.replace(/[^a-zA-Z0-9\\s\\-_.!?,]/g, '');

  // Validate length
  if (sanitizedName.length > 100) {
    return res.status(400).json({ error: 'Name too long' });
  }

  if (sanitizedMessage.length > 1000) {
    return res.status(400).json({ error: 'Message too long' });
  }

  // Safe processing - no eval, no exec
  const result = {
    name: sanitizedName,
    message: sanitizedMessage,
    timestamp: Date.now(),
    processedBy: 'protected API'
  };

  res.status(200).json(result);
}`}</pre>

      <h3>Try these malicious payloads:</h3>
      <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px' }}>
        <p>All of these will be sanitized or rejected:</p>
        <ul>
          <li><code>'); require('child_process').exec('whoami'); //</code></li>
          <li><code>&lt;script&gt;alert('XSS')&lt;/script&gt;</code></li>
          <li><code>$(whoami)</code></li>
          <li><code>' OR '1'='1</code></li>
          <li><code>../../../etc/passwd</code></li>
        </ul>
      </div>
    </div>
  );
}
