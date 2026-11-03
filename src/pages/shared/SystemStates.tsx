// SYS-04, SYS-05, SYS-07, SYS-08, SYS-09, SYS-10 reusable system states.

import { Inbox, KeyRound, Lock, PlugZap, WifiOff } from '@/components/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { Banner, EmptyState, Loading } from '@/components/feedback/States';
import { Screen } from '@/components/layout/Screen';
import { useApp } from '@/hooks/useAppState';

// SYS-04
export function ConnectionError() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const fromOnb = params.get('from') === 'onboarding';
  return (
    <Screen title="Connection failed" back>
      <EmptyState icon={PlugZap} title="We couldn't connect your account" body="The institution didn't respond. Nothing was shared, and your existing information is unchanged." />
      <div className="stack-sm">
        <button
          className="btn block"
          onClick={() => {
            if (state.dev.failConnections) actions.setDev({ failConnections: false });
            navigate(fromOnb ? '/onboarding/connect' : '/profile/accounts');
          }}
        >
          Try again
        </button>
        <button className="btn secondary block" onClick={() => navigate(fromOnb ? '/onboarding/review' : '/home')}>Continue manually</button>
        <p className="caption center">Prototype: this state is triggered by the “Account connection fails” toggle. Retrying turns it off.</p>
      </div>
    </Screen>
  );
}

// SYS-05
export function NoDataState() {
  return (
    <Screen title="Overview" back>
      <EmptyState
        icon={Inbox}
        title="No financial information yet"
        body="Add income, expenses, savings and loans to see where you stand. Approximate values are fine, and you can skip anything you don't know."
        action={
          <div className="stack-sm" style={{ width: '100%' }}>
            <Link to="/onboarding/income-type" className="btn block">Guided setup</Link>
            <Link to="/records/new/income" className="btn secondary block">Add income</Link>
            <Link to="/records/new/expense" className="btn secondary block">Add expense</Link>
          </div>
        }
      />
    </Screen>
  );
}

// SYS-07
export function CalculatingState() {
  return (
    <Screen title="Decision" back>
      <Loading label="Calculating…" sub="Longer calculations show this state. Your inputs are kept." />
    </Screen>
  );
}

// SYS-08
export function OfflineState() {
  const { state, actions } = useApp();
  const { toast } = useFeedback();
  return (
    <Screen title="You're offline" back>
      <EmptyState icon={WifiOff} title="No internet connection" body="Connecting accounts and syncing are unavailable. Everything else works, and your entries are saved on this device." />
      <div className="card outline stack-sm">
        <span className="strong">Available offline</span>
        <span className="caption">Viewing your overview, adding and editing records, goals, decisions, scenarios</span>
        <span className="strong mt-8">Unavailable</span>
        <span className="caption">Connecting accounts, syncing, sending support requests</span>
      </div>
      <div className="mt-16">
        {state.dev.offline ? (
          <button className="btn block" onClick={() => (actions.setDev({ offline: false }), toast('Back online'))}>Retry connection</button>
        ) : (
          <Banner>You're back online.</Banner>
        )}
      </div>
    </Screen>
  );
}

// SYS-09
export function PermissionDenied() {
  const { toast } = useFeedback();
  return (
    <Screen title="Permission needed" back>
      <EmptyState icon={Lock} title="Notifications are turned off" body="To send payment reminders, allow notifications for this app in your device settings." />
      <div className="stack-sm">
        <button className="btn block" onClick={() => toast('Prototype: permission request shown', 'info')}>Allow notifications</button>
        <Link to="/profile/notifications" className="btn secondary block">Not now</Link>
      </div>
    </Screen>
  );
}

// SYS-10
export function SessionExpired() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  return (
    <Screen>
      <div style={{ paddingTop: 60 }}>
        <EmptyState icon={KeyRound} title="Your session has expired" body="For your security, please log in again. Your information is saved." />
      </div>
      <div className="stack-sm">
        <button
          className="btn block"
          onClick={() => {
            actions.signIn(state.session.user?.email || state.profile.email || 'user@example.com');
            navigate('/auth/otp', { replace: true });
          }}
        >
          Log in again
        </button>
        <button className="btn ghost block" onClick={() => (actions.signOut(), navigate('/auth/welcome', { replace: true }))}>Use a different account</button>
      </div>
    </Screen>
  );
}
