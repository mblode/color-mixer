import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  assetPrefix: "/color-mixer",
  basePath: "/color-mixer",
  experimental: { turbopackRustReactCompiler: true },
  reactCompiler: true,
  redirects() {
    return Promise.resolve([
      {
        basePath: false,
        destination: "https://blode.co/color-mixer",
        has: [{ type: "host" as const, value: "color-mixer.blode.co" }],
        permanent: true,
        source: "/",
      },
      {
        basePath: false,
        destination: "https://blode.co/color-mixer/:path*",
        has: [{ type: "host" as const, value: "color-mixer.blode.co" }],
        permanent: true,
        source: "/:path*",
      },
    ]);
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
