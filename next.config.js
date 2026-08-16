/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output is what the Dockerfile deploys (it copies .next/standalone
  // and runs its server.js), so it stays on for self-hosted builds. Vercel does
  // its own file tracing and does not need it — and under Next 16.3.x the two
  // conflict there, failing the build with a missing next-server.js.nft.json.
  output: process.env.VERCEL ? undefined : 'standalone',
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
