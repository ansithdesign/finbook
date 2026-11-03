// HOME-01 Financial overview. Every number is derived from the user's records via useFinance().

import { ArrowDown, ArrowUp, Bell, ChevronRight, Eye, EyeOff, Inbox, Lightbulb, Plus } from '@/components/icons';
import { Link, useNavigate } from 'react-router-dom';
import { List, ListRow, Section, SectionLink } from '@/components/cards/Cards';
import { HeroSparkline, Ribbon, Runway } from '@/components/charts/Charts';
import { useQuickAdd } from '@/components/bottom-sheets/QuickAdd';
import { EmptyState, Money } from '@/components/feedback/States';
import { Screen } from '@/components/layout/Screen';
import { useApp } from '@/hooks/useAppState';
import { useFinance } from '@/hooks/useFinance';
import { inr, months } from '@/utils/format';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function HomeHeaderActions({ onAdd }: { onAdd?: () => void }) {
  const { state } = useApp();
  const navigate = useNavigate();
  const unread = state.notifications.filter((n) => !n.read).length;
  return (
    <>
      {onAdd && (
        <button className="icon-btn" aria-label="Add a record" onClick={onAdd}>
          <Plus size={23} />
        </button>
      )}
      <button className="icon-btn" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} onClick={() => navigate('/notifications')}>
        <Bell size={22} />
        {unread > 0 && <span className="badge-dot" />}
      </button>
    </>
  );
}

export function HomeOverview() {
  const { state, actions } = useApp();
  const f = useFinance();
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
          { label: 'Expenses', value: spent, color: 'var(--s1)' },
          { label: 'Loan EMIs', value: emi, color: 'var(--s2)' },
          { label: 'Other commitments', value: other, color: 'var(--s4)' },
          { label: left !== null && left < 0 ? 'Shortfall' : 'Left over', value: Math.abs(left ?? 0), color: left !== null && left < 0 ? 'var(--act)' : 'var(--s3)' },
        ]
      : [];

  const hidden = state.prefs.hideBalances;
  return (
    <Screen large title={`${greeting()}${first ? `, ${first}` : ''}`} actions={<HomeHeaderActions onAdd={quickAdd} />}>
      {!f.hasData ? (
        <div className="mt-12">
          <EmptyState
            icon={Inbox}
            title="Nothing here yet"
            body="Add your income, spending, savings and loans. Rough numbers are fine."
            action={
              <div className="stack-sm" style={{ width: '100%' }}>
                <Link to="/onboarding/income-type" className="btn block">Set up my finances</Link>
                <button className="btn secondary block" onClick={quickAdd}>Add one record</button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="home">
          <section className="hero reveal">
            <div className="row-between">
              <Link to="/home/net-worth" className="hero-label">Net worth <ChevronRight size={14} /></Link>
              <button className="icon-btn" aria-label={hidden ? 'Show balances' : 'Hide balances'} onClick={() => actions.updatePrefs({ hideBalances: !hidden })}>
                {hidden ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="display-num" style={{ fontSize: 58 }}><Money value={f.netWorth.value} compact animate /></div>
            {nwDelta !== null && !hidden && (
              <span className={`delta mt-12 ${nwDelta < 0 ? 'neg prepare' : ''}`}>
                {nwDelta >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {inr(Math.abs(nwDelta))} since {lastNW ? new Date(`${lastNW.month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long' }) : ''}
              </span>
            )}
            {nwSeries.length >= 2 && !hidden && <div className="mt-16"><HeroSparkline values={nwSeries} height={56} /></div>}
          </section>

          {lead && (
            <Link to={`/home/insights/${lead.id}`} className="insight reveal d1" data-severity={lead.severity}>
              <span className="flex-1">
                <span className="level prepare" style={{ marginBottom: 8 }}>Be prepared</span>
                <span className="strong" style={{ display: 'block' }}>{lead.title}</span>
                <span className="caption" style={{ display: 'block', marginTop: 3 }}>{lead.observation}</span>
              </span>
              <ChevronRight size={16} className="chev" />
            </Link>
          )}

          {flowParts.length > 0 && (
            <Link to="/home/expenses" className="tile reveal d1">
              <div className="row-between">
                <span className="label">Left this month</span>
                <span className="caption">of <Money value={income} compact /></span>
              </div>
              <div className="display-num mt-8" style={{ fontSize: 38 }}><Money value={left} compact animate /></div>
              <div className="mt-16"><Ribbon parts={flowParts} total={Math.max(income ?? 0, flowParts.reduce((sum, p) => sum + p.value, 0))} legend={false} /></div>
              <div className="flow-legend mt-12">
                {flowParts.map((p) => (
                  <span key={p.label}><i style={{ background: p.color }} />{p.label}<b><Money value={p.value} compact /></b></span>
                ))}
              </div>
            </Link>
          )}

          <Link to="/home/liquidity" className="tile reveal d2">
            <div className="row-between">
              <span className="label">Safety net</span>
              <span className="caption">target {target} months</span>
            </div>
            {f.coverage.value === null ? (
              <p className="caption mt-8">Add essential spending and savings to see how long you could cover.</p>
            ) : (
              <>
                <div className="display-num mt-8" style={{ fontSize: 38 }}>{months(f.coverage.value)}</div>
                <div className="mt-16"><Runway months={f.coverage.value} target={target} /></div>
              </>
            )}
          </Link>

          {restInsights.length > 0 && (
            <Section title="Worth a look">
              <List>
                {restInsights.slice(0, 2).map((i) => (
                  <ListRow key={i.id} icon={Lightbulb} title={i.title} sub={i.observation} to={`/home/insights/${i.id}`} />
                ))}
              </List>
            </Section>
          )}

          {upcoming.length > 0 && (
            <Section title="Coming up" action={<SectionLink to="/home/commitments">All</SectionLink>}>
              <div className="list">
                {upcoming.map((c) => {
                  const d = new Date(c.nextDue);
                  return (
                    <Link key={c.id} to={`/records/commitment/${c.id}`} className="list-row" style={{ gap: 14 }}>
                      <span className="datebox"><b>{d.getDate()}</b><small>{d.toLocaleDateString('en-IN', { month: 'short' })}</small></span>
                      <span className="main"><span className="title" style={{ display: 'block' }}>{c.name}</span></span>
                      <span className="value"><Money value={c.amount} /></span>
                    </Link>
                  );
                })}
              </div>
            </Section>
          )}
        </div>
      )}
    </Screen>
  );
}
