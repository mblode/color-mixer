import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  assetPrefix: "/color-mixer",
  basePath: "/color-mixer",
  experimental: { turbopackRustReactCompiler: true },
  reactCompiler: true,
  // No full Content-Security-Policy: Next's inline bootstrap and the JSON-LD
  // script would need a nonce, which forces this page off static prerender.
  // HSTS is already set at the blode.co origin.
  headers() {
    return Promise.resolve([
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self'",
          },
        ],
      },
    ]);
  },
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
};

export default nextConfig;
