/**
 * Cavos custom icon set — layered, multi-tone Cavos indigo.
 *
 * Hand-built SVGs in the same language as the cavos.xyz pricing icons: stacked
 * shapes in a graded indigo palette for depth, not flat single-color glyphs.
 *
 * Palette is tuned for light surfaces by default. Pass `dark` for a variant that
 * reads on a near-black card (lifted brand tone, darker pale layers).
 */
import type { CSSProperties } from 'react';

interface IconProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Use the dark-surface palette (for near-black backgrounds). */
  dark?: boolean;
}

// Graded Cavos indigo palettes (light → deep). `dark` lifts the brand tone and
// darkens the pale layers so the icon stays legible on a near-black surface.
const LIGHT = {
  bg: '#E5E1FF',
  pale: '#C9BEFF',
  light: '#9F8CFF',
  mid: '#7C5CFF',
  brand: '#402AFF',
  facet: '#5A45FF',
  deep: '#2A1AB8',
};
const DARK = {
  bg: '#241C57',
  pale: '#33268F',
  light: '#5A45FF',
  mid: '#8B78FF',
  brand: '#6E5CFF',
  facet: '#8B78FF',
  deep: '#1B1147',
};

function Svg({ size = 40, className, style, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Wallet / account (from cavos.xyz pricing). */
export function CvWallet({ dark, ...p }: IconProps) {
  const C = dark ? DARK : LIGHT;
  return (
    <Svg {...p}>
      <rect x="10" y="12" width="28" height="19" rx="4" fill={C.pale} />
      <rect x="6" y="17" width="36" height="23" rx="5" fill={C.brand} />
      <rect x="6" y="23" width="36" height="4.5" fill={C.deep} />
      <rect x="11" y="32" width="9" height="5" rx="1.5" fill={C.light} />
      <circle cx="35" cy="34" r="2.2" fill={C.light} />
    </Svg>
  );
}

/** Gasless / fast (from cavos.xyz pricing). */
export function CvBolt({ dark, ...p }: IconProps) {
  const C = dark ? DARK : LIGHT;
  return (
    <Svg {...p}>
      <circle cx="22" cy="24" r="16" fill={C.bg} />
      <path d="M25 9 L13 27 h8 l-2 12 13-19 h-9 z" fill={C.brand} />
      <circle cx="35" cy="13" r="2.4" fill={C.mid} />
      <circle cx="11" cy="36" r="1.7" fill={C.light} />
    </Svg>
  );
}

/** Code / developer / export (from cavos.xyz pricing). */
export function CvCode({ dark, ...p }: IconProps) {
  const C = dark ? DARK : LIGHT;
  return (
    <Svg {...p}>
      <rect x="6" y="9" width="36" height="30" rx="5" fill={C.bg} />
      <path d="M6 14a5 5 0 0 1 5-5h26a5 5 0 0 1 5 5v2H6z" fill={C.pale} />
      <circle cx="12" cy="12.5" r="1.4" fill={C.brand} />
      <circle cx="17" cy="12.5" r="1.4" fill={C.mid} />
      <path
        d="M21 22l-5 5 5 5M27 22l5 5-5 5"
        stroke={C.brand}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Security / non-custodial (from cavos.xyz pricing). */
export function CvShield({ dark, ...p }: IconProps) {
  const C = dark ? DARK : LIGHT;
  return (
    <Svg {...p}>
      <path d="M24 6l16 6v10c0 10-7 16.5-16 20.5C15 38.5 8 32 8 22V12z" fill={C.brand} />
      <path d="M24 6l16 6v10c0 10-7 16.5-16 20.5z" fill={C.facet} />
      <path
        d="M17 24l5 5 9-10"
        stroke="#fff"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Cavos 4-point spark. */
export function CvSpark({ dark, ...p }: IconProps) {
  const C = dark ? DARK : LIGHT;
  return (
    <Svg {...p}>
      <circle cx="24" cy="24" r="15" fill={C.bg} />
      <path
        d="M24 9c1.6 8 4.5 10.9 12.5 12.5-8 1.6-10.9 4.5-12.5 12.5-1.6-8-4.5-10.9-12.5-12.5 8-1.6 10.9-4.5 12.5-12.5z"
        fill={C.brand}
      />
      <circle cx="35" cy="14" r="2.2" fill={C.mid} />
      <circle cx="13" cy="34" r="1.6" fill={C.light} />
    </Svg>
  );
}

/** Docs / guides. */
export function CvDocs({ dark, ...p }: IconProps) {
  const C = dark ? DARK : LIGHT;
  return (
    <Svg {...p}>
      <rect x="13" y="8" width="24" height="32" rx="4" fill={C.pale} />
      <rect x="9" y="11" width="26" height="30" rx="4" fill={C.brand} />
      <path d="M14 20h16M14 26h16M14 32h10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

/** Copy. */
export function CvCopy({ dark, ...p }: IconProps) {
  const C = dark ? DARK : LIGHT;
  return (
    <Svg {...p}>
      <rect x="8" y="8" width="21" height="21" rx="5" fill={C.light} />
      <rect x="19" y="19" width="21" height="21" rx="5" fill={C.brand} />
    </Svg>
  );
}

/** Lock. */
export function CvLock({ dark, ...p }: IconProps) {
  const C = dark ? DARK : LIGHT;
  return (
    <Svg {...p}>
      <path
        d="M16 23v-5a8 8 0 0 1 16 0v5"
        stroke={C.light}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="11" y="22" width="26" height="18" rx="5" fill={C.brand} />
      <circle cx="24" cy="29" r="2.6" fill="#fff" />
      <rect x="22.6" y="30" width="2.8" height="5" rx="1.4" fill="#fff" />
    </Svg>
  );
}

/** Key / recovery — layered bow (with facet + hole), collar, shaft, teeth. */
export function CvKey({ dark, ...p }: IconProps) {
  const C = dark ? DARK : LIGHT;
  return (
    <Svg {...p}>
      {/* shaft + teeth (behind the bow) */}
      <path d="M22 24 L39 41" stroke={C.brand} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M31 33l4 4M34.5 29.5l4 4" stroke={C.mid} strokeWidth="4.5" strokeLinecap="round" />
      {/* bow */}
      <circle cx="18" cy="20" r="11" fill={C.brand} />
      <path d="M18 9a11 11 0 0 1 0 22z" fill={C.facet} />
      <circle cx="18" cy="20" r="4.2" fill={C.bg} />
    </Svg>
  );
}

/** Customize / controls. */
export function CvSliders({ dark, ...p }: IconProps) {
  const C = dark ? DARK : LIGHT;
  return (
    <Svg {...p}>
      <rect x="7" y="9" width="34" height="30" rx="7" fill={C.bg} />
      <path d="M14 19h20M14 29h20" stroke={C.pale} strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="21" cy="19" r="4.5" fill={C.brand} />
      <circle cx="28" cy="29" r="4.5" fill={C.brand} />
    </Svg>
  );
}

export const CAVOS_ICONS = {
  spark: CvSpark,
  wallet: CvWallet,
  bolt: CvBolt,
  code: CvCode,
  shield: CvShield,
  docs: CvDocs,
  sliders: CvSliders,
  copy: CvCopy,
  lock: CvLock,
  key: CvKey,
} as const;
