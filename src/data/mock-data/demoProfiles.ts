// Illustrative demo profiles. All values are prototype examples, not real people or accounts.

import type {
  Activity,
  AppNotification,
  Asset,
  Commitment,
  Expense,
  FinancialData,
  Goal,
  IncomeSource,
  Liability,
  ScenarioTemplate,
  UserProfile,
} from '@/types';
import { calculateNetWorth } from '@/calculations/financial/overview';

export interface DemoProfile {
  key: string;
  label: string;
  description: string;
  profile: UserProfile;
  data: FinancialData;
  activity: Activity[];
  notifications: AppNotification[];
  /** Scenarios already explored, built from the profile's own numbers when the demo loads. */
  scenarioSeeds?: Array<{ template: ScenarioTemplate; name?: string; saved: boolean; daysAgo: number }>;
  /** Questions the person has already started asking. */
  decisionSeeds?: Array<{ question: string; daysAgo: number }>;
}

const day = 86400000;
const ago = (d: number) => new Date(Date.now() - d * day).toISOString();
const ahead = (d: number) => new Date(Date.now() + d * day).toISOString();
/** Next occurrence of a day-of-month. */
function nextDay(dom: number): string {
  const now = new Date();
  let d = new Date(now.getFullYear(), now.getMonth(), dom, 9);
  if (d.getTime() < now.getTime()) d = new Date(now.getFullYear(), now.getMonth() + 1, dom, 9);
  return d.toISOString();
}
function monthKey(offset: number): string {
  const n = new Date();
  const d = new Date(n.getFullYear(), n.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function dateYearsAhead(years: number, month = 11): string {
  const n = new Date();
  return new Date(n.getFullYear() + years, month, 1).toISOString();
}

const inc = (p: Partial<IncomeSource> & Pick<IncomeSource, 'id' | 'name' | 'amount'>): IncomeSource => ({
  kind: 'salary',
  frequency: 'monthly',
  isAdditional: false,
  source: 'manual',
  updatedAt: ago(3),
  ...p,
});
const exp = (id: string, name: string, category: Expense['category'], amount: number | null, essential: boolean, extra: Partial<Expense> = {}): Expense => ({
  id,
  name,
  category,
  amount,
  essential,
  frequency: 'monthly',
  source: 'estimated',
  updatedAt: ago(3),
  ...extra,
});
const asset = (id: string, name: string, category: Asset['category'], value: number | null, liquidity: Asset['liquidity'], emergencyEligible: boolean, extra: Partial<Asset> = {}): Asset => ({
  id,
  name,
  category,
  value,
  liquidity,
  emergencyEligible,
  source: 'manual',
  updatedAt: ago(5),
  ...extra,
});
const loan = (p: Partial<Liability> & Pick<Liability, 'id' | 'name' | 'type'>): Liability => ({
  outstanding: null,
  rate: null,
  emi: null,
  remainingMonths: null,
  source: 'manual',
  updatedAt: ago(6),
  ...p,
});
const commit = (p: Partial<Commitment> & Pick<Commitment, 'id' | 'name' | 'type' | 'amount' | 'nextDue'>): Commitment => ({
  recurrence: 'monthly',
  linkedTo: null,
  status: 'upcoming',
  source: 'manual',
  updatedAt: ago(6),
  ...p,
});
const goal = (p: Partial<Goal> & Pick<Goal, 'id' | 'name' | 'type' | 'target'>): Goal => ({
  startingAmount: 0,
  targetDate: null,
  priority: 'medium',
  monthlyContribution: null,
  contributions: [],
  createdAt: ago(60),
  updatedAt: ago(10),
  ...p,
});

// ---------------------------------------------------------------------------
// 1. Salaried professional (values from the product brief)
// ---------------------------------------------------------------------------
const salaried: DemoProfile = {
  key: 'salaried',
  label: 'Ananya · Salaried professional',
  description: '₹85k salary + ₹5k side income, vehicle loan, Bengaluru',
  profile: {
    name: 'Ananya Sharma',
    email: 'ananya@example.com',
    mobile: '9876500001',
    city: 'Bengaluru',
    dependents: 0,
    profileTypes: ['professional'],
    incomeType: 'fixed',
  },
  data: {
    incomes: [
      inc({ id: 'inc_salary', name: 'Salary (take-home)', amount: 85000, kind: 'salary' }),
      inc({ id: 'inc_side', name: 'Freelance writing', amount: 5000, kind: 'other', isAdditional: true, source: 'estimated' }),
    ],
    expenses: [
      exp('exp_rent', 'Rent', 'housing', 17000, true, { source: 'manual' }),
      exp('exp_food', 'Food and groceries', 'food', 6000, true),
      exp('exp_util', 'Utilities', 'utilities', 2000, true),
      exp('exp_trans', 'Fuel and transport', 'transport', 1500, true),
      exp('exp_ins', 'Health insurance', 'insurance', 18000, true, { frequency: 'yearly', source: 'manual' }),
      exp('exp_life', 'Dining, shopping, outings', 'lifestyle', 8000, false),
      exp('exp_subs', 'Subscriptions', 'subscriptions', 1500, false, { source: 'manual' }),
      exp('exp_other', 'Personal and miscellaneous', 'other', 5500, false),
    ],
    assets: [
      asset('ast_sav', 'Savings account', 'savings', 250000, 'liquid', true),
      asset('ast_fd', 'Fixed deposit', 'fd', 100000, 'liquid', true),
      asset('ast_mf', 'Mutual funds', 'mutual-funds', 350000, 'market', false, { source: 'estimated' }),
      asset('ast_stk', 'Stocks and ETFs', 'stocks', 75000, 'market', false, { source: 'estimated' }),
      asset('ast_gold', 'Gold', 'gold', 100000, 'market', false, { source: 'estimated' }),
    ],
    liabilities: [
      loan({ id: 'liab_car', name: 'Vehicle loan', type: 'vehicle', outstanding: 250000, rate: 9, emi: 12000, remainingMonths: 23 }),
    ],
    commitments: [
      commit({ id: 'cm_rent', name: 'Rent', type: 'rent', amount: 17000, nextDue: nextDay(5), linkedTo: { kind: 'expense', id: 'exp_rent' } }),
      commit({ id: 'cm_emi', name: 'Vehicle loan EMI', type: 'emi', amount: 12000, nextDue: nextDay(10), linkedTo: { kind: 'liability', id: 'liab_car' } }),
      commit({ id: 'cm_sip', name: 'Mutual fund SIP', type: 'sip', amount: 10000, nextDue: nextDay(15) }),
      commit({ id: 'cm_ins', name: 'Health insurance premium', type: 'insurance', amount: 18000, nextDue: ahead(54), recurrence: 'yearly', linkedTo: { kind: 'expense', id: 'exp_ins' } }),
    ],
    goals: [
      goal({ id: 'goal_house', name: 'House down payment', type: 'house', target: 1500000, startingAmount: 200000, targetDate: dateYearsAhead(4, 11), priority: 'high', monthlyContribution: 15000,
        contributions: [
          { id: 'c1', date: ago(62), amount: 15000 },
          { id: 'c2', date: ago(32), amount: 15000 },
          { id: 'c3', date: ago(2), amount: 15000 },
        ] }),
      goal({ id: 'goal_trip', name: 'Europe trip', type: 'travel', target: 300000, startingAmount: 60000, targetDate: dateYearsAhead(1, 9), priority: 'medium', monthlyContribution: 10000,
        contributions: [{ id: 'c4', date: ago(30), amount: 10000 }] }),
    ],
    history: [
      { month: monthKey(-3), income: 90000, expenses: 40000, netWorth: 588000 },
      { month: monthKey(-2), income: 90000, expenses: 40500, netWorth: 601000 },
      { month: monthKey(-1), income: 90000, expenses: 40500, netWorth: 612000 },
    ],
  },
  activity: [
    { id: 'a1', type: 'contribution-added', text: '₹15,000 added to House down payment', at: ago(2), link: '/goals/goal_house' },
    { id: 'a2', type: 'expense-updated', text: 'Dining, shopping, outings updated to ₹8,000', at: ago(3), link: '/records/expense/exp_life' },
    { id: 'a3', type: 'asset-updated', text: 'Mutual funds value updated', at: ago(5), link: '/records/asset/ast_mf' },
    { id: 'a5', type: 'scenario-saved', text: 'Saved scenario: Buy a car', at: ago(6), link: '/simulate' },
    { id: 'a4', type: 'goal-created', text: 'Goal created: Europe trip', at: ago(40), link: '/goals/goal_trip' },
  ],
  scenarioSeeds: [
    { template: 'car', name: 'Hatchback at ₹8 lakh', saved: true, daysAgo: 6 },
    { template: 'invest-more', name: 'SIP up to ₹15,000', saved: false, daysAgo: 2 },
  ],
  decisionSeeds: [{ question: 'Can I afford to buy a car worth ₹12 lakh?', daysAgo: 1 }],
  notifications: [
    { id: 'n1', kind: 'reminder', title: 'Rent due soon', body: 'Rent of ₹17,000 is due on the 5th.', at: ago(1), read: false, link: '/home/commitments' },
    { id: 'n2', kind: 'insight', title: 'Expenses rose this month', body: 'Your recorded expenses are higher than last month.', at: ago(3), read: false, link: '/home' },
    { id: 'n3', kind: 'product', title: 'Prototype notice', body: 'All figures in this app are illustrative and entered manually.', at: ago(20), read: true },
  ],
};

// ---------------------------------------------------------------------------
// 2. Household with a home loan
// ---------------------------------------------------------------------------
const household: DemoProfile = {
  key: 'household',
  label: 'Rahul · Household with home loan',
  description: 'Two incomes, home loan + car loan, child, Pune',
  profile: {
    name: 'Rahul Iyer',
    email: 'rahul@example.com',
    mobile: '9876500002',
    city: 'Pune',
    dependents: 2,
    profileTypes: ['professional', 'household'],
    incomeType: 'multiple',
  },
  data: {
    incomes: [
      inc({ id: 'h_inc1', name: 'Salary (take-home)', amount: 120000 }),
      inc({ id: 'h_inc2', name: "Spouse's salary", amount: 55000 }),
    ],
    expenses: [
      exp('h_food', 'Food and groceries', 'food', 15000, true),
      exp('h_util', 'Utilities and maintenance', 'utilities', 5000, true),
      exp('h_school', 'School fees', 'education', 120000, true, { frequency: 'yearly', source: 'manual' }),
      exp('h_trans', 'Fuel and transport', 'transport', 6000, true),
      exp('h_help', 'Household help', 'family', 8000, true),
      exp('h_health', 'Healthcare', 'healthcare', 3000, true),
      exp('h_ins', 'Insurance premiums', 'insurance', 36000, true, { frequency: 'yearly', source: 'manual' }),
      exp('h_life', 'Lifestyle and outings', 'lifestyle', 12000, false),
      exp('h_subs', 'Subscriptions', 'subscriptions', 2000, false),
    ],
    assets: [
      asset('h_sav', 'Savings account', 'savings', 320000, 'liquid', true),
      asset('h_fd', 'Fixed deposits', 'fd', 200000, 'liquid', true),
      asset('h_mf', 'Mutual funds', 'mutual-funds', 950000, 'market', false, { source: 'estimated' }),
      asset('h_stk', 'Stocks', 'stocks', 210000, 'market', false, { source: 'estimated' }),
      asset('h_gold', 'Gold', 'gold', 250000, 'market', false, { source: 'estimated' }),
      asset('h_epf', 'EPF and PPF', 'retirement', 680000, 'locked', false),
      asset('h_home', 'Home (Pune flat)', 'property', 8500000, 'locked', false, { source: 'estimated' }),
    ],
    liabilities: [
      loan({ id: 'h_home_loan', name: 'Home loan', type: 'home', outstanding: 4200000, rate: 8.6, emi: 38300, remainingMonths: 216 }),
      loan({ id: 'h_car_loan', name: 'Car loan', type: 'vehicle', outstanding: 320000, rate: 9.25, emi: 10500, remainingMonths: 34 }),
    ],
    commitments: [
      commit({ id: 'h_cm1', name: 'Home loan EMI', type: 'emi', amount: 38300, nextDue: nextDay(7), linkedTo: { kind: 'liability', id: 'h_home_loan' } }),
      commit({ id: 'h_cm2', name: 'Car loan EMI', type: 'emi', amount: 10500, nextDue: nextDay(12), linkedTo: { kind: 'liability', id: 'h_car_loan' } }),
      commit({ id: 'h_cm3', name: 'SIP (index + flexi-cap)', type: 'sip', amount: 15000, nextDue: nextDay(15) }),
      commit({ id: 'h_cm4', name: 'School fees (term)', type: 'school-fees', amount: 40000, nextDue: ahead(40), recurrence: 'quarterly', linkedTo: { kind: 'expense', id: 'h_school' } }),
    ],
    goals: [
      goal({ id: 'h_goal_edu', name: "Child's higher education", type: 'education', target: 2500000, startingAmount: 300000, targetDate: dateYearsAhead(10, 5), priority: 'high', monthlyContribution: 15000 }),
      goal({ id: 'h_goal_ret', name: 'Retirement corpus top-up', type: 'retirement', target: 10000000, startingAmount: 680000, targetDate: dateYearsAhead(20, 0), priority: 'medium', monthlyContribution: 10000 }),
    ],
    history: [
      { month: monthKey(-2), income: 175000, expenses: 63000, netWorth: 9050000 },
      { month: monthKey(-1), income: 175000, expenses: 63500, netWorth: 9110000 },
    ],
  },
  activity: [
    { id: 'ha1', type: 'liability-updated', text: 'Home loan outstanding updated', at: ago(6), link: '/records/liability/h_home_loan' },
    { id: 'ha3', type: 'scenario-saved', text: 'Saved scenario: Prepay ₹20,000 a month', at: ago(3), link: '/simulate' },
    { id: 'ha4', type: 'contribution-added', text: "₹20,000 added to Child's higher education", at: ago(9), link: '/goals/h_goal_edu' },
    { id: 'ha2', type: 'goal-created', text: "Goal created: Child's higher education", at: ago(50) },
  ],
  scenarioSeeds: [
    { template: 'prepay', name: 'Prepay ₹20,000 a month', saved: true, daysAgo: 3 },
    { template: 'invest-more', name: 'Put the same into SIPs', saved: true, daysAgo: 3 },
  ],
  decisionSeeds: [{ question: 'Should I prepay my home loan or continue investing through SIPs?', daysAgo: 2 }],
  notifications: [
    { id: 'hn1', kind: 'reminder', title: 'Home loan EMI on the 7th', body: '₹38,300 will be due.', at: ago(1), read: false, link: '/home/commitments' },
    { id: 'hn2', kind: 'reminder', title: 'School fees next month', body: 'The term fee of ₹40,000 is due in about six weeks.', at: ago(4), read: false, link: '/home/commitments' },
  ],
};

// ---------------------------------------------------------------------------
// 3. Freelancer with variable income
// ---------------------------------------------------------------------------
const freelancer: DemoProfile = {
  key: 'freelancer',
  label: 'Arjun · Freelance designer',
  description: 'Variable income ₹45k–₹1.6 lakh/month, Mumbai',
  profile: {
    name: 'Arjun Mehta',
    email: 'arjun@example.com',
    mobile: '9876500003',
    city: 'Mumbai',
    dependents: 0,
    profileTypes: ['freelancer'],
    incomeType: 'freelance',
  },
  data: {
    incomes: [
      inc({ id: 'f_inc1', name: 'Design projects', kind: 'freelance', amount: 95000, min: 45000, max: 160000, paymentPattern: 'per-project', source: 'estimated' }),
    ],
    expenses: [
      exp('f_rent', 'Rent', 'housing', 22000, true, { source: 'manual' }),
      exp('f_food', 'Food and groceries', 'food', 9000, true),
      exp('f_util', 'Utilities and internet', 'utilities', 2500, true),
      exp('f_trans', 'Transport', 'transport', 3000, true),
      exp('f_ins', 'Health insurance', 'insurance', 24000, true, { frequency: 'yearly', source: 'manual' }),
      exp('f_cowork', 'Co-working desk', 'other', 6000, true),
      exp('f_life', 'Lifestyle', 'lifestyle', 12000, false),
      exp('f_soft', 'Software subscriptions', 'subscriptions', 3000, false),
      exp('f_other', 'Miscellaneous', 'other', 4000, false),
    ],
    assets: [
      asset('f_sav', 'Savings account', 'savings', 180000, 'liquid', true),
      asset('f_cur', 'Current account', 'current', 60000, 'liquid', true),
      asset('f_cash', 'Cash', 'cash', 10000, 'liquid', false),
      asset('f_mf', 'Mutual funds', 'mutual-funds', 220000, 'market', false, { source: 'estimated' }),
      asset('f_stk', 'Stocks', 'stocks', 40000, 'market', false, { source: 'estimated' }),
    ],
    liabilities: [
      loan({ id: 'f_pl', name: 'Personal loan', type: 'personal', outstanding: 150000, rate: 13, emi: 7000, remainingMonths: 24 }),
      loan({ id: 'f_cc', name: 'Credit card outstanding', type: 'credit-card', outstanding: 18000 }),
    ],
    commitments: [
      commit({ id: 'f_cm1', name: 'Rent', type: 'rent', amount: 22000, nextDue: nextDay(3), linkedTo: { kind: 'expense', id: 'f_rent' } }),
      commit({ id: 'f_cm2', name: 'Personal loan EMI', type: 'emi', amount: 7000, nextDue: nextDay(8), linkedTo: { kind: 'liability', id: 'f_pl' } }),
      commit({ id: 'f_cm3', name: 'Credit card bill', type: 'credit-card', amount: 18000, nextDue: nextDay(20), recurrence: 'once' }),
      commit({ id: 'f_cm4', name: 'Advance tax instalment', type: 'other', amount: 25000, nextDue: ahead(42), recurrence: 'quarterly' }),
    ],
    goals: [
      goal({ id: 'f_goal_em', name: 'Emergency fund', type: 'emergency', target: 400000, startingAmount: 150000, targetDate: dateYearsAhead(1, 5), priority: 'high', monthlyContribution: 12000 }),
    ],
    history: [],
  },
  activity: [
    { id: 'fa2', type: 'contribution-added', text: '₹12,000 added to Emergency fund', at: ago(1), link: '/goals/f_goal_em' },
    { id: 'fa1', type: 'income-updated', text: 'Design projects income range updated', at: ago(4) },
    { id: 'fa3', type: 'scenario-saved', text: 'Saved scenario: A lean month every quarter', at: ago(11), link: '/simulate' },
  ],
  scenarioSeeds: [
    { template: 'variable-income', name: 'A lean month every quarter', saved: true, daysAgo: 11 },
    { template: 'income-drop', name: 'Two slow months in a row', saved: false, daysAgo: 4 },
  ],
  decisionSeeds: [{ question: 'My income changes every month. How much can I safely spend?', daysAgo: 3 }],
  notifications: [
    { id: 'fn1', kind: 'reminder', title: 'Advance tax due next month', body: 'Quarterly advance tax of ₹25,000 is coming up.', at: ago(2), read: false, link: '/home/commitments' },
  ],
};

export const DEMO_PROFILES: DemoProfile[] = [salaried, household, freelancer];

// Twelve months of history, shaped per person and anchored to the net worth their records produce today,
// so the Home trend and the month-on-month change always agree with the numbers on screen.
const SHAPES: Record<string, number[]> = {
  salaried: [0.79, 0.81, 0.82, 0.85, 0.84, 0.87, 0.89, 0.9, 0.92, 0.94, 0.95, 0.979],
  household: [0.931, 0.936, 0.944, 0.948, 0.951, 0.958, 0.962, 0.967, 0.973, 0.978, 0.984, 0.991],
  freelancer: [0.74, 0.8, 0.77, 0.84, 0.81, 0.88, 0.85, 0.92, 0.9, 0.97, 0.95, 1.024],
};
for (const p of DEMO_PROFILES) {
  const now = calculateNetWorth(p.data).value;
  const shape = SHAPES[p.key];
  if (now === null || !shape) continue;
  const last = p.data.history.at(-1);
  const income = last?.income ?? p.data.incomes.reduce((s, i) => s + (i.amount ?? 0), 0);
  const expenses = last?.expenses ?? p.data.expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  p.data.history = shape.map((f, i) => ({
    month: monthKey(i - shape.length),
    income: p.key === 'freelancer' ? Math.round(income * (0.55 + ((i * 37) % 10) / 10)) : income,
    expenses: Math.round(expenses * (0.97 + ((i * 13) % 7) / 100)),
    netWorth: Math.round((now * f) / 1000) * 1000,
  }));
}

export function getDemoProfile(key: string): DemoProfile | undefined {
  return DEMO_PROFILES.find((p) => p.key === key);
}
