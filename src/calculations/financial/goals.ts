// Goal maths. No investment returns are assumed for goal savings.

import type { Goal, Priority } from '@/types';

export function goalSaved(goal: Goal): number {
  return goal.startingAmount + goal.contributions.reduce((s, c) => s + c.amount, 0);
}

export interface GoalProgress {
  saved: number;
  target: number | null;
  remaining: number | null;
  /** 0–1, null when no target set. */
  progress: number | null;
}

export function calculateGoalProgress(goal: Goal): GoalProgress {
  const saved = goalSaved(goal);
  if (goal.target === null || goal.target <= 0) return { saved, target: null, remaining: null, progress: null };
  return {
    saved,
    target: goal.target,
    remaining: Math.max(0, goal.target - saved),
    progress: Math.min(1, saved / goal.target),
  };
}

/** Whole months from `now` until `iso` (minimum 0). */
export function monthsUntil(iso: string, now = new Date()): number {
  const d = new Date(iso);
  const m = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
  return Math.max(0, m);
}

export interface ContributionRequirement {
  required: number | null;
  monthsLeft: number | null;
  reason: string;
}

/** Monthly amount needed to reach the target by the target date: remaining ÷ months left. */
export function calculateGoalContribution(goal: Goal, now = new Date()): ContributionRequirement {
  const p = calculateGoalProgress(goal);
  if (p.remaining === null) return { required: null, monthsLeft: null, reason: 'No target amount set.' };
  if (p.remaining === 0) return { required: 0, monthsLeft: goal.targetDate ? monthsUntil(goal.targetDate, now) : null, reason: 'Target reached.' };
  if (!goal.targetDate) return { required: null, monthsLeft: null, reason: 'No target date set.' };
  const monthsLeft = monthsUntil(goal.targetDate, now);
  if (monthsLeft === 0) return { required: p.remaining, monthsLeft: 0, reason: 'Target date has passed or is this month.' };
  return { required: Math.ceil(p.remaining / monthsLeft), monthsLeft, reason: 'Remaining amount ÷ months left.' };
}

/** Months to reach the target at a given monthly rate (null if never). */
export function monthsToReach(goal: Goal, monthly: number): number | null {
  const p = calculateGoalProgress(goal);
  if (p.remaining === null) return null;
  if (p.remaining === 0) return 0;
  if (monthly <= 0) return null;
  return Math.ceil(p.remaining / monthly);
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function sortGoals(goals: Goal[]): Goal[] {
  return [...goals].sort(
    (a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      (a.targetDate ?? '9999').localeCompare(b.targetDate ?? '9999'),
  );
}

export interface GoalAllocation {
  goalId: string;
  name: string;
  /** What the goal needs (planned contribution if set, otherwise the requirement). */
  needed: number | null;
  funded: number;
  shortfall: number;
  monthsToTarget: number | null;
  onTrack: boolean | null;
}

/**
 * Allocate a monthly amount available for goals in priority order.
 * This is a simplified model: it shows whether the available surplus can cover planned contributions.
 */
export function allocateToGoals(goals: Goal[], available: number, now = new Date()): GoalAllocation[] {
  let pool = Math.max(0, available);
  return sortGoals(goals).map((g) => {
    const req = calculateGoalContribution(g, now);
    const needed = g.monthlyContribution ?? req.required;
    const funded = needed === null ? 0 : Math.min(pool, needed);
    pool -= funded;
    const shortfall = needed === null ? 0 : Math.max(0, needed - funded);
    const monthsToTarget = monthsToReach(g, funded);
    const onTrack =
      req.required === null ? null : req.required === 0 ? true : funded >= req.required;
    return { goalId: g.id, name: g.name, needed, funded: Math.round(funded), shortfall: Math.round(shortfall), monthsToTarget, onTrack };
  });
}

export interface GoalImpactRow {
  goalId: string;
  name: string;
  before: GoalAllocation;
  after: GoalAllocation;
  delayMonths: number | null;
}

export function compareGoalAllocations(goals: Goal[], beforeAvailable: number, afterAvailable: number, now = new Date()): GoalImpactRow[] {
  const before = allocateToGoals(goals, beforeAvailable, now);
  const after = allocateToGoals(goals, afterAvailable, now);
  return before.map((b, i) => {
    const a = after[i];
    let delayMonths: number | null = null;
    if (b.monthsToTarget !== null && a.monthsToTarget !== null) delayMonths = a.monthsToTarget - b.monthsToTarget;
    return { goalId: b.goalId, name: b.name, before: b, after: a, delayMonths };
  });
}
