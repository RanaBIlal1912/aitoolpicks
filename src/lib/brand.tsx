// The AI Tool Picks mark, defined once: a hexagon (the chip) with a tick (the pick). The header, footer, favicon, app icons and
// social image all render this same component, so they cannot drift apart. public/brand/mark.svg is the same drawing as a file.
export const BRAND = { from: "#5b7fc0", to: "#8a83c2", ink: "#05070d" } as const;

export function BrandMark({ size = 32, gradientId = "brand-g" }: { size?: number; gradientId?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={BRAND.from} />
          <stop offset="1" stopColor={BRAND.to} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${gradientId})`} />
      <path d="M32 11l17.3 10v20L32 51 14.7 41V21z" fill="none" stroke="#fff" strokeOpacity="0.92" strokeWidth="3.4" strokeLinejoin="round" />
      <path d="M24.2 32.6l5.7 5.7 10.2-11.6" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
