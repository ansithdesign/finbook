// Global prototype state: one store, persisted to localStorage so navigation never resets the experience.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createInitialState, STATE_VERSION, STORAGE_KEY } from '@/data/initial-state';
import { getDemoProfile } from '@/data/mock-data/demoProfiles';
import type {
  Activity,
  ActivityType,
  AppState,
  Asset,
  Commitment,
  Contribution,
  Decision,
  Expense,
  Goal,
  IncomeSource,
  Liability,
  RecordKind,
  Scenario,
} from '@/types';
import { nowISO, uid } from '@/utils/id';

export type RecordOf<K extends RecordKind> = K extends 'income'
  ? IncomeSource
  : K extends 'expense'
    ? Expense
    : K extends 'asset'
      ? Asset
      : K extends 'liability'
        ? Liability
        : Commitment;

export const RECORD_COLLECTION: Record<RecordKind, 'incomes' | 'expenses' | 'assets' | 'liabilities' | 'commitments'> = {
  income: 'incomes',
  expense: 'expenses',
  asset: 'assets',
  liability: 'liabilities',
  commitment: 'commitments',
};

export const RECORD_LABEL: Record<RecordKind, string> = {
  income: 'Income',
  expense: 'Expense',
  asset: 'Asset',
  liability: 'Liability',
  commitment: 'Commitment',
};

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.version === STATE_VERSION) return { ...createInitialState(), ...parsed };
    }
  } catch {
    /* storage unavailable — start fresh */
  }
  return createInitialState();
}

function activity(type: ActivityType, text: string, link?: string): Activity {
  return { id: uid('act'), type, text, at: nowISO(), link };
}

function useActions(setState: (fn: (s: AppState) => AppState) => void) {
  return useMemo(() => {
    /** Clone, mutate, return — keeps updates simple and immutable from React's point of view. */
    const mutate = (fn: (s: AppState) => void) =>
      setState((prev) => {
        const next = structuredClone(prev);
        fn(next);
        return next;
      });
    const log = (s: AppState, a: Activity) => {
      s.activity = [a, ...s.activity].slice(0, 100);
    };

    return {
      mutate,
      reset: () => setState(() => createInitialState()),
      loadDemo: (key: string) =>
        setState((prev) => {
          const demo = getDemoProfile(key);
          if (!demo) return prev;
          const base = createInitialState();
          return {
            ...base,
            prefs: prev.prefs,
            dev: prev.dev,
            session: {
              status: 'signed-in',
              user: { name: demo.profile.name, email: demo.profile.email, mobile: demo.profile.mobile, passwordHash: '' },
            },
            onboarding: { completed: true, step: 'complete', skipped: [], selectedGoalTypes: [] },
            profile: structuredClone(demo.profile),
            data: structuredClone(demo.data),
            activity: structuredClone(demo.activity),
            notifications: structuredClone(demo.notifications),
            demoProfile: key,
          };
        }),

      // ---- session ----
      signUp: (user: { name: string; email: string; mobile: string; passwordHash: string }) =>
        mutate((s) => {
          s.session = { status: 'pending-otp', user };
          s.profile.name = user.name;
          s.profile.email = user.email;
          s.profile.mobile = user.mobile;
        }),
      verifyOtp: () => mutate((s) => void (s.session.status = 'signed-in')),
      signIn: (identifier: string) =>
        mutate((s) => {
          if (!s.session.user) {
            const isEmail = identifier.includes('@');
            s.session.user = { name: s.profile.name || 'there', email: isEmail ? identifier : '', mobile: isEmail ? '' : identifier, passwordHash: '' };
          }
          s.session.status = 'pending-otp';
        }),
      signOut: () => mutate((s) => void (s.session.status = 'signed-out')),
      expireSession: () => mutate((s) => void (s.session.status = 'expired')),

      // ---- onboarding ----
      setOnboarding: (patch: Partial<AppState['onboarding']>) => mutate((s) => void Object.assign(s.onboarding, patch)),
      updateProfile: (patch: Partial<AppState['profile']>, logIt = false) =>
        mutate((s) => {
          Object.assign(s.profile, patch);
          if (logIt) log(s, activity('profile-updated', 'Personal information updated', '/profile/personal'));
        }),

      // ---- financial records ----
      upsertRecord: <K extends RecordKind>(kind: K, record: RecordOf<K>, silent = false) =>
        mutate((s) => {
          const coll = s.data[RECORD_COLLECTION[kind]] as Array<RecordOf<K>>;
          const idx = coll.findIndex((r) => r.id === record.id);
          const stamped = { ...record, updatedAt: nowISO() };
          if (idx >= 0) coll[idx] = stamped;
          else coll.push(stamped);
          if (!silent) {
            const verb = idx >= 0 ? 'updated' : 'added';
            log(s, activity(`${kind}-${verb}` as ActivityType, `${RECORD_LABEL[kind]} ${verb}: ${record.name}`, `/records/${kind}/${record.id}`));
          }
        }),
      deleteRecord: (kind: RecordKind, id: string) =>
        mutate((s) => {
          const key = RECORD_COLLECTION[kind];
          const coll = s.data[key] as Array<{ id: string; name: string }>;
          const rec = coll.find((r) => r.id === id);
          (s.data[key] as Array<{ id: string }>) = coll.filter((r) => r.id !== id);
          // Unlink commitments that pointed at a deleted expense/liability so nothing is silently dropped.
          s.data.commitments.forEach((c) => {
            if (c.linkedTo && c.linkedTo.id === id) c.linkedTo = null;
          });
          if (rec) log(s, activity('record-deleted', `${RECORD_LABEL[kind]} deleted: ${rec.name}`));
        }),

      // ---- goals ----
      upsertGoal: (goal: Goal) =>
        mutate((s) => {
          const idx = s.data.goals.findIndex((g) => g.id === goal.id);
          const stamped = { ...goal, updatedAt: nowISO() };
          if (idx >= 0) {
            s.data.goals[idx] = stamped;
            log(s, activity('goal-updated', `Goal updated: ${goal.name}`, `/goals/${goal.id}`));
          } else {
            s.data.goals.push(stamped);
            log(s, activity('goal-created', `Goal created: ${goal.name}`, `/goals/${goal.id}`));
          }
        }),
      deleteGoal: (id: string) =>
        mutate((s) => {
          const g = s.data.goals.find((x) => x.id === id);
          s.data.goals = s.data.goals.filter((x) => x.id !== id);
          if (g) log(s, activity('record-deleted', `Goal deleted: ${g.name}`));
        }),
      addContribution: (goalId: string, c: Omit<Contribution, 'id'>) =>
        mutate((s) => {
          const g = s.data.goals.find((x) => x.id === goalId);
          if (!g) return;
          g.contributions.push({ ...c, id: uid('ctb') });
          g.updatedAt = nowISO();
          log(s, activity('contribution-added', `₹${c.amount.toLocaleString('en-IN')} added to ${g.name}`, `/goals/${g.id}`));
        }),

      // ---- decisions & scenarios ----
      upsertDecision: (d: Decision) =>
        mutate((s) => {
          const idx = s.decisions.findIndex((x) => x.id === d.id);
          const wasSaved = idx >= 0 && s.decisions[idx].saved;
          const stamped = { ...d, updatedAt: nowISO() };
          if (idx >= 0) s.decisions[idx] = stamped;
          else s.decisions.unshift(stamped);
          if (d.saved && !wasSaved) log(s, activity('decision-saved', `Decision saved: ${d.title}`, `/decide/${d.id}`));
        }),
      deleteDecision: (id: string) => mutate((s) => void (s.decisions = s.decisions.filter((d) => d.id !== id))),
      upsertScenario: (sc: Scenario) =>
        mutate((s) => {
          const idx = s.scenarios.findIndex((x) => x.id === sc.id);
          const wasSaved = idx >= 0 && s.scenarios[idx].saved;
          const stamped = { ...sc, updatedAt: nowISO() };
          if (idx >= 0) s.scenarios[idx] = stamped;
          else s.scenarios.unshift(stamped);
          if (sc.saved && !wasSaved) log(s, activity('scenario-saved', `Scenario saved: ${sc.name}`, `/simulate/${sc.id}`));
        }),
      deleteScenario: (id: string) => mutate((s) => void (s.scenarios = s.scenarios.filter((x) => x.id !== id))),

      // ---- misc ----
      markNotificationRead: (id: string) => mutate((s) => s.notifications.forEach((n) => n.id === id && (n.read = true))),
      markAllNotificationsRead: () => mutate((s) => s.notifications.forEach((n) => (n.read = true))),
      updatePrefs: (patch: Partial<AppState['prefs']>) => mutate((s) => void Object.assign(s.prefs, patch)),
      setDev: (patch: Partial<AppState['dev']>) => mutate((s) => void Object.assign(s.dev, patch)),
    };
  }, [setState]);
}

export type Actions = ReturnType<typeof useActions>;

const Ctx = createContext<{ state: AppState; actions: Actions } | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(load);
  const setState = useCallback((fn: (s: AppState) => AppState) => setStateRaw(fn), []);
  const actions = useActions(setState);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota / private mode */
    }
  }, [state]);

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppStateProvider');
  return v;
}
