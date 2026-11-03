// Abstract, authored SVG assets: dot-grid fields, branching decision paths and topographic contours.
// Everything is self-contained on an ink tile so it reads on any background.

import type { SVGProps } from 'react';

const INK = '#0c3a47';
const BRIGHT = '#6fd5e3';

/** App mark: one source branching into three outcomes. */
export function BrandMark({ size = 28, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 24V9M16 22c0-6-8-5-8-12M16 22c0-6 8-5 8-12" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="16" cy="25" r="3.2" fill={color} />
      <circle cx="8" cy="8" r="3" fill={color} />
      <circle cx="16" cy="6" r="3" fill={color} />
      <circle cx="24" cy="8" r="3" fill={color} />
    </svg>
  );
}

function wobble(cx: number, cy: number, r: number, seed: number): string {
  const pts: string[] = [];
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + 0.12 * Math.sin(a * 3 + seed) + 0.07 * Math.sin(a * 5 - seed * 1.7);
    pts.push(`${(cx + Math.cos(a) * r * k * 1.35).toFixed(1)},${(cy + Math.sin(a) * r * k * 0.8).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** Topographic contours as a tile background. Pass to a `.tile` as its first child. */
export function ContourArt({ seed = 1, opacity = 1 }: { seed?: number; opacity?: number }) {
  return (
    <svg className="tile-art" viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ opacity }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d={wobble(290, 40, 20 + i * 20, seed + i * 0.15)} fill="none" stroke={BRIGHT} strokeOpacity={0.5 - i * 0.045} strokeWidth="1.2" />
      ))}
    </svg>
  );
}

function DotGrid({ id, w, h, color = '#2c6677' }: { id: string; w: number; h: number; color?: string }) {
  return (
    <>
      <defs>
        <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.1" fill={color} />
        </pattern>
      </defs>
      <rect width={w} height={h} fill={`url(#${id})`} />
    </>
  );
}

/** Welcome / completion scene: one source forking into outcomes across a dot grid. */
export function SunriseScene(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="scene" viewBox="0 0 360 230" aria-hidden="true" {...props}>
      <rect width="360" height="230" rx="30" fill={INK} />
      <DotGrid id="g-sun" w={360} h={230} />
      <path d="M40 200 C110 200 120 150 180 140 C240 130 250 80 322 56" fill="none" stroke="#2c6677" strokeWidth="2" strokeDasharray="3 6" />
      <path d="M40 200 C110 200 120 170 190 170 C250 170 270 140 322 128" fill="none" stroke="#2c6677" strokeWidth="2" strokeDasharray="3 6" />
      <path className="draw" pathLength={1} d="M40 200 C120 200 130 150 190 140 C250 130 262 70 322 40" fill="none" stroke={BRIGHT} strokeWidth="4" strokeLinecap="round" />
      <circle cx="40" cy="200" r="9" fill="#fff" />
      <circle cx="322" cy="128" r="7" fill="#2c6677" stroke="#9fc1ca" strokeWidth="2" />
      <circle cx="322" cy="56" r="7" fill="#2c6677" stroke="#9fc1ca" strokeWidth="2" />
      <circle cx="322" cy="40" r="12" fill={BRIGHT} />
      <circle cx="322" cy="40" r="22" fill="none" stroke={BRIGHT} strokeOpacity="0.35" />
      <circle cx="322" cy="40" r="34" fill="none" stroke={BRIGHT} strokeOpacity="0.15" />
      <rect x="56" y="38" width="86" height="30" rx="15" fill="rgba(255,255,255,0.08)" />
      <circle cx="73" cy="53" r="5" fill={BRIGHT} />
      <rect x="84" y="49" width="46" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}

/** Onboarding intro: stacked bars resolving into a trend. */
export function GrowthScene(props: SVGProps<SVGSVGElement>) {
  const bars = [34, 52, 44, 70, 62, 92, 84, 118];
  return (
    <svg className="scene" viewBox="0 0 360 220" aria-hidden="true" {...props}>
      <rect width="360" height="220" rx="30" fill={INK} />
      <DotGrid id="g-gro" w={360} h={220} />
      {bars.map((h, i) => (
        <rect key={i} x={36 + i * 38} y={190 - h} width="24" height={h} rx="8" fill={i === bars.length - 1 ? BRIGHT : '#1a4c5b'} stroke={i === bars.length - 1 ? 'none' : '#2c6677'} />
      ))}
      <polyline className="draw" pathLength={1} points={bars.map((h, i) => `${48 + i * 38},${180 - h}`).join(' ')} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="314" cy="62" r="8" fill="#fff" stroke={BRIGHT} strokeWidth="4" />
      <rect x="36" y="28" width="92" height="26" rx="13" fill="rgba(255,255,255,0.08)" />
      <circle cx="51" cy="41" r="5" fill={BRIGHT} />
      <rect x="62" y="37" width="52" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}

/** Consent / privacy: concentric rings around a key. */
export function ShieldScene(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="scene" viewBox="0 0 360 200" aria-hidden="true" {...props}>
      <rect width="360" height="200" rx="30" fill={INK} />
      <DotGrid id="g-shd" w={360} h={200} />
      {[92, 68, 46].map((r, i) => <circle key={r} cx="180" cy="100" r={r} fill="none" stroke={BRIGHT} strokeOpacity={0.15 + i * 0.12} strokeWidth="1.5" strokeDasharray={i === 0 ? '3 6' : undefined} />)}
      <circle cx="180" cy="100" r="30" fill={BRIGHT} />
      <rect x="166" y="98" width="28" height="22" rx="6" fill={INK} />
      <path d="M171 98v-6a9 9 0 0 1 18 0v6" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <circle cx="180" cy="108" r="3" fill={BRIGHT} />
      <circle cx="82" cy="60" r="4" fill="#fff" /><circle cx="286" cy="140" r="4" fill="#fff" /><circle cx="262" cy="44" r="3" fill={BRIGHT} />
    </svg>
  );
}

/** Decide landing: a question branching into compared options. */
export function PathsScene(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="scene" viewBox="0 0 360 170" aria-hidden="true" {...props}>
      <rect width="360" height="170" rx="30" fill={INK} />
      <DotGrid id="g-pth" w={360} h={170} />
      <path d="M52 85 C110 85 120 40 180 40 H300" fill="none" stroke="#2c6677" strokeWidth="2" strokeDasharray="3 6" />
      <path d="M52 85 C110 85 120 130 180 130 H300" fill="none" stroke="#2c6677" strokeWidth="2" strokeDasharray="3 6" />
      <path className="draw" pathLength={1} d="M52 85 H300" fill="none" stroke={BRIGHT} strokeWidth="4" strokeLinecap="round" />
      <circle cx="52" cy="85" r="12" fill="#fff" />
      <text x="52" y="90" textAnchor="middle" style={{ fontSize: 14, fontWeight: 800, fill: INK, fontFamily: 'Geist, sans-serif' }}>?</text>
      {[['A', 40, '#2c6677'], ['B', 85, BRIGHT], ['C', 130, '#2c6677']].map(([l, y, c]) => (
        <g key={String(l)}>
          <circle cx="300" cy={Number(y)} r="13" fill={String(c)} stroke={c === BRIGHT ? 'none' : '#9fc1ca'} strokeWidth="1.5" />
          <text x="300" y={Number(y) + 4} textAnchor="middle" style={{ fontSize: 12, fontWeight: 800, fill: c === BRIGHT ? INK : '#fff', fontFamily: 'Geist, sans-serif' }}>{String(l)}</text>
        </g>
      ))}
    </svg>
  );
}
