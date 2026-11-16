export default function RedirectSafe() {
  // Safe control for REDIR-001: only same-site relative paths may redirect.
  // Rendered only when a target is rejected; accepted targets never see HTML.
  return null;
}
export function getServerSideProps({ query }) {
  const to = typeof query.to === 'string' ? query.to : '';
  // Must start with "/" but not "//" (protocol-relative) and contain no scheme.
  const allowed = /^\/[^/]/.test(to) && !/[a-z][a-z0-9+.-]*:/i.test(to) && to.length <= 2000;
  if (allowed) return { redirect: { destination: to, permanent: false } };
  return { props: { to } };
}
