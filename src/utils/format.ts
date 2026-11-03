// Currency, number and date formatting using Indian conventions.

const fullFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** Full INR with Indian grouping: ₹2,50,000 */
export function inr(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const sign = value < 0 ? '−' : '';
  return `${sign}₹${fullFmt.format(Math.round(Math.abs(value)))}`;
}

/** Fixed decimals with trailing fractional zeros removed (never touches integer zeros: 50 stays 50). */
function trim(n: number, digits: number): string {
  const s = n.toFixed(digits);
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}

/** Compact INR: ₹85,000 · ₹1.25 lakh · ₹12.5 lakh · ₹1.2 crore */
export function inrCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  if (abs >= 1_00_00_000) return `${sign}₹${trim(abs / 1_00_00_000, 2)} crore`;
  if (abs >= 1_00_000) return `${sign}₹${trim(abs / 1_00_000, 2)} lakh`;
  return inr(value);
}

export function groupDigits(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '';
  return fullFmt.format(value);
}

export function pct(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${trim(value * 100, digits)}%`;
}

export function months(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const v = Number(trim(value, digits));
  return `${v} ${v === 1 ? 'month' : 'months'}`;
}

export function tenure(monthsCount: number | null | undefined): string {
  if (monthsCount === null || monthsCount === undefined) return '—';
  const y = Math.floor(monthsCount / 12);
  const m = Math.round(monthsCount % 12);
  if (y === 0) return `${m} mo`;
  if (m === 0) return `${y} yr`;
  return `${y} yr ${m} mo`;
}

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const monthFmt = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' });

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return dateFmt.format(new Date(iso));
}
export function fmtShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return shortDate.format(new Date(iso));
}
export function fmtMonth(iso: string | null | undefined): string {
  if (!iso) return '—';
  return monthFmt.format(new Date(iso));
}

export function relativeTime(iso: string, now = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return fmtDate(iso);
}

export function monthLabelFromNow(offset: number, now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' }).format(d);
}

/** Parse a user-typed amount ("12 lakh", "1.2 crore", "50k", "₹2,50,000") into rupees. */
export function parseAmount(text: string): number | null {
  const t = text.toLowerCase().replace(/,/g, '').replace(/₹|rs\.?|inr/g, ' ');
  const m = t.match(/(\d+(?:\.\d+)?)\s*(crore|cr|lakhs?|lacs?|l\b|k\b|thousand)?/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2] ?? '';
  if (unit.startsWith('cr')) return Math.round(n * 1_00_00_000);
  if (unit.startsWith('lakh') || unit.startsWith('lac') || unit === 'l') return Math.round(n * 1_00_000);
  if (unit === 'k' || unit === 'thousand') return Math.round(n * 1000);
  return Math.round(n);
}
