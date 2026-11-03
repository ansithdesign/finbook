// HOME-01 Financial overview. Every number is derived from the user's records via useFinance().

import { ArrowUpRight, Banknote, Bell, Compass, Eye, EyeOff, Inbox, Landmark, Lightbulb, PiggyBank, Plus, Receipt, Search, Target } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { List, ListRow, Section, SectionLink } from '@/components/cards/Cards';
import { Ribbon, Runway } from '@/components/charts/Charts';
import { useQuickAdd } from '@/components/bottom-sheets/QuickAdd';
import { Banner, EmptyState, Money } from '@/components/feedback/States';
import { ContourArt } from '@/components/illustrations/Illustrations';
import { Screen } from '@/components/layout/Screen';
import { useApp } from '@/hooks/useAppState';
import { useFinance } from '@/hooks/useFinance';
import { inr, months, relativeTime } from '@/utils/format';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function HomeHeaderActions({ onAdd }: { onAdd?: () => void }) {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const unread = state.notifications.filter((n) => !n.read).length;
  return (
    <>
      {onAdd && (
        <button className="icon-btn" aria-label="Quick add" onClick={onAdd} style={{ background: 'var(--ink)', color: 'var(--lime)', width: 38, height: 38, margin: '3px 4px 0 0' }}>
          <Plus size={20} />
        </button>
      )}
      <button className="icon-btn" aria-label="Search" onClick={() => navigate('/search')}>
        <Search size={21} />
      </button>
      <button className="icon-btn" aria-label={state.prefs.hideBalances ? 'Show balances' : 'Hide balances'} onClick={() => actions.updatePrefs({ hideBalances: !state.prefs.hideBalances })}>
        {state.prefs.hideBalances ? <EyeOff size={21} /> : <Eye size={21} />}
      </button>
      <button className="icon-btn" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} onClick={() => navigate('/notifications')}>
        <Bell size={21} />
        {unread > 0 && <span className="badge-dot" />}
      </button>
    </>
  );
}

export function HomeOverview() {
  const { state } = useApp();
  const f = useFinance();
  const navigate = useNavigate();
  const quickAdd = useQuickAdd();
  const first = (state.profile.name || state.session.user?.name || '').split(' ')[0];
  const hist = [...state.data.history].sort((a, b) => a.month.localeCompare(b.month));
  const lastNW = hist.at(-1);
  const upcoming = [...state.data.commitments]
    .filter((c) => c.status !== 'paid')
    .sort((a, b) => a.nextDue.localeCompare(b.nextDue))
    .slice(0, 3);
  const target = state.prefs.emergencyMonthsTarget;
  const nwDelta = lastNW && f.netWorth.value !== null ? f.netWorth.value - lastNW.netWorth : null;

  // Income flow: every rupee of income is either spent, committed or left over.
  const income = f.income.value;
  const spent = f.expenses.value ?? 0;
  const emi = f.emi.value ?? 0;
  const other = f.otherCommitments.value ?? 0;
  const left = f.surplus.value;
  const flowParts =
    income !== null && f.expenses.value !== null
      ? [
          { label: 'Expenses', value: spent, color: '#111210' },
          { label: 'Loan EMIs', value: emi, color: '#3d5afe' },
          { label: 'Other commitments', value: other, color: '#a29f94' },
          { label: left !== null && left < 0 ? 'Shortfall' : 'Left over', value: Math.abs(left ?? 0), color: left !== null && left < 0 ? '#ff5a36' : '#cbf23b' },
        ]
      : [];

  return (
    <Screen
      large
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/profile" className="avatar" aria-label="Profile" style={{ textDecoration: 'none' }}>
            {(first || '?').slice(0, 1).toUpperCase()}
          </Link>
          <span style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>{greeting()}{first ? `, ${first}` : ''}</span>
        </span>
      }
      actions={<HomeHeaderActions onAdd={quickAdd} />}
    >
      {!f.hasData ? (
        <div className="tile ink mt-12">
          <ContourArt />
          <EmptyState
            icon={Inbox}
            title="No financial information yet"
            body="Add income, expenses, savings and loans to see your net worth, runway and monthly flow. Approximate values are fine."
            action={
              <div className="stack-sm" style={{ width: '100%' }}>
                <Link to="/onboarding/income-type" className="btn block">Set up my finances</Link>
                <button className="btn secondary block" onClick={quickAdd}>Add a single record</button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="bento mt-8">
          {/* Net worth */}
          <Link to="/home/net-worth" className="tile ink span-2 reveal">
            <ContourArt />
            <div className="row-between">
              <span className="label">Net worth</span>
              <span className="on-dark-chip">Details <ArrowUpRight size={13} /></span>
            </div>
            <div className="display-num mt-8" style={{ fontSize: 56 }}>
              <Money value={f.netWorth.value} compact animate />
            </div>
            <div className="row wrap mt-12" style={{ gap: 8 }}>
              {nwDelta !== null && !state.prefs.hideBalances ? (
                <span className={`delta ${nwDelta < 0 ? 'neg' : ''}`}>{nwDelta >= 0 ? '↑' : '↓'} {inr(Math.abs(nwDelta))} since {lastNW?.month}</span>
              ) : (
                <span className="caption">Change appears once monthly history exists</span>
              )}
            </div>
            <div style={{ marginTop: 26 }}>
              <div className="label mb-8">Where it sits</div>
              <Ribbon
                onDark
                height={36}
                legend={false}
                parts={[
                  { label: 'Liquid', value: f.byLiquidity.liquid.value ?? 0 },
                  { label: 'Market-linked', value: f.byLiquidity.market.value ?? 0 },
                  { label: 'Locked', value: f.byLiquidity.locked.value ?? 0, hatch: true, color: '#8f8d82' },
                ]}
              />
              <div className="row-between caption mt-8">
                <span>● Liquid <b style={{ color: '#fff' }}><Money value={f.byLiquidity.liquid.value} compact /></b></span>
                <span>○ Market <b style={{ color: '#fff' }}><Money value={f.byLiquidity.market.value} compact /></b></span>
                <span>▨ Locked <b style={{ color: '#fff' }}><Money value={f.byLiquidity.locked.value} compact /></b></span>
              </div>
            </div>
          </Link>

          {/* Monthly flow */}
          {flowParts.length > 0 && (
            <Link to="/home/expenses" className="tile span-2 reveal d1">
              <div className="row-between">
                <span className="label">Where this month's income goes</span>
                <span className="caption">per month</span>
              </div>
              <div className="row-between mt-8" style={{ alignItems: 'flex-end' }}>
                <div className="display-num" style={{ fontSize: 40 }}><Money value={left} compact animate /></div>
                <span className="caption" style={{ paddingBottom: 6 }}>{left !== null && left < 0 ? 'over your income' : 'left over'} of <Money value={income} compact /></span>
              </div>
              <div className="mt-16">
                <Ribbon parts={flowParts} total={Math.max(income ?? 0, flowParts.reduce((s, p) => s + p.value, 0))} height={34} legend={false} />
              </div>
              <div className="chips mt-12" style={{ gap: 6 }}>
                {flowParts.map((p) => (
                  <span key={p.label} className="tag" style={{ background: 'transparent', padding: 0, gap: 6 }}>
                    <i style={{ width: 9, height: 9, borderRadius: 3, background: p.color, display: 'inline-block', boxShadow: 'inset 0 0 0 1px rgba(17,18,16,.15)' }} />
                    {p.label} <b className="num"><Money value={p.value} compact /></b>
                  </span>
                ))}
              </div>
              {f.sip > 0 && <p className="caption mt-8">SIPs of {inr(f.sip)} are invested from what's left.</p>}
            </Link>
          )}

          {/* Runway */}
          <Link to="/home/liquidity" className="tile span-2 reveal d2">
            <div className="row-between">
              <span className="label">Emergency runway</span>
              <span className="caption">target {target} months</span>
            </div>
            {f.coverage.value === null ? (
              <p className="muted mt-8" style={{ fontSize: 14 }}>Add essential expenses and a liquid balance to see how many months you could cover.</p>
            ) : (
              <>
                <div className="display-num mt-8" style={{ fontSize: 40 }}>{months(f.coverage.value)}</div>
                <p className="caption mt-4">of essential spending (incl. EMIs) covered by <Money value={f.reserves.value} compact /> of reserves</p>
                <div className="mt-16"><Runway months={f.coverage.value} target={target} light /></div>
              </>
            )}
          </Link>

          <Link to="/home/liquidity" className="tile lime reveal d2">
            <span className="label">Liquid funds</span>
            <div className="display-num mt-8" style={{ fontSize: 30 }}><Money value={f.liquid.value} compact animate /></div>
            <p className="caption mt-8">Usable within days</p>
          </Link>
          <Link to="/home/income" className="tile reveal d3">
            <span className="label">Monthly income</span>
            <div className="display-num mt-8" style={{ fontSize: 30 }}><Money value={f.income.value} compact animate /></div>
            <p className="caption mt-8">{f.range.variable ? `Varies ${inr(f.range.low)}–${inr(f.range.high)}` : 'Normalised per month'}</p>
          </Link>
        </div>
      )}

      {f.hasData && (
        <>
          <Section title="What needs attention" action={f.insights.length > 2 ? <span className="caption">{f.insights.length} insights</span> : undefined}>
            {f.insights.length === 0 ? (
              <Banner tone="outline">Nothing needs your attention right now, based on the information you've entered.</Banner>
            ) : (
              <div className="stack-sm">
                {f.insights.slice(0, 4).map((i) => (
                  <Link key={i.id} to={`/home/insights/${i.id}`} className="insight" data-severity={i.severity}>
                    <span className="insight-icon"><Lightbulb size={18} /></span>
                    <span className="flex-1">
                      <span className="strong" style={{ display: 'block' }}>{i.title}</span>
                      <span className="caption" style={{ display: 'block', marginTop: 3 }}>{i.observation}</span>
                      <span className="caption strong" style={{ display: 'block', marginTop: 6, color: 'var(--ink)' }}>Why am I seeing this? ›</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          <Section title="Explore a decision" action={<SectionLink to="/decide">All</SectionLink>}>
            <div className="stack-sm">
              {(f.range.variable
                ? ['My income changes every month. How much can I safely spend?', 'Can I afford to buy a car worth ₹8 lakh?']
                : state.data.liabilities.some((l) => l.type === 'home')
                  ? ['Should I prepay my home loan or continue investing through SIPs?', 'Can I afford to buy a car worth ₹12 lakh?']
                  : ['Can I afford to buy a car worth ₹12 lakh?', 'Should I prepay my home loan or continue investing through SIPs?']
              ).map((q) => (
                <button key={q} className="chip-btn row" onClick={() => navigate(`/decide/ask?q=${encodeURIComponent(q)}`)}>
                  <Compass size={16} /> {q}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Coming up" action={<SectionLink to="/home/commitments">View all</SectionLink>}>
            {upcoming.length === 0 ? (
              <Banner tone="outline" action={<Link className="link-btn" to="/records/new/commitment">Add</Link>}>No upcoming commitments recorded.</Banner>
            ) : (
              <div className="stack-sm">
                {upcoming.map((c) => {
                  const d = new Date(c.nextDue);
                  return (
                    <Link key={c.id} to={`/records/commitment/${c.id}`} className="card tight row" style={{ textDecoration: 'none', gap: 14 }}>
                      <span className="datebox"><b>{d.getDate()}</b><small>{d.toLocaleDateString('en-IN', { month: 'short' })}</small></span>
                      <span className="flex-1">
                        <span className="strong" style={{ display: 'block' }}>{c.name}</span>
                        <span className="caption">{c.recurrence} · {c.type === 'sip' ? 'investing' : c.status}</span>
                      </span>
                      <strong className="num"><Money value={c.amount} /></strong>
                    </Link>
                  );
                })}
              </div>
            )}
          </Section>

          <Section title="Recent activity" action={<SectionLink to="/home/activity">View all</SectionLink>}>
            {state.activity.length === 0 ? (
              <p className="caption">Changes you make will appear here.</p>
            ) : (
              <List>
                {state.activity.slice(0, 4).map((a) => (
                  <ListRow key={a.id} title={a.text} sub={relativeTime(a.at)} to={a.link} chevron={!!a.link} />
                ))}
              </List>
            )}
          </Section>
        </>
      )}

      <Section title="Quick actions">
        <div className="grid-3">
          {[
            { label: 'Income', icon: Banknote, to: '/records/new/income' },
            { label: 'Expense', icon: Receipt, to: '/records/new/expense' },
            { label: 'Asset', icon: PiggyBank, to: '/records/new/asset' },
            { label: 'Liability', icon: Landmark, to: '/records/new/liability' },
            { label: 'Decision', icon: Compass, to: '/decide/ask' },
            { label: 'Goal', icon: Target, to: '/goals/new' },
          ].map((q) => (
            <Link key={q.label} to={q.to} className="card tight center" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600 }}>
              <span className="avatar" style={{ width: 36, height: 36, borderRadius: 12 }}><q.icon size={18} /></span>
              {q.label}
            </Link>
          ))}
        </div>
      </Section>
      <p className="caption center mt-24">
        {f.lastUpdated ? `Updated ${relativeTime(f.lastUpdated)}` : 'No data yet'} · {state.connections.length === 0 ? 'Based on manual entries' : `${state.connections.length} illustrative connection(s)`}
      </p>
    </Screen>
  );
}
