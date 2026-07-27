export function CraftedBy() {
  return (
    <a
      className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
      href="https://blode.co"
      rel="author noreferrer"
      target="_blank"
    >
      <span>Crafted by</span>
      {/* Self-hosted avatar; intentionally a plain img, not next/image. */}
      {/* biome-ignore lint/performance/noImgElement: self-hosted, fixed 20px */}
      <img
        alt="Matthew Blode"
        className="rounded-full"
        height={20}
        loading="lazy"
        src="/color-mixer/avatar-sm.png"
        width={20}
      />
      <span>Matthew Blode</span>
    </a>
  );
}
