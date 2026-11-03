// SIM-01 Scenario landing, SIM-02 Create scenario, SIM-05 Scenario comparison.

import { Check, GitCompare, Plus } from '@/components/icons';
import { SCENARIO_ICON } from '@/components/topicIcons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Expandable, List, ListRow, Section } from '@/components/cards/Cards';
import { DotPlot, LineChart } from '@/components/charts/Charts';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { Banner, EmptyState } from '@/components/feedback/States';
import { Screen } from '@/components/layout/Screen';
import { compareGoalAllocations } from '@/calculations/financial/goals';
import { projectScenario } from '@/calculations/projections/scenario';
import { baseVarsFromProfile, TEMPLATE_INFO, varsForTemplate } from '@/calculations/projections/templates';
import { baselineGoalCapacity, scenarioGoalCapacity } from '@/features/goals/impact';
import { useApp } from '@/hooks/useAppState';
import type { Scenario, ScenarioTemplate } from '@/types';
import { inr, months, monthLabelFromNow, relativeTime } from '@/utils/format';
import { nowISO, uid } from '@/utils/id';

const START: ScenarioTemplate[] = ['car', 'save-purchase', 'invest-more', 'income-drop'];

export function useCreateScenario() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  return (template: ScenarioTemplate, replace = false) => {
    const sc: Scenario = {
      id: uid('scn'),
      name: TEMPLATE_INFO[template].title,
      template,
      vars: varsForTemplate(template, state.data),
      saved: false,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    actions.upsertScenario(sc);
    navigate(`/simulate/${sc.id}`, { replace });
  };
}

export function SimulateLanding() {
  const { state } = useApp();
  const create = useCreateScenario();
  const navigate = useNavigate();
  const mine = [...state.scenarios].sort((x, y) => Number(y.saved) - Number(x.saved) || y.updatedAt.localeCompare(x.updatedAt)).slice(0, 3);
  const noData = state.data.incomes.length === 0;
  return (
    <Screen large title="Simulate">
      {noData && <div className="mt-4"><Banner tone="warn" action={<Link className="link-btn" to="/records/new/income">Add</Link>}>Add your income and expenses first, so projections start from real numbers.</Banner></div>}
      <div className="row mt-8">
        <button className="btn flex-1" onClick={() => navigate('/simulate/new')}><Plus size={18} /> New scenario</button>
        <button className="btn secondary" disabled={state.scenarios.length < 1} onClick={() => navigate('/simulate/compare')}><GitCompare size={18} /> Compare</button>
      </div>
      {mine.length > 0 && (
        <Section title="Your scenarios">
          <List>
            {mine.map((s) => (
              <ListRow key={s.id} icon={SCENARIO_ICON[s.template]} title={s.name} sub={s.saved ? `Saved · ${relativeTime(s.updatedAt)}` : `Draft · ${relativeTime(s.updatedAt)}`} to={`/simulate/${s.id}`} />
            ))}
          </List>
        </Section>
      )}
      <Section title="Start from">
        <List>
          {START.map((t) => (
            <ListRow key={t} icon={SCENARIO_ICON[t]} title={TEMPLATE_INFO[t].title} onClick={() => create(t)} />
          ))}
          <ListRow icon={Plus} title="More starting points" to="/simulate/new" />
        </List>
      </Section>
    </Screen>
  );
}

export function ScenarioCreate() {
  const create = useCreateScenario();
  const [params] = useSearchParams();
  const t = params.get('template') as ScenarioTemplate | null;
  const done = useRef(false);
  useEffect(() => {
    // Guard against StrictMode's double effect creating two scenarios.
    if (t && TEMPLATE_INFO[t] && !done.current) {
      done.current = true;
      create(t, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);
  return (
    <Screen title="Create scenario" back>
      <div className="stack">
        <p className="muted" style={{ fontSize: 14 }}>Pick a starting point. Values come from your profile, and you can change any of them.</p>
        <List>
          {(Object.keys(TEMPLATE_INFO) as ScenarioTemplate[]).map((k) => (
            <ListRow key={k} icon={SCENARIO_ICON[k]} title={TEMPLATE_INFO[k].title} sub={TEMPLATE_INFO[k].description} onClick={() => create(k)} />
          ))}
        </List>
      </div>
    </Screen>
  );
}

// SIM-05
export function ScenarioCompare() {
  const { state } = useApp();
  const { toast } = useFeedback();
  const [params] = useSearchParams();
  const baselineScenario: Scenario = useMemo(
    () => ({ id: 'baseline', name: 'Current path', template: 'custom', vars: baseVarsFromProfile(state.data), saved: false, createdAt: '', updatedAt: '' }),
    [state.data],
  );
  const pool = [baselineScenario, ...state.scenarios];
  const initial = params.get('ids')?.split(',') ?? ['baseline', ...state.scenarios.filter((s) => s.saved).slice(0, 2).map((s) => s.id)];
  const [sel, setSel] = useState<string[]>(initial.filter((id) => pool.some((p) => p.id === id)).slice(0, 3));
  const toggle = (id: string) => {
    if (sel.includes(id)) setSel(sel.filter((x) => x !== id));
    else if (sel.length >= 3) toast('You can compare up to three scenarios', 'error');
    else setSel([...sel, id]);
  };
  const chosen = sel.map((id) => pool.find((p) => p.id === id)!).filter(Boolean);
  const baseCap = baselineGoalCapacity(state) ?? 0;
  // All scenarios are projected over the same horizon so end-of-period figures are comparable.
  const horizon = Math.max(12, ...chosen.map((s) => s.vars.horizonMonths));
  const results = chosen.map((s) => {
    const p = projectScenario({ ...s.vars, horizonMonths: horizon });
    const goalRows = compareGoalAllocations(state.data.goals, baseCap, scenarioGoalCapacity(s.vars));
    const goalFunded = goalRows.reduce((x, r) => x + r.after.funded, 0);
    const goalNeeded = goalRows.reduce((x, r) => x + (r.after.needed ?? 0), 0);
    const essential = s.vars.essentialExpenses + p.summary.emiTotal;
    return { s, p, goalFunded, goalNeeded, coverage: essential > 0 ? p.summary.minLiquidity / essential : null };
  });
  type Row = { label: string; get: (r: (typeof results)[number]) => number | null; fmt: (v: number | null) => string; higher: boolean };
  const rows: Row[] = [
    { label: 'Monthly surplus', get: (r) => r.p.summary.monthlySurplus, fmt: inr, higher: true },
    { label: 'Liquid funds at end', get: (r) => r.p.summary.endLiquidity, fmt: inr, higher: true },
    { label: 'Lowest liquid funds', get: (r) => r.p.summary.minLiquidity, fmt: inr, higher: true },
    { label: 'Outstanding debt at end', get: (r) => r.p.summary.endDebt, fmt: inr, higher: false },
    { label: 'Monthly EMI obligations', get: (r) => r.p.summary.emiTotal, fmt: inr, higher: false },
    { label: 'Emergency coverage (at lowest)', get: (r) => r.coverage, fmt: (v) => months(v), higher: true },
    { label: 'Goal contributions funded', get: (r) => r.goalFunded, fmt: (v) => (v === null ? '—' : `${inr(v)}/mo`), higher: true },
    { label: 'Months with negative cash flow', get: (r) => r.p.summary.negativeMonths, fmt: (v) => String(v ?? '—'), higher: false },
  ];
  return (
    <Screen title="Compare scenarios" back="/simulate">
      <div className="stack">
        <p className="muted" style={{ fontSize: 14 }}>Select up to three. All are projected over the same horizon{chosen.length > 1 ? ` (${horizon} months)` : ''}. The highlighted dot is the better result in each row.</p>
        <div className="chips">
          {pool.map((p) => (
            <button key={p.id} className={`chip ${sel.includes(p.id) ? 'on' : ''}`} onClick={() => toggle(p.id)} aria-pressed={sel.includes(p.id)}>
              {sel.includes(p.id) && <Check size={14} />} {p.name}
            </button>
          ))}
        </div>
        {chosen.length < 2 ? (
          <EmptyState icon={GitCompare} title="Choose at least two scenarios" body={state.scenarios.length === 0 ? 'Create a scenario first, then compare it with your current path.' : 'Tap scenarios above to add them.'} action={state.scenarios.length === 0 ? <Link to="/simulate/new" className="btn sm">Create scenario</Link> : undefined} />
        ) : (
          <>
            <DotPlot
              rows={[
                ...rows.map((row) => ({
                  label: row.label,
                  lowerIsBetter: !row.higher,
                  values: results.map((r, i) => ({ key: String.fromCharCode(65 + i), value: row.get(r), display: row.fmt(row.get(r)) })),
                })),
              ]}
            />
            <div className="stack-sm">
              {results.map((r, i) => (
                <div key={r.s.id} className="row caption"><span className="avatar" style={{ width: 24, height: 24, borderRadius: 12, fontSize: 11 }}>{String.fromCharCode(65 + i)}</span> {r.s.name} · {r.p.summary.stability}</div>
              ))}
            </div>
            <Expandable title="Full comparison table">
            <div className="table-scroll">
              <table className="cmp">
                <thead>
                  <tr>
                    <th>Metric</th>
                    {results.map((r, i) => <th key={r.s.id} style={{ maxWidth: 110, whiteSpace: 'normal' }}>{String.fromCharCode(65 + i)}. {r.s.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const vals = results.map((r) => row.get(r));
                    const valid = vals.filter((v): v is number => v !== null);
                    const bestV = valid.length > 1 && !valid.every((v) => v === valid[0]) ? (row.higher ? Math.max(...valid) : Math.min(...valid)) : null;
                    return (
                      <tr key={row.label}>
                        <td>{row.label}</td>
                        {vals.map((v, i) => <td key={i} className={v !== null && v === bestV ? 'best' : ''}>{row.fmt(v)}</td>)}
                      </tr>
                    );
                  })}
                  <tr>
                    <td>Cash-flow stability</td>
                    {results.map((r) => <td key={r.s.id}>{r.p.summary.stability}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
            </Expandable>
            <Section title="Liquid funds over time">
              <LineChart
                series={results.map((r, i) => ({ label: `${String.fromCharCode(65 + i)}. ${r.s.name}`, values: r.p.rows.map((x) => x.closingLiquid) }))}
                xLabels={Array.from({ length: horizon }, (_, i) => monthLabelFromNow(i + 1))}
              />
            </Section>
            <Section title="Trade-offs">
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 14 }}>
                {results.map((r, i) => (
                  <li key={r.s.id} style={{ marginBottom: 6 }}>
                    <strong>{String.fromCharCode(65 + i)}</strong>: surplus {inr(r.p.summary.monthlySurplus)}/mo, lowest liquidity {inr(r.p.summary.minLiquidity)} in month {r.p.summary.minLiquidityMonth}
                    {r.goalNeeded > r.goalFunded ? `, goals underfunded by ${inr(r.goalNeeded - r.goalFunded)}/mo` : ', goals funded'}.
                  </li>
                ))}
              </ul>
            </Section>
            <p className="caption">Projections are estimates using each scenario's assumptions over a common horizon. Investment returns, if any, are assumptions.</p>
          </>
        )}
      </div>
    </Screen>
  );
}
