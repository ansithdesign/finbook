// Use case 03 — safe spending with variable income.
// Gives a range, never a single confident figure, and refuses a "safe" number without a low-month figure.

import { projectScenario, type ProjectionSummary } from '@/calculations/projections/scenario';
import {
  calculateEmergencyReserves,
  calculateEssentialExpenses,
  calculateLiquidFunds,
  calculateMonthlyEmi,
  calculateUnlinkedCommitments,
} from '@/calculations/financial/overview';
import type { FinancialData, ScenarioVars } from '@/types';
import { inr, months } from '@/utils/format';
import type { Inputs } from '../questions';
import { emptyAnalysis, type DecisionAnalysis, type DecisionOption } from './car';

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : null);

export interface SafeSpendExtras {
  essentialCore: number;
  reserveTarget: number;
  reserveGap: number;
  reserveTopUp: number;
  conservative: number | null;
  typical: number;
  scenarioSummaries: Record<string, ProjectionSummary>;
  scenarioRows: Record<string, number[]>;
}

export function analyzeSafeSpend(data: FinancialData, inputs: Inputs, emergencyTarget = 6): DecisionAnalysis & { extras?: SafeSpendExtras } {
  const avg = num(inputs.avgIncome);
  const low = num(inputs.lowIncome);
  const high = num(inputs.highIncome) ?? avg;
  const unexpected = num(inputs.unexpectedExpense) ?? 50000;
  const essential = calculateEssentialExpenses(data).value;
  const emi = calculateMonthlyEmi(data).value ?? 0;
  const otherCommit = calculateUnlinkedCommitments(data).value ?? 0;
  const reserves = calculateEmergencyReserves(data).value ?? 0;
  const liquid = calculateLiquidFunds(data).value ?? reserves;
  const blockers: string[] = [];
  if (avg === null) blockers.push('Average monthly income is needed.');
  if (essential === null) blockers.push('Essential expenses are missing from your profile.');
  if (avg === null || essential === null) return emptyAnalysis(blockers);

  const planned = num(inputs.plannedDiscretionary) ?? 0;
  const essentialCore = essential + emi + otherCommit;
  const reserveTarget = essentialCore * emergencyTarget;
  const reserveGap = Math.max(0, reserveTarget - reserves);
  const reserveTopUp = Math.round(reserveGap / 12);
  const typical = Math.max(0, Math.round(avg - essentialCore - reserveTopUp));
  const conservative = low === null ? null : Math.max(0, Math.round(low - essentialCore - reserveTopUp));

  const base: ScenarioVars = {
    horizonMonths: 12,
    income: avg,
    incomeLow: null,
    expenses: essential + otherCommit + planned,
    essentialExpenses: essential + otherCommit,
    existingEmi: emi,
    existingDebt: 0,
    existingRate: 0,
    openingLiquid: liquid,
    purchaseAmount: 0,
    downPayment: 0,
    interestRate: 0,
    tenureMonths: 0,
    purchaseMonth: 1,
    monthlyInvestment: 0,
    monthlySavings: 0,
    extraLoanPrepayment: 0,
    expectedReturnPct: 0,
    oneOffExpense: 0,
    oneOffMonth: 2,
  };
  const variants: Record<string, ScenarioVars> = {
    average: { ...base },
    low: { ...base, income: low ?? avg },
    high: { ...base, income: high ?? avg },
    unexpected: { ...base, incomeLow: low, oneOffExpense: unexpected, oneOffMonth: 2 },
  };
  const scenarioSummaries: Record<string, ProjectionSummary> = {};
  const scenarioRows: Record<string, number[]> = {};
  for (const [k, v] of Object.entries(variants)) {
    const p = projectScenario(v);
    scenarioSummaries[k] = p.summary;
    scenarioRows[k] = p.rows.map((r) => r.closingLiquid);
  }

  const mk = (key: string, label: string, summary: string, income: number | null, sum: ProjectionSummary, adv: string[], dis: string[]): DecisionOption => {
    const net = income === null ? null : income - base.expenses - emi;
    return {
      key,
      label,
      summary,
      feasible: income !== null,
      infeasibleReason: income === null ? 'Needs your lowest typical monthly income.' : undefined,
      metrics: [
        { key: 'income', label: 'Income per month', value: income, format: 'inr' },
        { key: 'outgo', label: 'Essentials + EMIs + planned spending', value: base.expenses + emi, format: 'inr' },
        { key: 'net', label: 'Monthly cash flow', value: net, format: 'inr' },
        { key: 'end', label: 'Liquid funds after 12 months', value: sum.endLiquidity, format: 'inr' },
        { key: 'min', label: 'Lowest point', value: sum.minLiquidity, format: 'inr' },
        { key: 'coverage', label: 'Coverage at lowest point', value: essentialCore > 0 ? sum.minLiquidity / essentialCore : null, format: 'months' },
      ],
      advantages: adv,
      disadvantages: dis,
      goalImpact: [],
      scenarioSeed: { income: income ?? avg, incomeLow: key === 'unexpected' ? low ?? 0 : 0, oneOffExpense: key === 'unexpected' ? unexpected : 0, horizonMonths: 12 },
    };
  };

  const options: DecisionOption[] = [
    mk('average', 'Average-income months', `Every month brings ${inr(avg)}.`, avg, scenarioSummaries.average, ['Reflects a typical month.'], ['Overstates safety if low months cluster together.']),
    mk('low', 'Low-income months', low === null ? 'Lowest-month income unknown.' : `Every month brings only ${inr(low)} — a stress test.`, low, scenarioSummaries.low,
      ['Shows how long reserves last in a prolonged slow period.'], scenarioSummaries.low.negativeMonths ? [`Cash flow is negative every month at this spending level.`] : []),
    mk('high', 'High-income months', `Every month brings ${inr(high)}.`, high, scenarioSummaries.high, ['Shows how quickly reserves can be rebuilt in good months.'], ['Not a safe basis for regular spending.']),
    mk('unexpected', 'Unexpected expense', `Typical months with a low month every third month, plus a ${inr(unexpected)} expense in month 2.`, avg, scenarioSummaries.unexpected,
      ['Tests resilience to a realistic shock.'], [`The ${inr(unexpected)} shock is paid from reserves.`]),
  ];

  const findings: string[] = [];
  if (conservative === null) {
    findings.push(`Without a figure for your lowest typical month, a reliable safe-spending estimate cannot be calculated. In an average month, about ${inr(typical)} remains for discretionary spending — but that is not a safe figure for lean months.`);
  } else if (low !== null && low < essentialCore) {
    findings.push(`In a low month (${inr(low)}), income does not cover essential commitments of ${inr(essentialCore)} — the ${inr(essentialCore - low)} gap comes from reserves. Discretionary spending is only safe in average months, up to about ${inr(typical)}.`);
  } else {
    findings.push(`A safe discretionary spending range is about ${inr(conservative)} (based on a low month) to ${inr(typical)} (based on an average month).`);
  }
  findings.push(`Essential commitments total ${inr(essentialCore)} a month: essentials ${inr(essential)}, EMIs ${inr(emi)} and other commitments ${inr(Math.round(otherCommit))}.`);
  findings.push(
    reserveGap > 0
      ? `Reserves of ${inr(reserves)} cover ${months(reserves / essentialCore)}. Reaching ${emergencyTarget} months (${inr(reserveTarget)}) needs ${inr(reserveTopUp)} a month for 12 months, which is set aside before discretionary spending.`
      : `Reserves of ${inr(reserves)} already cover ${months(reserves / essentialCore)} of essential commitments.`,
  );
  findings.push(`With your planned discretionary spending of ${inr(planned)}, the low-income stress test ends the year at ${inr(scenarioSummaries.low.endLiquidity)} in liquid funds.`);

  return {
    ok: true,
    blockers: [],
    headline:
      conservative === null
        ? 'A safe range needs your lowest typical month.'
        : low !== null && low < essentialCore
          ? `Low months don't cover essentials. Keep discretionary spending to ${inr(typical)} or less, and only in average months.`
          : `Safe discretionary spending: ${inr(conservative)} – ${inr(typical)} a month.`,
    findings,
    options,
    assumptions: [
      'Income figures are your own estimates of typical, low and high months.',
      'The unexpected-expense scenario uses an illustrative pattern: every third month is a low month.',
      `Reserve target is ${emergencyTarget} months of essential commitments, to be reached over 12 months.`,
      'Quarterly and yearly commitments (e.g. advance tax, insurance) are spread into a monthly equivalent.',
      'No interest is assumed on cash reserves. Taxes are excluded unless entered as commitments.',
    ],
    risks: ['Consecutive low months drain reserves faster than averages suggest.', 'Delayed client payments can create gaps even when annual income is fine.'],
    whatCouldChange: ['A retainer or steady client would raise the low-month figure.', 'Lowering fixed costs raises the safe range in every scenario.', 'Reaching the reserve target frees the monthly top-up for spending.'],
    methodology: [
      { label: 'Essential commitments', formula: 'Essential expenses + EMIs + other recurring commitments (monthly equivalent)' },
      { label: 'Reserve top-up', formula: `max(0, essentials × ${emergencyTarget} − reserves) ÷ 12` },
      { label: 'Conservative safe spend', formula: 'Lowest-month income − essential commitments − reserve top-up' },
      { label: 'Typical safe spend', formula: 'Average income − essential commitments − reserve top-up' },
      { label: 'Projection', formula: 'Liquid(m) = Liquid(m−1) + income(m) − expenses − EMIs − one-off(m)' },
    ],
    limitations: low === null ? ['Lowest-month income not provided — only the typical figure is shown.'] : [],
    extras: { essentialCore, reserveTarget, reserveGap, reserveTopUp, conservative, typical, scenarioSummaries, scenarioRows },
  };
}
