import Link from 'next/link';

export default function SecurePage({ userInput, sanitizedInput, rawQuery }) {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Link href="/">← Back to Home</Link>

      <h1 style={{ color: '#00ff00' }}>✅ Secure: Sanitized Input Handling</h1>

      <div style={{ background: '#00ff00', color: '#000', padding: '1rem', margin: '1rem 0', borderRadius: '5px' }}>
        ✅ SECURE: This page properly sanitizes and validates user input!
      </div>

      <h2>How it's secured:</h2>
      <p>This page demonstrates multiple layers of defense:</p>
      <ul>
        <li>Input validation with regex patterns</li>
        <li>Content sanitization</li>
        <li>No use of eval() or dangerous functions</li>
        <li>Length limits</li>
        <li>Type checking</li>
      </ul>

      <h3>Original Input (from query):</h3>
      <div style={{ background: '#1a1a1a', padding: '1rem', margin: '1rem 0', borderRadius: '5px' }}>
        <code>{rawQuery}</code>
      </div>

      <h3>Sanitized Output:</h3>
      <div style={{ background: '#1a1a1a', padding: '1rem', margin: '1rem 0', borderRadius: '5px', minHeight: '50px' }}>
        {sanitizedInput}
      </div>

      <h3>Secure Code Implementation:</h3>
      <pre>{`export async function getServerSideProps({ query }) {
  const userInput = query.input || 'Hello World';

  // Step 1: Type validation
  if (typeof userInput !== 'string') {
    return {
      props: {
        userInput: '',
        sanitizedInput: 'Invalid input type',
        rawQuery: 'Type validation failed'
      }
    };
  }

  // Step 2: Length validation
  if (userInput.length > 200) {
    return {
      props: {
        userInput: '',
        sanitizedInput: 'Input too long',
        rawQuery: userInput.substring(0, 50) + '...'
      }
    };
  }

  // Step 3: Sanitization - only allow safe characters
  const sanitizedInput = userInput.replace(/[^a-zA-Z0-9\\s\\-_.]/g, '');

  // Step 4: Additional validation
  const dangerousPatterns = [
    /eval\\(/i,
    /require\\(/i,
    /child_process/i,
    /exec\\(/i,
    /<script/i,
    /javascript:/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(userInput)) {
      return {
        props: {
          userInput: '',
          sanitizedInput: 'Blocked: Dangerous pattern detected',
          rawQuery: 'Security check failed'
        }
      };
    }
  }

  return {
    props: {
      userInput,
      sanitizedInput,
      rawQuery: userInput
    }
  };
}`}</pre>

      <h3>Test it out:</h3>
      <p>Try these URLs and see how they're handled safely:</p>
      <ul style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px' }}>
        <li style={{ marginBottom: '0.5rem' }}>
          <strong>Normal input:</strong><br />
          <code>/secure/sanitized-input?input=Hello World</code>
        </li>
        <li style={{ marginBottom: '0.5rem' }}>
          <strong>Malicious payload (blocked):</strong><br />
          <code>/secure/sanitized-input?input='); alert('XSS'); //</code>
        </li>
        <li style={{ marginBottom: '0.5rem' }}>
          <strong>Command injection attempt (blocked):</strong><br />
          <code>/secure/sanitized-input?input='); require('child_process'); //</code>
        </li>
      </ul>

      <h3>Security Features:</h3>
      <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px', margin: '1rem 0' }}>
        <ul>
          <li>✅ Type validation</li>
          <li>✅ Length limits</li>
          <li>✅ Character whitelist (only alphanumeric + basic punctuation)</li>
          <li>✅ Pattern blocking (dangerous keywords)</li>
          <li>✅ No eval() or exec()</li>
          <li>✅ No dynamic code execution</li>
          <li>✅ Server-side validation</li>
        </ul>
      </div>
    </div>
  );
}

export async function getServerSideProps({ query }) {
  const userInput = query.input || 'Hello World';

  // Step 1: Type validation
  if (typeof userInput !== 'string') {
    return {
      props: {
        userInput: '',
        sanitizedInput: 'Invalid input type',
        rawQuery: 'Type validation failed'
      }
    };
  }

  // Step 2: Length validation
  if (userInput.length > 200) {
    return {
      props: {
        userInput: '',
        sanitizedInput: 'Input too long',
        rawQuery: userInput.substring(0, 50) + '...'
      }
    };
  }

  // Step 3: Sanitization - only allow safe characters
  const sanitizedInput = userInput.replace(/[^a-zA-Z0-9\s\-_.]/g, '');

  // Step 4: Additional validation - check for dangerous patterns
  const dangerousPatterns = [
    /eval\(/i,
    /require\(/i,
    /child_process/i,
    /exec\(/i,
    /<script/i,
    /javascript:/i,
    /\$\{/,  // Template literals
    /process\./i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(userInput)) {
      return {
        props: {
          userInput: '',
          sanitizedInput: 'Blocked: Dangerous pattern detected',
          rawQuery: 'Security check failed'
        }
      };
    }
  }

  return {
    props: {
      userInput,
      sanitizedInput,
      rawQuery: userInput
    }
  };
}
