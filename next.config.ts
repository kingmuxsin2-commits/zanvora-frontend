import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'marketplace-api.test',
        port: '',
        pathname: '/storage/**',
      },
      // Add production domain later
    ],
  },
};

export default nextConfig;