import { renderZoneOgImage } from "@/app/og-image-shared";

export {
  OG_CONTENT_TYPE as contentType,
  OG_SIZE as size,
} from "@/app/og-image-shared";

export const alt = "Colour Mixer: mix and blend colours online";

/**
 * The house card (Rule 12), replacing the static `opengraph-image.png`.
 *
 * Converting the PNG to a generated route is also the Rule 11 fix, which is
 * why `metadataBase` moves to the zone URL in the same commit. A static
 * metadata image already carries `basePath`, so pointing `metadataBase` at the
 * zone while the PNG is still there produces
 * `/color-mixer/color-mixer/opengraph-image.png`. A generated route is not
 * prefixed, so this form is the one that cannot double.
 */
export default function OpengraphImage() {
  return renderZoneOgImage({
    badge: "COLOUR MIXER",
    eyebrow: "blode.co/color-mixer",
    // Shorter than the meta description, which runs long for the SERP. A card
    // is read in a feed, at a glance.
    subtitle: "Mix pigments and build palettes in the browser.",
    title: "Colour Mixer: mix and blend colours online",
  });
}
