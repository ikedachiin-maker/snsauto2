import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "iphonekaitori.tokyo",
      },
      {
        protocol: "https",
        hostname: "gamekaitori.jp",
      },
    ],
  },
  serverExternalPackages: ["sql.js"],
  outputFileTracingIncludes: {
    "/**": ["./data/**"],
  },
};

export default nextConfig;
