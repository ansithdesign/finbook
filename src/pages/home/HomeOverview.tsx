// HOME-01 Financial overview. Every number is derived from the user's records via useFinance().

import { ArrowDown, ArrowUp, ArrowUpRight, Bell, ChevronRight, Eye, EyeOff, Inbox, Lightbulb, Plus, Search, Split, Target } from '@/components/icons';
import { INTENT_ICON, RECORD_ICON } from '@/components/topicIcons';
import { Link, useNavigate } from 'react-router-dom';
import { List, ListRow, Section, SectionLink } from '@/components/cards/Cards';
import { HeroSparkline, Ribbon, Runway } from '@/components/charts/Charts';
import { useQuickAdd } from '@/components/bottom-sheets/QuickAdd';
import { Banner, EmptyState, Money } from '@/components/feedback/States';
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
        <button className="icon-btn" aria-label="Quick add" onClick={onAdd} style={{ background: 'var(--midnight)', color: '#fff', width: 38, height: 38, margin: '3px 4px 0 0' }}>
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
  const nwSeries = [...hist.map((h) => h.netWorth), ...(f.netWorth.value !== null ? [f.netWorth.value] : [])];
  // The most pressing insight is read first, so it sits in the first viewport instead of below the fold.
  const lead = f.insights.find((i) => i.severity === 'attention') ?? null;
  const restInsights = f.insights.filter((i) => i !== lead);

  // Income flow: every rupee of income is either spent, committed or left over.
  const income = f.income.value;
  const spent = f.expenses.value ?? 0;
  const emi = f.emi.value ?? 0;
  const other = f.otherCommitments.value ?? 0;
  const left = f.surplus.value;
  const flowParts =
    income !== null && f.expenses.value !== null
      ? [
          { label: 'Expenses', value: spent, color: 'var(--seg-1)' },
          { label: 'Loan EMIs', value: emi, color: 'var(--rain)' },
          { label: 'Other commitments', value: other, color: 'var(--faint)' },
          { label: left !== null && left < 0 ? 'Shortfall' : 'Left over', value: Math.abs(left ?? 0), color: left !== null && left < 0 ? 'var(--act)' : 'var(--accent-bright)' },
        ]
      : [];

  return (
    <Screen
      large
      title={`${greeting()}${first ? `, ${first}` : ''}`}
      actions={<HomeHeaderActions />}
    >
      {!f.hasData ? (
        <div className="tile ink mt-12">
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
            <div className="row-between">
              <span className="label">Net worth</span>
              <span className="on-dark-chip">Details <ArrowUpRight size={13} /></span>
            </div>
            <div className="display-num mt-8" style={{ fontSize: 56 }}>
              <Money value={f.netWorth.value} compact animate />
            </div>
            <div className="row wrap mt-12" style={{ gap: 8 }}>
              {nwDelta !== null && !state.prefs.hideBalances ? (
                <span className={`delta ${nwDelta < 0 ? 'neg prepare' : ''}`}>{nwDelta >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {inr(Math.abs(nwDelta))} since {lastNW ? new Date(`${lastNW.month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long' }) : ''}</span>
              ) : (
                <span className="caption">Change appears once monthly history exists</span>
              )}
            </div>
            {nwSeries.length >= 2 && !state.prefs.hideBalances && (
              <div style={{ marginTop: 14 }} aria-hidden="true"><HeroSparkline values={nwSeries} height={52} /></div>
            )}
            <div style={{ marginTop: 20 }}>
              <div className="label mb-8">Where your money is</div>
              <Ribbon
                onDark
                height={36}
                legend={false}
                parts={[
                  { label: 'Liquid', value: f.byLiquidity.liquid.value ?? 0 },
                  { label: 'Market-linked', value: f.byLiquidity.market.value ?? 0 },
                  { label: 'Locked', value: f.byLiquidity.locked.value ?? 0, hatch: true, color: 'var(--s4)' },
                ]}
              />
              <div className="lg3 caption mt-8">
                <span><i className="lg-sw" style={{ background: 'var(--s1)' }} />Liquid<b><Money value={f.byLiquidity.liquid.value} compact /></b></span>
                <span><i className="lg-sw" style={{ background: 'var(--s2)' }} />Market<b><Money value={f.byLiquidity.market.value} compact /></b></span>
                <span><i className="lg-sw hatch-sw" />Locked<b><Money value={f.byLiquidity.locked.value} compact /></b></span>
              </div>
            </div>
          </Link>
          {lead && (
            <Link to={`/home/insights/${lead.id}`} className="insight span-2 reveal d1" data-severity={lead.severity}>
              <span className="insight-icon"><Lightbulb size={18} /></span>
              <span className="flex-1">
                <span className="level prepare" style={{ marginBottom: 6 }}>Be prepared</span>
                <span className="strong" style={{ display: 'block' }}>{lead.title}</span>
                <span className="caption" style={{ display: 'block', marginTop: 3 }}>{lead.observation}</span>
              </span>
            </Link>
          )}

          {/* Monthly flow */}
          {flowParts.length > 0 && (
            <Link to="/home/expenses" className="tile span-2 reveal d1">
              <div className="row-between">
                <span className="label">Left this month</span>
                <span className="caption">after spending and EMIs</span>
              </div>
              <div className="row-between mt-8" style={{ alignItems: 'flex-end' }}>
                <div className="display-num" style={{ fontSize: 40 }}><Money value={left} compact animate /></div>
                <span className="caption" style={{ paddingBottom: 6 }}>{left !== null && left < 0 ? 'more than you earn' : 'of'} <Money value={income} compact /> {left !== null && left < 0 ? '' : 'income'}</span>
              </div>
              <div className="mt-16">
                <Ribbon parts={flowParts} total={Math.max(income ?? 0, flowParts.reduce((s, p) => s + p.value, 0))} height={34} legend={false} />
              </div>
              <div className="chips mt-12" style={{ gap: 6 }}>
                {flowParts.map((p) => (
                  <span key={p.label} className="tag" style={{ background: 'transparent', padding: 0, gap: 6 }}>
                    <i style={{ width: 9, height: 9, borderRadius: 3, background: p.color, display: 'inline-block', boxShadow: 'inset 0 0 0 0.5px var(--line)' }} />
                    {p.label} <b className="num"><Money value={p.value} compact /></b>
                  </span>
                ))}
              </div>
              {f.sip > 0 && <p className="caption mt-8">Your {inr(f.sip)} of SIPs come out of this.</p>}
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
                <p className="caption mt-4">How long <Money value={f.reserves.value} compact /> of reserves would cover essentials and EMIs</p>
                <div className="mt-16"><Runway months={f.coverage.value} target={target} light /></div>
              </>
            )}
          </Link>

          <Link to="/home/liquidity" className="tile signal reveal d2">
            <span className="label">Liquid funds</span>
            <div className="display-num mt-8" style={{ fontSize: 30 }}><Money value={f.liquid.value} compact animate /></div>
            <p className="caption mt-8">Usable within days</p>
          </Link>
          <Link to="/home/income" className="tile reveal d3">
            <span className="label">Monthly income</span>
            <div className="display-num mt-8" style={{ fontSize: 30 }}><Money value={f.income.value} compact animate /></div>
            <p className="caption mt-8">{f.range.variable ? `Varies ${inr(f.range.low)}–${inr(f.range.high)}` : 'Averaged per month'}</p>
          </Link>
        </div>
      )}

      {f.hasData && (
        <>
          {(restInsights.length > 0 || !lead) && (
          <Section title={lead ? 'More to know' : 'What needs attention'} action={f.insights.length > 2 ? <span className="caption">{f.insights.length} insights</span> : undefined}>
            {f.insights.length === 0 ? (
              <Banner tone="outline">Nothing needs your attention right now, based on the information you've entered.</Banner>
            ) : (
              <div className="stack-sm">
                {restInsights.slice(0, 4).map((i) => (
                  <Link key={i.id} to={`/home/insights/${i.id}`} className="insight" data-severity={i.severity}>
                    <span className="insight-icon"><Lightbulb size={18} /></span>
                    <span className="flex-1">
                      {i.severity === 'attention' && <span className="level prepare" style={{ marginBottom: 6 }}>Be prepared</span>}
                      <span className="strong" style={{ display: 'block' }}>{i.title}</span>
                      <span className="caption" style={{ display: 'block', marginTop: 3 }}>{i.observation}</span>
                      <span className="see-why">See why <ChevronRight size={14} /></span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Section>
          )}

          <Section title="Questions to explore" action={<SectionLink to="/decide">All</SectionLink>}>
            <div className="stack-sm">
              {(f.range.variable
                ? ['My income changes every month. How much can I safely spend?', 'Can I afford to buy a car worth ₹8 lakh?']
                : state.data.liabilities.some((l) => l.type === 'home')
                  ? ['Should I prepay my home loan or continue investing through SIPs?', 'Can I afford to buy a car worth ₹12 lakh?']
                  : ['Can I afford to buy a car worth ₹12 lakh?', 'Should I prepay my home loan or continue investing through SIPs?']
              ).map((q) => (
                <button key={q} className="chip-btn row" style={{ gap: 12 }} onClick={() => navigate(`/decide/ask?q=${encodeURIComponent(q)}`)}>
                  {(() => { const I = INTENT_ICON[q.includes('car') ? 'car' : q.includes('prepay') ? 'prepay' : 'safe-spend']; return <span className="topic-badge" style={{ width: 34, height: 34 }}><I size={18} weight="duotone" /></span>; })()}
                  <span className="flex-1">{q}</span>
                  <ChevronRight size={16} className="chev" />
                </button>
              ))}
            </div>
          </Section>

          <Section title="Coming up" action={<SectionLink to="/home/commitments">View all</SectionLink>}>
            {upcoming.length === 0 ? (
              <Banner tone="outline" action={<Link className="link-btn" to="/records/new/commitment">Add</Link>}>No upcoming commitments recorded.</Banner>
            ) : (
              <div className="list">
                {upcoming.map((c) => {
                  const d = new Date(c.nextDue);
                  return (
                    <Link key={c.id} to={`/records/commitment/${c.id}`} className="list-row" style={{ gap: 14 }}>
                      <span className="datebox"><b>{d.getDate()}</b><small>{d.toLocaleDateString('en-IN', { month: 'short' })}</small></span>
                      <span className="main">
                        <span className="title" style={{ display: 'block' }}>{c.name}</span>
                        <span className="sub" style={{ display: 'block', textTransform: 'capitalize' }}>{c.recurrence} · {c.type === 'sip' ? 'investing' : c.status}</span>
                      </span>
                      <span className="value"><Money value={c.amount} /></span>
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

      <Section title="Add">
        <div className="quick-grid">
          {[
            { label: 'Income', icon: RECORD_ICON.income, to: '/records/new/income' },
            { label: 'Expense', icon: RECORD_ICON.expense, to: '/records/new/expense' },
            { label: 'Asset', icon: RECORD_ICON.asset, to: '/records/new/asset' },
            { label: 'Loan', icon: RECORD_ICON.liability, to: '/records/new/liability' },
            { label: 'Decision', icon: Split, to: '/decide/ask' },
            { label: 'Goal', icon: Target, to: '/goals/new' },
          ].map((q) => (
            <Link key={q.label} to={q.to} className="quick-item">
              <span className="topic-badge"><q.icon size={22} weight="duotone" /></span>
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
