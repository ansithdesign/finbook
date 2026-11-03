// Use case 01 — car affordability. All numbers come from the profile, the user's answers and the EMI formula.

import { compareGoalAllocations, type GoalImpactRow } from '@/calculations/financial/goals';
import { loanSummary } from '@/calculations/financial/loans';
import {
  calculateEmergencyReserves,
  calculateEssentialMonthly,
  calculateFixedObligations,
  calculateLiquidFunds,
  calculateMonthlyIncome,
  calculateMonthlySurplus,
} from '@/calculations/financial/overview';
import type { FinancialData } from '@/types';
import { inr, months, pct } from '@/utils/format';
import type { Inputs } from '../questions';

export interface OptionMetric {
  key: string;
  label: string;
  value: number | null;
  format: 'inr' | 'months' | 'pct' | 'tenure' | 'text';
  text?: string;
  /** For comparison tables: is lower better? */
  lowerIsBetter?: boolean;
}

export interface DecisionOption {
  key: string;
  label: string;
  summary: string;
  feasible: boolean;
  infeasibleReason?: string;
  metrics: OptionMetric[];
  advantages: string[];
  disadvantages: string[];
  goalImpact: GoalImpactRow[];
  /** For "Open in simulator". */
  scenarioSeed?: Record<string, number>;
  goalSeed?: { name: string; type: 'car' | 'emergency' | 'other' | 'house'; target: number; months: number };
}

export interface DecisionAnalysis {
  ok: boolean;
  blockers: string[];
  headline: string;
  findings: string[];
  options: DecisionOption[];
  assumptions: string[];
  risks: string[];
  whatCouldChange: string[];
  methodology: Array<{ label: string; formula: string }>;
  limitations: string[];
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : null);

export function analyzeCar(data: FinancialData, inputs: Inputs, emergencyTarget = 6): DecisionAnalysis {
  const price = num(inputs.price);
  const income = calculateMonthlyIncome(data).value;
  const s = calculateMonthlySurplus(data);
  const liquid = calculateLiquidFunds(data).value;
  const reserves = calculateEmergencyReserves(data).value;
  const essential = calculateEssentialMonthly(data).value;
  const fixed = calculateFixedObligations(data).value ?? 0;
  const blockers: string[] = [];
  if (price === null) blockers.push('Car price is needed.');
  if (income === null) blockers.push('Monthly income is missing from your profile.');
  if (s.expenses.value === null) blockers.push('Monthly expenses are missing from your profile.');
  if (liquid === null) blockers.push('Liquid funds (savings / bank balances) are missing from your profile.');
  if (blockers.length || price === null || income === null || liquid === null || s.surplus.value === null) {
    return emptyAnalysis(blockers);
  }

  const rate = num(inputs.interestRate) ?? 9.5;
  const tenure = num(inputs.tenureMonths) ?? 60;
  const down = Math.min(num(inputs.downPayment) ?? Math.round(price * 0.2), price);
  const largerDown = Math.min(num(inputs.largerDownPayment) ?? Math.round(price * 0.4), price);
  const lowerPrice = num(inputs.lowerPrice) ?? Math.round(price * 0.7);
  const waitSave = num(inputs.waitMonthlySaving) ?? 15000;
  const preferredEmi = num(inputs.preferredEmi);
  const baseAvailable = s.afterSip ?? s.surplus.value;
  const reservesVal = reserves ?? liquid;
  const essentialVal = essential ?? 0;

  function build(key: string, label: string, summary: string, p: number, dp: number, opts: { wait?: boolean; cash?: boolean } = {}): DecisionOption {
    const loanAmt = opts.cash ? 0 : Math.max(0, p - dp);
    const loan = loanSummary(loanAmt, rate, tenure);
    const emi = loanAmt > 0 ? loan.emi : 0;
    // When waiting, the extra down payment is built from new monthly savings, so today's liquid funds fund only the original down payment.
    const fromLiquid = opts.wait ? Math.max(0, dp - waitSave * 12) : dp;
    const liquidAfter = liquid! - fromLiquid;
    const reservesAfter = Math.max(0, reservesVal - fromLiquid);
    const coverageAfter = essentialVal + emi > 0 ? reservesAfter / (essentialVal + emi) : null;
    const surplusAfter = s.surplus.value! - emi;
    const ratioAfter = income! > 0 ? (fixed + emi) / income! : null;
    // While waiting, the monthly saving competes with goals; afterwards the EMI does. Use the larger of the two.
    const monthlyDraw = opts.wait ? Math.max(waitSave, emi) : emi;
    const goalImpact = compareGoalAllocations(data.goals, baseAvailable, baseAvailable - monthlyDraw);
    const feasible = liquidAfter >= 0;
    const advantages: string[] = [];
    const disadvantages: string[] = [];
    if (emi === 0) advantages.push('No new EMI or interest cost.');
    else if (loan.totalInterest < 150000) advantages.push(`Relatively low interest cost (${inr(loan.totalInterest)}).`);
    if (coverageAfter !== null && coverageAfter >= emergencyTarget) advantages.push(`Emergency coverage stays at ${months(coverageAfter)}.`);
    if (coverageAfter !== null && coverageAfter < 3) disadvantages.push(`Emergency coverage drops to ${months(coverageAfter)}, below 3 months.`);
    else if (coverageAfter !== null && coverageAfter < emergencyTarget) disadvantages.push(`Emergency coverage falls to ${months(coverageAfter)} (target ${emergencyTarget}).`);
    if (surplusAfter < 0) disadvantages.push(`Monthly surplus becomes negative (${inr(surplusAfter)}).`);
    else if (emi > 0) disadvantages.push(`Adds an EMI of ${inr(emi)} for ${tenure / 12} years.`);
    if (ratioAfter !== null && ratioAfter > 0.4) disadvantages.push(`Fixed obligations reach ${pct(ratioAfter)} of income.`);
    if (preferredEmi !== null && emi > preferredEmi) disadvantages.push(`EMI exceeds your preferred maximum of ${inr(preferredEmi)}.`);
    const delayed = goalImpact.filter((g) => g.after.funded < g.before.funded);
    if (delayed.length) disadvantages.push(`Reduces funding for ${delayed.map((g) => g.name).join(', ')}.`);
    else if (data.goals.length) advantages.push('Existing goal contributions remain funded.');
    if (opts.wait) {
      advantages.push(`Down payment grows by ${inr(waitSave * 12)} from savings, so the loan is smaller.`);
      disadvantages.push('Purchase delayed by 12 months; prices may change.');
      disadvantages.push(`Requires saving ${inr(waitSave)} a month for 12 months.`);
    }

    return {
      key,
      label,
      summary,
      feasible,
      infeasibleReason: feasible ? undefined : `Needs ${inr(fromLiquid)} from liquid funds; you have ${inr(liquid)}. The balance would have to come from selling investments or borrowing.`,
      metrics: [
        { key: 'price', label: 'Car price', value: p, format: 'inr' },
        { key: 'down', label: 'Down payment', value: dp, format: 'inr' },
        { key: 'loan', label: 'Loan amount', value: loanAmt, format: 'inr', lowerIsBetter: true },
        { key: 'emi', label: 'Estimated EMI', value: emi, format: 'inr', lowerIsBetter: true },
        { key: 'interest', label: 'Total interest', value: loanAmt > 0 ? loan.totalInterest : 0, format: 'inr', lowerIsBetter: true },
        { key: 'repayment', label: 'Total repayment', value: loanAmt > 0 ? loan.totalPayment : 0, format: 'inr', lowerIsBetter: true },
        { key: 'surplus', label: 'Monthly surplus after EMI', value: surplusAfter, format: 'inr' },
        { key: 'liquid', label: 'Liquid funds after down payment', value: liquidAfter, format: 'inr' },
        { key: 'coverage', label: 'Emergency fund coverage', value: coverageAfter, format: 'months' },
        { key: 'ratio', label: 'Fixed commitment ratio', value: ratioAfter, format: 'pct', lowerIsBetter: true },
      ],
      advantages,
      disadvantages,
      goalImpact,
      scenarioSeed: { purchaseAmount: p, downPayment: dp, interestRate: rate, tenureMonths: opts.cash ? 0 : tenure, purchaseMonth: opts.wait ? 12 : 1, monthlySavings: opts.wait ? waitSave : 0 },
      goalSeed: { name: `Car down payment (${label.split(':')[0]})`, type: 'car', target: dp, months: opts.wait ? 12 : 3 },
    };
  }

  const options: DecisionOption[] = [
    build('A', 'A: Buy now, smaller down payment', `Buy the ${inr(price)} car now with ${inr(down)} down and finance the rest.`, price, down),
    build('B', 'B: Buy now, larger down payment', `Pay ${inr(largerDown)} down to reduce the loan and EMI.`, price, largerDown),
    build('C', 'C: Wait 12 months and save more', `Save ${inr(waitSave)} a month for a year, then pay ${inr(down + waitSave * 12)} down.`, price, down + waitSave * 12, { wait: true }),
    build('D', 'D: Choose a lower-priced car', `Buy a ${inr(lowerPrice)} car with the same ${pct(down / price)} down payment.`, lowerPrice, Math.round((lowerPrice * down) / price)),
  ];
  const cash = build('E', 'E: Pay in full, no loan', `Pay the full ${inr(price)} from liquid funds.`, price, price, { cash: true });
  if (cash.feasible && (cash.metrics.find((m) => m.key === 'coverage')?.value ?? 0) >= 3) {
    options.push(cash);
  } else {
    cash.feasible = false;
    cash.infeasibleReason = `Paying in full needs ${inr(price)}. With ${inr(liquid)} in liquid funds, this would ${liquid < price ? 'not be possible without selling investments' : 'leave less than 3 months of emergency cover'}.`;
    options.push(cash);
  }

  const a = options[0];
  const aEmi = a.metrics.find((m) => m.key === 'emi')!.value!;
  const aCov = a.metrics.find((m) => m.key === 'coverage')!.value;
  const aSurplus = a.metrics.find((m) => m.key === 'surplus')!.value!;
  const findings = [
    `Buying now with ${inr(down)} down means an estimated EMI of ${inr(aEmi)} at ${rate}% over ${tenure / 12} years.`,
    `Your monthly surplus would go from ${inr(s.surplus.value)} to ${inr(aSurplus)}.`,
    `Liquid funds would fall from ${inr(liquid)} to ${inr(liquid - down)}, covering ${months(aCov)} of essential spending plus EMIs.`,
  ];
  if (data.goals.length) {
    const hit = a.goalImpact.filter((g) => g.after.funded < g.before.funded);
    findings.push(
      hit.length
        ? `If you purchase now, contributions towards ${hit.map((h) => h.name).join(' and ')} may need to decrease.`
        : 'Your existing goal contributions can still be funded under option A.',
    );
  }

  return {
    ok: true,
    blockers: [],
    headline:
      aSurplus < 0
        ? 'Buying this car now with a loan would exceed your monthly surplus.'
        : aCov !== null && aCov < 3
          ? 'Affordable on monthly cash flow, but it would leave thin emergency reserves.'
          : 'This purchase fits your monthly cash flow; the trade-offs are in reserves and goals.',
    findings,
    options,
    assumptions: [
      `Interest rate ${rate}% per year (assumption — confirm with lenders).`,
      `Loan tenure ${tenure} months, fixed EMI, no processing fees or insurance included.`,
      'Down payment comes from liquid funds (savings, current account, cash, FDs). Investments are not sold.',
      'Income and expenses stay at current levels. No inflation or salary increase is assumed.',
      'Option C assumes the car price does not change in 12 months.',
      `Emergency coverage = eligible reserves ÷ (essential expenses + all EMIs). Your target is ${emergencyTarget} months.`,
    ],
    risks: [
      'An income disruption during the loan tenure would need to be met from reduced reserves.',
      'Running costs (fuel, insurance, maintenance) are not included unless you add them as expenses.',
      'Interest rates for your profile may differ from the assumption.',
    ],
    whatCouldChange: [
      'A salary increase or bonus would increase room for the EMI.',
      'A larger down payment lowers EMI but reduces reserves.',
      'Choosing a shorter tenure lowers total interest but raises EMI.',
      'Exchanging or selling an existing vehicle would reduce the amount needed.',
    ],
    methodology: [
      { label: 'EMI', formula: 'P × r × (1+r)^n ÷ ((1+r)^n − 1), r = annual rate ÷ 12, n = months' },
      { label: 'Total interest', formula: 'EMI × n − P' },
      { label: 'Monthly surplus after EMI', formula: 'Income − expenses − existing EMIs − unlinked commitments − new EMI' },
      { label: 'Emergency coverage', formula: '(Eligible reserves − down payment) ÷ (essential expenses + existing EMIs + new EMI)' },
      { label: 'Fixed commitment ratio', formula: '(Existing fixed obligations + new EMI) ÷ monthly income' },
    ],
    limitations: s.surplus.missing > 0 ? [`${s.surplus.missing} value(s) in your profile are missing, so results are estimates.`] : [],
  };
}

export function emptyAnalysis(blockers: string[]): DecisionAnalysis {
  return {
    ok: false,
    blockers,
    headline: 'More information is needed before this can be calculated.',
    findings: [],
    options: [],
    assumptions: [],
    risks: [],
    whatCouldChange: [],
    methodology: [],
    limitations: blockers,
  };
}
