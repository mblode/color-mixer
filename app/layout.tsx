import { GoogleAnalytics } from "@next/third-parties/google";
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

const siteUrl = "https://colormixer.app";
const title = "Colour mixer - mix and blend colours online";
const description =
  "Mix and blend colours online with an interactive colour mixer. Experiment with pigment combinations and create beautiful colour palettes in your browser.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Colour mixer",
  title,
  description,
  alternates: {
    canonical: "/",
  },
  manifest: "/site.webmanifest",
  category: "DesignApplication",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  openGraph: {
    type: "website",
    siteName: "Colour mixer",
    locale: "en_GB",
    url: "/",
    title,
    description,
    images: [
      {
        url: "/opengraph-image.png",
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
        url: "/opengraph-image.png",
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
      <body className={manrope.variable}>
        {children}
        <footer className="flex justify-center px-6 py-8">
          <CraftedBy />
        </footer>
      </body>
      <GoogleAnalytics gaId="G-9D3DKRFC1R" />
    </html>
  );
}
