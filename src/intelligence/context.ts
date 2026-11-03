// 2. Financial context retrieval + 3. missing-information detection.
// Reads only from the user's structured records; nothing is invented.

import {
  calculateDiscretionaryExpenses,
  calculateEmergencyReserves,
  calculateEssentialExpenses,
  calculateIncomeRange,
  calculateLiquidFunds,
  calculateMonthlyEmi,
  calculateMonthlyExpenses,
  calculateMonthlyIncome,
  calculateMonthlySip,
  calculateMonthlySurplus,
  calculateTotalLiabilities,
  calculateUnlinkedCommitments,
} from '@/calculations/financial/overview';
import type { DecisionIntent, FinancialData, Liability, Source } from '@/types';
import { inr } from '@/utils/format';

export interface ContextItem {
  key: string;
  label: string;
  value: number | null;
  display: string;
  source: Source | 'missing';
  editTo: string;
  note?: string;
}

export function primaryHomeLoan(data: FinancialData): Liability | undefined {
  return data.liabilities.find((l) => l.type === 'home') ?? undefined;
}

export function retrieveContext(intent: DecisionIntent, data: FinancialData): ContextItem[] {
  const income = calculateMonthlyIncome(data);
  const expenses = calculateMonthlyExpenses(data);
  const liquid = calculateLiquidFunds(data);
  const emi = calculateMonthlyEmi(data);
  const liabilities = calculateTotalLiabilities(data);
  const s = calculateMonthlySurplus(data);
  const src = (c: { value: number | null; estimated: boolean }): ContextItem['source'] =>
    c.value === null ? 'missing' : c.estimated ? 'estimated' : 'manual';
  const item = (key: string, label: string, c: { value: number | null; estimated: boolean; missing?: number }, editTo: string, note?: string): ContextItem => ({
    key,
    label,
    value: c.value,
    display: inr(c.value),
    source: src(c),
    editTo,
    note: note ?? (c.missing ? `${c.missing} value(s) missing` : undefined),
  });

  const common = [
    item('income', 'Monthly income', income, '/home/income'),
    item('expenses', 'Monthly expenses', expenses, '/home/expenses'),
    item('liquid', 'Liquid funds', liquid, '/home/liquidity', 'Savings, current account, cash and FDs only'),
    item('emi', 'Existing EMIs', emi, '/home/liabilities'),
  ];

  if (intent === 'car') {
    return [
      ...common,
      item('liabilities', 'Current liabilities', liabilities, '/home/liabilities'),
      { ...item('surplus', 'Estimated monthly surplus', { value: s.surplus.value, estimated: true }, '/home'), source: 'calculated' },
      {
        key: 'goals',
        label: 'Existing goals',
        value: data.goals.length,
        display: data.goals.length ? data.goals.map((g) => g.name).join(', ') : 'None',
        source: 'manual',
        editTo: '/goals',
      },
    ];
  }
  if (intent === 'prepay') {
    const hl = primaryHomeLoan(data);
    const sip = calculateMonthlySip(data);
    return [
      ...common,
      {
        key: 'homeLoan',
        label: 'Home loan outstanding',
        value: hl?.outstanding ?? null,
        display: hl ? inr(hl.outstanding) : 'Not in profile',
        source: hl?.outstanding != null ? hl.source : 'missing',
        editTo: hl ? `/records/liability/${hl.id}` : '/records/new/liability?type=home',
      },
      {
        key: 'sip',
        label: 'Current SIP contributions',
        value: sip || null,
        display: sip ? inr(sip) : 'None recorded',
        source: sip ? 'manual' : 'missing',
        editTo: '/home/commitments',
      },
      item('reserves', 'Emergency reserves', calculateEmergencyReserves(data), '/home/liquidity'),
    ];
  }
  if (intent === 'safe-spend') {
    const r = calculateIncomeRange(data);
    return [
      { key: 'avg', label: 'Average monthly income', value: r.average, display: inr(r.average), source: r.average === null ? 'missing' : 'estimated', editTo: '/home/income' },
      {
        key: 'low',
        label: 'Lowest typical month',
        value: r.variable ? r.low : null,
        display: r.variable ? inr(r.low) : 'Not provided',
        source: r.variable && r.missingRange === 0 ? 'estimated' : 'missing',
        editTo: '/home/income',
      },
      item('essential', 'Essential expenses', calculateEssentialExpenses(data), '/home/expenses'),
      item('discretionary', 'Variable (discretionary) expenses', calculateDiscretionaryExpenses(data), '/home/expenses'),
      item('emi', 'Existing EMIs', emi, '/home/liabilities'),
      item('reserves', 'Emergency reserves', calculateEmergencyReserves(data), '/home/liquidity'),
      item('irregular', 'Other recurring commitments (monthly equivalent)', calculateUnlinkedCommitments(data), '/home/commitments', 'Quarterly/yearly items spread per month'),
    ];
  }
  return common;
}

export function missingContext(items: ContextItem[]): ContextItem[] {
  return items.filter((i) => i.source === 'missing' && i.key !== 'sip' && i.key !== 'goals');
}
