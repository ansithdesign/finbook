// Month-by-month scenario projection. Simplified, deterministic and fully explainable.
// Assumptions (listed in methodology): flat income/expenses, no inflation, no tax changes,
// surplus stays in liquid funds unless allocated, investment returns are user-set assumptions.

import type { ScenarioVars } from '@/types';
import { calculateEmi } from '../financial/loans';
import { emergencyCoverageFrom } from '../financial/overview';

export interface ProjectionRow {
  month: number;
  income: number;
  expenses: number;
  existingEmi: number;
  newEmi: number;
  prepayment: number;
  investment: number;
  goalSavings: number;
  oneOff: number;
  inflow: number;
  outflow: number;
  net: number;
  openingLiquid: number;
  closingLiquid: number;
  existingDebt: number;
  newDebt: number;
  invested: number;
  goalBalance: number;
}

export interface ProjectionSummary {
  /** Income − expenses − all EMIs, in a typical month after any purchase. */
  monthlySurplus: number;
  /** Surplus left after planned investments, goal savings and prepayments. */
  unallocatedSurplus: number;
  emiTotal: number;
  newLoan: number;
  newEmi: number;
  newLoanInterest: number;
  liquidAfterPurchase: number;
  minLiquidity: number;
  minLiquidityMonth: number;
  endLiquidity: number;
  endDebt: number;
  investedEnd: number;
  investedContributed: number;
  goalSavingsEnd: number;
  negativeMonths: number;
  emergencyCoverageAfter: number | null;
  stability: 'Stable' | 'Tight' | 'At risk';
  existingLoanClosedMonth: number | null;
}

export interface Projection {
  rows: ProjectionRow[];
  summary: ProjectionSummary;
}

export function scenarioIncomeForMonth(vars: ScenarioVars, month: number): number {
  // Illustrative pattern for variable income: every third month is a low month.
  if (vars.incomeLow !== null && month % 3 === 0) return vars.incomeLow;
  return vars.income;
}

export function projectScenario(vars: ScenarioVars): Projection {
  const rExisting = vars.existingRate / 12 / 100;
  const loanPrincipal = Math.max(0, vars.purchaseAmount - vars.downPayment);
  const newEmi = loanPrincipal > 0 && vars.tenureMonths > 0 ? calculateEmi(loanPrincipal, vars.interestRate, vars.tenureMonths) : 0;
  const rNew = vars.interestRate / 12 / 100;
  const rInvest = vars.expectedReturnPct / 12 / 100;

  let liquid = vars.openingLiquid;
  let existingDebt = vars.existingDebt;
  let newDebt = 0;
  let invested = 0;
  let goalBalance = 0;
  let newLoanInterest = 0;
  let existingLoanClosedMonth: number | null = null;
  const rows: ProjectionRow[] = [];
  const hasPurchase = vars.purchaseAmount > 0;

  for (let m = 1; m <= vars.horizonMonths; m++) {
    const opening = liquid;
    const income = scenarioIncomeForMonth(vars, m);

    // Existing loan: EMI continues until the balance is cleared (if the balance is known).
    let existingEmi = 0;
    let prepayment = 0;
    if (vars.existingDebt > 0) {
      if (existingDebt > 0.5) {
        const interest = existingDebt * rExisting;
        const due = existingDebt + interest;
        existingEmi = Math.min(due, vars.existingEmi);
        prepayment = Math.min(due - existingEmi, vars.extraLoanPrepayment);
        existingDebt = due - existingEmi - prepayment;
        if (existingDebt <= 0.5) {
          existingDebt = 0;
          existingLoanClosedMonth = existingLoanClosedMonth ?? m;
        }
      }
    } else {
      existingEmi = vars.existingEmi;
    }

    // When a purchase is planned, monthly savings build its down payment until the purchase month.
    const savingsThisMonth = hasPurchase && m > vars.purchaseMonth ? 0 : vars.monthlySavings;
    goalBalance += savingsThisMonth;

    // New purchase: down payment in the purchase month (from earmarked savings first, then liquid funds), EMI from the following month.
    let oneOff = 0;
    let emiNow = 0;
    if (hasPurchase && m === vars.purchaseMonth) {
      const fromSavings = Math.min(goalBalance, vars.downPayment);
      goalBalance -= fromSavings;
      oneOff += vars.downPayment - fromSavings;
      newDebt = loanPrincipal;
    }
    if (hasPurchase && m > vars.purchaseMonth && newDebt > 0.5) {
      const interest = newDebt * rNew;
      emiNow = Math.min(newDebt + interest, newEmi);
      newDebt = newDebt + interest - emiNow;
      newLoanInterest += interest;
      if (newDebt < 0.5) newDebt = 0;
    }
    if (vars.oneOffExpense > 0 && m === vars.oneOffMonth) oneOff += vars.oneOffExpense;

    invested = invested * (1 + rInvest) + vars.monthlyInvestment;

    const inflow = income;
    const outflow =
      vars.expenses + existingEmi + prepayment + emiNow + vars.monthlyInvestment + savingsThisMonth + oneOff;
    const net = inflow - outflow;
    liquid = opening + net;

    rows.push({
      month: m,
      income,
      expenses: vars.expenses,
      existingEmi,
      newEmi: emiNow,
      prepayment,
      investment: vars.monthlyInvestment,
      goalSavings: savingsThisMonth,
      oneOff,
      inflow,
      outflow,
      net,
      openingLiquid: opening,
      closingLiquid: liquid,
      existingDebt,
      newDebt,
      invested,
      goalBalance,
    });
  }

  const steadyMonth = rows.find((r) => r.month > vars.purchaseMonth) ?? rows[0];
  const steadyEmi = (steadyMonth?.existingEmi ?? vars.existingEmi) + (hasPurchase ? Math.round(newEmi) : 0);
  const monthlySurplus = vars.income - vars.expenses - steadyEmi;
  const steadySavings = hasPurchase ? 0 : vars.monthlySavings;
  const unallocatedSurplus = monthlySurplus - vars.monthlyInvestment - steadySavings - vars.extraLoanPrepayment;
  const min = rows.reduce((acc, r) => (r.closingLiquid < acc.v ? { v: r.closingLiquid, m: r.month } : acc), {
    v: Number.POSITIVE_INFINITY,
    m: 0,
  });
  const purchaseRow = hasPurchase ? rows.find((r) => r.month === vars.purchaseMonth) : undefined;
  const liquidAfterPurchase = purchaseRow ? purchaseRow.closingLiquid : vars.openingLiquid;
  const essentialWithEmi = vars.essentialExpenses + steadyEmi;
  const negativeMonths = rows.filter((r) => r.net < 0).length;
  const last = rows.at(-1);
  const minLiquidity = rows.length ? min.v : vars.openingLiquid;
  const minCoverage = emergencyCoverageFrom(minLiquidity, essentialWithEmi) ?? 0;

  let stability: ProjectionSummary['stability'] = 'Stable';
  if (minLiquidity < 0) stability = 'At risk';
  else if (negativeMonths > rows.filter((r) => r.oneOff > 0).length || minCoverage < 3) stability = 'Tight';

  return {
    rows,
    summary: {
      monthlySurplus: Math.round(monthlySurplus),
      unallocatedSurplus: Math.round(unallocatedSurplus),
      emiTotal: Math.round(steadyEmi),
      newLoan: loanPrincipal,
      newEmi: Math.round(newEmi),
      newLoanInterest: Math.round(newLoanInterest),
      liquidAfterPurchase: Math.round(liquidAfterPurchase),
      minLiquidity: Math.round(minLiquidity),
      minLiquidityMonth: min.m,
      endLiquidity: Math.round(last?.closingLiquid ?? vars.openingLiquid),
      endDebt: Math.round((last?.existingDebt ?? vars.existingDebt) + (last?.newDebt ?? 0)),
      investedEnd: Math.round(last?.invested ?? 0),
      investedContributed: vars.monthlyInvestment * vars.horizonMonths,
      goalSavingsEnd: Math.round(last?.goalBalance ?? 0),
      negativeMonths,
      emergencyCoverageAfter: emergencyCoverageFrom(Math.max(0, liquidAfterPurchase), essentialWithEmi),
      stability,
      existingLoanClosedMonth,
    },
  };
}
