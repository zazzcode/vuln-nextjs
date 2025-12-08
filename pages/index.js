import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          React2Shell Vulnerability Test Site
        </h1>

        <div className={styles.warning}>
          ⚠️ WARNING: This is a deliberately vulnerable application for testing purposes only.
          <br />
          DO NOT deploy this to production or expose it to the internet!
        </div>

        <p className={styles.description}>
          CVE-2025-66478 - Next.js Remote Code Execution Vulnerability
        </p>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Vulnerable Examples</h2>
            <ul>
              <li>
                <Link href="/vulnerable/eval-injection">
                  1. Eval Injection via Query Params
                </Link>
              </li>
              <li>
                <Link href="/vulnerable/form-submission">
                  2. Form Submission RCE
                </Link>
              </li>
              <li>
                <Link href="/vulnerable/api-route">
                  3. API Route Exploitation
                </Link>
              </li>
              <li>
                <Link href="/vulnerable/header-injection">
                  4. Header Injection Attack
                </Link>
              </li>
              <li>
                <Link href="/vulnerable/dynamic-import">
                  5. Dynamic Import Vulnerability
                </Link>
              </li>
              <li>
                <Link href="/vulnerable/rsc-server-action">
                  6. RSC Server Action RCE (CVE-2025-66478)
                </Link>
              </li>
            </ul>
          </div>

          <div className={styles.card}>
            <h2>Secure Examples</h2>
            <ul>
              <li>
                <Link href="/secure/sanitized-input">
                  1. Sanitized Input Handling
                </Link>
              </li>
              <li>
                <Link href="/secure/validated-form">
                  2. Validated Form Processing
                </Link>
              </li>
              <li>
                <Link href="/secure/protected-api">
                  3. Protected API Route
                </Link>
              </li>
              <li>
                <Link href="/secure/csp-enabled">
                  4. CSP-Enabled Page
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.info}>
          <h3>Test Scripts</h3>
          <p>Run test scripts from the <code>/scripts</code> directory:</p>
          <ul>
            <li><code>./test-eval-injection.sh</code> - Test eval injection attacks</li>
            <li><code>./test-form-rce.sh</code> - Test form-based RCE</li>
            <li><code>./test-api-exploit.sh</code> - Test API exploitation</li>
            <li><code>./test-rsc-exploit.sh</code> - Test RSC RCE vulnerability</li>
            <li><code>./test-all.sh</code> - Run all tests</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
