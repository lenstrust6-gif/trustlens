import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Ensure proper code generation for Vercel production builds
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  // Disable aggressive minification that might break dynamic code
  swcMinify: true,
  // Ensure client components are properly handled
  reactStrictMode: true,
};

export default nextConfig;
