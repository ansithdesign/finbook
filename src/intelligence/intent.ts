// 1. Intent recognition — deterministic keyword rules. Replaceable by a real NLU/LLM service
// as long as it returns the same `RecognizedIntent` shape. It never produces financial values
// other than amounts the user literally typed.

import type { DecisionIntent } from '@/types';
import { inrCompact, parseAmount } from '@/utils/format';

export interface RecognizedIntent {
  intent: DecisionIntent;
  confidence: 'high' | 'low';
  /** Amount explicitly mentioned in the question, if any. */
  amount: number | null;
  title: string;
  /** What the engine understood, in plain words (shown to the user). */
  understanding: string;
}

const RULES: Array<{ intent: DecisionIntent; patterns: RegExp[] }> = [
  { intent: 'prepay', patterns: [/prepay|pre-pay|part.?pay|foreclose|close (my )?(home )?loan early/i, /(home loan|loan).*(sip|invest)/i, /(sip|invest).*(home loan|loan)/i] },
  { intent: 'safe-spend', patterns: [/income (changes|varies|is irregular|fluctuates)/i, /variable income|irregular income/i, /safely spend|safe to spend|how much can i (safely )?spend/i, /freelanc/i] },
  { intent: 'car', patterns: [/\bcar\b|vehicle|suv|sedan|hatchback|bike|scooter/i] },
];

export function recognizeIntent(question: string): RecognizedIntent {
  const q = question.trim();
  const amount = /\d/.test(q) ? parseAmount(q) : null;
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(q))) {
      return build(rule.intent, amount, 'high');
    }
  }
  if (/afford|buy|purchase/i.test(q) && amount) return build('car', amount, 'low');
  return build('generic', amount, 'low');
}

function build(intent: DecisionIntent, amount: number | null, confidence: 'high' | 'low'): RecognizedIntent {
  const fmt = amount ? inrCompact(amount) : null;
  switch (intent) {
    case 'car':
      return {
        intent,
        confidence,
        amount,
        title: amount ? `Car purchase · ${fmt}` : 'Car purchase',
        understanding: amount
          ? `You're considering buying a car worth ${fmt}. I'll check affordability against your income, savings, existing EMIs and goals.`
          : "You're considering buying a car. I'll need the price, then check affordability against your profile.",
      };
    case 'prepay':
      return {
        intent,
        confidence,
        amount,
        title: 'Prepay home loan vs continue investing',
        understanding:
          "You're weighing loan prepayment against investing. I'll compare contractual interest savings with investment projections based on an explicit return assumption.",
      };
    case 'safe-spend':
      return {
        intent,
        confidence,
        amount,
        title: 'Safe spending with variable income',
        understanding:
          "Your income varies. I'll estimate a safe spending range using your lowest typical month, essential costs and reserve target — not just the average.",
      };
    default:
      return {
        intent,
        confidence,
        amount,
        title: 'Financial decision',
        understanding:
          "I couldn't match this to a decision type I can analyse yet. Choose the closest decision type below or explore a custom scenario in Simulate.",
      };
  }
}

export const EXAMPLE_QUESTIONS = [
  'Can I afford to buy a car worth ₹12 lakh?',
  'Should I prepay my home loan or continue investing through SIPs?',
  'My income changes every month. How much can I safely spend?',
];
