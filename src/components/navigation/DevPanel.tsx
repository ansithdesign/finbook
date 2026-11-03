// Development-only screen navigator, rendered OUTSIDE the device. Not part of the app UI.

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DEMO_PROFILES } from '@/data/mock-data/demoProfiles';
import { useApp } from '@/hooks/useAppState';

export function DevPanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [q, setQ] = useState('');

  const g = state.data.goals[0]?.id;
  const d = state.decisions[0]?.id;
  const sc = state.scenarios[0]?.id;
  const inc = state.data.incomes[0]?.id;
  const conn = state.connections[0]?.id;

  const groups = useMemo(
    () => [
      { name: 'Authentication', items: [['AUTH-01 Welcome', '/auth/welcome'], ['AUTH-02 Create account', '/auth/signup'], ['AUTH-03 Login', '/auth/login'], ['AUTH-04 OTP', '/auth/otp'], ['AUTH-05 Recovery', '/auth/recover']] },
      {
        name: 'Onboarding',
        items: [
          ['ONB-01 Introduction', '/onboarding/intro'], ['ONB-02 Financial profile', '/onboarding/profile'], ['ONB-03 Income type', '/onboarding/income-type'],
          ['ONB-04 Income details', '/onboarding/income'], ['ONB-05 Expenses', '/onboarding/expenses'], ['ONB-06 Savings', '/onboarding/savings'],
          ['ONB-07 Investments', '/onboarding/investments'], ['ONB-08 Loans', '/onboarding/loans'], ['ONB-09 Goals', '/onboarding/goals'],
          ['ONB-10 Connect accounts', '/onboarding/connect'], ['ONB-11 Review', '/onboarding/review'], ['ONB-12 Complete', '/onboarding/complete'],
        ],
      },
      {
        name: 'Home',
        items: [
          ['HOME-01 Overview', '/home'], ['HOME-02 Net worth', '/home/net-worth'], ['HOME-03 Income', '/home/income'], ['HOME-04 Expenses', '/home/expenses'],
          ['HOME-05 Assets', '/home/assets'], ['HOME-06 Liabilities', '/home/liabilities'], ['HOME-07 Liquidity', '/home/liquidity'], ['HOME-08 Commitments', '/home/commitments'],
          ['HOME-09 Insight detail', '/home/insights/incomplete'], ['HOME-10 Activity', '/home/activity'], ['HOME-11 Add record', '/records/new/expense'],
          ...(inc ? [['HOME-12 Edit record', `/records/income/${inc}`]] : []),
        ],
      },
      {
        name: 'Decide',
        items: [
          ['DEC-01 Landing', '/decide'], ['DEC-02 Ask', '/decide/ask'],
          ...(d ? [['DEC-03 Clarify', `/decide/${d}/clarify`], ['DEC-04 Context', `/decide/${d}/context`], ['DEC-05/10 Workspace', `/decide/${d}`], ['DEC-06 Alternatives', `/decide/${d}/alternatives`], ['DEC-07 Explanation', `/decide/${d}/explanation`]] : []),
          ['DEC-08 Saved', '/decide/saved'], ['DEC-09 History', '/decide/history'],
        ],
      },
      {
        name: 'Simulate',
        items: [
          ['SIM-01 Landing', '/simulate'], ['SIM-02 Create', '/simulate/new'],
          ...(sc ? [['SIM-03/04 Configure + projection', `/simulate/${sc}`], ['SIM-06 Cash flow', `/simulate/${sc}/cashflow`], ['SIM-07 Liquidity', `/simulate/${sc}/liquidity`], ['SIM-08 Goal impact', `/simulate/${sc}/goals`], ['SIM-09 Assumptions', `/simulate/${sc}/assumptions`]] : []),
          ['SIM-05 Compare', '/simulate/compare'],
        ],
      },
      {
        name: 'Goals',
        items: [
          ['GOAL-01 Overview', '/goals'], ['GOAL-02 Create', '/goals/new'],
          ...(g ? [['GOAL-03 Configure', `/goals/${g}/edit`], ['GOAL-04 Details', `/goals/${g}`], ['GOAL-05 Progress', `/goals/${g}/progress`], ['GOAL-06 Impact', `/goals/${g}/impact`]] : []),
        ],
      },
      {
        name: 'Profile',
        items: [
          ['PROF-01 Overview', '/profile'], ['PROF-02 Personal', '/profile/personal'], ['PROF-03 Financial profile', '/profile/financial'], ['PROF-04 Income sources', '/profile/income'],
          ['PROF-05 Accounts', '/profile/accounts'], ...(conn ? [['PROF-06 Connected account', `/profile/accounts/${conn}`]] : []), ['PROF-07 Privacy', '/profile/privacy'],
          ['PROF-08 Notifications', '/profile/notifications'], ['PROF-09 Preferences', '/profile/preferences'], ['PROF-10 Help', '/profile/help'],
        ],
      },
      {
        name: 'System',
        items: [
          ['SYS-01 Search', '/search'], ['SYS-02 Notifications', '/notifications'], ['SYS-04 Connection error', '/system/connection-error'], ['SYS-05 No data', '/system/no-data'],
          ['SYS-06 Incomplete profile', '/profile/completeness'], ['SYS-07 Calculating', '/system/calculating'], ['SYS-08 Offline', '/system/offline'],
          ['SYS-09 Permission denied', '/system/permission-denied'], ['SYS-10 Session expired', '/system/session-expired'],
        ],
      },
    ],
    [g, d, sc, inc, conn],
  );

  if (!open)
    return (
      <div className="devpanel collapsed">
        <header>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onToggle} aria-label="Open prototype navigator">
            <PanelLeftOpen size={18} />
          </button>
        </header>
      </div>
    );

  const needsSession = (path: string) => !path.startsWith('/auth') && path !== '/system/session-expired';
  const go = (path: string) => {
    if (needsSession(path) && state.session.status !== 'signed-in') {
      actions.loadDemo(state.demoProfile ?? 'salaried');
    }
    if (path === '/system/session-expired') actions.expireSession();
    navigate(path);
  };

  return (
    <aside className="devpanel" aria-label="Prototype navigator (development only)">
      <header>
        <span>Prototype navigator</span>
        <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onToggle} aria-label="Collapse prototype navigator">
          <PanelLeftClose size={18} />
        </button>
      </header>
      <div className="dp-body">
        <h4>Demo profile</h4>
        <div className="stack-sm">
          {DEMO_PROFILES.map((p) => (
            <button
              key={p.key}
              className={`dp-btn ${state.demoProfile === p.key ? 'on' : ''}`}
              onClick={() => {
                actions.loadDemo(p.key);
                navigate('/home');
              }}
            >
              <strong>{p.label}</strong>
              <div style={{ fontSize: 11, opacity: 0.75 }}>{p.description}</div>
            </button>
          ))}
          <button
            className="dp-btn"
            onClick={() => {
              actions.reset();
              navigate('/auth/welcome');
            }}
          >
            <strong>New user (empty)</strong>
            <div style={{ fontSize: 11, opacity: 0.75 }}>Reset everything and start at sign-up</div>
          </button>
        </div>

        <h4>Simulate conditions</h4>
        <div className="stack-sm">
          <button className={`dp-btn ${state.dev.appearance === 'dark' ? 'on' : ''}`} onClick={() => actions.setDev({ appearance: state.dev.appearance === 'dark' ? 'light' : 'dark' })}>
            Appearance: {state.dev.appearance}
          </button>
          <button className={`dp-btn ${state.dev.offline ? 'on' : ''}`} onClick={() => actions.setDev({ offline: !state.dev.offline })}>
            Offline mode: {state.dev.offline ? 'on' : 'off'}
          </button>
          <button className={`dp-btn ${state.dev.failConnections ? 'on' : ''}`} onClick={() => actions.setDev({ failConnections: !state.dev.failConnections })}>
            Account connection fails: {state.dev.failConnections ? 'yes' : 'no'}
          </button>
          <button className="dp-btn" onClick={() => go('/system/session-expired')}>
            Expire session
          </button>
        </div>

        <h4>Screens</h4>
        <input type="search" placeholder="Filter screens…" value={q} onChange={(e) => setQ(e.target.value)} />
        {groups.map((grp) => {
          const items = grp.items.filter(([label]) => label.toLowerCase().includes(q.toLowerCase()));
          if (!items.length) return null;
          return (
            <div key={grp.name}>
              <h4>{grp.name}</h4>
              {items.map(([label, path]) => (
                <button key={path} className={`dp-link ${pathname === path ? 'cur' : ''}`} onClick={() => go(path)}>
                  {label}
                </button>
              ))}
            </div>
          );
        })}
        <p className="caption mt-16">Screens with IDs in the URL use the current profile's first goal, decision or scenario. Create one to unlock them.</p>
      </div>
    </aside>
  );
}
