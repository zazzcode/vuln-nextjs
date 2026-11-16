/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Keep PGlite's WASM and filesystem assets in its installed Node package.
  webpack(config, { isServer }) {
    if (isServer) config.externals.push({ '@electric-sql/pglite': 'commonjs @electric-sql/pglite' });
    return config;
  },
};
