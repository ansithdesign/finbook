// Deterministic overview calculations derived from the user's records.
// Missing values (null) are never silently treated as zero: each result reports how many inputs were missing.

import type {
  Asset,
  Commitment,
  Expense,
  FinancialData,
  Frequency,
  IncomeSource,
  Liability,
} from '@/types';
import { calculateEmi } from './loans';

export interface Calc {
  /** null when nothing at all is known. */
  value: number | null;
  /** Number of relevant records whose amount is unknown. */
  missing: number;
  /** True when any input is an estimate or was derived. */
  estimated: boolean;
}

const PER_MONTH: Record<Frequency, number> = { monthly: 1, quarterly: 3, 'half-yearly': 6, yearly: 12 };

export function toMonthly(amount: number, frequency: Frequency | 'once'): number {
  if (frequency === 'once') return 0;
  return amount / PER_MONTH[frequency];
}

function sumKnown(values: Array<number | null>, estimated = false): Calc {
  let total = 0;
  let known = 0;
  let missing = 0;
  for (const v of values) {
    if (v === null || v === undefined || Number.isNaN(v)) missing += 1;
    else {
      total += v;
      known += 1;
    }
  }
  return { value: known === 0 && missing > 0 ? null : total, missing, estimated };
}

const anyEstimated = (items: Array<{ source: string }>) => items.some((i) => i.source === 'estimated');

// ---------- Assets & liabilities ----------

export function calculateTotalAssets(data: Pick<FinancialData, 'assets'>): Calc {
  return sumKnown(data.assets.map((a) => a.value), anyEstimated(data.assets));
}

export function calculateTotalLiabilities(data: Pick<FinancialData, 'liabilities'>): Calc {
  return sumKnown(data.liabilities.map((l) => l.outstanding), anyEstimated(data.liabilities));
}

export function calculateNetWorth(data: Pick<FinancialData, 'assets' | 'liabilities'>): Calc {
  const a = calculateTotalAssets(data);
  const l = calculateTotalLiabilities(data);
  const nothingRecorded = data.assets.length === 0 && data.liabilities.length === 0;
  if (nothingRecorded || (a.value === null && l.value === null)) return { value: null, missing: a.missing + l.missing, estimated: false };
  return {
    value: (a.value ?? 0) - (l.value ?? 0),
    missing: a.missing + l.missing,
    estimated: a.estimated || l.estimated,
  };
}

export function assetsByLiquidity(assets: Asset[]) {
  const group = (pred: (a: Asset) => boolean) => sumKnown(assets.filter(pred).map((a) => a.value));
  return {
    liquid: group((a) => a.liquidity === 'liquid'),
    market: group((a) => a.liquidity === 'market'),
    locked: group((a) => a.liquidity === 'locked'),
  };
}

/** Only assets classified as readily accessible. Investments are not cash. */
export function calculateLiquidFunds(data: Pick<FinancialData, 'assets'>): Calc {
  const liquid = data.assets.filter((a) => a.liquidity === 'liquid');
  return sumKnown(liquid.map((a) => a.value), anyEstimated(liquid));
}

export function calculateEmergencyReserves(data: Pick<FinancialData, 'assets'>): Calc {
  const eligible = data.assets.filter((a) => a.emergencyEligible);
  return sumKnown(eligible.map((a) => a.value), anyEstimated(eligible));
}

// ---------- Income ----------

export function monthlyIncomeOf(i: IncomeSource): number | null {
  return i.amount === null ? null : toMonthly(i.amount, i.frequency);
}

export function calculateMonthlyIncome(data: Pick<FinancialData, 'incomes'>): Calc {
  return sumKnown(data.incomes.map(monthlyIncomeOf), anyEstimated(data.incomes));
}

export function isVariableIncome(i: IncomeSource): boolean {
  return i.kind === 'freelance' || i.kind === 'business' || i.kind === 'variable-salary' || i.paymentPattern === 'irregular';
}

export interface IncomeRange {
  average: number | null;
  low: number | null;
  high: number | null;
  variable: boolean;
  /** Variable sources with no lowest-month figure: the low estimate falls back to the average. */
  missingRange: number;
}

export function calculateIncomeRange(data: Pick<FinancialData, 'incomes'>): IncomeRange {
  const avg = calculateMonthlyIncome(data).value;
  let low = 0;
  let high = 0;
  let missingRange = 0;
  let variable = false;
  for (const i of data.incomes) {
    const m = monthlyIncomeOf(i);
    if (m === null) continue;
    if (isVariableIncome(i)) {
      variable = true;
      if (i.min === null || i.min === undefined) missingRange += 1;
      low += i.min !== null && i.min !== undefined ? toMonthly(i.min, i.frequency) : m;
      high += i.max !== null && i.max !== undefined ? toMonthly(i.max, i.frequency) : m;
    } else {
      low += m;
      high += m;
    }
  }
  return { average: avg, low: avg === null ? null : low, high: avg === null ? null : high, variable, missingRange };
}

// ---------- Expenses ----------

export function monthlyExpenseOf(e: Expense): number | null {
  return e.amount === null ? null : toMonthly(e.amount, e.frequency);
}

export function calculateMonthlyExpenses(data: Pick<FinancialData, 'expenses'>): Calc {
  return sumKnown(data.expenses.map(monthlyExpenseOf), anyEstimated(data.expenses));
}

export function calculateEssentialExpenses(data: Pick<FinancialData, 'expenses'>): Calc {
  const e = data.expenses.filter((x) => x.essential);
  return sumKnown(e.map(monthlyExpenseOf), anyEstimated(e));
}

export function calculateDiscretionaryExpenses(data: Pick<FinancialData, 'expenses'>): Calc {
  const e = data.expenses.filter((x) => !x.essential);
  return sumKnown(e.map(monthlyExpenseOf), anyEstimated(e));
}

// ---------- EMIs and commitments ----------

/** EMI of a liability. If unknown but outstanding, rate and tenure are known, it is derived (estimated). */
export function liabilityEmi(l: Liability): { value: number | null; derived: boolean } {
  if (l.emi !== null) return { value: l.emi, derived: false };
  if (l.outstanding !== null && l.rate !== null && l.remainingMonths) {
    return { value: Math.round(calculateEmi(l.outstanding, l.rate, l.remainingMonths)), derived: true };
  }
  return { value: null, derived: false };
}

export function calculateMonthlyEmi(data: Pick<FinancialData, 'liabilities'>): Calc {
  // Credit-card outstanding has no EMI; it is repaid from regular spending.
  const loans = data.liabilities.filter((l) => l.type !== 'credit-card');
  const vals = loans.map((l) => liabilityEmi(l));
  const c = sumKnown(vals.map((v) => v.value));
  return { ...c, estimated: c.estimated || vals.some((v) => v.derived) || anyEstimated(loans) };
}

/**
 * Commitments that are NOT already counted elsewhere. Linked commitments (e.g. rent linked
 * to the Housing expense, an EMI linked to a loan) are excluded to avoid double-counting.
 * SIPs are investing allocations, not expenditure.
 */
export function unlinkedCommitments(commitments: Commitment[]): Commitment[] {
  return commitments.filter((c) => !c.linkedTo && c.type !== 'sip' && c.recurrence !== 'once');
}

export function calculateUnlinkedCommitments(data: Pick<FinancialData, 'commitments'>): Calc {
  return sumKnown(unlinkedCommitments(data.commitments).map((c) => (c.amount === null ? null : toMonthly(c.amount, c.recurrence))));
}

export function calculateMonthlySip(data: Pick<FinancialData, 'commitments'>): number {
  return data.commitments
    .filter((c) => c.type === 'sip' && c.amount !== null)
    .reduce((s, c) => s + toMonthly(c.amount as number, c.recurrence), 0);
}

// ---------- Surplus ----------

export interface SurplusBreakdown {
  income: Calc;
  expenses: Calc;
  emi: Calc;
  otherCommitments: Calc;
  surplus: Calc;
  sip: number;
  afterSip: number | null;
}

/** Surplus = normalised income − expenditure − EMIs − commitments not already in expenditure. */
export function calculateMonthlySurplus(data: FinancialData): SurplusBreakdown {
  const income = calculateMonthlyIncome(data);
  const expenses = calculateMonthlyExpenses(data);
  const emi = calculateMonthlyEmi(data);
  const otherCommitments = calculateUnlinkedCommitments(data);
  const sip = calculateMonthlySip(data);
  let surplus: Calc;
  if (income.value === null || expenses.value === null) {
    surplus = { value: null, missing: income.missing + expenses.missing, estimated: true };
  } else {
    surplus = {
      value: income.value - expenses.value - (emi.value ?? 0) - (otherCommitments.value ?? 0),
      missing: income.missing + expenses.missing + emi.missing + otherCommitments.missing,
      estimated: income.estimated || expenses.estimated || emi.estimated,
    };
  }
  return {
    income,
    expenses,
    emi,
    otherCommitments,
    surplus,
    sip,
    afterSip: surplus.value === null ? null : surplus.value - sip,
  };
}

// ---------- Ratios ----------

/** Essential monthly expenditure: essential expenses + EMIs + unlinked commitments (rent, insurance, fees). */
export function calculateEssentialMonthly(data: FinancialData): Calc {
  const ess = calculateEssentialExpenses(data);
  const emi = calculateMonthlyEmi(data);
  const other = calculateUnlinkedCommitments(data);
  if (ess.value === null) return { value: null, missing: ess.missing, estimated: true };
  return {
    value: ess.value + (emi.value ?? 0) + (other.value ?? 0),
    missing: ess.missing + emi.missing + other.missing,
    estimated: ess.estimated || emi.estimated,
  };
}

/** Months of essential spending covered by eligible emergency reserves. */
export function calculateEmergencyCoverage(data: FinancialData): Calc {
  const reserves = calculateEmergencyReserves(data);
  const essential = calculateEssentialMonthly(data);
  if (reserves.value === null || essential.value === null || essential.value <= 0) {
    return { value: null, missing: reserves.missing + essential.missing, estimated: true };
  }
  return {
    value: reserves.value / essential.value,
    missing: reserves.missing + essential.missing,
    estimated: reserves.estimated || essential.estimated,
  };
}

export function emergencyCoverageFrom(reserves: number, essentialMonthly: number): number | null {
  return essentialMonthly > 0 ? reserves / essentialMonthly : null;
}

const FIXED_TYPES = new Set(['rent', 'insurance', 'school-fees', 'emi']);

/** Fixed obligations: loan EMIs + rent/insurance/fees commitments (each counted once). */
export function calculateFixedObligations(data: FinancialData): Calc {
  const emi = calculateMonthlyEmi(data);
  const fixedCommitments = data.commitments.filter(
    (c) => FIXED_TYPES.has(c.type) && !(c.type === 'emi' && c.linkedTo?.kind === 'liability') && c.recurrence !== 'once',
  );
  const commitmentTotal = sumKnown(fixedCommitments.map((c) => (c.amount === null ? null : toMonthly(c.amount, c.recurrence))));
  return {
    value: (emi.value ?? 0) + (commitmentTotal.value ?? 0),
    missing: emi.missing + commitmentTotal.missing,
    estimated: emi.estimated,
  };
}

export function calculateFixedCommitmentRatio(data: FinancialData): Calc {
  const fixed = calculateFixedObligations(data);
  const income = calculateMonthlyIncome(data);
  if (income.value === null || income.value <= 0 || fixed.value === null) {
    return { value: null, missing: fixed.missing + income.missing, estimated: true };
  }
  return { value: fixed.value / income.value, missing: fixed.missing + income.missing, estimated: fixed.estimated };
}

export function lastUpdated(data: FinancialData): string | null {
  const dates = [...data.incomes, ...data.expenses, ...data.assets, ...data.liabilities, ...data.commitments].map((r) => r.updatedAt);
  if (dates.length === 0) return null;
  return dates.sort().at(-1) ?? null;
}

export function hasAnyFinancialData(data: FinancialData): boolean {
  return (
    data.incomes.length + data.expenses.length + data.assets.length + data.liabilities.length + data.commitments.length > 0
  );
}
