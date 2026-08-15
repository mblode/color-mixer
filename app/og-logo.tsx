/** Three overlapping discs, same mark as `public/favicon.svg`. */
export const OgLogo = () => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      height: 64,
      width: 64,
    }}
  >
    <div
      style={{
        background: "#1d4ed8",
        borderRadius: 999,
        height: 36,
        marginRight: -8,
        width: 36,
      }}
    />
    <div
      style={{
        background: "#1d4ed8",
        borderRadius: 999,
        height: 36,
        opacity: 0.75,
        width: 36,
      }}
    />
    <div
      style={{
        background: "#1d4ed8",
        borderRadius: 999,
        height: 36,
        marginLeft: 14,
        marginTop: -8,
        width: 36,
      }}
    />
  </div>
);
