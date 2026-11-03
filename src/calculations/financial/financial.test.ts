import { describe, expect, it } from 'vitest';
import { getDemoProfile } from '@/data/mock-data/demoProfiles';
import { emptyData } from '@/data/initial-state';
import { inr, inrCompact, parseAmount, pct } from '@/utils/format';
import {
  amortize,
  calculateEmi,
  calculateRemainingBalance,
  calculateTotalInterest,
  inferRemainingMonths,
} from './loans';
import {
  calculateEmergencyCoverage,
  calculateFixedCommitmentRatio,
  calculateLiquidFunds,
  calculateMonthlyEmi,
  calculateMonthlyExpenses,
  calculateMonthlyIncome,
  calculateMonthlySurplus,
  calculateNetWorth,
  calculateTotalAssets,
  calculateTotalLiabilities,
} from './overview';
import { allocateToGoals, calculateGoalContribution, calculateGoalProgress } from './goals';
import { projectScenario } from '../projections/scenario';
import { baseVarsFromProfile } from '../projections/templates';
import type { Goal } from '@/types';
import { recognizeIntent } from '@/intelligence/intent';

const salaried = getDemoProfile('salaried')!.data;

describe('EMI and loans', () => {
  it('matches the standard EMI formula', () => {
    // ₹9.6 lakh at 9.5% for 60 months ≈ ₹20,162
    expect(Math.round(calculateEmi(960000, 9.5, 60))).toBe(20162);
  });
  it('handles zero interest', () => {
    expect(calculateEmi(120000, 0, 12)).toBe(10000);
  });
  it('total interest = EMI × n − P', () => {
    const emi = calculateEmi(960000, 9.5, 60);
    expect(calculateTotalInterest(960000, 9.5, 60)).toBe(Math.round(emi * 60 - 960000));
  });
  it('remaining balance reaches zero at the end of tenure', () => {
    expect(calculateRemainingBalance(500000, 10, 36, 36)).toBe(0);
    expect(calculateRemainingBalance(500000, 10, 36, 12)).toBeGreaterThan(300000);
  });
  it('prepayment shortens tenure and reduces interest', () => {
    const base = amortize({ outstanding: 4200000, annualRatePct: 8.6, emi: 38300 });
    const pre = amortize({ outstanding: 4200000, annualRatePct: 8.6, emi: 38300, extraMonthly: 10000 });
    expect(pre.months).toBeLessThan(base.months);
    expect(pre.totalInterest).toBeLessThan(base.totalInterest);
  });
  it('infers remaining months from EMI', () => {
    expect(inferRemainingMonths(250000, 9, 12000)).toBe(23);
    expect(inferRemainingMonths(100000, 12, 500)).toBeNull();
  });
});

describe('overview calculations (salaried demo profile)', () => {
  it('derives totals from records', () => {
    expect(calculateTotalAssets(salaried).value).toBe(875000);
    expect(calculateTotalLiabilities(salaried).value).toBe(250000);
    expect(calculateNetWorth(salaried).value).toBe(625000);
  });
  it('normalises yearly expenses to monthly', () => {
    expect(calculateMonthlyIncome(salaried).value).toBe(90000);
    expect(calculateMonthlyExpenses(salaried).value).toBe(43000);
  });
  it('does not double-count linked commitments or SIPs in surplus', () => {
    const s = calculateMonthlySurplus(salaried);
    expect(s.emi.value).toBe(12000);
    expect(s.otherCommitments.value).toBe(0);
    expect(s.surplus.value).toBe(35000);
    expect(s.afterSip).toBe(25000);
  });
  it('liquid funds exclude market-linked investments', () => {
    expect(calculateLiquidFunds(salaried).value).toBe(350000);
  });
  it('emergency coverage = reserves ÷ essential spending (incl. EMIs)', () => {
    expect(calculateEmergencyCoverage(salaried).value).toBeCloseTo(350000 / 40000, 5);
  });
  it('fixed commitment ratio', () => {
    expect(calculateFixedCommitmentRatio(salaried).value).toBeCloseTo((12000 + 17000 + 1500) / 90000, 5);
  });
  it('missing values are not treated as zero', () => {
    const d = emptyData();
    expect(calculateNetWorth(d).value).toBeNull();
    d.assets.push({ id: 'a', name: 'Savings', category: 'savings', value: null, liquidity: 'liquid', emergencyEligible: true, source: 'manual', updatedAt: '' });
    const r = calculateTotalAssets(d);
    expect(r.value).toBeNull();
    expect(r.missing).toBe(1);
  });
  it('derives EMI from loan terms when EMI is unknown', () => {
    const d = emptyData();
    d.liabilities.push({ id: 'l', name: 'Loan', type: 'personal', outstanding: 100000, rate: 12, emi: null, remainingMonths: 12, source: 'manual', updatedAt: '' });
    const e = calculateMonthlyEmi(d);
    expect(e.value).toBe(Math.round(calculateEmi(100000, 12, 12)));
    expect(e.estimated).toBe(true);
  });
});

describe('goals', () => {
  const now = new Date(2026, 10, 3);
  const g: Goal = {
    id: 'g', name: 'Car', type: 'car', target: 300000, startingAmount: 60000, targetDate: new Date(2027, 10, 1).toISOString(),
    priority: 'high', monthlyContribution: null, contributions: [{ id: 'c', date: '', amount: 40000 }], createdAt: '', updatedAt: '',
  };
  it('progress includes starting amount and contributions', () => {
    const p = calculateGoalProgress(g);
    expect(p.saved).toBe(100000);
    expect(p.remaining).toBe(200000);
    expect(p.progress).toBeCloseTo(1 / 3, 5);
  });
  it('required monthly contribution = remaining ÷ months left', () => {
    const r = calculateGoalContribution(g, now);
    expect(r.monthsLeft).toBe(12);
    expect(r.required).toBe(Math.ceil(200000 / 12));
  });
  it('allocates surplus by priority', () => {
    const low: Goal = { ...g, id: 'g2', name: 'Trip', priority: 'low', monthlyContribution: 10000 };
    const high: Goal = { ...g, id: 'g1', priority: 'high', monthlyContribution: 20000 };
    const alloc = allocateToGoals([low, high], 25000, now);
    expect(alloc[0].goalId).toBe('g1');
    expect(alloc[0].funded).toBe(20000);
    expect(alloc[1].funded).toBe(5000);
    expect(alloc[1].shortfall).toBe(5000);
  });
});

describe('scenario projection', () => {
  it('closing liquidity = opening + cumulative net', () => {
    const vars = baseVarsFromProfile(salaried);
    const p = projectScenario(vars);
    const totalNet = p.rows.reduce((s, r) => s + r.net, 0);
    expect(p.rows.at(-1)!.closingLiquid).toBeCloseTo(vars.openingLiquid + totalNet, 5);
  });
  it('down payment reduces liquidity in the purchase month and adds an EMI', () => {
    const vars = { ...baseVarsFromProfile(salaried), purchaseAmount: 1200000, downPayment: 240000 };
    const p = projectScenario(vars);
    expect(p.rows[0].oneOff).toBe(240000);
    expect(p.summary.newEmi).toBe(Math.round(calculateEmi(960000, 9.5, 60)));
    expect(p.rows[1].newEmi).toBeGreaterThan(0);
  });
});

describe('intent recognition', () => {
  it('recognises the three flagship questions', () => {
    expect(recognizeIntent('Can I afford to buy a car worth ₹10 lakh?')).toMatchObject({ intent: 'car', amount: 1000000, title: 'Car purchase · ₹10 lakh' });
    expect(recognizeIntent('Should I prepay my home loan or continue investing through SIPs?').intent).toBe('prepay');
    expect(recognizeIntent('My income changes every month. How much can I safely spend?').intent).toBe('safe-spend');
    expect(recognizeIntent('Should I learn the guitar?').intent).toBe('generic');
  });
});

describe('purchase funded from savings', () => {
  it('uses earmarked savings for the down payment instead of counting them twice', () => {
    const base = { ...baseVarsFromProfile(salaried), monthlyInvestment: 0, existingDebt: 0, existingEmi: 0, horizonMonths: 13 };
    const vars = { ...base, purchaseAmount: 1200000, downPayment: 420000, purchaseMonth: 12, monthlySavings: 15000 };
    const p = projectScenario(vars);
    // 12 months × ₹15,000 = ₹1,80,000 saved, so only ₹2,40,000 comes from liquid funds.
    expect(p.rows[11].oneOff).toBe(240000);
    expect(p.rows[12].goalSavings).toBe(0);
    const noSavings = projectScenario({ ...vars, monthlySavings: 0, downPayment: 420000 });
    expect(p.rows[11].closingLiquid).toBeCloseTo(noSavings.rows[11].closingLiquid, 5);
  });
});

describe('formatting', () => {
  it('uses Indian numbering', () => {
    expect(inr(250000)).toBe('₹2,50,000');
    expect(inrCompact(85000)).toBe('₹85,000');
    expect(inrCompact(125000)).toBe('₹1.25 lakh');
    expect(inrCompact(1250000)).toBe('₹12.5 lakh');
    expect(inrCompact(12000000)).toBe('₹1.2 crore');
    expect(inrCompact(1000000)).toBe('₹10 lakh');
    expect(inrCompact(20000000)).toBe('₹2 crore');
    expect(pct(0.5)).toBe('50%');
  });
  it('parses amounts typed in questions', () => {
    expect(parseAmount('a car worth ₹12 lakh')).toBe(1200000);
    expect(parseAmount('1.5 crore')).toBe(15000000);
    expect(parseAmount('₹2,50,000')).toBe(250000);
    expect(parseAmount('50k')).toBe(50000);
  });
});
