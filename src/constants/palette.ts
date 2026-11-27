/**
 * Episode colour as a complete, literal token set.
 *
 * These class strings must stay written out in full: Tailwind scans source text
 * at build time, so a class assembled at runtime (`text-${hue}-400`) never
 * reaches the stylesheet. Building them here keeps every utility visible to the
 * scanner and gives each surface one source for its episode colour.
 */
export interface EpisodePalette {
  /** Base text/icon colour for the episode. */
  text: string;
  /** Brighter variant, used for completed badges. */
  textStrong: string;
  /** Hex of the brighter variant, for shadows that must match the badge. */
  textStrongHex: string;
  /** Hairline border tint. */
  border: string;
  /** Solid left-rule / structural border colour. */
  borderStrong: string;
  /** Faint background wash. */
  bg: string;
  /** Solid fill, used for progress dots. */
  bgSolid: string;
  /** Outline ring. */
  ring: string;
  /** Half-opacity prompt glyph colour. */
  soft: string;
  /** Raw value for inline styles. */
  hex: string;
}

const PALETTES: Record<string, EpisodePalette> = {
  'text-blue-500': {
    text: 'text-blue-500',
    textStrong: 'text-blue-400',
    textStrongHex: '#60a5fa',
    border: 'border-blue-500/30',
    borderStrong: 'border-blue-500',
    bg: 'bg-blue-500/10',
    bgSolid: 'bg-blue-500',
    ring: 'ring-blue-500',
    soft: 'text-blue-500/50',
    hex: '#3b82f6',
  },
  'text-purple-500': {
    text: 'text-purple-500',
    textStrong: 'text-purple-400',
    textStrongHex: '#c084fc',
    border: 'border-purple-500/30',
    borderStrong: 'border-purple-500',
    bg: 'bg-purple-500/10',
    bgSolid: 'bg-purple-500',
    ring: 'ring-purple-500',
    soft: 'text-purple-500/50',
    hex: '#a855f7',
  },
  'text-yellow-500': {
    text: 'text-yellow-500',
    textStrong: 'text-yellow-400',
    textStrongHex: '#facc15',
    border: 'border-yellow-500/30',
    borderStrong: 'border-yellow-500',
    bg: 'bg-yellow-500/10',
    bgSolid: 'bg-yellow-500',
    ring: 'ring-yellow-500',
    soft: 'text-yellow-500/50',
    hex: '#eab308',
  },
  'text-red-500': {
    text: 'text-red-500',
    textStrong: 'text-red-400',
    textStrongHex: '#f87171',
    border: 'border-red-500/30',
    borderStrong: 'border-red-500',
    bg: 'bg-red-500/10',
    bgSolid: 'bg-red-500',
    ring: 'ring-red-500',
    soft: 'text-red-500/50',
    hex: '#ef4444',
  },
  'text-green-500': {
    text: 'text-green-500',
    textStrong: 'text-green-400',
    textStrongHex: '#4ade80',
    border: 'border-green-500/30',
    borderStrong: 'border-green-500',
    bg: 'bg-green-500/10',
    bgSolid: 'bg-green-500',
    ring: 'ring-green-500',
    soft: 'text-green-500/50',
    hex: '#22c55e',
  },
};

export function paletteFor(color: string | undefined): EpisodePalette {
  return (color && PALETTES[color]) || PALETTES['text-blue-500'];
}
