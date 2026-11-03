// Simulated intelligence layer. Each stage is a separate module so a real AI service can replace
// intent recognition or explanation generation later. Calculations always stay deterministic.

import type { Decision, FinancialData } from '@/types';
import { analyzeCar, type DecisionAnalysis } from './analyses/car';
import { analyzePrepay } from './analyses/prepay';
import { analyzeSafeSpend } from './analyses/safeSpend';

export { recognizeIntent, EXAMPLE_QUESTIONS } from './intent';
export { retrieveContext, missingContext, primaryHomeLoan } from './context';
export { defaultInputs, questionsFor, visibleQuestions, unansweredRequired } from './questions';
export type { DecisionAnalysis, DecisionOption, OptionMetric } from './analyses/car';

export function analyzeDecision(decision: Pick<Decision, 'intent' | 'inputs'>, data: FinancialData, emergencyTarget = 6): DecisionAnalysis {
  switch (decision.intent) {
    case 'car':
      return analyzeCar(data, decision.inputs, emergencyTarget);
    case 'prepay':
      return analyzePrepay(data, decision.inputs, emergencyTarget);
    case 'safe-spend':
      return analyzeSafeSpend(data, decision.inputs, emergencyTarget);
    default:
      return {
        ok: false,
        blockers: ['This decision type is not supported yet.'],
        headline: 'Choose a supported decision type.',
        findings: [],
        options: [],
        assumptions: [],
        risks: [],
        whatCouldChange: [],
        methodology: [],
        limitations: [],
      };
  }
}

export const INTENT_TEMPLATES = [
  { intent: 'car' as const, title: 'Can I afford a car?', question: 'Can I afford to buy a car worth ₹12 lakh?' },
  { intent: 'prepay' as const, title: 'Should I prepay my loan?', question: 'Should I prepay my home loan or continue investing through SIPs?' },
  { intent: 'safe-spend' as const, title: 'How much can I safely spend?', question: 'My income changes every month. How much can I safely spend?' },
];
