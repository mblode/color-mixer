export function CraftedBy() {
  return (
    <a
      className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
      href="https://matthewblode.com"
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
        src="/avatar-sm.png"
        width={20}
      />
      <span>Matthew Blode</span>
    </a>
  );
}
