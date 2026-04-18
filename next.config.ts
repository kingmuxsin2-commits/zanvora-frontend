import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React strict mode (optional but recommended)
  reactStrictMode: true,

  // Image optimization: allow loading images from your backend
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'marketplace-api.test',
        port: '',
        pathname: '/storage/**',
      },
      // Add your production domain when deploying
      // {
      //   protocol: 'https',
      //   hostname: 'api.yourdomain.com',
      //   port: '',
      //   pathname: '/storage/**',
      // },
    ],
  },

  // Optional: remove console.log in production (keeps console.error)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },

  // Standalone output for Docker
  output: 'standalone',

  // Ignore TypeScript build errors (if you absolutely must, but it's better to fix them)
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;