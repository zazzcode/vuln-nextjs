import Link from 'next/link';
import Head from 'next/head';
export default function LabLayout({ title, children }) {
  return <><Head><title>{title} · Zazzles vulnerability lab</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
    <div className="lab"><header><Link href="/">Zazzles / vulnerability lab</Link><nav><Link href="/vulnerabilities">Scenario index</Link><Link href="/sql/login">SQL lab</Link><Link href="/mongo/mongo-001">MongoDB lab</Link><Link href="/xss/unsafe/reflected">XSS lab</Link></nav></header>
      <p className="lab-warning">Deliberately vulnerable. Use isolated local environments and synthetic data.</p>
      <main><h1>{title}</h1>{children}</main>
      <footer>Expanded from Eric / e-tang’s <a href="https://github.com/e-tang/nextjs-vulsite">nextjs-vulsite</a>.</footer>
    </div></>;
}
