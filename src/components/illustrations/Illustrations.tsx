// Authored SVG scenes in the Sky language: a window of the current sky (it follows the time of day through
// the --sky-* tokens), a sun glow, soft clouds, and decisions drawn as white contrails between midnight nodes.
// On the full twilight screens the window is dropped and the drawing floats on the sky itself.

import { useId, type SVGProps } from 'react';

const MIDNIGHT = '#0f2238';
const FONT = "'Figtree Variable', Figtree, -apple-system, sans-serif";

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

/** Sky window: gradient from the live sky tokens, a sun glow and a few soft clouds. */
function SkyWindow({ w, h, sun = [0.82, 0.18], clouds = [] as Array<[number, number, number]> }: { w: number; h: number; sun?: [number, number]; clouds?: Array<[number, number, number]> }) {
  const id = useId().replace(/:/g, '');
  return (
    <g className="scene-bg">
      <defs>
        <linearGradient id={`${id}s`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--sky-1)" />
          <stop offset="60%" stopColor="var(--sky-2)" />
          <stop offset="100%" stopColor="var(--sky-3)" />
        </linearGradient>
        <radialGradient id={`${id}g`} cx={sun[0]} cy={sun[1]} r="0.55">
          <stop offset="0%" stopColor="var(--sun)" />
          <stop offset="100%" stopColor="var(--sun)" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}b`} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <clipPath id={`${id}c`}>
          <rect width={w} height={h} rx="26" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width={w} height={h} fill={`url(#${id}s)`} />
        <rect width={w} height={h} fill={`url(#${id}g)`} />
        {clouds.map(([cx, cy, rx], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={rx * 0.28} fill="#fff" opacity="var(--cloud-a)" filter={`url(#${id}b)`} />
        ))}
      </g>
    </g>
  );
}

/** Welcome / completion: a path climbing from where you are toward the sun. */
export function SunriseScene(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="scene" viewBox="0 0 360 230" aria-hidden="true" {...props}>
      <SkyWindow w={360} h={230} sun={[0.86, 0.2]} clouds={[[90, 70, 70], [250, 150, 90]]} />
      <circle cx="318" cy="46" r="16" fill="#fff" opacity="0.95" />
      <circle cx="318" cy="46" r="30" fill="none" stroke="#fff" strokeOpacity="0.45" />
      <circle cx="318" cy="46" r="46" fill="none" stroke="#fff" strokeOpacity="0.2" />
      <path d="M40 196 C110 196 120 166 190 166 C250 166 272 138 318 120" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
      <path className="draw" pathLength={1} d="M40 196 C120 196 132 150 192 140 C252 130 268 74 318 52" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="40" cy="196" r="9" fill={MIDNIGHT} stroke="#fff" strokeWidth="3" />
      <circle cx="192" cy="140" r="5" fill="#fff" />
      <circle cx="318" cy="120" r="6" fill="#fff" fillOpacity="0.6" />
    </svg>
  );
}

/** Onboarding intro: months rising like light columns, a trend line riding over them. */
export function GrowthScene(props: SVGProps<SVGSVGElement>) {
  const bars = [34, 52, 44, 70, 62, 92, 84, 118];
  return (
    <svg className="scene" viewBox="0 0 360 220" aria-hidden="true" {...props}>
      <SkyWindow w={360} h={220} sun={[0.84, 0.16]} clouds={[[70, 48, 60], [230, 36, 80]]} />
      {bars.map((h, i) => (
        <rect key={i} x={36 + i * 38} y={200 - h} width="24" height={h} rx="12" fill="#fff" fillOpacity={i === bars.length - 1 ? 0.95 : 0.32 + i * 0.04} />
      ))}
      <polyline className="draw" pathLength={1} points={bars.map((h, i) => `${48 + i * 38},${188 - h}`).join(' ')} fill="none" stroke={MIDNIGHT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="314" cy="70" r="8" fill={MIDNIGHT} stroke="#fff" strokeWidth="3" />
    </svg>
  );
}

/** Consent / privacy: a lock held in the calm centre of the sky, with soft halos. */
export function ShieldScene(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="scene" viewBox="0 0 360 200" aria-hidden="true" {...props}>
      <SkyWindow w={360} h={200} sun={[0.5, 0.5]} clouds={[[70, 150, 70], [300, 50, 60]]} />
      {[88, 64, 44].map((r, i) => <circle key={r} cx="180" cy="100" r={r} fill="#fff" fillOpacity={0.1 + i * 0.08} />)}
      <circle cx="180" cy="100" r="30" fill="#fff" />
      <rect x="167" y="98" width="26" height="20" rx="6" fill={MIDNIGHT} />
      <path d="M172 98v-6a8 8 0 0 1 16 0v6" fill="none" stroke={MIDNIGHT} strokeWidth="4" strokeLinecap="round" />
      <circle cx="180" cy="107" r="2.6" fill="#fff" />
    </svg>
  );
}

/** Decide landing: a question splitting into three routes; one is chosen. */
export function PathsScene(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="scene" viewBox="0 0 360 170" aria-hidden="true" {...props}>
      <SkyWindow w={360} h={170} sun={[0.9, 0.12]} clouds={[[120, 30, 70], [260, 150, 80]]} />
      <path d="M52 85 C110 85 120 40 180 40 H300" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
      <path d="M52 85 C110 85 120 130 180 130 H300" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
      <path className="draw" pathLength={1} d="M52 85 H300" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="52" cy="85" r="13" fill="#fff" />
      <text x="52" y="90" textAnchor="middle" style={{ fontSize: 14, fontWeight: 800, fill: MIDNIGHT, fontFamily: FONT }}>?</text>
      {(['A', 'B', 'C'] as const).map((l, i) => {
        const y = 40 + i * 45;
        const on = l === 'B';
        return (
          <g key={l}>
            <circle cx="300" cy={y} r="14" fill={on ? MIDNIGHT : '#fff'} fillOpacity={on ? 1 : 0.85} />
            <text x="300" y={y + 4.5} textAnchor="middle" style={{ fontSize: 12.5, fontWeight: 750, fill: on ? '#fff' : MIDNIGHT, fontFamily: FONT }}>{l}</text>
          </g>
        );
      })}
    </svg>
  );
}
