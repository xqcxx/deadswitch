import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@stacks/connect', '@stacks/network', '@stacks/transactions'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
