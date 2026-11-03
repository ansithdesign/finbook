// Clarification questions per decision type. Questions are conditional and skip anything the
// profile already answers. Defaults are derived from the profile or are clearly labelled assumptions.

import {
  calculateIncomeRange,
  calculateMonthlySip,
  calculateMonthlySurplus,
  calculateDiscretionaryExpenses,
} from '@/calculations/financial/overview';
import type { Decision, DecisionIntent, FinancialData } from '@/types';
import { primaryHomeLoan } from './context';

export type Inputs = Decision['inputs'];

export interface Question {
  key: string;
  label: string;
  help?: string;
  kind: 'money' | 'percent' | 'months' | 'choice';
  options?: Array<{ value: string; label: string }>;
  required: boolean;
  /** Marked as an assumption in the UI (e.g. interest rate, investment return). */
  assumption?: boolean;
  show?: (inputs: Inputs) => boolean;
  min?: number;
  max?: number;
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function defaultInputs(intent: DecisionIntent, data: FinancialData, amount: number | null): Inputs {
  const s = calculateMonthlySurplus(data);
  const goalContribs = data.goals.reduce((x, g) => x + (g.monthlyContribution ?? 0), 0);
  const freeAfterGoals = s.afterSip === null ? null : Math.max(0, s.afterSip - goalContribs);
  if (intent === 'car') {
    const price = amount ?? null;
    return {
      price,
      financing: 'loan',
      downPayment: price ? roundTo(price * 0.2, 10000) : null,
      largerDownPayment: price ? roundTo(price * 0.4, 10000) : null,
      interestRate: 9.5,
      tenureMonths: 60,
      preferredEmi: null,
      timing: 'now',
      lowerPrice: price ? roundTo(price * 0.7, 50000) : null,
      waitMonthlySaving: freeAfterGoals !== null ? roundTo(Math.max(10000, Math.min(freeAfterGoals || 15000, 30000)), 1000) : 15000,
    };
  }
  if (intent === 'prepay') {
    const hl = primaryHomeLoan(data);
    const sip = calculateMonthlySip(data);
    return {
      outstanding: hl?.outstanding ?? null,
      rate: hl?.rate ?? null,
      remainingMonths: hl?.remainingMonths ?? null,
      emi: hl?.emi ?? null,
      currentSip: sip || null,
      extraMonthly: freeAfterGoals !== null && freeAfterGoals > 0 ? roundTo(Math.min(freeAfterGoals, 25000), 1000) : null,
      expectedReturn: 10,
      splitPct: 50,
      loanId: hl?.id ?? null,
    };
  }
  if (intent === 'safe-spend') {
    const r = calculateIncomeRange(data);
    return {
      avgIncome: r.average !== null ? Math.round(r.average) : null,
      lowIncome: r.variable && r.missingRange === 0 && r.low !== null ? Math.round(r.low) : null,
      highIncome: r.variable && r.high !== null ? Math.round(r.high) : null,
      unexpectedExpense: 50000,
      plannedDiscretionary: calculateDiscretionaryExpenses(data).value,
    };
  }
  return {};
}

export function questionsFor(intent: DecisionIntent, data: FinancialData): Question[] {
  if (intent === 'car') {
    return [
      { key: 'price', label: 'What is the price of the car (on-road)?', kind: 'money', required: true, min: 100000 },
      {
        key: 'timing',
        label: 'When are you planning to purchase?',
        kind: 'choice',
        required: true,
        options: [
          { value: 'now', label: 'Within 3 months' },
          { value: 'later', label: 'In 6–12 months' },
          { value: 'unsure', label: 'Not sure yet' },
        ],
      },
      {
        key: 'financing',
        label: 'Will you take a loan?',
        kind: 'choice',
        required: true,
        options: [
          { value: 'loan', label: 'Yes, car loan' },
          { value: 'cash', label: 'No, pay in full' },
          { value: 'unsure', label: 'Compare both' },
        ],
      },
      { key: 'downPayment', label: 'What is your expected down payment?', help: 'Paid from your liquid funds.', kind: 'money', required: true, show: (i) => i.financing !== 'cash' },
      {
        key: 'tenureMonths',
        label: 'What loan tenure are you considering?',
        kind: 'choice',
        required: true,
        show: (i) => i.financing !== 'cash',
        options: [
          { value: '36', label: '3 years' },
          { value: '48', label: '4 years' },
          { value: '60', label: '5 years' },
          { value: '84', label: '7 years' },
        ],
      },
      { key: 'interestRate', label: 'Expected interest rate (per year)', help: 'Assumption. Typical new-car loan rates vary by lender and credit profile.', kind: 'percent', required: true, assumption: true, show: (i) => i.financing !== 'cash', min: 0, max: 30 },
      { key: 'preferredEmi', label: 'Do you have a preferred maximum monthly EMI?', help: 'Optional. Leave blank if you do not have one.', kind: 'money', required: false, show: (i) => i.financing !== 'cash' },
    ];
  }
  if (intent === 'prepay') {
    const hl = primaryHomeLoan(data);
    const qs: Question[] = [];
    if (!hl || hl.outstanding === null) qs.push({ key: 'outstanding', label: 'Outstanding home loan amount', kind: 'money', required: true });
    if (!hl || hl.rate === null) qs.push({ key: 'rate', label: 'Home loan interest rate (per year)', kind: 'percent', required: true, min: 0, max: 20 });
    if (!hl || hl.remainingMonths === null) qs.push({ key: 'remainingMonths', label: 'Remaining tenure (months)', kind: 'months', required: true, min: 1, max: 360 });
    if (!hl || hl.emi === null) qs.push({ key: 'emi', label: 'Current EMI', help: 'Optional — calculated from the loan details if left blank.', kind: 'money', required: false });
    if (calculateMonthlySip(data) === 0) qs.push({ key: 'currentSip', label: 'Current monthly SIP contribution', help: 'Enter 0 if you do not invest through SIPs.', kind: 'money', required: true });
    qs.push({ key: 'extraMonthly', label: 'How much additional money can you put aside each month?', help: 'This is the amount we compare: prepay, invest, split, or hold as cash.', kind: 'money', required: true, min: 1000 });
    qs.push({ key: 'expectedReturn', label: 'Expected investment return (per year)', help: 'Assumption, not a guarantee. Market-linked returns can be lower or negative.', kind: 'percent', required: true, assumption: true, min: 0, max: 20 });
    return qs;
  }
  if (intent === 'safe-spend') {
    const r = calculateIncomeRange(data);
    const qs: Question[] = [];
    if (r.average === null) qs.push({ key: 'avgIncome', label: 'Average monthly income', kind: 'money', required: true });
    if (!r.variable || r.missingRange > 0) qs.push({ key: 'lowIncome', label: 'Income in a low month', help: 'Think of a typical lean month in the last year.', kind: 'money', required: false });
    if (!r.variable) qs.push({ key: 'highIncome', label: 'Income in a good month', kind: 'money', required: false });
    qs.push({ key: 'unexpectedExpense', label: 'Size of an unexpected expense to test against', help: 'For example a medical bill or laptop replacement.', kind: 'money', required: true });
    return qs;
  }
  return [];
}

export function visibleQuestions(qs: Question[], inputs: Inputs): Question[] {
  return qs.filter((q) => !q.show || q.show(inputs));
}

export function unansweredRequired(qs: Question[], inputs: Inputs): Question[] {
  return visibleQuestions(qs, inputs).filter((q) => q.required && (inputs[q.key] === null || inputs[q.key] === undefined || inputs[q.key] === ''));
}
