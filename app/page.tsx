import ColorMixerApp from "../color-mixer-app";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Colour mixer",
  url: "https://colormixer.app/",
  description:
    "Mix and blend colours online with an interactive colour mixer. Experiment with pigment combinations and create beautiful colour palettes in your browser.",
  applicationCategory: "DesignApplication",
  operatingSystem: "Any (WebGPU-enabled browser)",
  browserRequirements: "Requires WebGPU",
  offers: {
    "@type": "Offer",
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
