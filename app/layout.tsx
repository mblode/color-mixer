import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";

import { CraftedBy } from "../components/crafted-by";

import "./globals.css";

const manrope = Manrope({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-manrope",
});

const siteUrl = "https://blode.co/color-mixer";
const title = "Colour mixer - mix and blend colours online";
const description =
  "Mix and blend colours online with an interactive colour mixer. Experiment with pigment combinations and create beautiful colour palettes in your browser.";

export const metadata: Metadata = {
  metadataBase: new URL("https://blode.co"),
  applicationName: "Colour mixer",
  title,
  description,
  alternates: {
    canonical: siteUrl,
  },
  manifest: "/color-mixer/site.webmanifest",
  category: "DesignApplication",
  icons: {
    icon: [
      { url: "/color-mixer/favicon.ico", sizes: "32x32" },
      { url: "/color-mixer/favicon.svg", type: "image/svg+xml" },
      {
        url: "/color-mixer/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
    ],
    apple: [{ url: "/color-mixer/apple-touch-icon.png" }],
  },
  openGraph: {
    type: "website",
    siteName: "Colour mixer",
    locale: "en_GB",
    url: siteUrl,
    title,
    description,
    images: [
      {
        url: "/color-mixer/opengraph-image.png",
        alt: "Colour mixer - an interactive online pigment-mixing tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [
      {
        url: "/color-mixer/opengraph-image.png",
        alt: "Colour mixer - an interactive online pigment-mixing tool",
      },
    ],
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
    <html lang="en-GB">
      <head>
        <link href={process.env.NEXT_PUBLIC_POSTHOG_HOST} rel="preconnect" />
      </head>
      <body className={manrope.variable}>
        {children}
        <footer className="flex justify-center px-6 py-8">
          <CraftedBy />
        </footer>
      </body>
    </html>
  );
}
