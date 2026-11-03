// Product glimpses: instead of drawn scenes, the first screens show the product doing its job,
// as a small stack of frosted cards floating on the sky. Figures are illustrative examples.

import { Check, ChevronRight, Lock, MessageSquareText } from '@/components/icons';
import { Car, HandCoins, PiggyBank } from '@/components/icons';

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

/** A small smooth line for glimpse cards. */
function MiniLine({ values, w = 150, h = 40 }: { values: number[]; w?: number; h?: number }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (i: number) => 3 + (i / (values.length - 1)) * (w - 10);
  const y = (v: number) => 4 + (1 - (v - min) / (max - min || 1)) * (h - 10);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = values.length - 1;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="g-line">
      <path d={`${d} L${x(last)},${h} L${x(0)},${h} Z`} className="g-line-wash" />
      <path d={d} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="g-line-stroke" />
      <circle cx={x(last)} cy={y(values[last])} r="3.5" className="g-line-dot" />
    </svg>
  );
}

/** Welcome and completion: a question, the options it opens up, and what each one does to savings. */
export function DecisionGlimpse() {
  return (
    <div className="glimpse" aria-hidden="true">
      <div className="g-card g-ask">
        <MessageSquareText size={16} />
        <span>Can I afford a ₹12 lakh car?</span>
      </div>
      <div className="g-card g-options">
        <div className="g-title">Your options</div>
        {[
          { k: 'A', icon: Car, name: 'Buy now', level: 'prepare', word: 'Tight' },
          { k: 'B', icon: PiggyBank, name: 'Save for 8 months', level: 'ok', word: 'Safe' },
          { k: 'C', icon: HandCoins, name: 'Smaller loan', level: 'ok', word: 'Safe' },
        ].map((o, i) => (
          <div key={o.k} className={`g-opt ${i === 1 ? 'on' : ''}`}>
            <span className="g-key" style={{ background: `var(--s${i + 1})` }}>{o.k}</span>
            <span className="g-opt-name">{o.name}</span>
            <span className={`level ${o.level}`}>{o.word}</span>
          </div>
        ))}
      </div>
      <div className="g-card g-trend">
        <div className="g-title">Savings with option B</div>
        <div className="g-figure">₹3.9 lakh</div>
        <MiniLine values={[3.5, 3.1, 3.3, 3.4, 3.6, 3.7, 3.9]} />
      </div>
    </div>
  );
}

/** Onboarding intro: what the overview will show once your numbers are in. */
export function OverviewGlimpse() {
  return (
    <div className="glimpse" aria-hidden="true">
      <div className="g-card g-net">
        <div className="g-title">Net worth</div>
        <div className="g-figure big">₹6.25 lakh</div>
        <MiniLine values={[4.9, 5.1, 5.2, 5.4, 5.3, 5.6, 5.8, 6.0, 6.25]} w={200} h={44} />
      </div>
      <div className="g-card g-flow">
        <div className="g-title">Left this month</div>
        <div className="g-figure">₹35,000</div>
        <div className="seg" style={{ height: 8, marginTop: 10 }}>
          <div className="seg-part" style={{ flex: '48 1 0', background: 'var(--s1)' }} />
          <div className="seg-part" style={{ flex: '13 1 0', background: 'var(--s2)' }} />
          <div className="seg-part" style={{ flex: '39 1 0', background: 'var(--s3)' }} />
        </div>
      </div>
      <div className="g-card g-runway">
        <div className="g-title">Safety net</div>
        <div className="g-figure">8.8 months</div>
        <div className="meter-cells" style={{ marginTop: 10 }}>
          {[1, 1, 1, 1, 1, 1].map((_, i) => <div key={i} className="meter-cell"><i /></div>)}
        </div>
      </div>
    </div>
  );
}

/** Consent: exactly what a connection can see, and that it can be withdrawn. */
export function ConsentGlimpse() {
  return (
    <div className="glimpse short" aria-hidden="true">
      <div className="g-card g-consent">
        <div className="row" style={{ gap: 10 }}>
          <span className="g-badge"><Lock size={16} weight="duotone" /></span>
          <span className="flex-1">
            <span className="g-strong">Sample Bank A · Savings</span>
            <span className="g-sub">Consent until Nov 2027</span>
          </span>
          <ChevronRight size={14} />
        </div>
        {['Read balances and transactions', 'Never moves money', 'Withdraw consent any time'].map((t) => (
          <div key={t} className="g-check"><Check size={13} /> {t}</div>
        ))}
      </div>
    </div>
  );
}
