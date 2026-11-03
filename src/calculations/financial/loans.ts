// Loan maths. Rates are annual percentages (e.g. 9.5). All results are in whole rupees where shown to users.

/** EMI = P × r × (1+r)^n / ((1+r)^n − 1), with r the monthly rate. */
export function calculateEmi(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

export interface LoanSummary {
  principal: number;
  emi: number;
  months: number;
  totalPayment: number;
  totalInterest: number;
}

export function loanSummary(principal: number, annualRatePct: number, months: number): LoanSummary {
  const emi = calculateEmi(principal, annualRatePct, months);
  const totalPayment = emi * months;
  return {
    principal,
    emi: Math.round(emi),
    months,
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(Math.max(0, totalPayment - principal)),
  };
}

export function calculateTotalInterest(principal: number, annualRatePct: number, months: number): number {
  return loanSummary(principal, annualRatePct, months).totalInterest;
}

/** Outstanding balance after `paidMonths` regular EMIs. */
export function calculateRemainingBalance(
  principal: number,
  annualRatePct: number,
  months: number,
  paidMonths: number,
): number {
  if (paidMonths >= months) return 0;
  const r = annualRatePct / 12 / 100;
  const emi = calculateEmi(principal, annualRatePct, months);
  if (r === 0) return Math.max(0, principal - emi * paidMonths);
  const f = Math.pow(1 + r, paidMonths);
  return Math.max(0, principal * f - (emi * (f - 1)) / r);
}

/** Number of months needed to repay `outstanding` with a fixed EMI. Null if the EMI never covers interest. */
export function inferRemainingMonths(outstanding: number, annualRatePct: number, emi: number): number | null {
  if (outstanding <= 0) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return Math.ceil(outstanding / emi);
  if (emi <= outstanding * r) return null;
  return Math.ceil(-Math.log(1 - (r * outstanding) / emi) / Math.log(1 + r));
}

export interface AmortizationResult {
  months: number;
  totalInterest: number;
  totalPaid: number;
  /** Balance at the end of each month (index 0 = after month 1). */
  balances: number[];
  /** Payment made in each month (EMI + extra, capped at what is owed). */
  payments: number[];
}

/**
 * Month-by-month amortisation keeping the EMI constant and applying any extra
 * prepayment to principal (which shortens tenure — the common Indian default).
 */
export function amortize(opts: {
  outstanding: number;
  annualRatePct: number;
  emi: number;
  extraMonthly?: number;
  maxMonths?: number;
}): AmortizationResult {
  const { outstanding, annualRatePct, emi, extraMonthly = 0, maxMonths = 600 } = opts;
  const r = annualRatePct / 12 / 100;
  let balance = outstanding;
  let totalInterest = 0;
  let totalPaid = 0;
  const balances: number[] = [];
  const payments: number[] = [];
  let m = 0;
  while (balance > 0.5 && m < maxMonths) {
    const interest = balance * r;
    const due = balance + interest;
    const pay = Math.min(due, emi + extraMonthly);
    balance = due - pay;
    totalInterest += interest;
    totalPaid += pay;
    m += 1;
    balances.push(Math.max(0, balance));
    payments.push(pay);
  }
  return {
    months: m,
    totalInterest: Math.round(totalInterest),
    totalPaid: Math.round(totalPaid),
    balances,
    payments,
  };
}

/** Future value of a monthly contribution under an assumed annual return (an assumption, never a guarantee). */
export function futureValueOfMonthly(monthly: number, annualReturnPct: number, monthsCount: number, opening = 0): number {
  const r = annualReturnPct / 12 / 100;
  let v = opening;
  for (let i = 0; i < monthsCount; i++) v = v * (1 + r) + monthly;
  return v;
}
