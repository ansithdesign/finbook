// Use case 02 — prepay home loan vs continue investing.
// Contractual loan-interest savings (certain) are kept separate from investment projections (assumed).

import { compareGoalAllocations } from '@/calculations/financial/goals';
import { calculateEmi } from '@/calculations/financial/loans';
import {
  calculateEmergencyReserves,
  calculateEssentialMonthly,
  calculateMonthlySurplus,
} from '@/calculations/financial/overview';
import type { FinancialData } from '@/types';
import { inr, pct, tenure } from '@/utils/format';
import type { Inputs } from '../questions';
import { emptyAnalysis, type DecisionAnalysis, type DecisionOption } from './car';

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : null);

interface PathResult {
  loanMonths: number;
  totalInterest: number;
  /** Projected value of new investments at the original loan end, at an assumed return. */
  investAt: (ret: number) => number;
  liquidBuilt: number;
}

export function analyzePrepay(data: FinancialData, inputs: Inputs, emergencyTarget = 6): DecisionAnalysis {
  const outstanding = num(inputs.outstanding);
  const rate = num(inputs.rate);
  const remaining = num(inputs.remainingMonths);
  const extra = num(inputs.extraMonthly);
  const ret = num(inputs.expectedReturn) ?? 10;
  const split = (num(inputs.splitPct) ?? 50) / 100;
  const blockers: string[] = [];
  if (outstanding === null) blockers.push('Outstanding loan amount is needed.');
  if (rate === null) blockers.push('Loan interest rate is needed.');
  if (remaining === null) blockers.push('Remaining tenure is needed.');
  if (extra === null || extra <= 0) blockers.push('Additional monthly funds are needed.');
  if (blockers.length || outstanding === null || rate === null || remaining === null || extra === null) return emptyAnalysis(blockers);

  const emi = num(inputs.emi) ?? Math.round(calculateEmi(outstanding, rate, remaining));
  const horizon = remaining;
  const reserves = calculateEmergencyReserves(data).value ?? 0;
  const essential = calculateEssentialMonthly(data).value ?? 0;
  const reserveTarget = essential * emergencyTarget;
  const reserveGap = Math.max(0, reserveTarget - reserves);
  const s = calculateMonthlySurplus(data);
  const goalBase = s.afterSip ?? s.surplus.value ?? 0;

  /**
   * Simulates one approach month by month over the original tenure.
   * prepayShare: fraction of `extra` used to prepay. After the loan closes, EMI + extra are invested.
   * holdFirst: months during which `extra` is held as cash before the split starts.
   */
  function path(prepayShare: number, holdFirst = 0): PathResult {
    const prepayPerMonth = (m: number) => (m <= holdFirst ? 0 : extra! * prepayShare);
    // Loan
    let bal = outstanding!;
    const r = rate! / 12 / 100;
    let totalInterest = 0;
    let loanMonths = 0;
    const investFlows: number[] = [];
    let liquidBuilt = 0;
    for (let m = 1; m <= horizon; m++) {
      let invest = 0;
      if (bal > 0.5) {
        const interest = bal * r;
        totalInterest += interest;
        const pay = Math.min(bal + interest, emi + prepayPerMonth(m));
        bal = bal + interest - pay;
        loanMonths = m;
        const leftover = emi + prepayPerMonth(m) - pay;
        invest += leftover;
      } else {
        invest += emi + prepayPerMonth(m); // freed EMI and prepayment get invested
      }
      if (m <= holdFirst) liquidBuilt += extra!;
      else invest += extra! * (1 - prepayShare);
      investFlows.push(invest);
    }
    const investAt = (rr: number) => {
      const mr = rr / 12 / 100;
      return investFlows.reduce((v, f) => v * (1 + mr) + f, 0);
    };
    return { loanMonths, totalInterest: Math.round(totalInterest), investAt, liquidBuilt };
  }

  const holdMonths = reserveGap > 0 ? Math.ceil(reserveGap / extra) : 0;
  const paths = {
    A: path(0),
    B: path(1),
    C: path(split),
    D: path(split, Math.min(holdMonths, horizon)),
  };
  const baseInterest = paths.A.totalInterest;
  const low = Math.max(0, ret - 4);
  const high = ret + 2;
  const goalImpact = compareGoalAllocations(data.goals, goalBase, goalBase - extra);

  function option(key: keyof typeof paths, label: string, summary: string, adv: string[], dis: string[]): DecisionOption {
    const p = paths[key];
    const saved = baseInterest - p.totalInterest;
    return {
      key,
      label,
      summary,
      feasible: true,
      metrics: [
        { key: 'interest', label: 'Total loan interest (contractual)', value: p.totalInterest, format: 'inr', lowerIsBetter: true },
        { key: 'saved', label: 'Interest saved vs A', value: saved, format: 'inr' },
        { key: 'tenure', label: 'Loan closes in', value: p.loanMonths, format: 'tenure', lowerIsBetter: true },
        { key: 'tenureCut', label: 'Tenure reduced by', value: horizon - p.loanMonths, format: 'tenure' },
        { key: 'invest', label: `Projected investments at ${ret}% (assumed)`, value: Math.round(p.investAt(ret)), format: 'inr' },
        { key: 'investRange', label: `Range at ${low}%–${high}%`, value: null, format: 'text', text: `${inr(Math.round(p.investAt(low)))} – ${inr(Math.round(p.investAt(high)))}` },
        { key: 'liquid', label: 'Extra liquidity built', value: p.liquidBuilt, format: 'inr' },
      ],
      advantages: adv,
      disadvantages: dis,
      goalImpact,
      scenarioSeed: { extraLoanPrepayment: key === 'A' ? 0 : Math.round(extra! * (key === 'B' ? 1 : split)), monthlyInvestment: key === 'B' ? 0 : Math.round(extra! * (key === 'A' ? 1 : 1 - split)), expectedReturnPct: ret },
      goalSeed: key === 'D' && reserveGap > 0 ? { name: 'Emergency reserve top-up', type: 'emergency', target: Math.round(reserveGap), months: holdMonths } : undefined,
    };
  }

  const options: DecisionOption[] = [
    option('A', 'A: Continue SIPs and regular EMI', `Keep paying the EMI of ${inr(emi)} and invest the extra ${inr(extra)} a month.`,
      ['Money stays invested and can be withdrawn if needed.', 'Benefits if markets return more than the loan rate over time.'],
      ['Returns are uncertain and can be negative in some years.', `Pays the full contractual interest of ${inr(paths.A.totalInterest)}.`]),
    option('B', 'B: Increase loan prepayment', `Use the full ${inr(extra)} a month to prepay the loan.`,
      [`Saves ${inr(baseInterest - paths.B.totalInterest)} in interest — a contractual saving.`, `Loan closes ${tenure(horizon - paths.B.loanMonths)} earlier.`],
      ['Money paid into the loan cannot easily be withdrawn.', 'Less invested in the early years.', 'Check for any prepayment terms with your lender.']),
    option('C', `C: Split ${Math.round(split * 100)}/${Math.round((1 - split) * 100)}`, `Prepay ${inr(extra * split)} and invest ${inr(extra * (1 - split))} each month.`,
      ['Balances a certain interest saving with some market exposure.', 'Keeps part of the money accessible.'],
      ['Smaller benefit than either extreme if one clearly outperforms.']),
    option('D', 'D: Build liquidity first', reserveGap > 0 ? `Hold the ${inr(extra)} as cash for ${holdMonths} months to reach a ${emergencyTarget}-month reserve, then split.` : `Your reserves already meet the ${emergencyTarget}-month target, so this matches option C.`,
      reserveGap > 0 ? [`Closes the reserve gap of ${inr(reserveGap)} first.`, 'Lowers the risk of needing to borrow in an emergency.'] : ['No change from C — reserves are sufficient.'],
      reserveGap > 0 ? ['Delays both prepayment and investing.', 'Cash may earn less than the loan rate.'] : []),
  ];

  const bSaved = baseInterest - paths.B.totalInterest;
  return {
    ok: true,
    blockers: [],
    headline: `Prepaying is a guaranteed ${rate}% saving; investing could earn more or less than that.`,
    findings: [
      `Prepaying ${inr(extra)} a month saves ${inr(bSaved)} in interest and closes the loan ${tenure(horizon - paths.B.loanMonths)} earlier. This saving is contractual.`,
      `Investing the same amount is projected at ${inr(Math.round(paths.A.investAt(ret)))} by the original loan end, assuming ${ret}% a year — but could be ${inr(Math.round(paths.A.investAt(low)))} at ${low}%.`,
      ret > rate
        ? `Your return assumption (${ret}%) is above the loan rate (${rate}%), so investing projects higher — but only if that return is achieved.`
        : `Your return assumption (${ret}%) is not above the loan rate (${rate}%), so prepayment projects at least as well, with less uncertainty.`,
      reserveGap > 0
        ? `Your emergency reserves are ${inr(reserveGap)} short of a ${emergencyTarget}-month target, which matters before locking money into the loan.`
        : `Your emergency reserves meet a ${emergencyTarget}-month target (${pct(reserves / Math.max(1, reserveTarget))} of target).`,
    ],
    options,
    assumptions: [
      `Loan: ${inr(outstanding)} outstanding at ${rate}% with ${remaining} months left and EMI ${inr(emi)}.`,
      'Prepayments reduce tenure with the same EMI (the usual default). No prepayment charges assumed.',
      `Investment return of ${ret}% a year is an assumption, not a guarantee. Shown with a ${low}%–${high}% range.`,
      'When the loan closes early, the freed EMI and prepayment are assumed to be invested at the same return until the original end date, so options are compared over the same period.',
      'Taxes are excluded: home loan interest deductions, capital gains tax on investments and any rate resets.',
      `Rate is assumed fixed; floating-rate loans can change.`,
    ],
    risks: [
      'Market-linked investments can fall in value, especially over short periods.',
      'Money used to prepay is illiquid — you cannot withdraw it in an emergency.',
      'A floating loan rate may rise or fall, changing the interest saved.',
    ],
    whatCouldChange: [
      'Your tax situation (interest deduction under the old regime) lowers the effective loan rate.',
      'A higher or lower return assumption changes the investment projection.',
      'An upcoming large expense would favour building liquidity first.',
    ],
    methodology: [
      { label: 'Loan interest', formula: 'Monthly amortisation: interest = balance × rate ÷ 12; payment = EMI + prepayment' },
      { label: 'Interest saved', formula: 'Total interest (option A) − total interest (option)' },
      { label: 'Investment projection', formula: 'Value(m) = Value(m−1) × (1 + return ÷ 12) + contribution(m)' },
      { label: 'Reserve gap', formula: `Essential monthly spending × ${emergencyTarget} − eligible reserves` },
    ],
    limitations: ['Projections are estimates. Investment values are not guaranteed.'],
  };
}

