import type { NextConfig } from "next";
import type { Configuration } from "webpack";

const nextConfig: NextConfig = {
  webpack: (config: Configuration, { isServer }) => {
    if (isServer) {
      const externals: any[] = [];
      if (Array.isArray(config.externals)) {
        externals.push(...config.externals);
      } else if (config.externals) {
        externals.push(config.externals);
      }
      
      externals.push('ssh2');
      config.externals = externals;
    }
    return config;
  },
};

export default nextConfig;
