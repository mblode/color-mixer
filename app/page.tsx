import ColorMixerApp from "../color-mixer-app";

const structuredData = {
  "@context": "https://schema.org",
  // A WebPage, not a WebApplication. WebApplication is a SoftwareApplication
  // subtype, which validators hold to Google's Software App rich result: that
  // requires aggregateRating or review, and the only ratings available here
  // would be ones we wrote about our own tool, which Google's review policy
  // forbids. The WebGPU requirement moves into the description, where a reader
  // gets it before opening the page rather than after it fails to start.
  "@type": "WebPage",
  name: "Colour mixer",
  url: "https://blode.co/color-mixer/",
  description:
    "Mix and blend colours online with an interactive colour mixer. Experiment with pigment combinations and create beautiful colour palettes in your browser. Requires a WebGPU-enabled browser.",
  keywords: ["Colour mixing", "Pigment simulation", "Palette design", "WebGPU"],
  offers: {
    "@type": "Offer",
    category: "Free",
    price: "0",
    priceCurrency: "USD",
  },
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
