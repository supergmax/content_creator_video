import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), 'remotion', '@remotion/player'];
    }
    return config;
  },
};

export default nextConfig;
