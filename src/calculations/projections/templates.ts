// Builds starting scenario variables from the user's profile for each template.

import type { FinancialData, ScenarioTemplate, ScenarioVars } from '@/types';
import {
  calculateEssentialExpenses,
  calculateIncomeRange,
  calculateLiquidFunds,
  calculateMonthlyEmi,
  calculateMonthlyExpenses,
  calculateMonthlyIncome,
  calculateMonthlySip,
  calculateUnlinkedCommitments,
} from '../financial/overview';

export const TEMPLATE_INFO: Record<ScenarioTemplate, { title: string; description: string }> = {
  car: { title: 'Buying a car', description: 'Down payment, car loan EMI and the effect on liquidity.' },
  'invest-more': { title: 'Increasing investments', description: 'Raise your monthly SIP and see the cash-flow trade-off.' },
  prepay: { title: 'Prepaying a loan', description: 'Extra monthly prepayment on your largest loan.' },
  'income-drop': { title: 'Income reduction', description: 'What happens if income falls by 30%?' },
  'expense-increase': { title: 'Increasing monthly expenses', description: 'A new recurring cost, like higher rent.' },
  'save-purchase': { title: 'Saving for a major purchase', description: 'Set aside a fixed amount every month.' },
  'variable-income': { title: 'Variable income months', description: 'Typical income with a low month every third month.' },
  custom: { title: 'Custom scenario', description: 'Start from your current numbers and change anything.' },
};

export function baseVarsFromProfile(data: FinancialData): ScenarioVars {
  const other = calculateUnlinkedCommitments(data).value ?? 0;
  const biggestLoan = [...data.liabilities]
    .filter((l) => l.type !== 'credit-card' && l.outstanding !== null && l.rate !== null && l.emi !== null)
    .sort((a, b) => (b.outstanding ?? 0) - (a.outstanding ?? 0))[0];
  const totalEmi = calculateMonthlyEmi(data).value ?? 0;
  return {
    horizonMonths: 24,
    income: Math.round(calculateMonthlyIncome(data).value ?? 0),
    incomeLow: null,
    // Other EMIs (not modelled as the tracked loan) are kept in expenses so nothing is dropped or double-counted.
    expenses: Math.round((calculateMonthlyExpenses(data).value ?? 0) + other + (totalEmi - (biggestLoan?.emi ?? 0))),
    essentialExpenses: Math.round((calculateEssentialExpenses(data).value ?? 0) + other + (totalEmi - (biggestLoan?.emi ?? 0))),
    existingEmi: biggestLoan?.emi ?? 0,
    existingDebt: biggestLoan?.outstanding ?? 0,
    existingRate: biggestLoan?.rate ?? 0,
    openingLiquid: Math.round(calculateLiquidFunds(data).value ?? 0),
    purchaseAmount: 0,
    downPayment: 0,
    interestRate: 9.5,
    tenureMonths: 60,
    purchaseMonth: 1,
    monthlyInvestment: Math.round(calculateMonthlySip(data)),
    monthlySavings: 0,
    extraLoanPrepayment: 0,
    expectedReturnPct: 10,
    oneOffExpense: 0,
    oneOffMonth: 3,
  };
}

export function varsForTemplate(template: ScenarioTemplate, data: FinancialData): ScenarioVars {
  const b = baseVarsFromProfile(data);
  const range = calculateIncomeRange(data);
  switch (template) {
    case 'car':
      return { ...b, purchaseAmount: 1200000, downPayment: 240000, horizonMonths: 36 };
    case 'invest-more':
      return { ...b, monthlyInvestment: b.monthlyInvestment + 10000, horizonMonths: 36 };
    case 'prepay':
      return { ...b, extraLoanPrepayment: 10000, horizonMonths: 60 };
    case 'income-drop':
      return { ...b, income: Math.round(b.income * 0.7), horizonMonths: 12 };
    case 'expense-increase':
      return { ...b, expenses: b.expenses + 10000, essentialExpenses: b.essentialExpenses + 10000 };
    case 'save-purchase':
      return { ...b, monthlySavings: 15000, horizonMonths: 24 };
    case 'variable-income':
      return { ...b, income: Math.round(range.average ?? b.income), incomeLow: Math.round(range.low ?? b.income * 0.5), horizonMonths: 12 };
    default:
      return b;
  }
}
