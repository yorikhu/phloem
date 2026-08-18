/**
 * PixelSprout — G-series pixel logo (pixel sprout in dark soil).
 *
 * 8x8 grid, 3-tone blue ramp matching the app accent.
 * Rendered as SVG rects: crisp at any size, theme-aware via
 * currentColor for the soil.
 *
 * Legend: a=accent #6b8cff, h=highlight #a3b8ff, d=deep #3d5199
 */

export type PixelSproutProps = {
  size?: number;
  className?: string;
  title?: string;
};

const PALETTE: Record<string, string> = {
  a: 'var(--ph-accent, #6b8cff)',
  h: 'var(--ph-accent-light, #a3b8ff)',
  d: 'var(--ph-accent-deep, #3d5199)',
};

// 8x8 pixel map — G: sprout with two leaves on dark soil
const GRID = [
  '........',
  '.aa..aa.',
  '.aaaaaa.',
  '..a..a..',
  '...aa...',
  '...aa...',
  '..dddd..',
  '........',
];

export default function PixelSprout({ size = 24, className, title = 'Phloem' }: PixelSproutProps) {
  const rects = GRID.flatMap((row, y) =>
    row.split('').map((cell, x) => {
      if (!(cell in PALETTE)) return null;
      return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={PALETTE[cell]} />;
    }),
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {rects}
    </svg>
  );
}
