import { AlertTriangle, Info, type LucideIcon } from '@/components/icons';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useApp } from '@/hooks/useAppState';
import type { Source } from '@/types';
import { inr, inrCompact } from '@/utils/format';

/** Eases a number up from its previous value (or 0) once on change. Skips motion when the user prefers reduced motion. */
function useCountUp(target: number | null | undefined, enabled: boolean): number | null | undefined {
  const [shown, setShown] = useState<number | null | undefined>(enabled ? 0 : target);
  const from = useRef(0);
  useEffect(() => {
    if (!enabled || target === null || target === undefined) return setShown(target);
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setShown(target);
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 900);
      const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setShown(a + (target - a) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, enabled]);
  return shown;
}

/** Renders an amount, respecting "hide sensitive balances". `animate` counts the number up on mount. */
export function Money({ value: raw, compact, className, signed, animate }: { value: number | null | undefined; compact?: boolean; className?: string; signed?: boolean; animate?: boolean }) {
  const { state } = useApp();
  const value = useCountUp(raw, !!animate);
  if (state.prefs.hideBalances) return <span className={`num ${className ?? ''}`} aria-label="Hidden amount">₹ ••••</span>;
  if (value === null || value === undefined) return <span className={`num muted ${className ?? ''}`}>Not available</span>;
  const useCompact = compact ?? false;
  const txt = useCompact ? inrCompact(value) : inr(value);
  return <span className={`num ${className ?? ''}`}>{signed && value > 0 ? '+' : ''}{txt}</span>;
}

const SOURCE_LABEL: Record<Source | 'missing' | 'illustrative', string> = {
  connected: 'Connected',
  manual: 'Manual',
  estimated: 'Estimated',
  calculated: 'Calculated',
  missing: 'Missing',
  illustrative: 'Illustrative',
};

export function SourceTag({ source }: { source: Source | 'missing' | 'illustrative' }) {
  const cls = source === 'missing' ? 'warn' : source === 'estimated' || source === 'illustrative' ? 'dashed' : '';
  return <span className={`tag ${cls}`}>{SOURCE_LABEL[source]}</span>;
}

export function Banner({ children, tone = 'info', icon, action }: { children: ReactNode; tone?: 'info' | 'warn' | 'outline'; icon?: LucideIcon; action?: ReactNode }) {
  const Icon = icon ?? (tone === 'warn' ? AlertTriangle : Info);
  return (
    <div className={`banner ${tone === 'info' ? '' : tone}`}>
      <Icon size={16} className="b-icon" />
      <div className="flex-1">{children}</div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="ph">
        <Icon size={26} />
      </div>
      <div className="h3">{title}</div>
      {body && <p className="muted" style={{ fontSize: 14, maxWidth: 300 }}>{body}</p>}
      {action}
    </div>
  );
}

export function Loading({ label = 'Calculating…', sub }: { label?: string; sub?: string }) {
  return (
    <div className="empty" style={{ paddingTop: 80 }}>
      <div className="spinner" />
      <div className="h3">{label}</div>
      {sub && <p className="muted" style={{ fontSize: 13 }}>{sub}</p>}
      <div className="stack-sm" style={{ width: '100%', marginTop: 24 }}>
        <div className="skeleton" style={{ height: 70 }} />
        <div className="skeleton" style={{ height: 70 }} />
        <div className="skeleton" style={{ height: 120 }} />
      </div>
    </div>
  );
}

export function ProgressBar({ value, thin }: { value: number | null; thin?: boolean }) {
  const v = Math.max(0, Math.min(1, value ?? 0));
  return (
    <div className={`progress ${thin ? 'thin' : ''}`} role="progressbar" aria-valuenow={Math.round(v * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ width: `${v * 100}%` }} />
    </div>
  );
}

/** Explains a figure that is incomplete or estimated. */
export function CalcNote({ missing, estimated }: { missing: number; estimated?: boolean }) {
  if (!missing && !estimated) return null;
  return (
    <span className="caption">
      {missing ? `${missing} value${missing > 1 ? 's' : ''} missing · ` : ''}
      {estimated ? 'includes estimates' : 'partial total'}
    </span>
  );
}
