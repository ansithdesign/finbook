// SIM-03 Configure variables + SIM-04 Projection, SIM-06 Cash flow, SIM-07 Liquidity, SIM-08 Goal impact, SIM-09 Assumptions, SIM-10 Save.

import { Bookmark, BookmarkCheck, GitCompare, LineChart as LineIcon, RotateCcw, Trash2 } from '@/components/icons';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Expandable, KV, List, ListRow, Section } from '@/components/cards/Cards';
import { CashflowBars, LineChart } from '@/components/charts/Charts';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { Banner, EmptyState, Money } from '@/components/feedback/States';
import { SliderField, TextField } from '@/components/forms/Fields';
import { Screen } from '@/components/layout/Screen';
import { compareGoalAllocations } from '@/calculations/financial/goals';
import { projectScenario } from '@/calculations/projections/scenario';
import { TEMPLATE_INFO, varsForTemplate } from '@/calculations/projections/templates';
import { baselineGoalCapacity, scenarioGoalCapacity } from '@/features/goals/impact';
import { useApp } from '@/hooks/useAppState';
import type { Scenario, ScenarioVars } from '@/types';
import { inr, monthLabelFromNow, months, tenure } from '@/utils/format';

function useScenario() {
  const { id } = useParams();
  const { state } = useApp();
  const sc = state.scenarios.find((s) => s.id === id) ?? null;
  const projection = useMemo(() => (sc ? projectScenario(sc.vars) : null), [sc]);
  return { sc, projection };
}

function Missing() {
  return (
    <Screen title="Scenario" back="/simulate">
      <EmptyState icon={LineIcon} title="Scenario not found" body="It may have been deleted." action={<Link to="/simulate" className="btn sm">Back to Simulate</Link>} />
    </Screen>
  );
}

type VarKey = keyof ScenarioVars;
interface VarDef {
  key: VarKey;
  label: string;
  min: number;
  max: (v: ScenarioVars) => number;
  step: number;
  fmt: (n: number) => string;
  help?: string;
  assumption?: boolean;
}
const money = (n: number) => inr(n);
const GROUPS: Array<{ title: string; templates: string[]; vars: VarDef[] }> = [
  {
    title: 'Income and expenses',
    templates: ['income-drop', 'expense-increase', 'variable-income', 'custom'],
    vars: [
      { key: 'income', label: 'Monthly income', min: 0, max: (v) => Math.max(300000, v.income * 2), step: 1000, fmt: money },
      { key: 'incomeLow', label: 'Low-month income (every 3rd month)', min: 0, max: (v) => Math.max(200000, v.income), step: 1000, fmt: money, help: 'Set to 0 to treat every month as typical.' },
      { key: 'expenses', label: 'Monthly expenses (incl. other EMIs)', min: 0, max: (v) => Math.max(200000, v.expenses * 2), step: 1000, fmt: money },
      { key: 'essentialExpenses', label: 'Of which essential', min: 0, max: (v) => Math.max(v.expenses, 1000), step: 1000, fmt: money, help: 'Used for emergency coverage.' },
    ],
  },
  {
    title: 'Purchase and new loan',
    templates: ['car', 'save-purchase'],
    vars: [
      { key: 'purchaseAmount', label: 'Purchase amount', min: 0, max: () => 5000000, step: 10000, fmt: money },
      { key: 'downPayment', label: 'Down payment', min: 0, max: (v) => Math.max(v.purchaseAmount, 10000), step: 10000, fmt: money },
      { key: 'interestRate', label: 'Interest rate (p.a.)', min: 0, max: () => 20, step: 0.25, fmt: (n) => `${n}%`, assumption: true },
      { key: 'tenureMonths', label: 'Loan tenure', min: 0, max: () => 120, step: 6, fmt: (n) => tenure(n) },
      { key: 'purchaseMonth', label: 'Purchase in month', min: 1, max: (v) => Math.max(1, v.horizonMonths), step: 1, fmt: (n) => `Month ${n}` },
    ],
  },
  {
    title: 'Investing and saving',
    templates: ['invest-more', 'save-purchase'],
    vars: [
      { key: 'monthlyInvestment', label: 'Monthly investment (SIPs)', min: 0, max: () => 100000, step: 1000, fmt: money },
      { key: 'expectedReturnPct', label: 'Assumed annual return', min: 0, max: () => 15, step: 0.5, fmt: (n) => `${n}%`, assumption: true, help: 'An assumption, not a guarantee. Returns can be lower or negative.' },
      { key: 'monthlySavings', label: 'Monthly savings towards a goal', min: 0, max: () => 100000, step: 1000, fmt: money },
    ],
  },
  {
    title: 'Existing loan',
    templates: ['prepay'],
    vars: [
      { key: 'existingDebt', label: 'Outstanding balance', min: 0, max: (v) => Math.max(10000000, v.existingDebt), step: 10000, fmt: money },
      { key: 'existingRate', label: 'Interest rate (p.a.)', min: 0, max: () => 20, step: 0.1, fmt: (n) => `${n}%` },
      { key: 'existingEmi', label: 'EMI', min: 0, max: (v) => Math.max(100000, v.existingEmi * 2), step: 500, fmt: money },
      { key: 'extraLoanPrepayment', label: 'Extra monthly prepayment', min: 0, max: () => 100000, step: 1000, fmt: money },
    ],
  },
  {
    title: 'Time and one-off costs',
    templates: [],
    vars: [
      { key: 'horizonMonths', label: 'Time horizon', min: 6, max: () => 120, step: 6, fmt: (n) => tenure(n) },
      { key: 'openingLiquid', label: 'Starting liquid funds', min: 0, max: (v) => Math.max(2000000, v.openingLiquid * 2), step: 10000, fmt: money },
      { key: 'oneOffExpense', label: 'One-off expense', min: 0, max: () => 1000000, step: 5000, fmt: money },
      { key: 'oneOffMonth', label: 'One-off expense in month', min: 1, max: (v) => v.horizonMonths, step: 1, fmt: (n) => `Month ${n}` },
    ],
  },
];

function SubNav({ id }: { id: string }) {
  return (
    <List>
      <ListRow title="Monthly cash-flow projection" to={`/simulate/${id}/cashflow`} />
      <ListRow title="Liquidity projection" to={`/simulate/${id}/liquidity`} />
      <ListRow title="Goal impact" to={`/simulate/${id}/goals`} />
      <ListRow title="Assumptions and methodology" to={`/simulate/${id}/assumptions`} />
    </List>
  );
}

// SIM-03 + SIM-04 + SIM-10
export function ScenarioDetail() {
  const { sc, projection } = useScenario();
  if (!sc || !projection) return <Missing />;
  return <ScenarioView sc={sc} projection={projection} />;
}

function ScenarioView({ sc, projection }: { sc: Scenario; projection: ReturnType<typeof projectScenario> }) {
  const { state, actions } = useApp();
  const { toast, confirm, openSheet } = useFeedback();
  const navigate = useNavigate();
  const s = projection.summary;
  const setVar = (k: VarKey, v: number) => actions.upsertScenario({ ...sc, vars: { ...sc.vars, [k]: k === 'incomeLow' && v === 0 ? null : v } });
  const save = () => {
    if (sc.saved) return navigate('/simulate');
    openSheet('Save scenario', (close) => <SaveForm sc={sc} onSave={(name) => (actions.upsertScenario({ ...sc, name, saved: true }), toast('Scenario saved'), close())} />);
  };
  const warnings: string[] = [];
  if (sc.vars.downPayment > sc.vars.purchaseAmount && sc.vars.purchaseAmount > 0) warnings.push('Down payment is higher than the purchase amount.');
  if (sc.vars.essentialExpenses > sc.vars.expenses) warnings.push('Essential expenses exceed total expenses.');
  if (sc.vars.purchaseAmount > 0 && sc.vars.downPayment < sc.vars.purchaseAmount && sc.vars.tenureMonths === 0) warnings.push('A loan is needed but tenure is 0 months — set a tenure or a full down payment.');
  const baseCap = baselineGoalCapacity(state) ?? 0;
  const goalRows = compareGoalAllocations(state.data.goals, baseCap, scenarioGoalCapacity(sc.vars));
  const hurt = goalRows.filter((r) => r.after.funded < r.before.funded);
  return (
    <Screen
      title={sc.name}
      back="/simulate"
      actions={<button className="icon-btn" aria-label={sc.saved ? 'Saved' : 'Save scenario'} onClick={save}>{sc.saved ? <BookmarkCheck size={22} /> : <Bookmark size={22} />}</button>}
      footer={
        <div className="row">
          <button className="btn flex-1" onClick={save}>{sc.saved ? 'Saved ✓' : 'Save scenario'}</button>
          <button className="btn secondary" onClick={() => navigate(`/simulate/compare?ids=baseline,${sc.id}`)}><GitCompare size={18} /> Compare</button>
        </div>
      }
    >
      <div className="stack">
        <div className="row wrap" style={{ gap: 6 }}>
          <span className="tag">{TEMPLATE_INFO[sc.template].title}</span>
          {sc.saved ? <span className="tag dark">Saved</span> : <span className="tag dashed">Not saved</span>}
          <span className="tag">{tenure(sc.vars.horizonMonths)} horizon</span>
        </div>
        {sc.fromDecisionId && <Banner tone="outline">Created from a decision. <Link to={`/decide/${sc.fromDecisionId}`}><u>Open decision</u></Link></Banner>}

        <div className="tile ink reveal">
          <div className="row-between">
            <span className="label">Liquid funds after {tenure(sc.vars.horizonMonths)}</span>
            <span className={`delta ${s.stability === 'At risk' ? 'neg' : ''}`}>{s.stability}</span>
          </div>
          <div className="display-num mt-8" style={{ fontSize: 52 }}><Money value={s.endLiquidity} compact animate /></div>
          <div className="caption mt-4">estimate · starts at {inr(sc.vars.openingLiquid)} · lowest {inr(s.minLiquidity)} in month {s.minLiquidityMonth}</div>
        </div>
        <div className="card reveal d1">
          <div className="row-between mb-8"><span className="strong">Liquid funds over time</span><span className="caption">blue = above zero · red = below</span></div>
          <LineChart
            series={[{ label: 'Liquid funds', values: projection.rows.map((r) => r.closingLiquid) }]}
            xLabels={projection.rows.map((r) => monthLabelFromNow(r.month))}
            events={[
              ...(sc.vars.purchaseAmount > 0 ? [{ index: Math.min(projection.rows.length - 1, sc.vars.purchaseMonth - 1), label: 'Purchase' }] : []),
              ...(s.existingLoanClosedMonth ? [{ index: s.existingLoanClosedMonth - 1, label: 'Loan closed' }] : []),
              ...(sc.vars.oneOffExpense > 0 ? [{ index: Math.min(projection.rows.length - 1, sc.vars.oneOffMonth - 1), label: 'One-off' }] : []),
            ]}
          />
        </div>
        <div className="bento">
          <div className="tile"><span className="label">Monthly surplus</span><div className="display-num mt-8" style={{ fontSize: 26 }}><Money value={s.monthlySurplus} compact /></div><p className="caption mt-4">after all EMIs</p></div>
          <div className="tile signal"><span className="label">After allocations</span><div className="display-num mt-8" style={{ fontSize: 26 }}><Money value={s.unallocatedSurplus} compact /></div><p className="caption mt-4">free each month</p></div>
          <div className="tile"><span className="label">Monthly EMIs</span><div className="display-num mt-8" style={{ fontSize: 26 }}><Money value={s.emiTotal} compact /></div><p className="caption mt-4">{s.newLoan > 0 ? `new EMI ${inr(s.newEmi)}` : 'existing loans'}</p></div>
          <div className="tile"><span className="label">Cash-flow months</span><div className="display-num mt-8" style={{ fontSize: 26 }}>{projection.rows.length - s.negativeMonths}<span className="muted" style={{ fontSize: 16 }}> / {projection.rows.length}</span></div><p className="caption mt-4">{s.negativeMonths} negative</p></div>
        </div>
        <div className="card">
          {s.newLoan > 0 && <p className="caption">New loan {inr(s.newLoan)} · EMI {inr(s.newEmi)} · interest in horizon {inr(s.newLoanInterest)}</p>}
          {s.investedEnd > 0 && <p className="caption">Investments at end: {inr(s.investedEnd)} (contributed {inr(s.investedContributed)}, at an assumed {sc.vars.expectedReturnPct}%, not guaranteed)</p>}
          {s.existingLoanClosedMonth && <p className="caption">Existing loan closes in month {s.existingLoanClosedMonth}.</p>}
          {s.emergencyCoverageAfter !== null && <p className="caption">Emergency coverage after purchase: {months(s.emergencyCoverageAfter)}</p>}
        </div>
        {warnings.map((w) => <Banner key={w} tone="warn">{w}</Banner>)}
        {s.stability === 'At risk' && <Banner tone="warn">Liquid funds go below zero in this scenario — it would need borrowing or selling investments.</Banner>}
        {hurt.length > 0 && <Banner tone="warn">Reduces goal funding: {hurt.map((h) => `${h.name} (${inr(h.before.funded)} → ${inr(h.after.funded)}/mo)`).join(', ')}.</Banner>}

        <Section title="Configure variables" action={<button className="link-btn" onClick={async () => { if (await confirm({ title: 'Reset to profile values?', body: 'Variables return to the template defaults based on your current profile.', confirmLabel: 'Reset' })) { actions.upsertScenario({ ...sc, vars: varsForTemplate(sc.template, state.data) }); toast('Reset to profile values'); } }}><RotateCcw size={14} /> Reset</button>}>
          <div className="stack-sm">
            {GROUPS.map((g) => (
              <Expandable key={g.title} title={g.title} defaultOpen={g.templates.includes(sc.template)}>
                <div className="stack">
                  {g.vars.map((v) => (
                    <SliderField
                      key={v.key}
                      label={v.label}
                      value={(sc.vars[v.key] as number | null) ?? 0}
                      onChange={(n) => setVar(v.key, n)}
                      min={v.min}
                      max={v.max(sc.vars)}
                      step={v.step}
                      format={v.fmt}
                      help={v.help}
                      assumption={v.assumption}
                    />
                  ))}
                </div>
              </Expandable>
            ))}
          </div>
        </Section>
        <Section title="Details"><SubNav id={sc.id} /></Section>
        <button
          className="btn danger"
          onClick={async () => {
            if (!(await confirm({ title: 'Delete this scenario?', confirmLabel: 'Delete', danger: true }))) return;
            actions.deleteScenario(sc.id);
            toast('Scenario deleted');
            navigate('/simulate', { replace: true });
          }}
        >
          <Trash2 size={18} /> Delete scenario
        </button>
      </div>
    </Screen>
  );
}

function SaveForm({ sc, onSave }: { sc: Scenario; onSave: (name: string) => void }) {
  const [name, setName] = useState(sc.name);
  return (
    <div className="stack">
      <TextField label="Scenario name" value={name} onChange={setName} error={name.trim() ? null : 'Give the scenario a name.'} />
      <button className="btn block" disabled={!name.trim()} onClick={() => onSave(name.trim())}>Save scenario</button>
    </div>
  );
}

// SIM-06
export function ScenarioCashflow() {
  const { sc, projection } = useScenario();
  if (!sc || !projection) return <Missing />;
  return (
    <Screen title="Cash-flow projection" back>
      <p className="muted" style={{ fontSize: 14 }}>Simplified month-by-month projection for “{sc.name}”. Estimates only.</p>
      <div className="card mt-12">
        <div className="row-between mb-8"><span className="strong">Net cash flow each month</span><span className="caption">blue = surplus · red = shortfall</span></div>
        <CashflowBars values={projection.rows.map((r) => r.net)} labels={projection.rows.map((r) => monthLabelFromNow(r.month))} />
      </div>
      <div className="table-scroll mt-16">
        <table className="mini">
          <thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>EMIs</th><th>Invest/save</th><th>One-off</th><th>Net</th></tr></thead>
          <tbody>
            {projection.rows.map((r) => (
              <tr key={r.month}>
                <td>{monthLabelFromNow(r.month)}</td>
                <td>{inr(r.income)}</td>
                <td>{inr(r.expenses)}</td>
                <td>{inr(r.existingEmi + r.newEmi + r.prepayment)}</td>
                <td>{inr(r.investment + r.goalSavings)}</td>
                <td>{r.oneOff ? inr(r.oneOff) : '—'}</td>
                <td className="strong">{inr(r.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Screen>
  );
}

// SIM-07
export function ScenarioLiquidity() {
  const { sc, projection } = useScenario();
  if (!sc || !projection) return <Missing />;
  const s = projection.summary;
  return (
    <Screen title="Liquidity projection" back>
      <div className="card">
        <KV k="Opening liquid balance" v={inr(sc.vars.openingLiquid)} />
        <KV k="Minimum projected liquidity" v={`${inr(s.minLiquidity)} (month ${s.minLiquidityMonth})`} />
        <KV k="Closing liquid balance" v={inr(s.endLiquidity)} />
      </div>
      <div className="table-scroll mt-16">
        <table className="mini">
          <thead><tr><th>Month</th><th>Opening</th><th>Inflows</th><th>Outflows</th><th>Closing</th></tr></thead>
          <tbody>
            {projection.rows.map((r) => (
              <tr key={r.month} style={{ fontWeight: r.month === s.minLiquidityMonth ? 700 : 400 }}>
                <td>{monthLabelFromNow(r.month)}</td>
                <td>{inr(r.openingLiquid)}</td>
                <td>{inr(r.inflow)}</td>
                <td>{inr(r.outflow)}</td>
                <td>{inr(r.closingLiquid)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="caption mt-8">Bold row = lowest point. Outflows include expenses, EMIs, investments, goal savings and one-off costs.</p>
    </Screen>
  );
}

// SIM-08
export function ScenarioGoalImpact() {
  const { sc } = useScenario();
  const { state } = useApp();
  if (!sc) return <Missing />;
  const base = baselineGoalCapacity(state);
  const cap = scenarioGoalCapacity(sc.vars);
  const rows = base === null ? [] : compareGoalAllocations(state.data.goals, base, cap);
  return (
    <Screen title="Goal impact" back>
      <div className="card">
        <KV k="Available for goals today" v={inr(base)} />
        <KV k="Available in this scenario" v={inr(cap)} />
        <p className="caption mt-8">Available = monthly surplus − investments − prepayments. Goals are funded by priority.</p>
      </div>
      {state.data.goals.length === 0 ? (
        <EmptyState icon={LineIcon} title="No goals to assess" body="Create a goal to see how this scenario affects it." action={<Link to="/goals/new" className="btn sm">Create goal</Link>} />
      ) : (
        <div className="stack-sm mt-16">
          {rows.map((r) => (
            <div key={r.goalId} className="card outline">
              <div className="row-between"><span className="strong">{r.name}</span>{r.after.funded < r.before.funded ? <span className="tag warn">Reduced</span> : <span className="tag">Unchanged</span>}</div>
              <KV k="Monthly funding" v={`${inr(r.before.funded)} → ${inr(r.after.funded)}`} />
              <KV k="Time to target" v={`${tenure(r.before.monthsToTarget)} → ${r.after.monthsToTarget === null ? 'Not reachable' : tenure(r.after.monthsToTarget)}`} />
              {r.after.funded < r.before.funded && <p className="caption">In this scenario, your contribution towards {r.name} may need to decrease by {inr(r.before.funded - r.after.funded)} a month.</p>}
            </div>
          ))}
        </div>
      )}
    </Screen>
  );
}

// SIM-09
export function ScenarioAssumptions() {
  const { sc } = useScenario();
  if (!sc) return <Missing />;
  const v = sc.vars;
  return (
    <Screen title="Assumptions" back>
      <div className="stack">
        <Section title="Inputs used">
          <div className="card outline">
            <KV k="Monthly income" v={inr(v.income)} />
            {v.incomeLow !== null && <KV k="Low-month income" v={inr(v.incomeLow)} />}
            <KV k="Monthly expenses" v={inr(v.expenses)} />
            <KV k="Essential expenses" v={inr(v.essentialExpenses)} />
            <KV k="Existing EMI" v={inr(v.existingEmi)} />
            {v.existingDebt > 0 && <KV k="Existing loan" v={`${inr(v.existingDebt)} at ${v.existingRate}%`} />}
            <KV k="Starting liquid funds" v={inr(v.openingLiquid)} />
            {v.purchaseAmount > 0 && <KV k="Purchase" v={`${inr(v.purchaseAmount)}, ${inr(v.downPayment)} down`} />}
            {v.purchaseAmount > 0 && <KV k="New loan terms" v={`${v.interestRate}% for ${tenure(v.tenureMonths)}`} />}
            <KV k="Monthly investment" v={inr(v.monthlyInvestment)} />
            <KV k="Assumed return" v={`${v.expectedReturnPct}% p.a. (assumption)`} />
            <KV k="Goal savings" v={inr(v.monthlySavings)} />
            <KV k="Extra prepayment" v={inr(v.extraLoanPrepayment)} />
            <KV k="Horizon" v={tenure(v.horizonMonths)} />
          </div>
        </Section>
        <Section title="Methodology">
          <ul className="caption" style={{ paddingLeft: 18, margin: 0 }}>
            <li>Each month: closing liquid = opening + income − expenses − EMIs − prepayment − investments − goal savings − one-off costs.</li>
            <li>New loan EMI uses P × r × (1+r)^n ÷ ((1+r)^n − 1), starting the month after purchase.</li>
            <li>Existing loan is amortised monthly; extra prepayment reduces principal and tenure.</li>
            <li>Investments compound monthly at the assumed return. This is not a forecast.</li>
            <li>Emergency coverage = liquid funds ÷ (essential expenses + EMIs).</li>
          </ul>
        </Section>
        <Section title="Excluded variables">
          <ul className="caption" style={{ paddingLeft: 18, margin: 0 }}>
            <li>Inflation and salary increases</li>
            <li>Taxes, tax benefits and capital gains</li>
            <li>Interest earned on cash balances</li>
            <li>Loan processing fees, insurance, and prepayment charges</li>
            <li>Market volatility — returns are applied evenly</li>
          </ul>
        </Section>
        <Section title="Data limitations">
          <p className="caption">Starting values come from your profile, which may include estimates. Projections are simplified and should be read as direction, not precise outcomes.</p>
        </Section>
      </div>
    </Screen>
  );
}
