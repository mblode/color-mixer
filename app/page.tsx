import ColorMixerApp from "../color-mixer-app";

/*
 * The host graph. blode.co/color-mixer is a path on blode.co behind a rewrite,
 * not a site of its own, so the Person, Organization and WebSite nodes are
 * referenced by @id and never redefined here. The Person id was
 * `blode.co/#matthew-blode`, which matched nothing blode.co publishes and so
 * resolved to a second, empty person. Contract:
 * blode-co/apps/web/.claude/knowledge/zone-conventions.md
 */
const personId = "https://blode.co/#person";
const orgId = "https://blode.co/#organization";
const websiteId = "https://blode.co/#website";
const breadcrumbId = "https://blode.co/color-mixer/#breadcrumb";

// One @graph with stable @ids, so each entity is defined once and referenced
// by @id rather than duplicated inline.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      // A WebPage, not a WebApplication. WebApplication is a
      // SoftwareApplication subtype, which validators hold to Google's Software
      // App rich result: that requires aggregateRating or review, and the only
      // ratings available here would be ones we wrote about our own tool, which
      // Google's review policy forbids. The WebGPU requirement moves into the
      // description, where a reader gets it before opening the page rather than
      // after it fails to start.
      "@type": "WebPage",
      "@id": "https://blode.co/color-mixer/#webpage",
      name: "Colour Mixer",
      // No trailing slash, matching alternates.canonical in app/layout.tsx.
      url: "https://blode.co/color-mixer",
      description:
        "Mix and blend colours online with an interactive colour mixer. Experiment with pigment combinations and create beautiful colour palettes in your browser. Requires a WebGPU-enabled browser.",
      keywords: [
        "Colour mixing",
        "Pigment simulation",
        "Palette design",
        "WebGPU",
      ],
      inLanguage: "en-GB",
      isPartOf: { "@id": websiteId },
      creator: { "@id": personId },
      publisher: { "@id": orgId },
      breadcrumb: { "@id": breadcrumbId },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: "https://blode.co/color-mixer/opengraph-image",
      },
    },
    // Starts at the blode.co root, not at this zone. The root crumb is named
    // for the person rather than "Home": it is the one piece of chrome this
    // page shows above the fold. `components/zone-breadcrumb` renders the same
    // trail visibly and Google treats a mismatch as a markup error, so the two
    // change together.
    {
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Matthew Blode",
          item: "https://blode.co/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Projects",
          item: "https://blode.co/projects",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Colour Mixer",
          item: "https://blode.co/color-mixer",
        },
      ],
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        // Constants only; keeps the schema.org data from the previous document shell.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        type="application/ld+json"
      />
      <ColorMixerApp />
    </>
  );
}
