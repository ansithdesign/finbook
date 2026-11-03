// Derived financial metrics, memoised per data change. Screens read numbers from here, never hardcode them.

import { useMemo } from 'react';
import { generateInsights } from '@/calculations/insights';
import {
  assetsByLiquidity,
  calculateEmergencyCoverage,
  calculateEmergencyReserves,
  calculateEssentialMonthly,
  calculateFixedCommitmentRatio,
  calculateFixedObligations,
  calculateIncomeRange,
  calculateLiquidFunds,
  calculateMonthlySurplus,
  calculateNetWorth,
  calculateTotalAssets,
  calculateTotalLiabilities,
  hasAnyFinancialData,
  lastUpdated,
} from '@/calculations/financial/overview';
import { findMissingInformation, profileCompleteness } from '@/calculations/validation/completeness';
import { useApp } from './useAppState';

export function useFinance() {
  const { state } = useApp();
  const { data, prefs } = state;
  return useMemo(() => {
    const surplus = calculateMonthlySurplus(data);
    return {
      netWorth: calculateNetWorth(data),
      assets: calculateTotalAssets(data),
      liabilities: calculateTotalLiabilities(data),
      liquid: calculateLiquidFunds(data),
      byLiquidity: assetsByLiquidity(data.assets),
      reserves: calculateEmergencyReserves(data),
      essential: calculateEssentialMonthly(data),
      coverage: calculateEmergencyCoverage(data),
      fixed: calculateFixedObligations(data),
      fixedRatio: calculateFixedCommitmentRatio(data),
      range: calculateIncomeRange(data),
      ...surplus,
      insights: generateInsights(data, prefs.emergencyMonthsTarget),
      missing: findMissingInformation(data),
      completeness: profileCompleteness(data),
      lastUpdated: lastUpdated(data),
      hasData: hasAnyFinancialData(data),
    };
  }, [data, prefs.emergencyMonthsTarget]);
}
