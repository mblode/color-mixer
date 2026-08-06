import ColorMixerApp from "../color-mixer-app";

const personId = "https://blode.co/#matthew-blode";
const websiteId = "https://blode.co/#website";

// One @graph with stable @ids, so each entity is defined once and referenced
// by @id rather than duplicated inline.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": personId,
      name: "Matthew Blode",
      url: "https://blode.co",
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: "Blode",
      url: "https://blode.co",
      inLanguage: "en-GB",
      publisher: { "@id": personId },
    },
    {
      // A WebPage, not a WebApplication. WebApplication is a
      // SoftwareApplication subtype, which validators hold to Google's Software
      // App rich result: that requires aggregateRating or review, and the only
      // ratings available here would be ones we wrote about our own tool, which
      // Google's review policy forbids. The WebGPU requirement moves into the
      // description, where a reader gets it before opening the page rather than
      // after it fails to start.
      "@type": "WebPage",
      "@id": "https://blode.co/color-mixer#webpage",
      name: "Colour mixer",
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
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: "https://blode.co/color-mixer/opengraph-image.png",
      },
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
