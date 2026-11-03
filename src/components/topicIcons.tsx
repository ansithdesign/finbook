// Maps product topics (goal types, scenario templates, decision intents, record kinds) to real icons.

import type { DecisionIntent, GoalType, RecordKind, ScenarioTemplate } from '@/types';
import {
  Banknote,
  Car,
  Coins,
  GraduationCap,
  HandCoins,
  House2,
  Landmark,
  Lifebuoy,
  PiggyBank,
  Plane,
  Receipt,
  Recurring,
  Rings,
  ShoppingBag,
  SlidersHorizontal,
  Split,
  SunHorizon,
  Target,
  TrendDown,
  TrendUp,
  Wallet,
  Waves,
  type LucideIcon,
} from '@/components/icons';

export const GOAL_ICON: Record<GoalType, LucideIcon> = {
  emergency: Lifebuoy,
  car: Car,
  house: House2,
  marriage: Rings,
  education: GraduationCap,
  travel: Plane,
  retirement: SunHorizon,
  other: Target,
};

export const SCENARIO_ICON: Record<ScenarioTemplate, LucideIcon> = {
  car: Car,
  'invest-more': TrendUp,
  prepay: HandCoins,
  'income-drop': TrendDown,
  'expense-increase': ShoppingBag,
  'save-purchase': PiggyBank,
  'variable-income': Waves,
  custom: SlidersHorizontal,
};

export const INTENT_ICON: Record<DecisionIntent, LucideIcon> = {
  car: Car,
  prepay: HandCoins,
  'safe-spend': Wallet,
  generic: Split,
};

export const RECORD_ICON: Record<RecordKind, LucideIcon> = {
  income: Banknote,
  expense: Receipt,
  asset: Coins,
  liability: Landmark,
  commitment: Recurring,
};
