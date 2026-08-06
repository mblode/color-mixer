import type { MetadataRoute } from "next";

// Served at /color-mixer/sitemap.xml under next.config.ts's basePath, which is
// the URL blode.co's root sitemap index already points at.
//
// Bumped by hand when the page's content actually changes. Deriving it from
// new Date() would move on every build and tell crawlers the page is fresh
// when only the bundle hash changed.
const LAST_CONTENT_CHANGE = "2026-08-06";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      // Absolute: metadataBase does not prefix sitemap URLs.
      url: "https://blode.co/color-mixer",
      lastModified: LAST_CONTENT_CHANGE,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
