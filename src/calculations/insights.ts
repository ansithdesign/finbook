// Rule-based financial insights. Every insight states what was observed and why it is shown.
// Trend insights only appear when real monthly history exists — nothing is fabricated.

import type { FinancialData } from '@/types';
import { inr, months, pct } from '@/utils/format';
import {
  calculateEmergencyCoverage,
  calculateEmergencyReserves,
  calculateEssentialMonthly,
  calculateFixedCommitmentRatio,
  calculateFixedObligations,
  calculateIncomeRange,
  calculateMonthlyEmi,
  calculateMonthlyIncome,
  calculateMonthlySurplus,
} from './financial/overview';
import { findMissingInformation } from './validation/completeness';

export interface Insight {
  id: string;
  severity: 'attention' | 'info';
  title: string;
  observation: string;
  why: string;
  data: Array<{ label: string; value: string }>;
  implications: string;
  action: { label: string; to: string };
}

export function generateInsights(data: FinancialData, emergencyTargetMonths = 6, now = new Date()): Insight[] {
  const out: Insight[] = [];
  const s = calculateMonthlySurplus(data);
  const coverage = calculateEmergencyCoverage(data);
  const reserves = calculateEmergencyReserves(data);
  const essential = calculateEssentialMonthly(data);

  // 1. Emergency reserves
  if (coverage.value !== null && coverage.value < emergencyTargetMonths) {
    const gap = (essential.value ?? 0) * emergencyTargetMonths - (reserves.value ?? 0);
    out.push({
      id: 'emergency',
      severity: coverage.value < 3 ? 'attention' : 'info',
      title: 'Your emergency reserves may be insufficient',
      observation: `Your eligible reserves cover about ${months(coverage.value)} of essential spending.`,
      why: `You have set a target of ${emergencyTargetMonths} months of essential expenses (essential expenses + EMIs + fixed commitments).`,
      data: [
        { label: 'Eligible reserves', value: inr(reserves.value) },
        { label: 'Essential monthly spending', value: inr(essential.value) },
        { label: 'Coverage', value: months(coverage.value) },
        { label: `Gap to ${emergencyTargetMonths}-month target`, value: inr(Math.max(0, gap)) },
      ],
      implications: 'A large expense or income disruption could require selling investments or borrowing.',
      action: { label: 'Create an emergency fund goal', to: '/goals/new?type=emergency' },
    });
  }

  // 2. EMI / fixed commitments
  const ratio = calculateFixedCommitmentRatio(data);
  const emi = calculateMonthlyEmi(data);
  const income = calculateMonthlyIncome(data);
  if (ratio.value !== null && ratio.value >= 0.3) {
    out.push({
      id: 'fixed-ratio',
      severity: ratio.value >= 0.45 ? 'attention' : 'info',
      title: 'Your fixed monthly obligations are significant',
      observation: `${pct(ratio.value)} of your monthly income goes to EMIs and fixed commitments.`,
      why: 'This is shown when fixed obligations are 30% or more of income. Higher ratios leave less room for new loans or income changes.',
      data: [
        { label: 'Fixed obligations', value: inr(calculateFixedObligations(data).value) },
        { label: 'of which EMIs', value: inr(emi.value) },
        { label: 'Monthly income', value: inr(income.value) },
        { label: 'Ratio', value: pct(ratio.value) },
      ],
      implications: 'Taking on another loan would increase this ratio further.',
      action: { label: 'Review liabilities', to: '/home/liabilities' },
    });
  }

  // 3. Variable income: low month vs essentials
  const range = calculateIncomeRange(data);
  if (range.variable && range.low !== null && essential.value !== null) {
    const lowGap = range.low - essential.value;
    out.push({
      id: 'variable-income',
      severity: lowGap < 0 ? 'attention' : 'info',
      title: lowGap < 0 ? 'A low-income month may not cover essentials' : 'Your income varies month to month',
      observation:
        lowGap < 0
          ? `In a low month (${inr(range.low)}), essentials of ${inr(essential.value)} would exceed income by ${inr(-lowGap)}.`
          : `Your income ranges from ${inr(range.low)} to ${inr(range.high)} a month.`,
      why: 'You told us part of your income is variable. Planning around the average can overstate what is safe to spend.',
      data: [
        { label: 'Lowest typical month', value: inr(range.low) },
        { label: 'Average month', value: inr(range.average) },
        { label: 'Essential spending', value: inr(essential.value) },
      ],
      implications: 'Spending based on average months can drain reserves during low months.',
      action: { label: 'Explore safe spending', to: '/decide/ask?q=My%20income%20changes%20every%20month.%20How%20much%20can%20I%20safely%20spend%3F' },
    });
  }

  // 4. Trend insights — only with history
  const hist = [...data.history].sort((a, b) => a.month.localeCompare(b.month));
  if (hist.length >= 2 && s.expenses.value !== null) {
    const prev = hist[hist.length - 1];
    const change = (s.expenses.value - prev.expenses) / prev.expenses;
    if (change > 0.05) {
      out.push({
        id: 'expenses-up',
        severity: 'info',
        title: 'Your expenses have increased',
        observation: `Monthly expenses are ${pct(change)} higher than your recorded figure for ${prev.month}.`,
        why: 'Compared with the last monthly snapshot stored in the app.',
        data: [
          { label: `Recorded (${prev.month})`, value: inr(prev.expenses) },
          { label: 'Current', value: inr(s.expenses.value) },
        ],
        implications: 'Higher expenses reduce your monthly surplus and the amount available for goals.',
        action: { label: 'View expense breakdown', to: '/home/expenses' },
      });
    }
    const prevSurplus = prev.income - prev.expenses;
    const curSurplus = (s.income.value ?? 0) - s.expenses.value;
    if (prevSurplus > 0 && curSurplus < prevSurplus * 0.95) {
      out.push({
        id: 'surplus-down',
        severity: 'info',
        title: 'Your monthly surplus is decreasing',
        observation: `Income minus expenses is ${inr(curSurplus)}, down from ${inr(prevSurplus)} in ${prev.month}.`,
        why: 'Compared with the last monthly snapshot (before EMIs, for like-for-like comparison).',
        data: [
          { label: `Previous (${prev.month})`, value: inr(prevSurplus) },
          { label: 'Current', value: inr(curSurplus) },
        ],
        implications: 'Less surplus means slower progress on goals.',
        action: { label: 'Review income and expenses', to: '/home/expenses' },
      });
    }
  }

  // 5. Negative surplus
  if (s.surplus.value !== null && s.surplus.value < 0) {
    out.push({
      id: 'negative-surplus',
      severity: 'attention',
      title: 'Your outgoings exceed your income',
      observation: `Estimated monthly surplus is ${inr(s.surplus.value)}.`,
      why: 'Income minus expenses, EMIs and commitments is below zero.',
      data: [
        { label: 'Income', value: inr(s.income.value) },
        { label: 'Expenses', value: inr(s.expenses.value) },
        { label: 'EMIs', value: inr(s.emi.value) },
      ],
      implications: 'Shortfalls are being funded from savings or credit.',
      action: { label: 'Review expenses', to: '/home/expenses' },
    });
  }

  // 6. Upcoming commitments in the next 7 days
  const soon = data.commitments.filter((c) => {
    const d = (new Date(c.nextDue).getTime() - now.getTime()) / 86400000;
    return c.status !== 'paid' && d >= 0 && d <= 7 && c.amount !== null;
  });
  if (soon.length > 0) {
    const total = soon.reduce((x, c) => x + (c.amount ?? 0), 0);
    out.push({
      id: 'upcoming',
      severity: 'info',
      title: `${soon.length} payment${soon.length > 1 ? 's' : ''} due in the next 7 days`,
      observation: `${inr(total)} is due soon: ${soon.map((c) => c.name).join(', ')}.`,
      why: 'Shown for commitments due within a week.',
      data: soon.map((c) => ({ label: c.name, value: inr(c.amount) })),
      implications: 'Make sure enough balance is available in the paying account.',
      action: { label: 'View commitments', to: '/home/commitments' },
    });
  }

  // 7. Incomplete information
  const missing = findMissingInformation(data);
  if (missing.length > 0) {
    out.push({
      id: 'incomplete',
      severity: 'info',
      title: 'Some financial information is incomplete',
      observation: `${missing.length} item${missing.length > 1 ? 's are' : ' is'} missing, which limits some calculations.`,
      why: 'Missing values are never treated as zero, so affected numbers are estimates or unavailable.',
      data: missing.slice(0, 4).map((m) => ({ label: m.label, value: m.affects[0] })),
      implications: 'Results that depend on these values are marked as incomplete.',
      action: { label: 'Complete my profile', to: '/profile/completeness' },
    });
  }
  return out;
}
