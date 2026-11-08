import type { NextConfig } from "next";

const api = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000");

const nextConfig: NextConfig = {
  // Build tối giản (.next/standalone) để image Docker nhỏ.
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: api.protocol.replace(":", "") as "http" | "https",
        hostname: api.hostname,
        port: api.port,
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
