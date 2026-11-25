import Link from 'next/link';
import LabLayout from '../../components/LabLayout';
import ApiConsole from '../../components/ApiConsole';
const credentials = { username: 'alice', password: 'alice-lab-only' };
const scenarios = {
  'script-readable': { id: 'COOKIE-001', title: 'Session cookie readable by script', missing: 'HttpOnly', effect: 'Any script on this origin, for example through an XSS flaw, can read the session token from document.cookie.' },
  'plain-transport': { id: 'COOKIE-002', title: 'Session cookie sent over plain HTTP', missing: 'Secure', effect: 'A browser also sends the session token with an unencrypted request to this host.' },
  'misleading-name': { id: 'COOKIE-003', title: 'Session cookie with a preference-like name', missing: 'HttpOnly', effect: 'The cookie is called ui_prefs, but the server uses it to identify the caller. Script can read it.' },
  'overridden-options': { id: 'COOKIE-005', title: 'Hardened options overridden', missing: 'HttpOnly', safe: 'overridden-options', effect: 'The hardened options are spread first, so a later httpOnly: false wins.' },
  'attribute-in-name': { id: 'COOKIE-006', title: 'HttpOnly only in the name', missing: 'HttpOnly', safe: 'lowercase-attributes', effect: 'The word HttpOnly is part of the cookie name. The attribute itself is missing.' },
  'replaced-header': { id: 'COOKIE-007', title: 'Hardened header replaced', missing: 'Secure', safe: 'replaced-header', effect: 'A second setHeader call replaces the hardened header and drops the attribute.' },
  'several-cookies': { id: 'COOKIE-004', title: 'One of several cookies lacks Secure', missing: 'Secure', effect: 'The response sets a theme cookie and a session cookie. Only the session cookie needs the attribute, and it does not have it.' },
};
export default function CookieLab({ scenario }) {
  const example = scenarios[scenario];
  return <LabLayout title={`${example.id} · ${example.title}`}>
    <nav className="tabs">{Object.keys(scenarios).sort((a, b) => scenarios[a].id.localeCompare(scenarios[b].id)).map((key) => <Link key={key} href={`/cookies/${key}`}>{scenarios[key].id}</Link>)}</nav>
    <p>Missing attribute: <code>{example.missing}</code>. {example.effect}</p>
    <p>Sign in with the same lab credentials on both routes and compare the <code>Set-Cookie</code> response headers.</p>
    <h2>Unsafe</h2>
    <ApiConsole endpoint={`/api/cookies/unsafe/${scenario}`} initialBody={credentials} label="Sign in (unsafe)" />
    <h2>Safe</h2>
    <ApiConsole endpoint={`/api/cookies/safe/${example.safe ?? 'session'}`} initialBody={credentials} label="Sign in (safe)" />
    <p>Tricky safe cases that a scanner should not report are listed in <code>docs/vulnerabilities/cookies.md</code>.</p>
  </LabLayout>;
}
export function getServerSideProps({ params }) {
  if (!Object.hasOwn(scenarios, params.scenario)) return { notFound: true };
  return { props: { scenario: params.scenario } };
}
