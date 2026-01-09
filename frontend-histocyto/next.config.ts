import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",

  // Rewrites disabled - using API route handler instead for proper HTTPS support
  // async rewrites() {
  //   const backendUrl = process.env.BACKEND_URL || "http://histo-backend:8001";
  //   return {
  //     beforeFiles: [
  //       {
  //         source: "/api/proxy/:path*",
  //         destination: `${backendUrl}/api/v1/:path*`,
  //       },
  //     ],
  //     afterFiles: [],
  //     fallback: [],
  //   };
  // },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,PATCH,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Authorization, Content-Type" },
        ],
      },
    ];
  },
};

export default nextConfig;
