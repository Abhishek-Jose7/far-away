const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@transitiq/types', '@transitiq/scoring-engine'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

module.exports = nextConfig;
