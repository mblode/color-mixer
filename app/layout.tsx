import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import "./globals.css";

// Roman only. Nothing here renders in italic, and next/font applies one
// preload setting per declaration, so shipping the italic face alongside it
// would fetch 209KB on first load for nothing.
const glide = localFont({
  src: "./fonts/glide-variable.woff2",
  variable: "--font-glide",
  weight: "100 950",
  display: "swap",
});

const glideMono = localFont({
  src: "./fonts/glide-mono.woff2",
  variable: "--font-glide-mono",
  weight: "400",
  display: "swap",
  // Nothing on this page renders in mono; preloading it would only compete
  // with the LCP text for bandwidth.
  preload: false,
});

const siteUrl = "https://blode.co/color-mixer";
// Product first, then a colon, under 60 characters. Not a pipe, not a dash.
// "Colour Mixer" is what blode.co/projects calls it; the breadcrumb, the h1 and
// the structured data all have to agree with that and with each other.
const productName = "Colour Mixer";
const title = `${productName}: mix and blend colours online`;
const description =
  "Mix and blend colours online with an interactive colour mixer. Experiment with pigment combinations and create beautiful colour palettes in your browser.";

export const metadata: Metadata = {
  // The zone URL, not the bare origin (Rule 11). Only correct because the card
  // is a generated `opengraph-image.tsx` route: Next does not prefix those with
  // `basePath`, so `metadataBase` supplies the prefix exactly once. Against the
  // static PNG this replaced, the two would have stacked into
  // `/color-mixer/color-mixer/…`.
  metadataBase: new URL(siteUrl),
  applicationName: productName,
  title: {
    default: title,
    template: `%s | ${productName}`,
  },
  description,
  authors: [{ name: "Matthew Blode", url: "https://blode.co" }],
  creator: "Matthew Blode",
  publisher: "Matthew Blode",
  alternates: {
    canonical: siteUrl,
  },
  // Paths without `/color-mixer`: `metadataBase` already carries the zone, and
  // Next joins rather than replaces, so spelling the prefix here would double.
  manifest: "/site.webmanifest",
  category: "DesignApplication",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      {
        url: "/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  // No `images` here: `app/opengraph-image.tsx` is the card. Next reuses it for
  // `twitter:image` too when there is no `twitter-image` file.
  openGraph: {
    type: "website",
    // The person, not the product. All 33 zones are one site, and the product
    // name is already in og:title, so this is the only slot in the card that
    // can say who made the thing.
    siteName: "Matthew Blode",
    locale: "en_GB",
    url: siteUrl,
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    creator: "@mattblode",
    title,
    description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html className={`${glide.variable} ${glideMono.variable}`} lang="en-GB">
      <head>
        <link href={process.env.NEXT_PUBLIC_POSTHOG_HOST} rel="preconnect" />
      </head>
      {/* The canvas owns the viewport, so the credit moved into the app's
          "How the mixing works" panel rather than a footer below the fold. */}
      <body>{children}</body>
    </html>
  );
}
