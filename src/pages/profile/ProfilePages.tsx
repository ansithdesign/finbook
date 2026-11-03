// PROF-01 … PROF-10 and SYS-06 Incomplete financial profile.

import { Banknote, Bell, Building2, CircleHelp, Lock, LogOut, Plus, Settings, ShieldCheck, User, Wallet, ClipboardList, Link2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Expandable, KV, List, ListRow, Section } from '@/components/cards/Cards';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { Banner, EmptyState, Money, ProgressBar, SourceTag } from '@/components/feedback/States';
import { Chips, NumberField, Segmented, TextField, ToggleRow } from '@/components/forms/Fields';
import { Screen } from '@/components/layout/Screen';
import { monthlyIncomeOf } from '@/calculations/financial/overview';
import { useApp } from '@/hooks/useAppState';
import { useFinance } from '@/hooks/useFinance';
import type { ProfileType } from '@/types';
import { fmtDate, inr, pct, relativeTime } from '@/utils/format';
import { validateEmail, validateMobile, validateRequired } from '@/utils/validation';

const PROFILE_TYPE_LABEL: Record<ProfileType, string> = {
  professional: 'Working professional',
  freelancer: 'Self-employed / Freelancer',
  business: 'Business owner',
  household: 'Managing household finances',
  student: 'Student / Early career',
  other: 'Other',
};

// PROF-01
export function ProfileOverview() {
  const { state, actions } = useApp();
  const f = useFinance();
  const navigate = useNavigate();
  const { confirm, toast } = useFeedback();
  const name = state.profile.name || state.session.user?.name || 'Your profile';
  return (
    <Screen large title="Profile">
      <div className="row" style={{ gap: 14 }}>
        <div className="avatar lg">{name.slice(0, 1).toUpperCase()}</div>
        <div className="flex-1">
          <div className="h3">{name}</div>
          <div className="caption">{state.profile.email || 'No email'} · {state.profile.mobile ? `+91 ${state.profile.mobile}` : 'No mobile'}</div>
          <div className="caption">{state.profile.profileTypes.map((p) => PROFILE_TYPE_LABEL[p]).join(', ') || 'Financial profile not set'}</div>
        </div>
      </div>
      <Link to="/profile/completeness" className="card mt-16" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        <div className="row-between"><span className="strong">Profile completeness</span><span className="strong">{pct(f.completeness.score)}</span></div>
        <div className="mt-8"><ProgressBar value={f.completeness.score} /></div>
        <div className="caption mt-8">{f.missing.length ? `${f.missing.length} item(s) missing — see what's affected` : 'All core sections complete'}</div>
      </Link>
      <Section title="Financial summary">
        <div className="card outline">
          <KV k="Monthly income" v={<Money value={f.income.value} />} />
          <KV k="Monthly expenses" v={<Money value={f.expenses.value} />} />
          <KV k="Net worth" v={<Money value={f.netWorth.value} />} />
          <KV k="Goals" v={state.data.goals.length} />
        </div>
      </Section>
      <Section title="Account">
        <List>
          <ListRow icon={User} title="Personal information" to="/profile/personal" />
          <ListRow icon={ClipboardList} title="Financial profile" to="/profile/financial" />
          <ListRow icon={Banknote} title="Income sources" sub={`${state.data.incomes.length} source(s)`} to="/profile/income" />
          <ListRow icon={Wallet} title="Accounts, assets and liabilities" to="/profile/accounts" />
          <ListRow icon={Link2} title="Data connections" sub={state.connections.length ? `${state.connections.length} illustrative` : 'None'} to="/profile/accounts" />
        </List>
      </Section>
      <Section title="Settings">
        <List>
          <ListRow icon={ShieldCheck} title="Privacy and consent" to="/profile/privacy" />
          <ListRow icon={Bell} title="Notifications" to="/profile/notifications" />
          <ListRow icon={Settings} title="Preferences" to="/profile/preferences" />
          <ListRow icon={CircleHelp} title="Help and support" to="/profile/help" />
        </List>
      </Section>
      <Section>
        <List>
          <ListRow
            icon={LogOut}
            title="Log out"
            onClick={async () => {
              if (!(await confirm({ title: 'Log out?', body: 'Your prototype data stays on this device.', confirmLabel: 'Log out' }))) return;
              actions.signOut();
              toast('Logged out');
              navigate('/auth/welcome', { replace: true });
            }}
          />
        </List>
      </Section>
      <p className="caption center mt-16">Money Decision Engine · low-fidelity prototype v0.1</p>
    </Screen>
  );
}

// PROF-02
export function PersonalInfo() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const { toast, confirm } = useFeedback();
  const initial = { name: state.profile.name, email: state.profile.email, mobile: state.profile.mobile, city: state.profile.city ?? '' };
  const [f, setF] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const errors = { name: validateRequired(f.name, 'Name'), email: validateEmail(f.email), mobile: validateMobile(f.mobile) };
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);
  return (
    <Screen
      title="Personal information"
      back
      onBack={async () => {
        if (dirty && !(await confirm({ title: 'Discard changes?', confirmLabel: 'Discard', danger: true }))) return;
        navigate(-1);
      }}
      footer={
        <button
          className="btn block"
          onClick={() => {
            setSubmitted(true);
            if (Object.values(errors).some(Boolean)) return toast('Please fix the highlighted fields', 'error');
            actions.updateProfile(f, true);
            toast('Personal information saved');
            navigate(-1);
          }}
        >
          Save
        </button>
      }
    >
      <div className="stack">
        <TextField label="Full name" value={f.name} onChange={(v) => setF({ ...f, name: v })} error={submitted ? errors.name : null} />
        <TextField label="Email" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} error={submitted ? errors.email : null} />
        <TextField label="Mobile" inputMode="tel" value={f.mobile} onChange={(v) => setF({ ...f, mobile: v.replace(/\D/g, '').slice(0, 10) })} error={submitted ? errors.mobile : null} />
        <TextField label="City (optional)" value={f.city} onChange={(v) => setF({ ...f, city: v })} />
      </div>
    </Screen>
  );
}

// PROF-03
export function FinancialProfilePage() {
  const { state, actions } = useApp();
  const { toast } = useFeedback();
  const p = state.profile;
  return (
    <Screen title="Financial profile" back>
      <div className="stack">
        <div className="field">
          <span className="field-label">Which describes your situation?</span>
          <Chips multi value={p.profileTypes} onChange={(v) => (actions.updateProfile({ profileTypes: v }), toast('Saved'))} options={(Object.keys(PROFILE_TYPE_LABEL) as ProfileType[]).map((k) => ({ value: k, label: PROFILE_TYPE_LABEL[k] }))} />
        </div>
        <div className="card outline">
          <KV k="Income type" v={p.incomeType ? p.incomeType.replace('-', ' ') : 'Not set'} />
          <KV k="Emergency reserve target" v={`${state.prefs.emergencyMonthsTarget} months`} />
        </div>
        <Link to="/onboarding/income-type?return=review" className="btn secondary">Change how I earn</Link>
        <NumberField label="Financial dependents" value={p.dependents ?? null} onChange={(v) => actions.updateProfile({ dependents: v })} help="Household context used in explanations." />
        <Segmented
          label="Emergency reserve target"
          value={String(state.prefs.emergencyMonthsTarget)}
          onChange={(v) => (actions.updatePrefs({ emergencyMonthsTarget: Number(v) }), toast('Target updated — insights recalculated'))}
          options={[{ value: '3', label: '3 months' }, { value: '6', label: '6 months' }, { value: '9', label: '9 months' }, { value: '12', label: '12 months' }]}
        />
        <Link to="/onboarding/review" className="btn ghost">Review all onboarding answers</Link>
      </div>
    </Screen>
  );
}

// PROF-04
export function IncomeSources() {
  const { state } = useApp();
  return (
    <Screen title="Income sources" back actions={<Link to="/records/new/income" className="icon-btn" aria-label="Add income"><Plus size={22} /></Link>}>
      {state.data.incomes.length === 0 ? (
        <EmptyState icon={Banknote} title="No income sources" action={<Link to="/records/new/income" className="btn sm">Add income source</Link>} />
      ) : (
        <List>
          {state.data.incomes.map((i) => (
            <ListRow key={i.id} title={i.name} sub={<span className="row" style={{ gap: 4 }}><SourceTag source={i.source} />{i.isAdditional ? 'Additional' : i.kind}</span>} value={<Money value={monthlyIncomeOf(i)} />} to={`/records/income/${i.id}`} />
          ))}
        </List>
      )}
      <p className="caption mt-12">Tap a source to edit or remove it. Changes update Home, decisions and scenarios immediately.</p>
    </Screen>
  );
}

// PROF-05
export function FinancialAccounts() {
  const { state } = useApp();
  const navigate = useNavigate();
  const liquid = state.data.assets.filter((a) => a.liquidity === 'liquid');
  return (
    <Screen title="Financial accounts" back>
      <Section title="Data connections">
        {state.connections.length === 0 ? (
          <Banner tone="outline" action={<button className="link-btn" onClick={() => navigate(state.dev.offline ? '/system/offline' : '/onboarding/connect')}>Connect</button>}>
            No connected accounts. All figures are entered manually.
          </Banner>
        ) : (
          <List>
            {state.connections.map((c) => (
              <ListRow key={c.id} icon={Building2} title={c.institution} sub={<span className="row" style={{ gap: 4 }}><SourceTag source="illustrative" /> {c.accountType} · {c.status}</span>} to={`/profile/accounts/${c.id}`} />
            ))}
          </List>
        )}
      </Section>
      <Section title="Manually entered accounts" action={<Link to="/records/new/asset" className="link-btn">Add</Link>}>
        <List>
          {liquid.length ? liquid.map((a) => <ListRow key={a.id} title={a.name} sub={<SourceTag source={a.source} />} value={<Money value={a.value} />} to={`/records/asset/${a.id}`} />) : <ListRow title="None" />}
        </List>
      </Section>
      <Section title="Assets and liabilities">
        <List>
          <ListRow title="All assets" sub={`${state.data.assets.length} record(s)`} to="/home/assets" />
          <ListRow title="All liabilities" sub={`${state.data.liabilities.length} record(s)`} to="/home/liabilities" />
          <ListRow title="Commitments" sub={`${state.data.commitments.length} record(s)`} to="/home/commitments" />
        </List>
      </Section>
    </Screen>
  );
}

// PROF-06
export function ConnectedAccountDetail() {
  const { id } = useParams();
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const { confirm, toast } = useFeedback();
  const c = state.connections.find((x) => x.id === id);
  if (!c)
    return (
      <Screen title="Connection" back>
        <EmptyState icon={Building2} title="Connection not found" body="It may have been disconnected." />
      </Screen>
    );
  return (
    <Screen title={c.institution} back>
      <div className="stack">
        <Banner tone="warn">Illustrative connection. No data has been imported from any institution.</Banner>
        <div className="card outline">
          <KV k="Account type" v={c.accountType} />
          <KV k="Status" v={c.status} />
          <KV k="Source" v="Consent-based integration (illustrative)" />
          <KV k="Consent given" v={fmtDate(c.consentGivenAt)} />
          <KV k="Last synchronisation" v={c.lastSync ? relativeTime(c.lastSync) : 'Never — prototype'} />
        </div>
        <Section title="Permissions">
          <List>{c.permissions.map((p) => <ListRow key={p} icon={Lock} title={p} sub="Read-only" />)}</List>
        </Section>
        <button className="btn secondary" onClick={() => (state.dev.failConnections ? navigate('/system/connection-error') : toast('Nothing to sync in the prototype'))}>Sync now</button>
        <button
          className="btn danger"
          onClick={async () => {
            if (!(await confirm({ title: `Disconnect ${c.institution}?`, body: 'Consent will be withdrawn. Your manual entries remain unchanged.', confirmLabel: 'Disconnect', danger: true }))) return;
            actions.mutate((s) => void (s.connections = s.connections.filter((x) => x.id !== c.id)));
            toast('Disconnected and consent withdrawn');
            navigate('/profile/accounts', { replace: true });
          }}
        >
          Disconnect
        </button>
      </div>
    </Screen>
  );
}

// PROF-07
export function PrivacyConsent() {
  const { state, actions } = useApp();
  const { confirm, toast } = useFeedback();
  const navigate = useNavigate();
  return (
    <Screen title="Privacy and consent" back>
      <div className="stack">
        <Expandable title="What financial data is stored" defaultOpen>
          <p className="caption">Income, expenses, assets, liabilities, commitments, goals, decisions and scenarios you enter. In this prototype, everything is stored only in your browser's local storage on this device.</p>
        </Expandable>
        <Expandable title="How it is used">
          <p className="caption">Only to calculate your overview, insights, decisions and projections. Calculations run on your device using fixed formulas.</p>
        </Expandable>
        <Expandable title="What is shared">
          <p className="caption">Nothing is shared with third parties. No external AI service or bank receives your data in this prototype.</p>
        </Expandable>
        <Expandable title="How to withdraw permissions">
          <p className="caption">Disconnect any connection from Financial accounts. You can also delete all your data below.</p>
        </Expandable>
        <Section title="Consents">
          <List>
            <ToggleRow label="Product analytics" sub="Anonymous usage data to improve the app (not collected in the prototype)" on={state.prefs.analyticsConsent} onChange={(v) => actions.updatePrefs({ analyticsConsent: v })} />
          </List>
          <div className="mt-8">
            <List>
              {state.connections.length ? state.connections.map((c) => <ListRow key={c.id} title={`${c.institution} — data sharing`} sub={`Given ${fmtDate(c.consentGivenAt)}`} to={`/profile/accounts/${c.id}`} />) : <ListRow title="No account-sharing consents" />}
            </List>
          </div>
        </Section>
        <button
          className="btn danger"
          onClick={async () => {
            if (!(await confirm({ title: 'Delete all my data?', body: 'This permanently removes every record, goal, decision and scenario from this device.', confirmLabel: 'Delete everything', danger: true }))) return;
            actions.reset();
            toast('All data deleted');
            navigate('/auth/welcome', { replace: true });
          }}
        >
          Delete all my data
        </button>
      </div>
    </Screen>
  );
}

// PROF-08
export function NotificationSettings() {
  const { state, actions } = useApp();
  const n = state.prefs.notify;
  const set = (p: Partial<typeof n>) => actions.updatePrefs({ notify: { ...n, ...p } });
  return (
    <Screen title="Notifications" back>
      <Section title="Preferences">
        <List>
          <ToggleRow label="Payment reminders" sub="EMIs, rent, premiums before they're due" on={n.reminders} onChange={(v) => set({ reminders: v })} />
          <ToggleRow label="Financial insights" sub="When something in your finances changes" on={n.insights} onChange={(v) => set({ insights: v })} />
          <ToggleRow label="Product updates" on={n.product} onChange={(v) => set({ product: v })} />
          <ToggleRow label="Email summaries" on={n.email} onChange={(v) => set({ email: v })} />
        </List>
      </Section>
      <Section title="History" action={<Link to="/notifications" className="link-btn">Open inbox</Link>}>
        <List>
          {state.notifications.length ? state.notifications.slice(0, 5).map((x) => <ListRow key={x.id} title={x.title} sub={relativeTime(x.at)} />) : <ListRow title="No notifications yet" />}
        </List>
      </Section>
    </Screen>
  );
}

// PROF-09
export function PreferencesPage() {
  const { state, actions } = useApp();
  return (
    <Screen title="Preferences" back>
      <div className="stack">
        <Segmented label="Currency" value="INR" onChange={() => undefined} options={[{ value: 'INR', label: 'INR (₹)' }]} />
        <p className="caption">Only INR is supported in this version.</p>
        <Section title="Display">
          <List>
            <ToggleRow label="Hide sensitive balances" sub="Mask amounts across the app" on={state.prefs.hideBalances} onChange={(v) => actions.updatePrefs({ hideBalances: v })} />
            <ToggleRow label="Compact numbers" sub="Show ₹12.5 lakh instead of ₹12,50,000 on summaries" on={state.prefs.compactNumbers} onChange={(v) => actions.updatePrefs({ compactNumbers: v })} />
          </List>
        </Section>
        <Section title="Notifications"><List><ListRow title="Notification preferences" to="/profile/notifications" /></List></Section>
        <Section title="Privacy"><List><ListRow title="Privacy and consent" to="/profile/privacy" /></List></Section>
      </div>
    </Screen>
  );
}

// PROF-10
export function HelpSupport() {
  const topics = [
    ['How are my numbers calculated?', 'Net worth = assets − liabilities. Surplus = income − expenses − EMIs − commitments not already counted. Liquid funds include only bank balances, cash, FDs and other liquid funds.'],
    ['Why is a value marked "Missing"?', 'Unknown values are never treated as zero. Add them from the record to complete the related calculations.'],
    ['How does "Decide" work?', 'Your question is matched to a decision type using fixed rules. All values come from your profile, your answers and standard formulas such as the EMI formula. No live AI model or bank data is used.'],
    ['Are projections guaranteed?', 'No. Projections are estimates. Any investment return is an assumption you can change.'],
    ['Is this financial advice?', 'No. The app explains trade-offs using your information; it does not provide regulated investment advice or execute transactions.'],
  ];
  return (
    <Screen title="Help and support" back>
      <div className="stack-sm">
        {topics.map(([q, a]) => (
          <Expandable key={q} title={q}><p className="caption">{a}</p></Expandable>
        ))}
      </div>
      <Section title="Contact">
        <List>
          <ListRow title="Email support" sub="support@example.com (placeholder)" />
          <ListRow title="Request a callback" sub="Placeholder — not active in prototype" />
        </List>
      </Section>
    </Screen>
  );
}

// SYS-06
export function ProfileCompleteness() {
  const f = useFinance();
  const sections = Array.from(new Set(f.missing.map((m) => m.section)));
  return (
    <Screen title="Complete your profile" back>
      <div className="card">
        <div className="row-between"><span className="strong">Completeness</span><span className="strong">{pct(f.completeness.score)}</span></div>
        <div className="mt-8"><ProgressBar value={f.completeness.score} /></div>
        <div className="chips mt-8">{f.completeness.sections.map((s) => <span key={s.name} className={`tag ${s.done ? 'dark' : 'dashed'}`}>{s.name}</span>)}</div>
      </div>
      {f.missing.length === 0 ? (
        <div className="mt-16"><Banner>Your core information is complete. Keep it up to date for accurate results.</Banner></div>
      ) : (
        sections.map((sec) => (
          <Section key={sec} title={sec}>
            <List>
              {f.missing.filter((m) => m.section === sec).map((m) => (
                <ListRow key={m.id} title={m.label} sub={`Affects: ${m.affects.join(', ')}`} to={m.to} />
              ))}
            </List>
          </Section>
        ))
      )}
      <p className="caption mt-16">Incomplete information never blocks you. Features that depend on it show estimates or explain what's needed. Monthly income currently {f.income.value === null ? 'unknown' : inr(f.income.value)}.</p>
    </Screen>
  );
}
