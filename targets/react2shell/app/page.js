async function echo(formData) {
  'use server';
  // Ordinary Server Action: the intentional flaw is in the pinned RSC runtime,
  // not a handcrafted eval handler. Keep application processing benign.
  console.log('Zazzles lab echo:', String(formData.get('message') || '').slice(0, 200));
}
export default function React2ShellTarget() {
  return <main>
    <p>Zazzles vulnerability lab / SCA-001</p>
    <h1>React2Shell · CVE-2025-66478</h1>
    <p>Intentional lab target: Next.js 15.0.4, React 19.0.0, App Router, Node runtime.</p>
    <p>Run only in an isolated local environment. Dependency audits are expected to flag this target.</p>
    <form action={echo}><label>Benign Server Action message <input name="message" defaultValue="Hello lab" /></label> <button>Submit</button></form>
    <p><a href="http://127.0.0.1:3000">Main lab</a></p>
  </main>;
}
