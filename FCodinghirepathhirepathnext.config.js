/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  // Optional: add turbopack config to avoid the warning
  turbopack: {},
};

module.exports = nextConfig;
