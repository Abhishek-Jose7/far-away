/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@transitiq/types', '@transitiq/scoring-engine'],
};

module.exports = nextConfig;
