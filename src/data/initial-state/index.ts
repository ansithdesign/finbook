import type { AppState, FinancialData } from '@/types';

export const STATE_VERSION = 1;
export const STORAGE_KEY = 'mde-prototype-state-v1';

export const emptyData = (): FinancialData => ({
  incomes: [],
  expenses: [],
  assets: [],
  liabilities: [],
  commitments: [],
  goals: [],
  history: [],
});

export function createInitialState(): AppState {
  return {
    version: STATE_VERSION,
    session: { status: 'signed-out', user: null },
    onboarding: { completed: false, step: 'intro', skipped: [], selectedGoalTypes: [] },
    profile: { name: '', email: '', mobile: '', profileTypes: [], incomeType: null, dependents: null },
    data: emptyData(),
    decisions: [],
    scenarios: [],
    activity: [],
    notifications: [],
    connections: [],
    prefs: {
      currency: 'INR',
      hideBalances: false,
      compactNumbers: true,
      emergencyMonthsTarget: 6,
      notify: { reminders: true, insights: true, product: false, email: false },
      analyticsConsent: false,
    },
    dev: { offline: false, failConnections: false, appearance: 'light', sky: 'auto' },
    demoProfile: null,
  };
}
