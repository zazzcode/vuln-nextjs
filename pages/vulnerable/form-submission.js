import { useState } from 'react';
import Link from 'next/link';

export default function VulnerableFormPage({ submittedData }) {
  const [formData, setFormData] = useState({ name: '', message: '' });
  const [result, setResult] = useState(submittedData || null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Submit form data
    const response = await fetch('/api/vulnerable-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    setResult(data);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Link href="/">← Back to Home</Link>

      <h1 style={{ color: '#ff3333' }}>Vulnerable: Form Submission RCE</h1>

      <div style={{ background: '#ff3333', color: '#000', padding: '1rem', margin: '1rem 0', borderRadius: '5px' }}>
        ⚠️ VULNERABILITY: This form processes user input without validation!
      </div>

      <h2>How it works:</h2>
      <p>This form submits data to an API endpoint that uses eval() to process the input.</p>

      <h3>Vulnerable Form:</h3>
      <form onSubmit={handleSubmit} style={{ background: '#1a1a1a', padding: '2rem', borderRadius: '5px', margin: '2rem 0' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Name:</label><br />
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', background: '#0a0a0a', color: '#e0e0e0', border: '1px solid #333' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Message:</label><br />
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={4}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', background: '#0a0a0a', color: '#e0e0e0', border: '1px solid #333' }}
          />
        </div>
        <button type="submit" style={{ padding: '0.75rem 2rem', background: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Submit
        </button>
      </form>

      {result && (
        <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px' }}>
          <h3>Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <h3>Malicious Payloads to Test:</h3>
      <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px', margin: '1rem 0' }}>
        <p><strong>In the Message field, try:</strong></p>
        <ul>
          <li style={{ marginBottom: '0.5rem' }}>
            <code>'); require('child_process').exec('ls -la', (e,o) =&gt; console.log(o)); //</code>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <code>'); require('fs').readFileSync('/etc/passwd', 'utf8'); //</code>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <code>'); global.malicious = 'pwned'; //</code>
          </li>
        </ul>
      </div>

      <h3>Vulnerable API Code:</h3>
      <pre>{`// API endpoint: /api/vulnerable-submit
export default function handler(req, res) {
  const { name, message } = req.body;

  // DANGEROUS: Using eval with user input
  const result = eval(\`({
    name: '\${name}',
    message: '\${message}',
    timestamp: Date.now()
  })\`);

  res.status(200).json(result);
}`}</pre>
    </div>
  );
}

export async function getServerSideProps({ query }) {
  return {
    props: {
      submittedData: null
    }
  };
}
