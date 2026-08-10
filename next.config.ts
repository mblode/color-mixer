import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// blode.co deliberately excludes zone paths from its own headers, because two
// CSP headers on one response are intersected by the browser rather than
// overridden. So this zone owns its response headers.
//
// This was `frame-ancestors` only, on the reasoning that a full policy needs a
// nonce and a nonce forces the page off static prerender. `'unsafe-inline'`
// removes that constraint, which is how blode.co/fx already ships a full
// policy from a statically prerendered page.
//
// - 'unsafe-inline' scripts: Next's hydration bootstrap and the JSON-LD block
//   are inline; a nonce would need middleware on an otherwise static page.
// - 'unsafe-eval' in dev only: Turbopack's HMR runtime evals module code.
// - img-src data:: mixbox embeds its pigment lookup table inline rather than
//   fetching it, and next/font emits inline previews.
// - worker-src blob:: posthog-js lazy-loads session replay into a blob worker.
// - us.posthog.com is the PostHog toolbar calling back, not ingestion.
//
// HSTS is already set at the blode.co origin, and setting includeSubDomains or
// preload from a zone would apply to every blode.co subdomain irreversibly.
const PH_PROXY = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "";
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${PH_PROXY}`,
  `style-src 'self' 'unsafe-inline' ${PH_PROXY}`,
  `img-src 'self' data: blob: ${PH_PROXY}`,
  "worker-src 'self' blob:",
  `font-src 'self' ${PH_PROXY}`,
  `connect-src 'self' ${PH_PROXY} https://us.posthog.com`,
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  assetPrefix: "/color-mixer",
  basePath: "/color-mixer",
  experimental: { turbopackRustReactCompiler: true },
  reactCompiler: true,
  headers() {
    // Every matching rule applies in array order and a later one wins per
    // header key, so the catch-all comes first and per-route overrides after.
    return Promise.resolve([
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: CSP,
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
