import LabLayout from '../../components/LabLayout';
export default function React2ShellInfo() {
  return <LabLayout title="SCA-001 · React2Shell"><p>The real affected runtime is a separate workspace target: Next.js 15.0.4 + React 19.0.0 with App Router and a normal Server Action.</p><p>Start it with <code>pnpm dev:react2shell</code>, then <a href="http://127.0.0.1:3001">open the React2Shell target</a>.</p><p>Run <code>pnpm test:sca</code> for dependency detection and <code>pnpm test:react2shell</code> for a harmless runtime marker. The main Pages Router app is not affected by this CVE.</p><p><a href="https://nextjs.org/blog/CVE-2025-66478">Official Next.js advisory</a></p></LabLayout>;
}
