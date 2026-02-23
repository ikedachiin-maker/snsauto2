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
};

export default nextConfig;
