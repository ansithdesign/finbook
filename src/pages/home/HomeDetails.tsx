// HOME-02 … HOME-10 detail screens.

import { Banknote, CalendarClock, CheckCircle2, Circle, Landmark, Lightbulb, PiggyBank, Plus, Receipt } from '@/components/icons';
import { Link, Navigate, useParams } from 'react-router-dom';
import { BarList, Ribbon, Runway } from '@/components/charts/Charts';
import { KV, List, ListRow, Section, Shift } from '@/components/cards/Cards';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { Banner, CalcNote, EmptyState, Money, SourceTag } from '@/components/feedback/States';
import { Screen } from '@/components/layout/Screen';
import { liabilityEmi, monthlyExpenseOf, monthlyIncomeOf, toMonthly } from '@/calculations/financial/overview';
import { useApp } from '@/hooks/useAppState';
import { useFinance } from '@/hooks/useFinance';
import type { AssetCategory, Commitment } from '@/types';
import { fmtDate, fmtShortDate, inr, months, pct, relativeTime, tenure } from '@/utils/format';

const AddBtn = ({ to, label }: { to: string; label: string }) => (
  <Link to={to} className="icon-btn" aria-label={label}>
    <Plus size={22} />
  </Link>
);

export const ASSET_CAT_LABEL: Record<AssetCategory, string> = {
  savings: 'Savings',
  current: 'Current account',
  cash: 'Cash',
  fd: 'Fixed deposits',
  'liquid-other': 'Other liquid funds',
  'mutual-funds': 'Mutual funds',
  stocks: 'Stocks and ETFs',
  gold: 'Gold',
  property: 'Property',
  retirement: 'Retirement savings',
  other: 'Other assets',
};

// HOME-02
export function NetWorthDetails() {
  const { state } = useApp();
  const f = useFinance();
  const d = state.data;
  const byCat = Object.entries(
    d.assets.reduce<Record<string, number>>((acc, a) => ((acc[a.category] = (acc[a.category] ?? 0) + (a.value ?? 0)), acc), {}),
  ).map(([k, v]) => ({ label: ASSET_CAT_LABEL[k as AssetCategory], value: v }));
  return (
    <Screen title="Net worth" back>
      <div className="tile ink reveal">
        <div className="label">Net worth = assets − liabilities</div>
        <div className="display-num mt-8" style={{ fontSize: 52 }}><Money value={f.netWorth.value} animate /></div>
        <CalcNote missing={f.netWorth.missing} estimated={f.netWorth.estimated} />
        <div className="mt-16">
          <Ribbon onDark height={30} legend={false} parts={[{ label: 'Assets', value: f.assets.value ?? 0, color: 'var(--s1)' }, { label: 'Liabilities', value: f.liabilities.value ?? 0, color: 'var(--seg-1)' }]} />
          <div className="row-between caption mt-8">
            <span>Assets <b>{inr(f.assets.value)}</b></span>
            <span>Liabilities <b>{inr(f.liabilities.value)}</b></span>
          </div>
        </div>
      </div>
      <Banner tone="outline">Net worth is not the same as money you can spend. Only <Link to="/home/liquidity"><strong>liquid funds</strong></Link> are readily accessible.</Banner>
      <Section title="Assets by category" action={<Link className="link-btn" to="/home/assets">Manage</Link>}>
        {byCat.length ? (
          <div className="stack-lg">
            <div>
              <div className="label mb-8">How accessible is it?</div>
              <Ribbon
                parts={[
                  { label: 'Liquid', value: f.byLiquidity.liquid.value ?? 0, color: 'var(--s1)', note: 'usable within days' },
                  { label: 'Market-linked', value: f.byLiquidity.market.value ?? 0, color: 'var(--s2)', note: 'value fluctuates' },
                  { label: 'Locked', value: f.byLiquidity.locked.value ?? 0, color: 'var(--s4)', hatch: true, note: 'property, retirement' },
                ]}
              />
            </div>
            <BarList items={byCat} />
          </div>
        ) : (
          <p className="caption">No assets recorded.</p>
        )}
      </Section>
      <Section title="Liabilities" action={<Link className="link-btn" to="/home/liabilities">Manage</Link>}>
        {d.liabilities.length ? (
          <List>
            {d.liabilities.map((l) => (
              <ListRow key={l.id} title={l.name} sub={<SourceTag source={l.source} />} value={<Money value={l.outstanding} />} to={`/records/liability/${l.id}`} />
            ))}
          </List>
        ) : (
          <p className="caption">No liabilities recorded.</p>
        )}
      </Section>
      <Section title="Data provenance">
        <div className="card stack-sm" style={{ fontSize: 14 }}>
          <KV k="Manual entries" v={[...d.assets, ...d.liabilities].filter((x) => x.source === 'manual').length} />
          <KV k="Your estimates" v={[...d.assets, ...d.liabilities].filter((x) => x.source === 'estimated').length} />
          <KV k="Connected sources" v={[...d.assets, ...d.liabilities].filter((x) => x.source === 'connected').length} />
          <KV k="Last updated" v={f.lastUpdated ? fmtDate(f.lastUpdated) : '—'} />
        </div>
        <p className="caption mt-8">Historical change is shown only where monthly history exists. No past performance is generated.</p>
      </Section>
      {state.data.history.length > 0 && (
        <Section title="Recorded history">
          <List>
            {[...state.data.history].reverse().map((h) => (
              <ListRow key={h.month} title={h.month} value={<Money value={h.netWorth} compact />} />
            ))}
          </List>
        </Section>
      )}
    </Screen>
  );
}

// HOME-03
export function IncomeBreakdown() {
  const { state } = useApp();
  const f = useFinance();
  const main = state.data.incomes.filter((i) => !i.isAdditional);
  const extra = state.data.incomes.filter((i) => i.isAdditional);
  const row = (i: (typeof main)[number]) => (
    <ListRow
      key={i.id}
      icon={Banknote}
      title={i.name}
      sub={
        <span className="row wrap" style={{ gap: 4 }}>
          <SourceTag source={i.source} /> {i.frequency !== 'monthly' && <span>{inr(i.amount)} {i.frequency}</span>}
          {i.min != null && <span>Range {inr(i.min)}–{inr(i.max ?? null)}</span>}
        </span>
      }
      value={<strong><Money value={monthlyIncomeOf(i)} /></strong>}
      to={`/records/income/${i.id}`}
    />
  );
  return (
    <Screen title="Income" back actions={<AddBtn to="/records/new/income" label="Add income" />}>
      <div className="card">
        <div className="label">Monthly income (normalised)</div>
        <div className="big-number"><Money value={f.income.value} /></div>
        <CalcNote missing={f.income.missing} estimated={f.income.estimated} />
        {f.range.variable && (
          <div className="grid-2 mt-12">
            <div><div className="label">Low month</div><div className="strong"><Money value={f.range.low} /></div></div>
            <div><div className="label">High month</div><div className="strong"><Money value={f.range.high} /></div></div>
          </div>
        )}
      </div>
      <Section title="Income sources">
        {main.length ? <List>{main.map(row)}</List> : <EmptyState icon={Banknote} title="No income sources" action={<Link to="/records/new/income" className="btn sm">Add income</Link>} />}
      </Section>
      <Section title="Additional income">{extra.length ? <List>{extra.map(row)}</List> : <p className="caption">None recorded.</p>}</Section>
      <Section title="Income history">
        {state.data.history.length >= 2 ? (
          <BarList items={state.data.history.map((h) => ({ label: h.month, value: h.income }))} />
        ) : (
          <Banner tone="outline">Not enough history yet. Month-by-month income appears once at least two months are recorded.</Banner>
        )}
      </Section>
    </Screen>
  );
}

// HOME-04
export function ExpenseBreakdown() {
  const { state } = useApp();
  const f = useFinance();
  const exps = [...state.data.expenses].sort((a, b) => (monthlyExpenseOf(b) ?? 0) - (monthlyExpenseOf(a) ?? 0));
  const ess = exps.filter((e) => e.essential).reduce((s, e) => s + (monthlyExpenseOf(e) ?? 0), 0);
  const disc = exps.filter((e) => !e.essential).reduce((s, e) => s + (monthlyExpenseOf(e) ?? 0), 0);
  const prev = [...state.data.history].sort((a, b) => a.month.localeCompare(b.month)).at(-1);
  return (
    <Screen title="Expenses" back actions={<AddBtn to="/records/new/expense" label="Add expense" />}>
      <div className="card">
        <div className="label">Total monthly expenditure</div>
        <div className="big-number"><Money value={f.expenses.value} /></div>
        <CalcNote missing={f.expenses.missing} estimated={f.expenses.estimated} />
        <div className="mt-12"><Ribbon height={34} parts={[{ label: 'Essential', value: ess, color: 'var(--seg-1)' }, { label: 'Discretionary', value: disc, color: 'var(--s2)' }]} /></div>
        <p className="caption mt-8">Loan EMIs ({inr(f.emi.value ?? 0)}) are tracked under liabilities and not included here, to avoid double-counting.</p>
      </div>
      {prev && f.expenses.value !== null ? (
        <Banner tone="outline">
          Compared with {new Date(`${prev.month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long' })}: <Shift from={inr(prev.expenses)} to={inr(f.expenses.value)} /> ({f.expenses.value >= prev.expenses ? '+' : ''}{pct((f.expenses.value - prev.expenses) / prev.expenses, 1)}).
        </Banner>
      ) : (
        <Banner tone="outline">Monthly comparison appears once history exists.</Banner>
      )}
      <Section title="By category">
        {exps.length === 0 ? (
          <EmptyState icon={Receipt} title="No expenses recorded" action={<Link to="/records/new/expense" className="btn sm">Add expense</Link>} />
        ) : (
          <List>
            {exps.map((e) => (
              <ListRow
                key={e.id}
                title={e.name}
                sub={
                  <span className="row wrap" style={{ gap: 4 }}>
                    <SourceTag source={e.source} />
                    <span className="tag">{e.essential ? 'Essential' : 'Discretionary'}</span>
                    {e.frequency !== 'monthly' && <span>{inr(e.amount)} {e.frequency}</span>}
                  </span>
                }
                value={<strong><Money value={monthlyExpenseOf(e)} /></strong>}
                to={`/records/expense/${e.id}`}
              />
            ))}
          </List>
        )}
      </Section>
    </Screen>
  );
}

// HOME-05
const ASSET_ORDER: AssetCategory[] = ['savings', 'current', 'cash', 'fd', 'liquid-other', 'mutual-funds', 'stocks', 'gold', 'property', 'retirement', 'other'];
export function AssetsOverview() {
  const { state } = useApp();
  const f = useFinance();
  const groups = ASSET_ORDER.map((c) => ({ c, items: state.data.assets.filter((a) => a.category === c) })).filter((g) => g.items.length);
  return (
    <Screen title="Assets" back actions={<AddBtn to="/records/new/asset" label="Add asset" />}>
      <div className="card">
        <div className="label">Total assets</div>
        <div className="big-number"><Money value={f.assets.value} /></div>
        <div className="grid-3 mt-12" style={{ fontSize: 13 }}>
          <div><div className="label">Liquid</div><strong><Money value={f.byLiquidity.liquid.value} compact /></strong></div>
          <div><div className="label">Market-linked</div><strong><Money value={f.byLiquidity.market.value} compact /></strong></div>
          <div><div className="label">Locked</div><strong><Money value={f.byLiquidity.locked.value} compact /></strong></div>
        </div>
      </div>
      {groups.length === 0 && <EmptyState icon={PiggyBank} title="No assets yet" body="Add savings, investments or property." action={<Link to="/records/new/asset" className="btn sm">Add asset</Link>} />}
      {groups.map((g) => (
        <Section key={g.c} title={ASSET_CAT_LABEL[g.c]}>
          <List>
            {g.items.map((a) => (
              <ListRow key={a.id} icon={PiggyBank} title={a.name} sub={<span className="row" style={{ gap: 4 }}><SourceTag source={a.source} /> Updated {relativeTime(a.updatedAt)}</span>} value={<strong><Money value={a.value} /></strong>} to={`/records/asset/${a.id}`} />
            ))}
          </List>
        </Section>
      ))}
    </Screen>
  );
}

// HOME-06
export function LiabilitiesOverview() {
  const { state } = useApp();
  const f = useFinance();
  return (
    <Screen title="Liabilities" back actions={<AddBtn to="/records/new/liability" label="Add liability" />}>
      <div className="card">
        <div className="grid-2">
          <div><div className="label">Outstanding</div><div className="mid-number"><Money value={f.liabilities.value} /></div></div>
          <div><div className="label">Monthly EMIs</div><div className="mid-number"><Money value={f.emi.value} /></div></div>
        </div>
        <div className="mt-8 caption">Fixed commitment ratio: {pct(f.fixedRatio.value)} of income (EMIs + rent, insurance, fees).</div>
        <CalcNote missing={f.liabilities.missing + f.emi.missing} estimated={f.emi.estimated} />
      </div>
      <Section title="Loans and dues">
        {state.data.liabilities.length === 0 ? (
          <EmptyState icon={Landmark} title="No liabilities" body="If you have no loans, there's nothing to add." action={<Link to="/records/new/liability" className="btn sm secondary">Add liability</Link>} />
        ) : (
          <div className="stack-sm">
            {state.data.liabilities.map((l) => {
              const emi = liabilityEmi(l);
              return (
                <Link key={l.id} to={`/records/liability/${l.id}`} className="card outline" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div className="row-between">
                    <span className="strong">{l.name}</span>
                    <SourceTag source={l.source} />
                  </div>
                  <KV k="Outstanding" v={<Money value={l.outstanding} />} />
                  {l.type !== 'credit-card' ? (
                    <>
                      <KV k="EMI" v={emi.value === null ? <span className="tag warn">Missing</span> : <span><Money value={emi.value} />{emi.derived ? ' (est.)' : ''}</span>} />
                      <KV k="Interest rate" v={l.rate === null ? <span className="tag warn">Missing</span> : `${l.rate}% p.a.`} />
                      <KV k="Remaining tenure" v={l.remainingMonths === null ? '—' : tenure(l.remainingMonths)} />
                    </>
                  ) : (
                    <KV k="Repayment" v="From monthly spending" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </Section>
    </Screen>
  );
}

// HOME-07
export function LiquidityDetails() {
  const { state } = useApp();
  const f = useFinance();
  const target = state.prefs.emergencyMonthsTarget;
  const group = (pred: (l: string) => boolean) => state.data.assets.filter((a) => pred(a.liquidity));
  return (
    <Screen title="Liquidity" back>
      <div className="tile ink reveal">
        <div className="label">Total liquid funds</div>
        <div className="display-num mt-8" style={{ fontSize: 52 }}><Money value={f.liquid.value} animate /></div>
        {f.coverage.value !== null && <div className="mt-16"><Runway months={f.coverage.value} target={target} /></div>}
      </div>
      <div className="card mt-12">
        <div className="mt-8"><KV k="Emergency reserve (eligible)" v={<Money value={f.reserves.value} />} /></div>
        <KV k="Essential monthly spending (incl. EMIs)" v={<Money value={f.essential.value} />} />
        <KV k="Estimated coverage" v={f.coverage.value === null ? 'Cannot calculate' : months(f.coverage.value)} />
        <KV k="Your target" v={`${target} months`} />
        {f.coverage.value === null && <p className="caption warn-text mt-8">Coverage needs essential expenses and at least one liquid balance.</p>}
      </div>
      <Section title="Accessible funds">
        <p className="caption mb-8">Available within days. Fixed deposits may carry an early-withdrawal penalty.</p>
        <List>
          {group((l) => l === 'liquid').map((a) => (
            <ListRow key={a.id} title={a.name} sub={a.emergencyEligible ? 'Counts towards emergency reserve' : 'Not counted as emergency reserve'} value={<Money value={a.value} />} to={`/records/asset/${a.id}`} />
          ))}
        </List>
      </Section>
      <Section title="Less accessible investments">
        <p className="caption mb-8">Can be sold, but values fluctuate and selling may take days or have tax effects. Not counted as liquid funds.</p>
        <List>
          {group((l) => l === 'market').map((a) => (
            <ListRow key={a.id} title={a.name} value={<Money value={a.value} />} to={`/records/asset/${a.id}`} />
          ))}
        </List>
      </Section>
      <Section title="Locked or long-term">
        <List>
          {group((l) => l === 'locked').length ? (
            group((l) => l === 'locked').map((a) => <ListRow key={a.id} title={a.name} value={<Money value={a.value} />} to={`/records/asset/${a.id}`} />)
          ) : (
            <ListRow title="None recorded" />
          )}
        </List>
      </Section>
    </Screen>
  );
}

// HOME-08
export function CommitmentsOverview() {
  const { state, actions } = useApp();
  const { toast } = useFeedback();
  const list = [...state.data.commitments].sort((a, b) => a.nextDue.localeCompare(b.nextDue));
  const setStatus = (c: Commitment) => {
    actions.upsertRecord('commitment', { ...c, status: c.status === 'paid' ? 'upcoming' : 'paid' }, true);
    toast(c.status === 'paid' ? 'Marked as upcoming' : 'Marked as paid');
  };
  const monthlyTotal = list.filter((c) => c.recurrence !== 'once').reduce((s, c) => s + (c.amount ? toMonthly(c.amount, c.recurrence) : 0), 0);
  return (
    <Screen title="Upcoming commitments" back actions={<AddBtn to="/records/new/commitment" label="Add commitment" />}>
      <div className="card row-between">
        <div>
          <div className="label">Recurring, per month</div>
          <div className="mid-number"><Money value={monthlyTotal} /></div>
        </div>
        <span className="caption right" style={{ maxWidth: 150 }}>Linked items are already counted in expenses or EMIs.</span>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No commitments" body="Add EMIs, rent, insurance premiums or planned payments." action={<Link to="/records/new/commitment" className="btn sm">Add commitment</Link>} />
      ) : (
        <div className="stack-sm mt-16">
          {list.map((c) => (
            <div key={c.id} className="card outline tight">
              <div className="row">
                <button className="icon-btn" style={{ width: 36, height: 36 }} aria-label={c.status === 'paid' ? 'Mark as upcoming' : 'Mark as paid'} onClick={() => setStatus(c)}>
                  {c.status === 'paid' ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                </button>
                <Link to={`/records/commitment/${c.id}`} className="flex-1" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="row-between">
                    <span className="strong" style={{ textDecoration: c.status === 'paid' ? 'line-through' : 'none' }}>{c.name}</span>
                    <strong><Money value={c.amount} /></strong>
                  </div>
                  <div className="caption mt-4 row wrap" style={{ gap: 4 }}>
                    Due {fmtShortDate(c.nextDue)} · {c.recurrence} · <span className="tag">{c.status}</span>
                    {c.linkedTo && <span className="tag dashed">Linked to {c.linkedTo.kind}</span>}
                    {c.type === 'sip' && <span className="tag dashed">Investing</span>}
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Screen>
  );
}

// HOME-09
export function InsightDetail() {
  const { id } = useParams();
  const f = useFinance();
  const insight = f.insights.find((i) => i.id === id);
  if (!insight)
    return (
      <Screen title="Insight" back="/home">
        <EmptyState icon={Lightbulb} title="This insight no longer applies" body="Your financial information has changed since it was shown." action={<Link to="/home" className="btn sm">Back to Home</Link>} />
      </Screen>
    );
  return (
    <Screen title="Insight" back footer={<Link to={insight.action.to} className="btn block">{insight.action.label}</Link>}>
      <div className="stack-lg">
        <div className="stack-sm">
          {insight.severity === 'attention' && <span className="level prepare" style={{ alignSelf: 'flex-start' }}>Be prepared</span>}
          <h2 className="h2">{insight.title}</h2>
        </div>
        <div><div className="label">What we observed</div><p className="mt-4">{insight.observation}</p></div>
        <div><div className="label">Why this is shown</div><p className="mt-4">{insight.why}</p></div>
        <div className="card">
          <div className="label mb-8">Relevant data (from your records)</div>
          {insight.data.map((d) => <KV key={d.label} k={d.label} v={d.value} />)}
        </div>
        <div><div className="label">Potential implications</div><p className="mt-4">{insight.implications}</p></div>
        <Banner tone="outline">This is information, not financial advice. You decide what to do next.</Banner>
      </div>
    </Screen>
  );
}

// HOME-10
export function ActivityHistory() {
  const { state } = useApp();
  const groups = state.activity.reduce<Record<string, typeof state.activity>>((acc, a) => {
    const k = fmtDate(a.at);
    (acc[k] = acc[k] ?? []).push(a);
    return acc;
  }, {});
  return (
    <Screen title="Activity" back>
      {state.activity.length === 0 ? (
        <EmptyState icon={Receipt} title="No activity yet" body="Records you add or update will appear here." />
      ) : (
        Object.entries(groups).map(([day, items]) => (
          <Section key={day} title={<span className="label">{day}</span>}>
            <List>
              {items.map((a) => (
                <ListRow key={a.id} title={a.text} sub={new Date(a.at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} to={a.link} chevron={!!a.link} />
              ))}
            </List>
          </Section>
        ))
      )}
    </Screen>
  );
}

export function NotFoundRedirect() {
  return <Navigate to="/home" replace />;
}
