import { useState } from 'react';
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { DeviceFrame, useDeviceScale } from '@/components/device/DeviceFrame';
import { FeedbackProvider } from '@/components/feedback/FeedbackProvider';
import { BottomNav } from '@/components/navigation/BottomNav';
import { DevPanel } from '@/components/navigation/DevPanel';
import { AppStateProvider, useApp } from '@/hooks/useAppState';
import { AuthLogin, AuthOtp, AuthRecover, AuthSignup, AuthWelcome } from '@/pages/auth/AuthPages';
import { OnboardingRouter } from '@/pages/onboarding/Onboarding';
import { HomeOverview } from '@/pages/home/HomeOverview';
import {
  ActivityHistory,
  AssetsOverview,
  CommitmentsOverview,
  ExpenseBreakdown,
  IncomeBreakdown,
  InsightDetail,
  LiabilitiesOverview,
  LiquidityDetails,
  NetWorthDetails,
} from '@/pages/home/HomeDetails';
import { RecordForm } from '@/pages/home/RecordForm';
import { DecideLanding, DecisionList } from '@/pages/decide/DecideLanding';
import { DecideAsk } from '@/pages/decide/DecideAsk';
import { DecisionClarify, DecisionContext } from '@/pages/decide/DecisionFlow';
import { DecisionAlternatives, DecisionExplanation, DecisionWorkspace } from '@/pages/decide/DecisionWorkspace';
import { ScenarioCompare, ScenarioCreate, SimulateLanding } from '@/pages/simulate/SimulateLanding';
import { ScenarioAssumptions, ScenarioCashflow, ScenarioDetail, ScenarioGoalImpact, ScenarioLiquidity } from '@/pages/simulate/ScenarioPages';
import { GoalDetail, GoalForm, GoalImpact, GoalProgressPage, GoalsOverview } from '@/pages/goals/GoalPages';
import {
  ConnectedAccountDetail,
  FinancialAccounts,
  FinancialProfilePage,
  HelpSupport,
  IncomeSources,
  NotificationSettings,
  PersonalInfo,
  PreferencesPage,
  PrivacyConsent,
  ProfileCompleteness,
  ProfileOverview,
} from '@/pages/profile/ProfilePages';
import { GlobalSearch, NotificationsPage } from '@/pages/shared/GlobalPages';
import {
  CalculatingState,
  ConnectionError,
  NoDataState,
  OfflineState,
  PermissionDenied,
  SessionExpired,
} from '@/pages/shared/SystemStates';
import '@/styles/global.css';

const NO_NAV = ['/auth', '/onboarding', '/system/session-expired'];

function AppShell() {
  const { pathname } = useLocation();
  const showNav = !NO_NAV.some((p) => pathname.startsWith(p));
  return (
    <div className={`app ${showNav ? '' : 'no-nav'}`}>
      <FeedbackProvider>
        <div className="app-main">
          <Outlet />
        </div>
      </FeedbackProvider>
      {showNav && <BottomNav />}
    </div>
  );
}

/** Routes that need a signed-in session. */
function RequireSession() {
  const { state } = useApp();
  if (state.session.status === 'expired') return <Navigate to="/system/session-expired" replace />;
  if (state.session.status !== 'signed-in') return <Navigate to="/auth/welcome" replace />;
  return <Outlet />;
}

function EntryRedirect() {
  const { state } = useApp();
  const s = state.session.status;
  if (s === 'expired') return <Navigate to="/system/session-expired" replace />;
  if (s === 'pending-otp') return <Navigate to="/auth/otp" replace />;
  if (s !== 'signed-in') return <Navigate to="/auth/welcome" replace />;
  if (!state.onboarding.completed) return <Navigate to={`/onboarding/${state.onboarding.step}`} replace />;
  return <Navigate to="/home" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<EntryRedirect />} />
        <Route path="/auth/welcome" element={<AuthWelcome />} />
        <Route path="/auth/signup" element={<AuthSignup />} />
        <Route path="/auth/login" element={<AuthLogin />} />
        <Route path="/auth/otp" element={<AuthOtp />} />
        <Route path="/auth/recover" element={<AuthRecover />} />
        <Route path="/system/session-expired" element={<SessionExpired />} />

        <Route element={<RequireSession />}>
          <Route path="/onboarding/:step" element={<OnboardingRouter />} />

          <Route path="/home" element={<HomeOverview />} />
          <Route path="/home/net-worth" element={<NetWorthDetails />} />
          <Route path="/home/income" element={<IncomeBreakdown />} />
          <Route path="/home/expenses" element={<ExpenseBreakdown />} />
          <Route path="/home/assets" element={<AssetsOverview />} />
          <Route path="/home/liabilities" element={<LiabilitiesOverview />} />
          <Route path="/home/liquidity" element={<LiquidityDetails />} />
          <Route path="/home/commitments" element={<CommitmentsOverview />} />
          <Route path="/home/insights/:id" element={<InsightDetail />} />
          <Route path="/home/activity" element={<ActivityHistory />} />
          <Route path="/records/new/:kind" element={<RecordForm />} />
          <Route path="/records/:kind/:id" element={<RecordForm />} />

          <Route path="/decide" element={<DecideLanding />} />
          <Route path="/decide/ask" element={<DecideAsk />} />
          <Route path="/decide/saved" element={<DecisionList mode="saved" />} />
          <Route path="/decide/history" element={<DecisionList mode="history" />} />
          <Route path="/decide/:id/clarify" element={<DecisionClarify />} />
          <Route path="/decide/:id/context" element={<DecisionContext />} />
          <Route path="/decide/:id" element={<DecisionWorkspace />} />
          <Route path="/decide/:id/alternatives" element={<DecisionAlternatives />} />
          <Route path="/decide/:id/explanation" element={<DecisionExplanation />} />

          <Route path="/simulate" element={<SimulateLanding />} />
          <Route path="/simulate/new" element={<ScenarioCreate />} />
          <Route path="/simulate/compare" element={<ScenarioCompare />} />
          <Route path="/simulate/:id" element={<ScenarioDetail />} />
          <Route path="/simulate/:id/cashflow" element={<ScenarioCashflow />} />
          <Route path="/simulate/:id/liquidity" element={<ScenarioLiquidity />} />
          <Route path="/simulate/:id/goals" element={<ScenarioGoalImpact />} />
          <Route path="/simulate/:id/assumptions" element={<ScenarioAssumptions />} />

          <Route path="/goals" element={<GoalsOverview />} />
          <Route path="/goals/new" element={<GoalForm />} />
          <Route path="/goals/:id" element={<GoalDetail />} />
          <Route path="/goals/:id/edit" element={<GoalForm />} />
          <Route path="/goals/:id/progress" element={<GoalProgressPage />} />
          <Route path="/goals/:id/impact" element={<GoalImpact />} />

          <Route path="/profile" element={<ProfileOverview />} />
          <Route path="/profile/personal" element={<PersonalInfo />} />
          <Route path="/profile/financial" element={<FinancialProfilePage />} />
          <Route path="/profile/income" element={<IncomeSources />} />
          <Route path="/profile/accounts" element={<FinancialAccounts />} />
          <Route path="/profile/accounts/:id" element={<ConnectedAccountDetail />} />
          <Route path="/profile/privacy" element={<PrivacyConsent />} />
          <Route path="/profile/notifications" element={<NotificationSettings />} />
          <Route path="/profile/preferences" element={<PreferencesPage />} />
          <Route path="/profile/help" element={<HelpSupport />} />
          <Route path="/profile/completeness" element={<ProfileCompleteness />} />

          <Route path="/search" element={<GlobalSearch />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          <Route path="/system/connection-error" element={<ConnectionError />} />
          <Route path="/system/no-data" element={<NoDataState />} />
          <Route path="/system/calculating" element={<CalculatingState />} />
          <Route path="/system/offline" element={<OfflineState />} />
          <Route path="/system/permission-denied" element={<PermissionDenied />} />
        </Route>
        <Route path="*" element={<EntryRedirect />} />
      </Route>
    </Routes>
  );
}

function Stage() {
  const [panelOpen, setPanelOpen] = useState(() => window.innerWidth > 760);
  const scale = useDeviceScale(panelOpen ? 290 : 0);
  const { state } = useApp();
  return (
    <div className="stage" style={{ paddingLeft: panelOpen ? 290 : 0 }}>
      <DevPanel open={panelOpen} onToggle={() => setPanelOpen((o) => !o)} />
      <DeviceFrame scale={scale} appearance={state.dev.appearance}>
        <AppRoutes />
      </DeviceFrame>
      <div className="stage-note">Low-fidelity prototype · all figures illustrative · no real financial connections</div>
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <Stage />
      </HashRouter>
    </AppStateProvider>
  );
}
