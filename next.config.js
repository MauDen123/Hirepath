/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  turbopack: {},
};

module.exports = nextConfig;
