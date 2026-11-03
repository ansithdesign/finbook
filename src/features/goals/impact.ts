// Connects decisions and scenarios to goals: how much each would leave available for goal contributions.

import { compareGoalAllocations, type GoalImpactRow } from '@/calculations/financial/goals';
import { calculateMonthlySurplus } from '@/calculations/financial/overview';
import { projectScenario } from '@/calculations/projections/scenario';
import { analyzeDecision } from '@/intelligence';
import type { AppState, ScenarioVars } from '@/types';

/** Monthly amount available for goals today: surplus after existing SIPs. */
export function baselineGoalCapacity(state: AppState): number | null {
  const s = calculateMonthlySurplus(state.data);
  return s.afterSip ?? s.surplus.value;
}

/** Amount a scenario leaves for goals: surplus − investments − prepayments. */
export function scenarioGoalCapacity(vars: ScenarioVars): number {
  const p = projectScenario(vars);
  return p.summary.monthlySurplus - vars.monthlyInvestment - vars.extraLoanPrepayment;
}

export interface ImpactSource {
  kind: 'decision' | 'scenario';
  id: string;
  title: string;
  detail: string;
  before: number;
  after: number;
  rows: GoalImpactRow[];
}

export function impactsFromSaved(state: AppState): ImpactSource[] {
  const base = baselineGoalCapacity(state);
  if (base === null) return [];
  const out: ImpactSource[] = [];
  for (const d of state.decisions.filter((x) => x.saved)) {
    const a = analyzeDecision(d, state.data, state.prefs.emergencyMonthsTarget);
    if (!a.ok) continue;
    const opt = a.options.find((o) => o.key === d.chosenOption) ?? a.options[0];
    if (!opt || opt.goalImpact.length === 0) continue;
    const after = opt.goalImpact.reduce((s, r) => s + r.after.funded, 0);
    const before = opt.goalImpact.reduce((s, r) => s + r.before.funded, 0);
    out.push({ kind: 'decision', id: d.id, title: d.title, detail: opt.label, before, after, rows: opt.goalImpact });
  }
  for (const sc of state.scenarios.filter((x) => x.saved)) {
    const cap = scenarioGoalCapacity(sc.vars);
    const rows = compareGoalAllocations(state.data.goals, base, cap);
    out.push({ kind: 'scenario', id: sc.id, title: sc.name, detail: 'Saved scenario', before: base, after: cap, rows });
  }
  return out;
}
