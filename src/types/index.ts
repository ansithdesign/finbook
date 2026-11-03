// Shared domain types for the Money Decision Engine prototype.
// Monetary amounts are whole INR. `null` always means "unknown / not provided" — never zero.

export type Source = 'connected' | 'manual' | 'estimated' | 'calculated';
export type Frequency = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
export type ISODate = string;

export interface Meta {
  id: string;
  source: Source;
  updatedAt: ISODate;
}

export type ProfileType =
  | 'professional'
  | 'freelancer'
  | 'business'
  | 'household'
  | 'student'
  | 'other';

export type IncomeType = 'fixed' | 'variable-salary' | 'freelance' | 'business' | 'multiple' | 'other';

export interface IncomeSource extends Meta {
  name: string;
  kind: 'salary' | 'variable-salary' | 'freelance' | 'business' | 'rental' | 'interest' | 'other';
  /** Typical (average) amount per `frequency`. */
  amount: number | null;
  /** For variable income: lowest / highest typical month. */
  min?: number | null;
  max?: number | null;
  frequency: Frequency;
  paymentPattern?: 'monthly' | 'per-project' | 'irregular';
  isAdditional: boolean;
}

export type ExpenseCategory =
  | 'housing'
  | 'food'
  | 'transport'
  | 'utilities'
  | 'lifestyle'
  | 'healthcare'
  | 'education'
  | 'family'
  | 'insurance'
  | 'subscriptions'
  | 'other';

export interface Expense extends Meta {
  name: string;
  category: ExpenseCategory;
  amount: number | null;
  frequency: Frequency;
  essential: boolean;
}

export type AssetCategory =
  | 'savings'
  | 'current'
  | 'cash'
  | 'fd'
  | 'liquid-other'
  | 'mutual-funds'
  | 'stocks'
  | 'gold'
  | 'property'
  | 'retirement'
  | 'other';

/** liquid = accessible within days; market = sellable but value fluctuates; locked = property, retirement. */
export type Liquidity = 'liquid' | 'market' | 'locked';

export interface Asset extends Meta {
  name: string;
  category: AssetCategory;
  value: number | null;
  liquidity: Liquidity;
  /** Eligible to count towards an emergency reserve. */
  emergencyEligible: boolean;
}

export type LiabilityType = 'home' | 'vehicle' | 'personal' | 'education' | 'credit-card' | 'other';

export interface Liability extends Meta {
  name: string;
  type: LiabilityType;
  outstanding: number | null;
  /** Annual interest rate in percent, e.g. 8.6 */
  rate: number | null;
  emi: number | null;
  remainingMonths: number | null;
}

export type CommitmentType = 'emi' | 'rent' | 'insurance' | 'credit-card' | 'sip' | 'school-fees' | 'other';

export interface Commitment extends Meta {
  name: string;
  type: CommitmentType;
  amount: number | null;
  /** Day of month for monthly items, or next due date */
  nextDue: ISODate;
  recurrence: Frequency | 'once';
  /**
   * Avoids double-counting: when linked, the money is already counted in that
   * expense or liability EMI and is NOT subtracted again from surplus.
   */
  linkedTo?: { kind: 'expense' | 'liability'; id: string } | null;
  /** SIPs are allocations of surplus (investing), not spending. */
  status: 'upcoming' | 'paid' | 'overdue';
}

export type GoalType = 'emergency' | 'car' | 'house' | 'marriage' | 'education' | 'travel' | 'retirement' | 'other';
export type Priority = 'high' | 'medium' | 'low';

export interface Contribution {
  id: string;
  date: ISODate;
  amount: number;
  note?: string;
}

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  target: number | null;
  /** Amount saved before tracking started (contributions add to this). */
  startingAmount: number;
  targetDate: ISODate | null;
  priority: Priority;
  /** Planned monthly contribution, if the user has set one. */
  monthlyContribution: number | null;
  contributions: Contribution[];
  createdAt: ISODate;
  updatedAt: ISODate;
  origin?: { kind: 'decision' | 'scenario'; id: string };
}

export interface MonthlySnapshot {
  month: string; // YYYY-MM
  income: number;
  expenses: number;
  netWorth: number;
}

export interface Connection {
  id: string;
  institution: string;
  accountType: string;
  status: 'illustrative' | 'error' | 'disconnected';
  consentGivenAt: ISODate;
  lastSync: ISODate | null;
  permissions: string[];
}

export interface UserProfile {
  name: string;
  email: string;
  mobile: string;
  city?: string;
  dependents?: number | null;
  profileTypes: ProfileType[];
  incomeType: IncomeType | null;
}

export interface FinancialData {
  incomes: IncomeSource[];
  expenses: Expense[];
  assets: Asset[];
  liabilities: Liability[];
  commitments: Commitment[];
  goals: Goal[];
  history: MonthlySnapshot[];
}

export type RecordKind = 'income' | 'expense' | 'asset' | 'liability' | 'commitment';

export type DecisionIntent = 'car' | 'prepay' | 'safe-spend' | 'generic';
export type DecisionStatus = 'draft' | 'in-progress' | 'completed';

export interface Decision {
  id: string;
  title: string;
  question: string;
  intent: DecisionIntent;
  status: DecisionStatus;
  inputs: Record<string, number | string | boolean | null>;
  chosenOption: string | null;
  saved: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
  linkedGoalId?: string | null;
}

export type ScenarioTemplate =
  | 'car'
  | 'invest-more'
  | 'prepay'
  | 'income-drop'
  | 'expense-increase'
  | 'save-purchase'
  | 'variable-income'
  | 'custom';

export interface ScenarioVars {
  horizonMonths: number;
  /** Typical monthly income. */
  income: number;
  /** Lowest typical month (variable income). When set, every third month uses this figure. */
  incomeLow: number | null;
  expenses: number;
  essentialExpenses: number;
  existingEmi: number;
  existingDebt: number;
  existingRate: number;
  openingLiquid: number;
  purchaseAmount: number;
  downPayment: number;
  interestRate: number;
  tenureMonths: number;
  purchaseMonth: number;
  monthlyInvestment: number;
  monthlySavings: number;
  extraLoanPrepayment: number;
  /** Assumed annual return on new investments — an assumption, not a guarantee. */
  expectedReturnPct: number;
  oneOffExpense: number;
  oneOffMonth: number;
}

export interface Scenario {
  id: string;
  name: string;
  template: ScenarioTemplate;
  vars: ScenarioVars;
  saved: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
  fromDecisionId?: string;
}

export type ActivityType =
  | 'income-added'
  | 'income-updated'
  | 'expense-added'
  | 'expense-updated'
  | 'asset-added'
  | 'asset-updated'
  | 'liability-added'
  | 'liability-updated'
  | 'commitment-added'
  | 'commitment-updated'
  | 'record-deleted'
  | 'goal-created'
  | 'goal-updated'
  | 'contribution-added'
  | 'decision-saved'
  | 'scenario-saved'
  | 'profile-updated';

export interface Activity {
  id: string;
  type: ActivityType;
  text: string;
  at: ISODate;
  link?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  at: ISODate;
  read: boolean;
  link?: string;
  kind: 'reminder' | 'insight' | 'product';
}

export interface Preferences {
  currency: 'INR';
  hideBalances: boolean;
  compactNumbers: boolean;
  emergencyMonthsTarget: number;
  notify: { reminders: boolean; insights: boolean; product: boolean; email: boolean };
  analyticsConsent: boolean;
}

export interface Session {
  status: 'signed-out' | 'pending-otp' | 'signed-in' | 'expired';
  user: { name: string; email: string; mobile: string; passwordHash: string } | null;
}

export type OnboardingStep =
  | 'intro'
  | 'profile'
  | 'income-type'
  | 'income'
  | 'expenses'
  | 'savings'
  | 'investments'
  | 'loans'
  | 'goals'
  | 'connect'
  | 'review'
  | 'complete';

export interface OnboardingState {
  completed: boolean;
  step: OnboardingStep;
  skipped: OnboardingStep[];
  selectedGoalTypes: GoalType[];
}

export interface DevFlags {
  offline: boolean;
  failConnections: boolean;
  appearance: 'light' | 'dark';
}

export interface AppState {
  version: number;
  session: Session;
  onboarding: OnboardingState;
  profile: UserProfile;
  data: FinancialData;
  decisions: Decision[];
  scenarios: Scenario[];
  activity: Activity[];
  notifications: AppNotification[];
  connections: Connection[];
  prefs: Preferences;
  dev: DevFlags;
  demoProfile: string | null;
}
