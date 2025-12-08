import { useState } from 'react';
import Link from 'next/link';

export default function SecureFormPage() {
  const [formData, setFormData] = useState({ name: '', message: '' });
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    } else if (!/^[a-zA-Z0-9\s\-_.]+$/.test(formData.name)) {
      newErrors.name = 'Name contains invalid characters';
    }

    // Message validation
    if (!formData.message || formData.message.trim() === '') {
      newErrors.message = 'Message is required';
    } else if (formData.message.length > 1000) {
      newErrors.message = 'Message must be less than 1000 characters';
    } else if (!/^[a-zA-Z0-9\s\-_.!?,]+$/.test(formData.message)) {
      newErrors.message = 'Message contains invalid characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      // Submit to secure API endpoint
      const response = await fetch('/api/protected-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setErrors({ submit: data.error || 'Submission failed' });
      }
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Link href="/">← Back to Home</Link>

      <h1 style={{ color: '#00ff00' }}>✅ Secure: Validated Form Processing</h1>

      <div style={{ background: '#00ff00', color: '#000', padding: '1rem', margin: '1rem 0', borderRadius: '5px' }}>
        ✅ SECURE: This form uses comprehensive validation and sanitization!
      </div>

      <h2>Security Features:</h2>
      <ul>
        <li>Client-side validation</li>
        <li>Server-side validation</li>
        <li>Input sanitization</li>
        <li>Type checking</li>
        <li>Length limits</li>
        <li>Character whitelist</li>
        <li>No eval() or exec()</li>
      </ul>

      <h3>Secure Form:</h3>
      <form onSubmit={handleSubmit} style={{ background: '#1a1a1a', padding: '2rem', borderRadius: '5px', margin: '2rem 0' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Name (alphanumeric only):</label><br />
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              marginTop: '0.5rem',
              background: '#0a0a0a',
              color: '#e0e0e0',
              border: errors.name ? '2px solid #ff3333' : '1px solid #333'
            }}
            maxLength={100}
          />
          {errors.name && <div style={{ color: '#ff3333', marginTop: '0.25rem' }}>{errors.name}</div>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Message (alphanumeric and basic punctuation):</label><br />
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={4}
            style={{
              width: '100%',
              padding: '0.5rem',
              marginTop: '0.5rem',
              background: '#0a0a0a',
              color: '#e0e0e0',
              border: errors.message ? '2px solid #ff3333' : '1px solid #333'
            }}
            maxLength={1000}
          />
          {errors.message && <div style={{ color: '#ff3333', marginTop: '0.25rem' }}>{errors.message}</div>}
        </div>

        {errors.submit && (
          <div style={{ background: '#ff3333', color: '#000', padding: '0.75rem', marginBottom: '1rem', borderRadius: '5px' }}>
            {errors.submit}
          </div>
        )}

        <button
          type="submit"
          style={{
            padding: '0.75rem 2rem',
            background: '#00aa00',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Submit Securely
        </button>
      </form>

      {result && (
        <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px' }}>
          <h3>✅ Success - Secure Processing:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <h3>Try malicious inputs:</h3>
      <p>The form will reject these:</p>
      <ul style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px' }}>
        <li>Special characters: <code>&lt;script&gt;alert('XSS')&lt;/script&gt;</code></li>
        <li>Code injection: <code>'); require('child_process'); //</code></li>
        <li>SQL injection: <code>' OR '1'='1</code></li>
        <li>Command substitution: <code>$(whoami)</code></li>
      </ul>

      <h3>Validation Logic:</h3>
      <pre>{`const validateForm = () => {
  const newErrors = {};

  // Name validation
  if (!formData.name || formData.name.trim() === '') {
    newErrors.name = 'Name is required';
  } else if (formData.name.length > 100) {
    newErrors.name = 'Name must be less than 100 characters';
  } else if (!/^[a-zA-Z0-9\\s\\-_.]+$/.test(formData.name)) {
    newErrors.name = 'Name contains invalid characters';
  }

  // Message validation
  if (!formData.message || formData.message.trim() === '') {
    newErrors.message = 'Message is required';
  } else if (formData.message.length > 1000) {
    newErrors.message = 'Message must be less than 1000 characters';
  } else if (!/^[a-zA-Z0-9\\s\\-_.!?,]+$/.test(formData.message)) {
    newErrors.message = 'Message contains invalid characters';
  }

  return Object.keys(newErrors).length === 0;
};`}</pre>
    </div>
  );
}
