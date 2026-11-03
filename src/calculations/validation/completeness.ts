// Detects missing information and explains which features it affects.

import type { FinancialData } from '@/types';
import { liabilityEmi } from '../financial/overview';

export interface MissingItem {
  id: string;
  section: 'Income' | 'Expenses' | 'Savings' | 'Investments & assets' | 'Loans' | 'Goals';
  label: string;
  affects: string[];
  to: string;
}

export function findMissingInformation(data: FinancialData): MissingItem[] {
  const out: MissingItem[] = [];
  if (data.incomes.length === 0) {
    out.push({ id: 'no-income', section: 'Income', label: 'No income added yet', affects: ['Monthly surplus', 'Affordability decisions', 'Goal planning'], to: '/records/new/income' });
  }
  for (const i of data.incomes) {
    if (i.amount === null) out.push({ id: `inc-${i.id}`, section: 'Income', label: `${i.name}: amount unknown`, affects: ['Monthly surplus'], to: `/records/income/${i.id}` });
    else if ((i.kind === 'freelance' || i.kind === 'business' || i.kind === 'variable-salary') && (i.min === null || i.min === undefined)) {
      out.push({ id: `incmin-${i.id}`, section: 'Income', label: `${i.name}: lowest typical month unknown`, affects: ['Safe spending estimate', 'Low-income scenarios'], to: `/records/income/${i.id}` });
    }
  }
  if (data.expenses.length === 0) {
    out.push({ id: 'no-expenses', section: 'Expenses', label: 'No expenses added yet', affects: ['Monthly surplus', 'Emergency fund coverage'], to: '/records/new/expense' });
  }
  for (const e of data.expenses) {
    if (e.amount === null) out.push({ id: `exp-${e.id}`, section: 'Expenses', label: `${e.name}: amount unknown`, affects: ['Monthly surplus'], to: `/records/expense/${e.id}` });
  }
  const liquid = data.assets.filter((a) => a.liquidity === 'liquid');
  if (liquid.length === 0) {
    out.push({ id: 'no-liquid', section: 'Savings', label: 'No savings or bank balances added', affects: ['Liquid funds', 'Emergency fund coverage', 'Down payment checks'], to: '/records/new/asset' });
  }
  for (const a of data.assets) {
    if (a.value === null) out.push({ id: `asset-${a.id}`, section: a.liquidity === 'liquid' ? 'Savings' : 'Investments & assets', label: `${a.name}: value unknown`, affects: ['Net worth'], to: `/records/asset/${a.id}` });
  }
  for (const l of data.liabilities) {
    if (l.outstanding === null) out.push({ id: `lo-${l.id}`, section: 'Loans', label: `${l.name}: outstanding amount unknown`, affects: ['Net worth', 'Debt comparisons'], to: `/records/liability/${l.id}` });
    if (l.type !== 'credit-card' && l.rate === null) out.push({ id: `lr-${l.id}`, section: 'Loans', label: `${l.name}: interest rate unknown`, affects: ['Prepayment analysis', 'Interest calculations'], to: `/records/liability/${l.id}` });
    if (l.type !== 'credit-card' && l.emi === null && (l.rate === null || l.remainingMonths === null)) out.push({ id: `le-${l.id}`, section: 'Loans', label: `${l.name}: EMI unknown`, affects: ['Monthly surplus', 'Fixed commitment ratio'], to: `/records/liability/${l.id}` });
  }
  for (const g of data.goals) {
    if (g.target === null) out.push({ id: `gt-${g.id}`, section: 'Goals', label: `${g.name}: target amount not set`, affects: ['Goal progress', 'Required contribution'], to: `/goals/${g.id}/edit` });
    else if (!g.targetDate) out.push({ id: `gd-${g.id}`, section: 'Goals', label: `${g.name}: target date not set`, affects: ['Required contribution'], to: `/goals/${g.id}/edit` });
  }
  return out;
}

/** Simple completeness score across the six core sections (0–1). */
export function profileCompleteness(data: FinancialData): { score: number; sections: Array<{ name: string; done: boolean }> } {
  const sections = [
    { name: 'Income', done: data.incomes.length > 0 && data.incomes.every((i) => i.amount !== null) },
    { name: 'Expenses', done: data.expenses.length > 0 && data.expenses.some((e) => e.amount !== null) },
    { name: 'Savings', done: data.assets.some((a) => a.liquidity === 'liquid' && a.value !== null) },
    { name: 'Investments', done: data.assets.some((a) => a.liquidity !== 'liquid') },
    { name: 'Loans', done: data.liabilities.every((l) => l.outstanding !== null && (l.type === 'credit-card' || liabilityEmi(l).value !== null)) },
    { name: 'Goals', done: data.goals.length > 0 },
  ];
  return { score: sections.filter((s) => s.done).length / sections.length, sections };
}
