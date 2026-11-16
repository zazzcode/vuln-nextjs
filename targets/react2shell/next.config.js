module.exports = {
  reactStrictMode: true,
  // The workspace's hoisted tooling shadows @babel/core for next's embedded
  // lint pass. Lint this package with the root `pnpm lint` instead; do not
  // add dependencies here — the pinned graph is the SCA-001 scenario.
  eslint: { ignoreDuringBuilds: true },
};
