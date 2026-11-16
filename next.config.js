/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Keep PGlite's WASM and DOMPurify's jsdom in their installed Node packages.
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals.push({ '@electric-sql/pglite': 'commonjs @electric-sql/pglite' });
      config.externals.push({ 'isomorphic-dompurify': 'commonjs isomorphic-dompurify' });
    }
    return config;
  },
};
