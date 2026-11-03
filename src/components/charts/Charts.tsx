// Data-visualisation kit, Sky style. Quiet chrome, loud data:
// solid hairline grids, 2px lines over a soft wash, thin rounded bars with 2px surface gaps,
// markers with a surface ring, sparing direct labels in text tokens (never in the series colour),
// and a crosshair + tooltip on every plot (pointer and keyboard). Series colours come from
// --s1..--s3 (validated for colour-vision deficiency in light and night); --s4 is the neutral "other".

import { useId, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { inr, inrCompact } from '@/utils/format';

const SERIES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];

/** Short axis label: ₹3.1L, ₹1.2Cr, ₹45k. */
export function axisLabel(v: number): string {
  const a = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (a >= 1_00_00_000) return `${sign}₹${(a / 1_00_00_000).toFixed(1)}Cr`;
  if (a >= 1_00_000) return `${sign}₹${(a / 1_00_000).toFixed(1)}L`;
  if (a >= 1000) return `${sign}₹${Math.round(a / 1000)}k`;
  return `${sign}₹${Math.round(a)}`;
}

/** Clean tick values (1, 2, 2.5, 5 × 10ⁿ) covering [min, max], at most ~4 lines. */
function niceTicks(min: number, max: number, count = 3): number[] {
  const span = max - min || Math.abs(max) || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v));
  return out;
}

/** Monotone cubic path through points (Fritsch-Carlson): smooth, but never overshoots the data. */
function smooth(p: Array<[number, number]>): string {
  if (p.length < 3) return p.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const n = p.length;
  const d = p.slice(0, -1).map(([x, y], i) => (p[i + 1][1] - y) / (p[i + 1][0] - x || 1));
  const m = p.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  let out = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = (p[i + 1][0] - p[i][0]) / 3;
    out += ` C${(p[i][0] + dx).toFixed(1)},${(p[i][1] + m[i] * dx).toFixed(1)} ${(p[i + 1][0] - dx).toFixed(1)},${(p[i + 1][1] - m[i + 1] * dx).toFixed(1)} ${p[i + 1][0].toFixed(1)},${p[i + 1][1].toFixed(1)}`;
  }
  return out;
}

export interface Series {
  label: string;
  values: number[];
}
export interface ChartEvent {
  index: number;
  label: string;
}

/** Index under the pointer, snapped to the nearest data position. */
function useCrosshair(n: number, plotW: number, W: number) {
  const [at, setAt] = useState<number | null>(null);
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setAt(Math.max(0, Math.min(n - 1, Math.round((px / plotW) * (n - 1)))));
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowRight') setAt((a) => Math.min(n - 1, (a ?? -1) + 1));
    else if (e.key === 'ArrowLeft') setAt((a) => Math.max(0, (a ?? n) - 1));
    else if (e.key === 'Escape') setAt(null);
  };
  return { at, setAt, onMove, onKey };
}

function Tooltip({ x, title, rows }: { x: number; title: string; rows: Array<{ color: string; value: string; label: string; dashed?: boolean }> }) {
  const edge = x > 58 ? 'right' : 'mid';
  return (
    <div className={`viz-tip ${edge}`} style={{ left: `${x}%` }} role="status">
      <div className="viz-tip-title">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="viz-tip-row">
          <i className={r.dashed ? 'dashed' : ''} style={{ color: r.color }} />
          <b>{r.value}</b>
          <span>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

function LineLegend({ items }: { items: Array<{ label: string; color: string; dashed?: boolean }> }) {
  return (
    <div className="viz-legend">
      {items.map((s) => (
        <span key={s.label}><i className={s.dashed ? 'dashed' : ''} style={{ color: s.color }} />{s.label}</span>
      ))}
    </div>
  );
}

/**
 * Line chart. One series gets a soft wash (blue above zero, red below, so a shortfall reads at a glance).
 * Several series get a legend, end dots, and a faint band showing the range between them.
 * Events are hairline markers with a text label; the lowest point is called out directly.
 */
export function LineChart({ series, height = 190, xLabels, events = [], zeroLine = true, lowLabel = 'Low' }: { series: Series[]; height?: number; xLabels?: string[]; events?: ChartEvent[]; zeroLine?: boolean; lowLabel?: string }) {
  const uid = useId().replace(/:/g, '');
  const W = 360;
  const H = height;
  const padT = events.length ? 30 : 16;
  const padB = 22;
  const padR = 6;
  const all = series.flatMap((s) => s.values);
  const n = Math.max(0, ...series.map((s) => s.values.length));
  const plotW = W - padR;
  const ch = useCrosshair(n, plotW, W);
  if (all.length === 0) return <div className="skeleton" style={{ height }} />;
  const rawMin = Math.min(...all, zeroLine ? 0 : Infinity);
  const rawMax = Math.max(...all, zeroLine ? 0 : -Infinity);
  const ticks = niceTicks(rawMin, rawMax === rawMin ? rawMin + 1 : rawMax);
  const min = ticks[0];
  const max = ticks[ticks.length - 1];
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * plotW);
  const y = (v: number) => padT + (1 - (v - min) / (max - min || 1)) * (H - padT - padB);
  const zeroY = y(0);
  const s0 = series[0].values;
  const xy = (vals: number[]) => vals.map((v, i) => [x(i), y(v)] as [number, number]);
  const line = (vals: number[]) => smooth(xy(vals));
  const area = `${line(s0)} L${x(s0.length - 1)},${zeroY} L${x(0)},${zeroY} Z`;
  const labelEvery = Math.ceil(n / 5);
  const single = series.length === 1;
  const minIdx = s0.indexOf(Math.min(...s0));
  const lowAbove = y(s0[minIdx]) > (padT + H - padB) / 2;
  const lowX = Math.min(Math.max(x(minIdx), 30), plotW - 30);
  const at = (s: number[], i: number) => s[Math.min(i, s.length - 1)];
  const bandHi = Array.from({ length: n }, (_, i) => Math.max(...series.map((s) => at(s.values, i))));
  const bandLo = Array.from({ length: n }, (_, i) => Math.min(...series.map((s) => at(s.values, i))));
  const band = !single && n > 2 ? `${line(bandHi)} L${smooth(xy(bandLo).reverse()).slice(1)} Z` : null;
  const hov = ch.at;
  return (
    <div className="viz">
      {!single && <LineLegend items={series.map((s, i) => ({ label: s.label, color: SERIES[i % SERIES.length] }))} />}
      <div className="viz-plot">
        <svg
          className="chart"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          tabIndex={0}
          aria-label={`Chart: ${series.map((s) => s.label).join(', ')}. Use left and right arrow keys to read values.`}
          onPointerMove={ch.onMove}
          onPointerLeave={() => ch.setAt(null)}
          onKeyDown={ch.onKey}
          onBlur={() => ch.setAt(null)}
        >
          <defs>
            <linearGradient id={`${uid}p`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--s1)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--s1)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={`${uid}n`} x1="0" x2="0" y1="1" y2="0">
              <stop offset="0%" stopColor="var(--act)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--act)" stopOpacity="0.03" />
            </linearGradient>
            <clipPath id={`${uid}up`}><rect x="-2" y="0" width={W + 4} height={Math.max(0, zeroY)} /></clipPath>
            <clipPath id={`${uid}dn`}><rect x="-2" y={zeroY} width={W + 4} height={Math.max(0, H - zeroY)} /></clipPath>
          </defs>
          {ticks.map((t) => (
            <g key={t} className="viz-grid">
              <line x1={0} x2={plotW} y1={y(t)} y2={y(t)} className={t === 0 && min < 0 ? 'zero' : ''} />
              <text x={0} y={y(t) - 5}>{axisLabel(t)}</text>
            </g>
          ))}
          {band && <path d={band} fill="var(--s1)" opacity={0.07} />}
          {single && <path d={area} fill={`url(#${uid}p)`} clipPath={`url(#${uid}up)`} />}
          {single && <path d={area} fill={`url(#${uid}n)`} clipPath={`url(#${uid}dn)`} />}
          {events.map((e) => {
            const ex = x(e.index);
            const anchor = ex < 40 ? 'start' : ex > plotW - 40 ? 'end' : 'middle';
            return (
              <g key={e.label + e.index} className="viz-event">
                <line x1={ex} x2={ex} y1={padT - 8} y2={H - padB} />
                <circle cx={ex} cy={padT - 8} r={2.5} />
                <text x={ex + (anchor === 'start' ? -2 : anchor === 'end' ? 2 : 0)} y={10} textAnchor={anchor}>{e.label}</text>
              </g>
            );
          })}
          {series.map((s, si) => (
            <path key={s.label} className="draw" pathLength={1} d={line(s.values)} fill="none" stroke={SERIES[si % SERIES.length]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {single && s0.length > 2 && minIdx > 0 && minIdx < s0.length - 1 && (
            <g className="viz-callout">
              <circle cx={x(minIdx)} cy={y(s0[minIdx])} r={4} fill="var(--solid)" stroke="var(--s1)" strokeWidth={2} />
              <text x={lowX} y={lowAbove ? y(s0[minIdx]) - 11 : y(s0[minIdx]) + 18} textAnchor="middle">{lowLabel} {axisLabel(s0[minIdx])}</text>
            </g>
          )}
          {series.map((s, si) => (
            <circle key={s.label} cx={x(s.values.length - 1)} cy={y(s.values[s.values.length - 1])} r={4.5} fill={SERIES[si % SERIES.length]} stroke="var(--solid)" strokeWidth={2} />
          ))}
          {single && (
            <text className="viz-end" x={plotW} y={y(s0[s0.length - 1]) - 10} textAnchor="end">{axisLabel(s0[s0.length - 1])}</text>
          )}
          {hov !== null && (
            <g className="viz-cross">
              <line x1={x(hov)} x2={x(hov)} y1={padT - 4} y2={H - padB} />
              {series.map((s, si) => (
                <circle key={s.label} cx={x(hov)} cy={y(at(s.values, hov))} r={4.5} fill={SERIES[si % SERIES.length]} stroke="var(--solid)" strokeWidth={2} />
              ))}
            </g>
          )}
          {xLabels?.map((l, i) => (i % labelEvery === 0 ? <text key={i} className="viz-x" x={x(i)} y={H - 4} textAnchor={i === 0 ? 'start' : 'middle'}>{l}</text> : null))}
          <rect x={0} y={0} width={W} height={H} fill="transparent" />
        </svg>
        {hov !== null && (
          <Tooltip
            x={(x(hov) / W) * 100}
            title={xLabels?.[hov] ?? `Month ${hov + 1}`}
            rows={series.map((s, si) => ({ color: SERIES[si % SERIES.length], value: inr(at(s.values, hov)), label: s.label }))}
          />
        )}
      </div>
    </div>
  );
}

/** One whole split into parts: a thin rounded bar with 2px gaps, the legend carries names and numbers. */
export interface RibbonPart {
  label: string;
  value: number;
  color?: string;
  hatch?: boolean;
  note?: string;
}
export function Ribbon({ parts, total, format = inrCompact, legend = true, height = 10 }: { parts: RibbonPart[]; total?: number; format?: (n: number) => string; legend?: boolean; height?: number; onDark?: boolean }) {
  const [hover, setHover] = useState<string | null>(null);
  const clean = parts.filter((p) => p.value > 0);
  const sum = total ?? clean.reduce((s, p) => s + p.value, 0);
  const h = Math.min(height, 12);
  if (sum <= 0) return <div className="skeleton" style={{ height: h }} />;
  const color = (p: RibbonPart, i: number) => p.color ?? SERIES[i % SERIES.length];
  const share = (v: number) => Math.round((v / sum) * 100);
  const hp = clean.find((p) => p.label === hover);
  return (
    <div className="viz">
      <div className="seg" style={{ height: h }} role="img" aria-label={clean.map((p) => `${p.label} ${format(p.value)}, ${share(p.value)}%`).join('; ')}>
        {clean.map((p, i) => (
          <div
            key={p.label}
            className={`seg-part ${p.hatch ? 'hatch' : ''} ${hover && hover !== p.label ? 'dim' : ''}`}
            style={{ flex: `${p.value} 1 0`, background: color(p, i), animationDelay: `${i * 60}ms` }}
            onPointerEnter={() => setHover(p.label)}
            onPointerLeave={() => setHover(null)}
            title={`${p.label}: ${format(p.value)} (${share(p.value)}%)`}
          />
        ))}
      </div>
      {hp && !legend && <div className="seg-read"><b>{format(hp.value)}</b> {hp.label} · {share(hp.value)}%</div>}
      {legend && (
        <div className="seg-legend">
          {clean.map((p, i) => (
            <div key={p.label} className={`seg-row ${hover === p.label ? 'on' : ''}`} onPointerEnter={() => setHover(p.label)} onPointerLeave={() => setHover(null)}>
              <i className={p.hatch ? 'hatch' : ''} style={{ background: color(p, i) }} />
              <span>{p.label}{p.note && <span className="caption"> · {p.note}</span>}</span>
              <b className="num">{format(p.value)}</b>
              <span className="caption num">{share(p.value)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Kept for existing call sites: a two-or-three part split. */
export function SplitBar({ parts }: { parts: Array<{ label: string; value: number }> }) {
  return <Ribbon parts={parts} legend />;
}

/** Months of cover as a segmented meter: one segment per month of the target, filled to today's cover. */
export function Runway({ months, target }: { months: number; target: number; light?: boolean }) {
  const cells = Math.max(1, Math.min(12, Math.round(target)));
  return (
    <div className="meter" role="img" aria-label={`${months.toFixed(1)} months of cover against a ${target}-month target`}>
      <div className="meter-cells">
        {Array.from({ length: cells }).map((_, i) => {
          const f = Math.max(0, Math.min(1, months - i));
          return (
            <div key={i} className="meter-cell">
              {f > 0 && <i style={{ transform: `scaleX(${f})`, animationDelay: `${i * 60}ms` }} />}
            </div>
          );
        })}
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
const keyColor = (key: string) => SERIES[Math.max(0, key.charCodeAt(0) - 65) % 3];

/** Strip plot: one row per metric, one dot per option on a shared scale. The better option stays bright; the rest step back. */
export function DotPlot({ rows }: { rows: DotRow[] }) {
  const keys = Array.from(new Set(rows.flatMap((r) => r.values.map((v) => v.key))));
  return (
    <div className="dotplot">
      <LineLegend items={keys.map((k) => ({ label: `Option ${k}`, color: keyColor(k) }))} />
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
              <span>{bestV ? <>Better: <strong>{bestV.key}</strong> · {bestV.display}</> : spread === 0 ? 'Same for all' : ''}</span>
            </div>
            <div className="dp-track">
              {nums.map((v) => (
                <div
                  key={v.key}
                  className={`dp-dot ${v.key === best ? 'best' : best ? 'rest' : ''} ${v.feasible === false ? 'off' : ''}`}
                  style={{ left: `${spread === 0 ? 50 : ((v.value - lo) / spread) * 100}%`, background: v.feasible === false ? undefined : keyColor(v.key) }}
                  title={`${v.key}: ${v.display}`}
                >
                  {v.key}
                </div>
              ))}
            </div>
            <div className="dp-vals">
              {r.values.map((v) => (
                <span key={v.key} style={{ opacity: v.feasible === false ? 0.55 : 1 }}><i style={{ background: keyColor(v.key) }} /><b>{v.key}</b>{v.display}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Diverging monthly net cash flow: thin columns rounded at the data end, blue above zero, red below. */
export function CashflowBars({ values, labels, height = 150 }: { values: number[]; labels?: string[]; height?: number }) {
  const [hov, setHov] = useState<number | null>(null);
  if (values.length === 0) return <div className="skeleton" style={{ height }} />;
  const W = 360;
  const padT = 18;
  const padB = 22;
  const ticks = niceTicks(Math.min(...values, 0), Math.max(...values, 1), 2);
  const max = ticks[ticks.length - 1];
  const min = ticks[0];
  const y = (v: number) => padT + (1 - (v - min) / (max - min || 1)) * (height - padT - padB);
  const zeroY = y(0);
  const step = W / values.length;
  const bw = Math.min(12, step * 0.56);
  const r = Math.min(3, bw / 2);
  const every = Math.ceil(values.length / 5);
  const bar = (cx: number, v: number) => {
    const top = y(Math.max(v, 0));
    const bot = y(Math.min(v, 0));
    const hgt = Math.max(2, bot - top);
    const x0 = cx - bw / 2;
    return v >= 0
      ? `M${x0},${top + hgt} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + bw - r} Q${x0 + bw},${top} ${x0 + bw},${top + r} V${top + hgt} Z`
      : `M${x0},${zeroY} V${zeroY + hgt - r} Q${x0},${zeroY + hgt} ${x0 + r},${zeroY + hgt} H${x0 + bw - r} Q${x0 + bw},${zeroY + hgt} ${x0 + bw},${zeroY + hgt - r} V${zeroY} Z`;
  };
  return (
    <div className="viz">
      <div className="viz-plot">
        <svg className="chart" viewBox={`0 0 ${W} ${height}`} role="img" aria-label="Monthly net cash flow" onPointerLeave={() => setHov(null)}>
          {ticks.map((t) => (
            <g key={t} className="viz-grid">
              <line x1={0} x2={W} y1={y(t)} y2={y(t)} className={t === 0 ? 'zero' : ''} />
              <text x={0} y={y(t) - 5}>{axisLabel(t)}</text>
            </g>
          ))}
          {values.map((v, i) => {
            const cx = step * i + step / 2;
            return (
              <g key={i} onPointerEnter={() => setHov(i)}>
                <rect x={step * i} y={padT} width={step} height={height - padT - padB} fill="transparent" />
                <path d={bar(cx, v)} fill={v >= 0 ? 'var(--s1)' : 'var(--act)'} opacity={hov === null || hov === i ? 1 : 0.35} style={{ transition: 'opacity 0.15s' }} />
                {labels && i % every === 0 && <text className="viz-x" x={cx} y={height - 4} textAnchor="middle">{labels[i]}</text>}
              </g>
            );
          })}
        </svg>
        {hov !== null && (
          <Tooltip x={((step * hov + step / 2) / W) * 100} title={labels?.[hov] ?? `Month ${hov + 1}`} rows={[{ color: values[hov] >= 0 ? 'var(--s1)' : 'var(--act)', value: inr(values[hov]), label: values[hov] >= 0 ? 'Surplus' : 'Shortfall' }]} />
        )}
      </div>
    </div>
  );
}

/** Goal path: today's savings to the target, the pace you plan against the pace you need. */
export function PathToTarget({ saved, target, months, planned, required, height = 180 }: { saved: number; target: number; months: number; planned: number | null; required: number | null; height?: number }) {
  const uid = useId().replace(/:/g, '');
  const W = 360;
  const padT = 22;
  const padB = 22;
  const padR = 6;
  const horizon = Math.max(months, 1);
  const top = target * 1.08;
  const x = (m: number) => (m / horizon) * (W - padR);
  const y = (v: number) => padT + (1 - v / top) * (height - padT - padB);
  const plannedEnd = planned === null ? null : Math.min(top, saved + planned * horizon);
  const reachM = planned && planned > 0 ? Math.min(horizon, Math.max(0, (target - saved) / planned)) : null;
  const endM = reachM !== null && plannedEnd !== null && plannedEnd >= target ? reachM : horizon;
  const endV = plannedEnd !== null && plannedEnd >= target ? target : plannedEnd;
  return (
    <div className="viz">
      <LineLegend
        items={[
          ...(planned !== null ? [{ label: `Your plan ${axisLabel(planned)}/mo`, color: 'var(--s1)' }] : []),
          ...(required !== null ? [{ label: `Needed ${axisLabel(required)}/mo`, color: 'var(--ink-3)', dashed: true }] : []),
        ]}
      />
      <svg className="chart" viewBox={`0 0 ${W} ${height}`} role="img" aria-label={`Path to goal: ${axisLabel(saved)} saved of ${axisLabel(target)}`}>
        <defs>
          <linearGradient id={`${uid}w`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--s1)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--s1)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <g className="viz-grid">
          <line x1={0} x2={W - padR} y1={y(target)} y2={y(target)} />
          <line x1={0} x2={W - padR} y1={y(0)} y2={y(0)} />
        </g>
        <text className="viz-end" x={W - padR} y={y(target) - 7} textAnchor="end">Target {axisLabel(target)}</text>
        {endV !== null && <polygon points={`${x(0)},${y(0)} ${x(0)},${y(saved)} ${x(endM)},${y(endV)} ${x(endM)},${y(0)}`} fill={`url(#${uid}w)`} />}
        {required !== null && <line x1={x(0)} y1={y(saved)} x2={x(horizon)} y2={y(target)} stroke="var(--ink-3)" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="4 4" strokeLinecap="round" />}
        {endV !== null && <polyline className="draw" pathLength={1} points={`${x(0)},${y(saved)} ${x(endM)},${y(endV)}`} fill="none" stroke="var(--s1)" strokeWidth={2} strokeLinecap="round" />}
        {endV !== null && <circle cx={x(endM)} cy={y(endV)} r={4.5} fill="var(--s1)" stroke="var(--solid)" strokeWidth={2} />}
        <circle cx={x(0) + 5} cy={y(saved)} r={4.5} fill="var(--ink)" stroke="var(--solid)" strokeWidth={2} />
        <text className="viz-end" x={x(0)} y={Math.min(y(saved) + 20, height - 26)}>Today {axisLabel(saved)}</text>
        <text className="viz-x" x={0} y={height - 4}>Now</text>
        <text className="viz-x" x={W - padR} y={height - 4} textAnchor="end">{months} months</text>
      </svg>
    </div>
  );
}

/** Net worth line drawn straight on the sky, with a soft wash and the current point marked. */
export function HeroSparkline({ values, height = 84 }: { values: number[]; height?: number }) {
  const uid = useId().replace(/:/g, '');
  if (values.length < 2) return null;
  const W = 360;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => 4 + (i / (values.length - 1)) * (W - 12);
  const y = (v: number) => 8 + (1 - (v - min) / span) * (height - 16);
  const d = smooth(values.map((v, i) => [x(i), y(v)] as [number, number]));
  const last = values.length - 1;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id={uid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--s1)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--s1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${x(last)},${height} L${x(0)},${height} Z`} fill={`url(#${uid})`} />
      <path className="draw" pathLength={1} d={d} fill="none" stroke="var(--s1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(last)} cy={y(values[last])} r={4.5} fill="var(--s1)" stroke="var(--solid)" strokeWidth={2} />
    </svg>
  );
}

/** Horizontal ranked bars: thin, one colour, value at the end. */
export function BarList({ items, total }: { items: Array<{ label: string; value: number; sub?: string }>; total?: number }) {
  const max = total ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="bar-list">
      {items.map((i) => (
        <div key={i.label} className="bar-row" title={`${i.label}: ${inr(i.value)}`}>
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
