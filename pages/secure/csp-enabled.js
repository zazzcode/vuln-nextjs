import Link from 'next/link';

export default function CSPEnabledPage({ userInput }) {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Link href="/">← Back to Home</Link>

      <h1 style={{ color: '#00ff00' }}>✅ Secure: Content Security Policy Enabled</h1>

      <div style={{ background: '#00ff00', color: '#000', padding: '1rem', margin: '1rem 0', borderRadius: '5px' }}>
        ✅ SECURE: This page has Content Security Policy headers enabled!
      </div>

      <h2>What is CSP?</h2>
      <p>
        Content Security Policy (CSP) is an added layer of security that helps detect and mitigate
        certain types of attacks, including Cross-Site Scripting (XSS) and data injection attacks.
      </p>

      <h3>CSP Configuration:</h3>
      <pre>{`// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};`}</pre>

      <h3>Security Headers Applied:</h3>
      <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px', margin: '1rem 0' }}>
        <ul>
          <li>✅ <strong>Content-Security-Policy:</strong> Restricts resource loading</li>
          <li>✅ <strong>X-Frame-Options:</strong> Prevents clickjacking</li>
          <li>✅ <strong>X-Content-Type-Options:</strong> Prevents MIME sniffing</li>
          <li>✅ <strong>X-XSS-Protection:</strong> Enables XSS filter</li>
          <li>Referrer-Policy appears in the sample configuration; this page does not set it.</li>
        </ul>
      </div>

      <h3>Test CSP Protection:</h3>
      <p>Open your browser's developer console. This page sets a CSP, but unsafe-inline still permits inline scripts. It is a limited teaching example, not a strict production policy.</p>

      <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px', margin: '1rem 0' }}>
        <p><strong>User Input (sanitized):</strong></p>
        <code>{userInput}</code>

        <p style={{ marginTop: '1rem' }}>
          Try accessing this page with: <code>/secure/csp-enabled?input=&lt;script&gt;alert('XSS')&lt;/script&gt;</code>
        </p>
        <p>
          Input is rendered as React text after character filtering. This policy permits inline scripts and does not protect server-side eval or shell execution.
        </p>
      </div>

      <h3>Additional Security Measures:</h3>
      <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '5px' }}>
        <h4>1. Middleware Protection</h4>
        <pre>{`// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /eval\\(/,
    /require\\(/,
    /child_process/,
    /fs\\./,
    /__dirname/,
    /__filename/
  ];

  const queryString = url.searchParams.toString();

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(queryString)) {
      return new NextResponse('Blocked', { status: 403 });
    }
  }

  return NextResponse.next();
}`}</pre>

        <h4 style={{ marginTop: '1.5rem' }}>2. Rate Limiting</h4>
        <p>Implement rate limiting to prevent brute force attacks and automated exploitation attempts.</p>

        <h4 style={{ marginTop: '1.5rem' }}>3. Input Validation at Every Layer</h4>
        <ul>
          <li>Client-side validation (UX)</li>
          <li>Middleware validation (First defense)</li>
          <li>API route validation (Core defense)</li>
          <li>Database query parameterization (Data layer)</li>
        </ul>
      </div>
    </div>
  );
}

export async function getServerSideProps({ query, res }) {
  // Set CSP headers for this specific page
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
  );
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  const userInput = query.input || 'No input provided';

  // Sanitize even though we have CSP
  const sanitized = typeof userInput === 'string'
    ? userInput.replace(/[^a-zA-Z0-9\s\-_.]/g, '')
    : 'Invalid input';

  return {
    props: {
      userInput: sanitized
    }
  };
}
