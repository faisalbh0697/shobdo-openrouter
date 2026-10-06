import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "127.0.2.2", "localhost"],
  experimental: {
    proxyClientMaxBodySize: "26mb",
    serverActions: {
      bodySizeLimit: "26mb",
    },
  },
};

export default nextConfig;
