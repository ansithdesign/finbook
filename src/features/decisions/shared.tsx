import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyState } from '@/components/feedback/States';
import { Screen } from '@/components/layout/Screen';
import { MoneyField, NumberField, Segmented } from '@/components/forms/Fields';
import { baseVarsFromProfile } from '@/calculations/projections/templates';
import { analyzeDecision, questionsFor, type DecisionOption, type OptionMetric } from '@/intelligence';
import type { Question } from '@/intelligence/questions';
import { useApp } from '@/hooks/useAppState';
import type { AppState, Decision, Scenario, ScenarioVars } from '@/types';
import { inr, months, pct, tenure } from '@/utils/format';
import { nowISO, uid } from '@/utils/id';
import { calculateEmi } from '@/calculations/financial/loans';

export function useDecision() {
  const { id } = useParams();
  const { state } = useApp();
  const decision = state.decisions.find((d) => d.id === id) ?? null;
  const analysis = useMemo(
    () => (decision ? analyzeDecision(decision, state.data, state.prefs.emergencyMonthsTarget) : null),
    [decision, state.data, state.prefs.emergencyMonthsTarget],
  );
  return { decision, analysis };
}

export function MissingDecision() {
  return (
    <Screen title="Decision" back="/decide">
      <EmptyState icon={Compass} title="Decision not found" body="It may have been deleted." action={<Link to="/decide" className="btn sm">Back to Decide</Link>} />
    </Screen>
  );
}

export function formatMetric(m: OptionMetric, hidden = false): string {
  if (hidden && m.format === 'inr') return '₹ ••••';
  if (m.format === 'text') return m.text ?? '—';
  if (m.value === null) return '—';
  switch (m.format) {
    case 'inr':
      return inr(m.value);
    case 'months':
      return months(m.value);
    case 'pct':
      return pct(m.value);
    case 'tenure':
      return tenure(m.value);
    default:
      return String(m.value);
  }
}

export const STATUS_LABEL: Record<Decision['status'], string> = { draft: 'Draft', 'in-progress': 'In progress', completed: 'Completed' };

/** Additional, editable alternative settings (beyond clarification questions). */
export function alternativeSettings(intent: Decision['intent']): Question[] {
  if (intent === 'car')
    return [
      { key: 'largerDownPayment', label: 'Option B: larger down payment', kind: 'money', required: false },
      { key: 'waitMonthlySaving', label: 'Option C: monthly saving while waiting', kind: 'money', required: false },
      { key: 'lowerPrice', label: 'Option D: lower-priced car', kind: 'money', required: false },
    ];
  if (intent === 'prepay') return [{ key: 'splitPct', label: 'Option C: share used for prepayment', kind: 'percent', required: false, min: 0, max: 100 }];
  if (intent === 'safe-spend') return [{ key: 'plannedDiscretionary', label: 'Planned discretionary spending per month', kind: 'money', required: false }];
  return [];
}

export function QuestionInput({ q, value, onChange, error }: { q: Question; value: Decision['inputs'][string]; onChange: (v: number | string | null) => void; error?: string | null }) {
  const label = (
    <span>
      {q.label} {q.assumption && <span className="tag dashed">Assumption</span>} {!q.required && <span className="caption">(optional)</span>}
    </span>
  );
  if (q.kind === 'choice')
    return (
      <div className="field">
        <span className="field-label">{label}</span>
        <Segmented value={String(value ?? '')} onChange={(v) => onChange(v)} options={q.options!} />
        {error && <span className="error">{error}</span>}
        {q.help && !error && <span className="help">{q.help}</span>}
      </div>
    );
  if (q.kind === 'money') return <MoneyField label={label} value={(value as number) ?? null} onChange={onChange} help={q.help} error={error} />;
  return (
    <NumberField
      label={label}
      value={value === null || value === undefined || value === '' ? null : Number(value)}
      onChange={onChange}
      suffix={q.kind === 'percent' ? '%' : 'months'}
      help={q.help}
      error={error}
      min={q.min}
      max={q.max}
    />
  );
}

export function validateQuestion(q: Question, v: unknown): string | null {
  const empty = v === null || v === undefined || v === '';
  if (empty) return q.required ? 'This is needed to calculate the decision.' : null;
  if (q.kind !== 'choice') {
    const n = Number(v);
    if (Number.isNaN(n)) return 'Enter a number.';
    if (q.min !== undefined && n < q.min) return `Must be at least ${q.kind === 'money' ? inr(q.min) : q.min}.`;
    if (q.max !== undefined && n > q.max) return `Must be at most ${q.max}.`;
  }
  return null;
}

export function allQuestions(d: Decision, state: AppState) {
  return questionsFor(d.intent, state.data);
}

/** Builds a scenario from a decision option so it can be explored further in Simulate. */
export function scenarioFromOption(d: Decision, opt: DecisionOption, state: AppState): Scenario {
  const base = baseVarsFromProfile(state.data);
  let vars: ScenarioVars = { ...base, ...(opt.scenarioSeed ?? {}) } as ScenarioVars;
  if (d.intent === 'car') vars = { ...vars, horizonMonths: 36 };
  if (d.intent === 'prepay') {
    const out = Number(d.inputs.outstanding);
    const rate = Number(d.inputs.rate);
    const rem = Number(d.inputs.remainingMonths);
    const emi = d.inputs.emi ? Number(d.inputs.emi) : Math.round(calculateEmi(out, rate, rem));
    const otherEmi = base.existingDebt !== out ? base.existingEmi : 0;
    vars = { ...vars, existingDebt: out, existingRate: rate, existingEmi: emi, expenses: base.expenses + otherEmi, essentialExpenses: base.essentialExpenses + otherEmi, horizonMonths: Math.min(120, rem) };
  }
  if (d.intent === 'safe-spend') {
    vars = { ...vars, incomeLow: opt.scenarioSeed?.incomeLow ? opt.scenarioSeed.incomeLow : null, oneOffMonth: 2 };
  }
  return {
    id: uid('scn'),
    name: `${d.title} — ${opt.label.split(':')[0]}`,
    template: d.intent === 'car' ? 'car' : d.intent === 'prepay' ? 'prepay' : d.intent === 'safe-spend' ? 'variable-income' : 'custom',
    vars,
    saved: false,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    fromDecisionId: d.id,
  };
}

export function useOpenInSimulator() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  return (d: Decision, opt: DecisionOption) => {
    const sc = scenarioFromOption(d, opt, state);
    actions.upsertScenario(sc);
    navigate(`/simulate/${sc.id}`);
  };
}
