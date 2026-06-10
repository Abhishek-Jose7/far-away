/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@transit/types', '@transit/scoring-engine'],
};

module.exports = nextConfig;
