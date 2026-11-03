// Data-visualisation kit. Every chart is authored SVG/CSS, labelled directly (no legends where avoidable),
// animated once on mount, and honest about zero baselines and missing data.

import { useId, type ReactNode } from 'react';
import { inr, inrCompact } from '@/utils/format';

const PALETTE = ['var(--seg-1)', 'var(--rain)', 'var(--accent-bright)', 'var(--s2)', 'var(--act)', 'var(--faint)', 'var(--s3)'];
const LINE_COLORS = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];
const LINE_DASH = ['', '5 5', '2 5', '8 3 2 3'];

/** Short axis label: ₹3.1L, ₹1.2Cr, ₹45k. */
export function axisLabel(v: number): string {
  const a = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (a >= 1_00_00_000) return `${sign}₹${(a / 1_00_00_000).toFixed(1)}Cr`;
  if (a >= 1_00_000) return `${sign}₹${(a / 1_00_000).toFixed(1)}L`;
  if (a >= 1000) return `${sign}₹${Math.round(a / 1000)}k`;
  return `${sign}₹${Math.round(a)}`;
}

export interface Series {
  label: string;
  values: number[];
}
export interface ChartEvent {
  index: number;
  label: string;
}

/**
 * Area/line chart. The first series gets a filled area: teal above zero, red below zero, so a shortfall is
 * visible at a glance. Events are vertical markers; the lowest point is called out directly.
 */
export function LineChart({ series, height = 190, xLabels, events = [], zeroLine = true, lowLabel = 'Low' }: { series: Series[]; height?: number; xLabels?: string[]; events?: ChartEvent[]; zeroLine?: boolean; lowLabel?: string }) {
  const uid = useId().replace(/:/g, '');
  const W = 360;
  const H = height;
  const padB = 20;
  const padT = 36;
  const padR = series.length > 1 ? 70 : 6;
  const all = series.flatMap((s) => s.values);
  if (all.length === 0) return <div className="skeleton" style={{ height }} />;
  let min = Math.min(...all, zeroLine ? 0 : Infinity);
  let max = Math.max(...all, zeroLine ? 0 : -Infinity);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const n = Math.max(...series.map((s) => s.values.length));
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * (W - padR));
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);
  const zeroY = y(0);
  const s0 = series[0].values;
  // With several options on one chart, the shaded band is the true range across them at each month.
  const bandHi = Array.from({ length: n }, (_, i) => Math.max(...series.map((s) => s.values[Math.min(i, s.values.length - 1)])));
  const bandLo = Array.from({ length: n }, (_, i) => Math.min(...series.map((s) => s.values[Math.min(i, s.values.length - 1)])));
  const band = series.length > 1 && n > 2 ? `${bandHi.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')} ${bandLo.map((_, i) => `${x(n - 1 - i).toFixed(1)},${y(bandLo[n - 1 - i]).toFixed(1)}`).join(' ')}` : null;
  const pts = (vals: number[]) => vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${x(0)},${zeroY} ${pts(s0)} ${x(s0.length - 1)},${zeroY}`;
  const labelEvery = Math.ceil(n / 6);
  const minIdx = s0.indexOf(Math.min(...s0));
  const lowX = Math.min(Math.max(x(minIdx), 44), W - padR - 44);
  const lowAbove = y(s0[minIdx]) > H / 2;
  // End labels for multi-series charts, nudged apart so they never overlap.
  const ends = series
    .map((s, i) => ({ label: s.label, color: LINE_COLORS[i % LINE_COLORS.length], y: y(s.values[s.values.length - 1]) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Chart: ${series.map((s) => s.label).join(', ')}`}>
      <defs>
        <linearGradient id={`${uid}p`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.38" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id={`${uid}n`} x1="0" x2="0" y1="1" y2="0">
          <stop offset="0%" stopColor="var(--act)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--act)" stopOpacity="0.06" />
        </linearGradient>
        <clipPath id={`${uid}up`}><rect x="-2" y="0" width={W + 4} height={Math.max(0, zeroY)} /></clipPath>
        <clipPath id={`${uid}dn`}><rect x="-2" y={zeroY} width={W + 4} height={Math.max(0, H - zeroY)} /></clipPath>
      </defs>
      {[max, min].map((t, i) => (
        <g key={i}>
          <line x1={0} x2={W - padR + 4} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray="2 5" />
          <text x={0} y={y(t) - 4}>{axisLabel(t)}</text>
        </g>
      ))}
      {band && <polygon points={band} fill="var(--rain)" opacity={0.16} />}
      <polygon points={area} fill={`url(#${uid}p)`} clipPath={`url(#${uid}up)`} />
      <polygon points={area} fill={`url(#${uid}n)`} clipPath={`url(#${uid}dn)`} />
      {zeroLine && min < 0 && max > 0 && <line x1={0} x2={W - padR + 4} y1={zeroY} y2={zeroY} stroke="var(--ink)" strokeWidth={1.2} />}
      {events.map((e) => (
        <g key={e.label + e.index}>
          <line x1={x(e.index)} x2={x(e.index)} y1={padT - 4} y2={H - padB} stroke="var(--ink)" strokeDasharray="2 3" opacity={0.55} />
          <rect x={Math.min(Math.max(x(e.index) - e.label.length * 2.9 - 6, 0), W - padR - e.label.length * 5.8 - 12)} y={2} width={e.label.length * 5.8 + 12} height={16} rx={8} fill="var(--midnight)" />
          <text x={Math.min(Math.max(x(e.index), e.label.length * 2.9 + 6), W - padR - e.label.length * 2.9 - 6)} y={13} textAnchor="middle" style={{ fill: '#fff', fontWeight: 600 }}>{e.label}</text>
        </g>
      ))}
      {series.map((s, si) => (
        <polyline key={s.label} className={si === 0 ? 'draw' : undefined} pathLength={1} points={pts(s.values)} fill="none" stroke={LINE_COLORS[si % LINE_COLORS.length]} strokeWidth={si === 0 ? 3 : 2.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={si === 0 ? undefined : LINE_DASH[si % LINE_DASH.length]} />
      ))}
      {series.length === 1 && s0.length > 2 && (
        <g>
          <circle cx={x(minIdx)} cy={y(s0[minIdx])} r={5} fill="var(--paper)" stroke="var(--ink)" strokeWidth={2.5} />
          <rect x={lowX - 38} y={lowAbove ? y(s0[minIdx]) - 30 : y(s0[minIdx]) + 11} width={76} height={19} rx={9.5} fill="var(--midnight)" />
          <text x={lowX} y={(lowAbove ? y(s0[minIdx]) - 30 : y(s0[minIdx]) + 11) + 13} textAnchor="middle" style={{ fill: '#fff', fontWeight: 600 }}>{lowLabel} {axisLabel(s0[minIdx])}</text>
        </g>
      )}
      <circle cx={x(s0.length - 1)} cy={y(s0[s0.length - 1])} r={5} fill="var(--accent-bright)" stroke="var(--ink)" strokeWidth={2.5} />
      {series.length > 1 &&
        ends.map((e) => (
          <text key={e.label} x={W - padR + 10} y={e.y + 3} style={{ fill: e.color === 'var(--s4)' ? 'var(--muted)' : e.color, fontWeight: 600 }}>{e.label.length > 11 ? e.label.slice(0, 10) + '…' : e.label}</text>
        ))}
      {xLabels?.map((l, i) => (i % labelEvery === 0 ? <text key={i} x={x(i)} y={H - 4} textAnchor="middle">{l}</text> : null))}
    </svg>
  );
}

/** Proportional ribbon with direct value labels. Use `hatch` for locked/illiquid parts. */
export interface RibbonPart {
  label: string;
  value: number;
  color?: string;
  hatch?: boolean;
  note?: string;
}
export function Ribbon({ parts, total, format = inrCompact, legend = true, height = 44, onDark = false }: { parts: RibbonPart[]; total?: number; format?: (n: number) => string; legend?: boolean; height?: number; onDark?: boolean }) {
  const clean = parts.filter((p) => p.value > 0);
  const sum = total ?? clean.reduce((s, p) => s + p.value, 0);
  if (sum <= 0) return <div className="skeleton" style={{ height }} />;
  const colors = onDark ? ['var(--s1)', 'var(--s2)', 'var(--s4)', 'var(--act)', 'var(--faint)', 'var(--rain)'] : PALETTE;
  return (
    <div>
      <div className="ribbon" style={{ height }} role="img" aria-label={clean.map((p) => `${p.label} ${format(p.value)}`).join(', ')}>
        {clean.map((p, i) => {
          const c = p.color ?? colors[i % colors.length];
          const share = p.value / sum;
          const dark = ['var(--seg-1)', 'var(--rain)', 'var(--act)', 'var(--accent)', 'var(--s1)', 'var(--s2)', 'var(--midnight)'].includes(c);
          return (
            <div key={p.label} className={p.hatch ? 'hatch' : ''} style={{ flex: `${p.value} 1 0`, background: c, animationDelay: `${i * 70}ms` }}>
              {share >= 0.12 && <span style={{ position: 'absolute', left: 10, bottom: 7, fontSize: 11, fontWeight: 700, color: dark ? '#fff' : '#0d1b2a', background: p.hatch ? c : 'transparent', borderRadius: 4, padding: p.hatch ? '0 3px' : 0 }}>{Math.round(share * 100)}%</span>}
            </div>
          );
        })}
      </div>
      {legend && (
        <div className="ribbon-legend">
          {clean.map((p, i) => (
            <div key={p.label} className="rl">
              <span className={`sw ${p.hatch ? 'hatch' : ''}`} style={{ background: p.color ?? colors[i % colors.length], boxShadow: onDark ? 'none' : 'inset 0 0 0 1px rgba(17,18,16,0.12)' }} />
              <span>{p.label}{p.note && <span className="caption"> · {p.note}</span>}</span>
              <span className="strong num">{format(p.value)}</span>
              <span className="caption num" style={{ width: 34, textAlign: 'right' }}>{Math.round((p.value / sum) * 100)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Kept for existing call sites: a two-or-three part ribbon. */
export function SplitBar({ parts }: { parts: Array<{ label: string; value: number }> }) {
  return <Ribbon parts={parts} legend height={22} />;
}

/** Months of cover as a row of month-cells. Each cell is one month of essential spending. */
export function Runway({ months, target, light = false }: { months: number; target: number; light?: boolean }) {
  const cells = Math.max(1, Math.min(12, Math.round(target)));
  return (
    <div className={`runway ${light ? 'light' : ''}`} role="img" aria-label={`${months.toFixed(1)} months of cover against a ${target}-month target`}>
      <div className="cells">
        {Array.from({ length: cells }).map((_, i) => {
          const f = Math.max(0, Math.min(1, months - i));
          return (
            <div key={i} className="cell">
              {f > 0 && <i style={{ transform: `scaleX(${f})`, animationDelay: `${i * 70}ms` }} />}
            </div>
          );
        })}
      </div>
      <div className="ticks">
        {Array.from({ length: cells }).map((_, i) => (
          <span key={i}>{i === 0 || i === cells - 1 || (cells > 6 && i % 3 === 0) ? `${i + 1}${i === cells - 1 ? ' mo' : ''}` : ''}</span>
        ))}
      </div>
    </div>
  );
}

export interface DotRow {
  label: string;
  hint?: string;
  lowerIsBetter?: boolean;
  values: Array<{ key: string; value: number | null; display: string; feasible?: boolean }>;
}
/** Strip plot: one row per metric, one dot per option on a shared scale. The best dot is ringed. */
export function DotPlot({ rows }: { rows: DotRow[] }) {
  return (
    <div className="dotplot">
      {rows.map((r) => {
        const nums = r.values.filter((v) => v.value !== null) as Array<{ key: string; value: number; display: string; feasible?: boolean }>;
        if (nums.length === 0) return null;
        const lo = Math.min(...nums.map((v) => v.value));
        const hi = Math.max(...nums.map((v) => v.value));
        const feas = nums.filter((v) => v.feasible !== false);
        const spread = hi - lo;
        const best = spread === 0 || feas.length < 2 ? null : feas.reduce((a, b) => (r.lowerIsBetter ? (b.value < a.value ? b : a) : b.value > a.value ? b : a)).key;
        const bestV = nums.find((v) => v.key === best);
        return (
          <div key={r.label} className="dp-row">
            <div className="dp-head">
              <b>{r.label}</b>
              <span>{bestV ? `Best: ${bestV.key} · ${bestV.display}` : spread === 0 ? 'Same in all' : ''}</span>
            </div>
            <div className="dp-track">
              {nums.map((v) => (
                <div key={v.key} className={`dp-dot ${v.key === best ? 'best' : ''} ${v.feasible === false ? 'off' : ''}`} style={{ left: `${spread === 0 ? 50 : ((v.value - lo) / spread) * 100}%` }} title={`${v.key}: ${v.display}`}>
                  {v.key}
                </div>
              ))}
            </div>
            <div className="dp-vals">
              {r.values.map((v) => (
                <span key={v.key} style={{ opacity: v.feasible === false ? 0.55 : 1 }}><b>{v.key}</b>{v.display}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Diverging monthly net cash-flow bars: teal above zero, red below. */
export function CashflowBars({ values, labels, height = 150 }: { values: number[]; labels?: string[]; height?: number }) {
  if (values.length === 0) return <div className="skeleton" style={{ height }} />;
  const W = 360;
  const padT = 14;
  const padB = 18;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const zeroY = padT + (max / span) * (height - padT - padB);
  const bw = Math.min(18, (W / values.length) * 0.62);
  const step = W / values.length;
  const every = Math.ceil(values.length / 6);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${height}`} role="img" aria-label="Monthly net cash flow">
      <line x1={0} x2={W} y1={zeroY} y2={zeroY} stroke="var(--ink)" strokeWidth={1.2} />
      {values.map((v, i) => {
        const h = Math.max(2, (Math.abs(v) / span) * (height - padT - padB));
        const cx = step * i + step / 2;
        return (
          <g key={i}>
            <rect x={cx - bw / 2} y={v >= 0 ? zeroY - h : zeroY} width={bw} height={h} rx={Math.min(7, bw / 2)} fill={v >= 0 ? 'var(--accent)' : 'var(--act)'} stroke="none" strokeWidth={v >= 0 ? 1 : 0}>
              <title>{inr(v)}</title>
            </rect>
            {labels && i % every === 0 && <text x={cx} y={height - 4} textAnchor="middle">{labels[i]}</text>}
          </g>
        );
      })}
      <text x={0} y={10}>{axisLabel(max)}</text>
      {min < 0 && <text x={0} y={height - padB - 2}>{axisLabel(min)}</text>}
    </svg>
  );
}

/** Goal path: today's savings → target, with the pace needed and the pace planned. */
export function PathToTarget({ saved, target, months, planned, required, height = 190 }: { saved: number; target: number; months: number; planned: number | null; required: number | null; height?: number }) {
  const W = 360;
  const padL = 4;
  const padR = 62;
  const padT = 22;
  const padB = 22;
  const horizon = Math.max(months, 1);
  const top = target * 1.06;
  const x = (m: number) => padL + (m / horizon) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / top) * (height - padT - padB);
  const plannedEnd = planned === null ? null : Math.min(top, saved + planned * horizon);
  const reachM = planned && planned > 0 ? Math.min(horizon, Math.max(0, (target - saved) / planned)) : null;
  const endM = reachM !== null && plannedEnd !== null && plannedEnd >= target ? reachM : horizon;
  const endV = plannedEnd !== null && plannedEnd >= target ? target : plannedEnd;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${height}`} role="img" aria-label="Path to goal target">
      <line x1={padL} x2={W - padR + 6} y1={y(target)} y2={y(target)} stroke="var(--ink)" strokeDasharray="2 4" />
      <text x={W - padR + 10} y={y(target) + 3} className="lbl-strong">{axisLabel(target)}</text>
      <text x={padL} y={y(target) - 6}>Target</text>
      {required !== null && <line x1={x(0)} y1={y(saved)} x2={x(horizon)} y2={y(target)} stroke="var(--ink)" strokeWidth={2} strokeDasharray="6 5" />}
      {endV !== null && <polyline className="draw" pathLength={1} points={`${x(0)},${y(saved)} ${x(endM)},${y(endV)}`} fill="none" stroke="var(--accent)" strokeWidth={4.5} strokeLinecap="round" />}
      {endV !== null && <circle cx={x(endM)} cy={y(endV)} r={6} fill="var(--accent-bright)" stroke="var(--ink)" strokeWidth={2.5} />}
      <circle cx={x(0)} cy={y(saved)} r={6} fill="var(--ink)" />
      <text x={x(0) + 2} y={y(saved) + 22} className="lbl-strong">Today {axisLabel(saved)}</text>
      <text x={x(horizon)} y={height - 5} textAnchor="end">{months} mo</text>
      <text x={padL} y={height - 5}>Now</text>
      {required !== null && <text x={W - padR + 10} y={y(target) + 20} style={{ fontWeight: 600 }}>Needs {axisLabel(required)}/mo</text>}
      {planned !== null && <text x={W - padR + 10} y={y(target) + 33} style={{ fill: 'var(--accent-ink)', fontWeight: 600 }}>Plan {axisLabel(planned)}/mo</text>}
    </svg>
  );
}

/** Net worth line drawn straight on the sky. */
export function HeroSparkline({ values, height = 84 }: { values: number[]; height?: number }) {
  const uid = useId().replace(/:/g, '');
  if (values.length < 2) return null;
  const W = 360;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => (i / (values.length - 1)) * W;
  const y = (v: number) => 8 + (1 - (v - min) / span) * (height - 16);
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" style={{ height }} aria-hidden="true">
      <defs>
        <linearGradient id={uid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline className="draw" pathLength={1} points={pts} fill="none" stroke="var(--accent)" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Horizontal ranked bars with direct values. */
export function BarList({ items, total }: { items: Array<{ label: string; value: number; sub?: string }>; total?: number }) {
  const max = total ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="stack">
      {items.map((i) => (
        <div key={i.label} className="bar-row">
          <span>{i.label} {i.sub && <span className="caption">· {i.sub}</span>}</span>
          <span className="num strong">{inrCompact(i.value)}</span>
          <div className="bar"><div style={{ width: `${Math.max(1.5, (i.value / max) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export function ChartCard({ title, caption, children }: { title: string; caption?: ReactNode; children: ReactNode }) {
  return (
    <div className="card">
      <div className="row-between mb-8"><span className="strong">{title}</span>{caption && <span className="caption">{caption}</span>}</div>
      {children}
    </div>
  );
}
