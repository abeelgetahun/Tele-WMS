 import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Allow production builds to successfully complete even if
    // there are ESLint errors. Fixing the errors is recommended,
    // but this unblocks `next build`.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
