import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: ['userpic.codeforces.org'],
  }
};

export default nextConfig;
