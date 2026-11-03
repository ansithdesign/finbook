// ONB-01 … ONB-12. Progressive, adaptive onboarding. Every step saves on Continue, Back and Skip,
// so users can leave and resume. Empty fields stay unknown (null), never zero.

import { Building2, Link2, Plus, ShieldCheck, Trash2 } from '@/components/icons';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { KV, List, ListRow, Section } from '@/components/cards/Cards';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { Banner, Money, ProgressBar, SourceTag } from '@/components/feedback/States';
import { Checkbox, MoneyField, NumberField, OptionList, Segmented, SelectField, TextField } from '@/components/forms/Fields';
import { GrowthScene, ShieldScene, SunriseScene } from '@/components/illustrations/Illustrations';
import { Screen } from '@/components/layout/Screen';
import { profileCompleteness } from '@/calculations/validation/completeness';
import { useApp } from '@/hooks/useAppState';
import { useFinance } from '@/hooks/useFinance';
import type {
  Asset,
  AssetCategory,
  AppState,
  Expense,
  ExpenseCategory,
  Frequency,
  GoalType,
  IncomeSource,
  IncomeType,
  Liability,
  LiabilityType,
  OnboardingStep,
  ProfileType,
} from '@/types';
import { inr } from '@/utils/format';
import { nowISO, uid } from '@/utils/id';
import { calculateEmi } from '@/calculations/financial/loans';
import { toMonthly } from '@/calculations/financial/overview';

const STEPS: OnboardingStep[] = ['intro', 'profile', 'income-type', 'income', 'expenses', 'savings', 'investments', 'loans', 'goals', 'connect', 'review', 'complete'];
const OPTIONAL: OnboardingStep[] = ['profile', 'expenses', 'savings', 'investments', 'loans', 'goals', 'connect'];

const FREQ_OPTIONS: Array<{ value: Frequency; label: string }> = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half-yearly', label: 'Half-yearly' },
  { value: 'yearly', label: 'Yearly' },
];

function useStepNav(step: OnboardingStep) {
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const [params] = useSearchParams();
  const returnToReview = params.get('return') === 'review';
  const idx = STEPS.indexOf(step);
  useEffect(() => {
    if (!state.onboarding.completed && state.onboarding.step !== step) actions.setOnboarding({ step });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  return {
    idx,
    next: () => navigate(returnToReview ? '/onboarding/review' : `/onboarding/${STEPS[idx + 1]}`),
    back: () => navigate(returnToReview ? '/onboarding/review' : idx > 0 ? `/onboarding/${STEPS[idx - 1]}` : '/auth/welcome'),
    skip: () => {
      actions.setOnboarding({ skipped: Array.from(new Set([...state.onboarding.skipped, step])) });
      navigate(returnToReview ? '/onboarding/review' : `/onboarding/${STEPS[idx + 1]}`);
    },
    returnToReview,
  };
}

function OnbScreen({ step, title, children, onContinue, continueLabel = 'Continue', onSave, canContinue = true }: { step: OnboardingStep; title: string; children: ReactNode; onContinue?: () => void; continueLabel?: string; onSave?: () => void; canContinue?: boolean }) {
  const nav = useStepNav(step);
  const total = STEPS.length - 2; // exclude intro & complete from the bar
  const pos = Math.max(0, nav.idx - 1);
  const optional = OPTIONAL.includes(step);
  return (
    <Screen
      title={title}
      back
      onBack={() => {
        onSave?.();
        nav.back();
      }}
      actions={
        optional && !nav.returnToReview ? (
          <button className="link-btn" style={{ padding: '0 8px' }} onClick={() => (onSave?.(), nav.skip())}>
            Skip
          </button>
        ) : null
      }
      subheader={
        <div style={{ padding: '0 20px 10px' }}>
          <div className="stepper" aria-label={`Step ${pos + 1} of ${total}`}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className={i <= pos ? 'done' : ''} />
            ))}
          </div>
          <div className="caption mt-4">
            Step {pos + 1} of {total}
            {optional ? ' · Optional' : ''}
          </div>
        </div>
      }
      footer={
        <button
          className="btn block"
          disabled={!canContinue}
          onClick={() => {
            onSave?.();
            (onContinue ?? nav.next)();
          }}
        >
          {nav.returnToReview ? 'Save and return to review' : continueLabel}
        </button>
      }
    >
      {children}
    </Screen>
  );
}

// ---------------------------------------------------------------------------
export function OnboardingRouter() {
  const { step } = useParams();
  switch (step as OnboardingStep) {
    case 'intro':
      return <Intro />;
    case 'profile':
      return <ProfileStep />;
    case 'income-type':
      return <IncomeTypeStep />;
    case 'income':
      return <IncomeStep />;
    case 'expenses':
      return <ExpensesStep />;
    case 'savings':
      return <AssetStep step="savings" />;
    case 'investments':
      return <AssetStep step="investments" />;
    case 'loans':
      return <LoansStep />;
    case 'goals':
      return <GoalsStep />;
    case 'connect':
      return <ConnectStep />;
    case 'review':
      return <ReviewStep />;
    case 'complete':
      return <CompleteStep />;
    default:
      return <Navigate to="/onboarding/intro" replace />;
  }
}

// ONB-01 ----------------------------------------------------------------------
function Intro() {
  const nav = useStepNav('intro');
  const { state } = useApp();
  return (
    <Screen
      footer={
        <>
          <button className="btn block" onClick={nav.next}>Get started</button>
          <Link to="/auth/login" className="btn ghost block">I already have an account</Link>
        </>
      }
    >
      <div className="stack-lg" style={{ paddingTop: 24 }}>
        <div className="reveal"><GrowthScene /></div>
        <h1 className="h1">Your money has possibilities. Understand them.</h1>
        <p className="muted">Bring your financial life together, explore different possibilities and make decisions with greater confidence.</p>
        <Banner tone="outline">
          Next, a few short questions{state.session.user?.name ? `, ${state.session.user.name.split(' ')[0]}` : ''}. Approximate answers are fine and you can skip anything optional. You can edit everything later.
        </Banner>
      </div>
    </Screen>
  );
}

// ONB-02 ----------------------------------------------------------------------
const PROFILE_OPTIONS: Array<{ value: ProfileType; label: string; sub?: string }> = [
  { value: 'professional', label: 'Working professional', sub: 'Salaried employment' },
  { value: 'freelancer', label: 'Self-employed / Freelancer', sub: 'Project or client-based income' },
  { value: 'business', label: 'Business owner' },
  { value: 'household', label: 'Managing household finances', sub: 'Family expenses, shared goals' },
  { value: 'student', label: 'Student / Early career' },
  { value: 'other', label: 'Other' },
];

function ProfileStep() {
  const { state, actions } = useApp();
  const [sel, setSel] = useState<ProfileType[]>(state.profile.profileTypes);
  const save = () => {
    const patch: Partial<AppState['profile']> = { profileTypes: sel };
    if (!state.profile.incomeType) {
      if (sel.includes('freelancer')) patch.incomeType = 'freelance';
      else if (sel.includes('business')) patch.incomeType = 'business';
      else if (sel.length) patch.incomeType = 'fixed';
    }
    actions.updateProfile(patch);
  };
  return (
    <OnbScreen step="profile" title="About you" onSave={save}>
      <div className="stack">
        <h2 className="h2">Which best describes your financial situation?</h2>
        <p className="muted">Select all that apply. This tailors the next questions.</p>
        <OptionList multi value={sel} onChange={setSel} options={PROFILE_OPTIONS} />
      </div>
    </OnbScreen>
  );
}

// ONB-03 ----------------------------------------------------------------------
const INCOME_TYPES: Array<{ value: IncomeType; label: string; sub: string }> = [
  { value: 'fixed', label: 'Fixed monthly salary', sub: 'Same take-home every month' },
  { value: 'variable-salary', label: 'Variable salary', sub: 'Salary with incentives or commission' },
  { value: 'freelance', label: 'Freelance / Project-based income', sub: 'Varies with clients and projects' },
  { value: 'business', label: 'Business income', sub: 'Personal income drawn from a business' },
  { value: 'multiple', label: 'Multiple income sources', sub: 'Salary plus rental, side income, etc.' },
  { value: 'other', label: 'Other', sub: 'Pension, allowance, support' },
];

function IncomeTypeStep() {
  const { state, actions } = useApp();
  const [sel, setSel] = useState<IncomeType[]>(state.profile.incomeType ? [state.profile.incomeType] : []);
  return (
    <OnbScreen step="income-type" title="Income" canContinue={sel.length > 0} onSave={() => sel[0] && actions.updateProfile({ incomeType: sel[0] })}>
      <div className="stack">
        <h2 className="h2">How do you earn money?</h2>
        <p className="muted">We'll ask for the details that fit how you're paid.</p>
        <OptionList value={sel} onChange={setSel} options={INCOME_TYPES} />
      </div>
    </OnbScreen>
  );
}

// ONB-04 ----------------------------------------------------------------------
interface IncomeDraft {
  id: string;
  name: string;
  kind: IncomeSource['kind'];
  amount: number | null;
  min: number | null;
  max: number | null;
  frequency: Frequency;
  paymentPattern: IncomeSource['paymentPattern'];
  approximate: boolean;
  isAdditional: boolean;
}

const kindForType = (t: IncomeType | null): IncomeSource['kind'] =>
  t === 'freelance' ? 'freelance' : t === 'business' ? 'business' : t === 'variable-salary' ? 'variable-salary' : t === 'other' ? 'other' : 'salary';

function toDraft(i: IncomeSource): IncomeDraft {
  return { id: i.id, name: i.name, kind: i.kind, amount: i.amount, min: i.min ?? null, max: i.max ?? null, frequency: i.frequency, paymentPattern: i.paymentPattern, approximate: i.source === 'estimated', isAdditional: i.isAdditional };
}

function IncomeStep() {
  const { state, actions } = useApp();
  const type = state.profile.incomeType;
  const kind = kindForType(type);
  const variable = type === 'freelance' || type === 'variable-salary' || type === 'business';
  const existingPrimary = state.data.incomes.filter((i) => !i.isAdditional);
  const existingAdditional = state.data.incomes.filter((i) => i.isAdditional);
  const defaultName = { salary: 'Salary (take-home)', 'variable-salary': 'Salary incl. variable pay', freelance: 'Freelance income', business: 'Business income (personal draw)', other: 'Other income', rental: 'Rental income', interest: 'Interest income' }[kind];
  const blank = (isAdditional = false, name = defaultName): IncomeDraft => ({ id: uid('inc'), name, kind: isAdditional ? 'other' : kind, amount: null, min: null, max: null, frequency: 'monthly', paymentPattern: variable ? 'irregular' : 'monthly', approximate: false, isAdditional });
  const [primary, setPrimary] = useState<IncomeDraft[]>(existingPrimary.length ? existingPrimary.map(toDraft) : [blank()]);
  const [additional, setAdditional] = useState<IncomeDraft[]>(existingAdditional.map(toDraft));
  const multi = type === 'multiple' || type === 'business';

  const save = () => {
    const all = [...primary, ...additional].filter((d) => d.amount !== null || d.min !== null || d.max !== null || d.name !== defaultName);
    actions.mutate((s) => {
      const keepIds = new Set(all.map((d) => d.id));
      s.data.incomes = s.data.incomes.filter((i) => keepIds.has(i.id));
      for (const d of all) {
        const rec: IncomeSource = {
          id: d.id,
          name: d.name || 'Income',
          kind: d.isAdditional ? d.kind : d.kind === 'salary' || d.kind === 'other' ? kind : d.kind,
          amount: d.amount,
          min: variable && !d.isAdditional ? d.min : undefined,
          max: variable && !d.isAdditional ? d.max : undefined,
          frequency: d.frequency,
          paymentPattern: d.paymentPattern,
          isAdditional: d.isAdditional,
          source: d.approximate || variable ? 'estimated' : 'manual',
          updatedAt: nowISO(),
        };
        const idx = s.data.incomes.findIndex((x) => x.id === d.id);
        if (idx >= 0) s.data.incomes[idx] = rec;
        else s.data.incomes.push(rec);
      }
    });
  };
  const validate = () => {
    for (const d of primary) {
      if (d.min !== null && d.max !== null && d.min > d.max) return 'Lowest month cannot be higher than the highest month.';
      if (d.amount !== null && d.min !== null && d.amount < d.min) return 'Typical income should be at or above the lowest month.';
    }
    return null;
  };

  const patch = (list: IncomeDraft[], set: (l: IncomeDraft[]) => void, i: number, p: Partial<IncomeDraft>) => set(list.map((d, j) => (j === i ? { ...d, ...p } : d)));
  const labels = {
    fixed: { amount: 'Monthly take-home salary', help: 'After tax and deductions: what reaches your bank account.' },
    'variable-salary': { amount: 'Average monthly take-home', help: 'Including typical incentives or commission.' },
    freelance: { amount: 'Typical monthly income', help: 'What a normal month looks like, after business expenses.' },
    business: { amount: 'Average monthly personal income', help: 'What you take out of the business for personal use.' },
    multiple: { amount: 'Amount', help: undefined },
    other: { amount: 'Amount', help: undefined },
  }[type ?? 'fixed'];

  return (
    <OnbScreen
      step="income"
      title="Income details"
      onSave={save}
      canContinue={!validate()}
    >
      <div className="stack-lg">
        <div className="stack-sm">
          <h2 className="h2">{variable ? 'Tell us about your income range' : 'How much do you earn?'}</h2>
          <p className="muted">Approximate values are fine. All amounts in INR (₹).</p>
          {!type && (
            <Banner tone="warn" action={<Link className="link-btn" to="/onboarding/income-type">Choose</Link>}>
              Choose how you earn first.
            </Banner>
          )}
        </div>

        {primary.map((d, i) => (
          <div key={d.id} className="card outline stack">
            {multi && (
              <div className="row-between">
                <span className="h3">{type === 'business' && i > 0 ? `Business income source ${i}` : `Income source ${i + 1}`}</span>
                {primary.length > 1 && (
                  <button className="icon-btn" aria-label="Remove income source" onClick={() => setPrimary(primary.filter((_, j) => j !== i))}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )}
            {multi && <TextField label="Source name" value={d.name} onChange={(v) => patch(primary, setPrimary, i, { name: v })} placeholder="e.g. Salary, Rental income" />}
            {type === 'multiple' && (
              <SelectField
                label="Type"
                value={d.kind}
                onChange={(v) => patch(primary, setPrimary, i, { kind: v })}
                options={[
                  { value: 'salary', label: 'Salary' },
                  { value: 'freelance', label: 'Freelance / project' },
                  { value: 'business', label: 'Business' },
                  { value: 'rental', label: 'Rental' },
                  { value: 'interest', label: 'Interest / dividends' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            )}
            <MoneyField label={labels.amount} help={labels.help} value={d.amount} onChange={(v) => patch(primary, setPrimary, i, { amount: v })} />
            {variable && (i === 0 || type !== 'business') && (
              <>
                <div className="grid-2">
                  <MoneyField label="Lowest typical month" value={d.min} onChange={(v) => patch(primary, setPrimary, i, { min: v })} />
                  <MoneyField label="Highest typical month" value={d.max} onChange={(v) => patch(primary, setPrimary, i, { max: v })} />
                </div>
                {type === 'freelance' && (
                  <SelectField
                    label="How often are you paid?"
                    value={d.paymentPattern ?? 'irregular'}
                    onChange={(v) => patch(primary, setPrimary, i, { paymentPattern: v })}
                    options={[
                      { value: 'monthly', label: 'Monthly retainer' },
                      { value: 'per-project', label: 'Per project / milestone' },
                      { value: 'irregular', label: 'Irregular' },
                    ]}
                  />
                )}
              </>
            )}
            {!variable && (
              <SelectField label="Frequency" value={d.frequency} onChange={(v) => patch(primary, setPrimary, i, { frequency: v })} options={FREQ_OPTIONS} />
            )}
            <Segmented
              value={d.approximate ? 'approx' : 'exact'}
              onChange={(v) => patch(primary, setPrimary, i, { approximate: v === 'approx' })}
              options={[
                { value: 'exact', label: 'Exact figure' },
                { value: 'approx', label: 'Approximate' },
              ]}
            />
          </div>
        ))}
        {multi && (
          <button className="btn secondary" onClick={() => setPrimary([...primary, { ...blank(false, type === 'business' ? 'Business income' : 'Income source'), kind: type === 'business' ? 'business' : 'other' }])}>
            <Plus size={18} /> {type === 'business' ? 'Add business income source' : 'Add income source'}
          </button>
        )}

        <Section title="Additional income" className="mt-8">
          <p className="muted mb-8" style={{ fontSize: 14 }}>Rent received, interest, side projects. Optional.</p>
          <div className="stack">
            {additional.map((d, i) => (
              <div key={d.id} className="card outline stack">
                <div className="row-between">
                  <span className="h3">Additional income</span>
                  <button className="icon-btn" aria-label="Remove additional income" onClick={() => setAdditional(additional.filter((_, j) => j !== i))}>
                    <Trash2 size={18} />
                  </button>
                </div>
                <TextField label="Income source" value={d.name} onChange={(v) => patch(additional, setAdditional, i, { name: v })} />
                <div className="grid-2">
                  <MoneyField label="Amount" value={d.amount} onChange={(v) => patch(additional, setAdditional, i, { amount: v })} />
                  <SelectField label="Frequency" value={d.frequency} onChange={(v) => patch(additional, setAdditional, i, { frequency: v })} options={FREQ_OPTIONS} />
                </div>
              </div>
            ))}
            <button className="btn secondary" onClick={() => setAdditional([...additional, blank(true, 'Side income')])}>
              <Plus size={18} /> Add additional income
            </button>
          </div>
        </Section>
        {validate() && <Banner tone="warn">{validate()}</Banner>}
      </div>
    </OnbScreen>
  );
}

// ONB-05 ----------------------------------------------------------------------
const EXPENSE_CATS: Array<{ category: ExpenseCategory; name: string; essential: boolean; hint?: string }> = [
  { category: 'housing', name: 'Housing / Rent', essential: true },
  { category: 'food', name: 'Food and groceries', essential: true },
  { category: 'transport', name: 'Transportation', essential: true },
  { category: 'utilities', name: 'Utilities', essential: true, hint: 'Electricity, water, internet, phone' },
  { category: 'lifestyle', name: 'Lifestyle', essential: false, hint: 'Dining, shopping, outings' },
  { category: 'healthcare', name: 'Healthcare', essential: true },
  { category: 'education', name: 'Education', essential: true },
  { category: 'family', name: 'Family responsibilities', essential: true, hint: 'Support to parents, household help' },
  { category: 'insurance', name: 'Insurance', essential: true, hint: 'Premiums. Choose yearly if you pay annually.' },
  { category: 'subscriptions', name: 'Subscriptions', essential: false },
  { category: 'other', name: 'Other', essential: false },
];

interface ExpenseDraft {
  id: string;
  name: string;
  category: ExpenseCategory;
  amount: number | null;
  frequency: Frequency;
  essential: boolean;
  estimated: boolean;
  custom: boolean;
  hint?: string;
}

function ExpensesStep() {
  const { state, actions } = useApp();
  const household = state.profile.profileTypes.includes('household');
  const [rows, setRows] = useState<ExpenseDraft[]>(() => {
    const used = new Set<string>();
    const base = EXPENSE_CATS.map((c) => {
      const match = state.data.expenses.find((e) => e.category === c.category && !used.has(e.id));
      if (match) used.add(match.id);
      return {
        id: match?.id ?? uid('exp'),
        name: match?.name ?? c.name,
        category: c.category,
        amount: match?.amount ?? null,
        frequency: match?.frequency ?? 'monthly',
        essential: match?.essential ?? c.essential,
        estimated: match ? match.source === 'estimated' : true,
        custom: false,
        hint: c.hint,
      };
    });
    const extra = state.data.expenses
      .filter((e) => !used.has(e.id))
      .map((e) => ({ id: e.id, name: e.name, category: e.category, amount: e.amount, frequency: e.frequency, essential: e.essential, estimated: e.source === 'estimated', custom: true }));
    return [...base, ...extra];
  });
  const [newName, setNewName] = useState('');
  const total = rows.reduce((s, r) => s + (r.amount === null ? 0 : toMonthly(r.amount, r.frequency)), 0);
  const filled = rows.filter((r) => r.amount !== null).length;
  const patch = (i: number, p: Partial<ExpenseDraft>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const save = () =>
    actions.mutate((s) => {
      const draftIds = new Set(rows.map((r) => r.id));
      const keep = s.data.expenses.filter((e) => !draftIds.has(e.id));
      const fromDraft: Expense[] = rows
        .filter((r) => r.amount !== null)
        .map((r) => ({ id: r.id, name: r.name, category: r.category, amount: r.amount, frequency: r.frequency, essential: r.essential, source: r.estimated ? 'estimated' : 'manual', updatedAt: nowISO() }));
      s.data.expenses = [...keep, ...fromDraft];
    });
  const ordered = household ? [...rows].sort((a, b) => Number(b.category === 'family' || b.category === 'education') - Number(a.category === 'family' || a.category === 'education')) : rows;

  return (
    <OnbScreen step="expenses" title="Monthly expenses" onSave={save}>
      <div className="stack">
        <h2 className="h2">What do you usually spend?</h2>
        <p className="muted">Estimates are fine. Leave blank anything you don't know. Blanks are not counted as zero. Don't include loan EMIs here; we ask about loans separately.</p>
        <div className="card row-between" style={{ position: 'sticky', top: 0, zIndex: 2 }}>
          <div>
            <div className="label">Estimated monthly total</div>
            <div className="mid-number num">{inr(total)}</div>
          </div>
          <span className="caption">{filled} of {rows.length} filled</span>
        </div>
        {ordered.map((r) => {
          const i = rows.indexOf(r);
          return (
            <details key={r.id} className="expand" open={r.amount !== null || r.category === 'housing'}>
              <summary>
                <span>
                  {r.name}
                  {r.hint && <span className="caption" style={{ display: 'block', fontWeight: 400 }}>{r.hint}</span>}
                </span>
                <span className="row">
                  <span className="num" style={{ fontWeight: 600 }}>{r.amount !== null ? inr(r.amount) : <span className="caption">Add</span>}</span>
                </span>
              </summary>
              <div className="expand-body stack">
                {r.custom && <TextField label="Category name" value={r.name} onChange={(v) => patch(i, { name: v })} />}
                <div className="grid-2">
                  <MoneyField label="Amount" value={r.amount} onChange={(v) => patch(i, { amount: v })} />
                  <SelectField label="Frequency" value={r.frequency} onChange={(v) => patch(i, { frequency: v })} options={FREQ_OPTIONS} />
                </div>
                <Segmented value={r.estimated ? 'est' : 'exact'} onChange={(v) => patch(i, { estimated: v === 'est' })} options={[{ value: 'est', label: 'Estimated' }, { value: 'exact', label: 'Exact' }]} />
                <Segmented value={r.essential ? 'ess' : 'disc'} onChange={(v) => patch(i, { essential: v === 'ess' })} options={[{ value: 'ess', label: 'Essential' }, { value: 'disc', label: 'Discretionary' }]} />
                {r.custom && (
                  <button className="btn danger sm" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                    <Trash2 size={16} /> Remove category
                  </button>
                )}
              </div>
            </details>
          );
        })}
        <div className="card outline stack-sm">
          <span className="h3">Add a custom category</span>
          <div className="row">
            <div className="flex-1">
              <TextField value={newName} onChange={setNewName} placeholder="e.g. Pet care" />
            </div>
            <button
              className="btn sm"
              disabled={!newName.trim()}
              onClick={() => {
                setRows([...rows, { id: uid('exp'), name: newName.trim(), category: 'other', amount: null, frequency: 'monthly', essential: false, estimated: true, custom: true }]);
                setNewName('');
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </OnbScreen>
  );
}

// ONB-06 / ONB-07 -------------------------------------------------------------
const SAVINGS_CATS: Array<{ category: AssetCategory; name: string; emergency: boolean; note?: string }> = [
  { category: 'savings', name: 'Savings account balance', emergency: true },
  { category: 'current', name: 'Current account balance', emergency: true },
  { category: 'cash', name: 'Cash', emergency: true },
  { category: 'fd', name: 'Fixed deposits', emergency: true, note: 'Accessible within days; early withdrawal may carry a small penalty.' },
  { category: 'liquid-other', name: 'Other liquid funds', emergency: true, note: 'e.g. liquid mutual funds, sweep-in deposits' },
];
const INVEST_CATS: Array<{ category: AssetCategory; name: string; liquidity: Asset['liquidity'] }> = [
  { category: 'mutual-funds', name: 'Mutual funds', liquidity: 'market' },
  { category: 'stocks', name: 'Stocks and ETFs', liquidity: 'market' },
  { category: 'gold', name: 'Gold', liquidity: 'market' },
  { category: 'property', name: 'Property', liquidity: 'locked' },
  { category: 'retirement', name: 'Retirement savings (EPF, PPF, NPS)', liquidity: 'locked' },
  { category: 'other', name: 'Other investments', liquidity: 'market' },
];

function AssetStep({ step }: { step: 'savings' | 'investments' }) {
  const { state, actions } = useApp();
  const cats = step === 'savings' ? SAVINGS_CATS.map((c) => ({ ...c, liquidity: 'liquid' as const })) : INVEST_CATS.map((c) => ({ ...c, emergency: false, note: undefined as string | undefined }));
  const [values, setValues] = useState(() =>
    cats.map((c) => {
      const match = state.data.assets.find((a) => a.category === c.category);
      return { id: match?.id ?? uid('ast'), cat: c, value: match?.value ?? null, existing: !!match, name: match?.name ?? c.name };
    }),
  );
  const total = values.reduce((s, v) => s + (v.value ?? 0), 0);
  const save = () =>
    actions.mutate((s) => {
      for (const v of values) {
        const idx = s.data.assets.findIndex((a) => a.id === v.id);
        if (v.value === null) {
          if (idx >= 0) s.data.assets.splice(idx, 1);
          continue;
        }
        const rec: Asset = {
          id: v.id,
          name: v.name,
          category: v.cat.category,
          value: v.value,
          liquidity: v.cat.liquidity,
          emergencyEligible: v.cat.emergency,
          source: step === 'investments' ? 'estimated' : 'manual',
          updatedAt: nowISO(),
        };
        if (idx >= 0) s.data.assets[idx] = { ...s.data.assets[idx], value: v.value, updatedAt: nowISO() };
        else s.data.assets.push(rec);
      }
    });
  return (
    <OnbScreen step={step} title={step === 'savings' ? 'Savings and balances' : 'Investments and assets'} onSave={save}>
      <div className="stack">
        <h2 className="h2">{step === 'savings' ? 'How much do you have readily available?' : 'What do you own or invest in?'}</h2>
        {step === 'savings' ? (
          <Banner>
            <strong>Liquid funds</strong> are money you can use within days: bank balances, cash and FDs. <strong>Long-term investments</strong> like mutual funds, stocks and property are counted in net worth, but not as cash you can spend immediately.
          </Banner>
        ) : (
          <Banner>
            Enter approximate current values. These are labelled as <strong>your estimates</strong>, and no investment returns are assumed. Market-linked investments are not treated as cash.
          </Banner>
        )}
        <div className="card row-between">
          <span className="label">Total entered</span>
          <span className="mid-number num">{inr(total)}</span>
        </div>
        {values.map((v, i) => (
          <MoneyField
            key={v.id}
            label={
              <span className="row" style={{ justifyContent: 'space-between' }}>
                {v.name} {step === 'investments' && <SourceTag source="estimated" />}
              </span>
            }
            help={v.cat.note}
            value={v.value}
            onChange={(n) => setValues(values.map((x, j) => (j === i ? { ...x, value: n } : x)))}
          />
        ))}
      </div>
    </OnbScreen>
  );
}

// ONB-08 ----------------------------------------------------------------------
const LOAN_TYPES: Array<{ value: LiabilityType; label: string }> = [
  { value: 'home', label: 'Home loan' },
  { value: 'vehicle', label: 'Vehicle loan' },
  { value: 'personal', label: 'Personal loan' },
  { value: 'education', label: 'Education loan' },
  { value: 'credit-card', label: 'Credit card outstanding' },
  { value: 'other', label: 'Other liabilities' },
];

function LoansStep() {
  const { state, actions } = useApp();
  const [loans, setLoans] = useState<Liability[]>(state.data.liabilities);
  const [none, setNone] = useState(false);
  const selected = LOAN_TYPES.filter((t) => loans.some((l) => l.type === t.value)).map((t) => t.value);
  const toggle = (types: LiabilityType[]) => {
    const add = types.filter((t) => !selected.includes(t));
    const remove = selected.filter((t) => !types.includes(t));
    setNone(false);
    setLoans([
      ...loans.filter((l) => !remove.includes(l.type)),
      ...add.map((t) => ({ id: uid('liab'), name: LOAN_TYPES.find((x) => x.value === t)!.label, type: t, outstanding: null, rate: null, emi: null, remainingMonths: null, source: 'manual' as const, updatedAt: nowISO() })),
    ]);
  };
  const patch = (id: string, p: Partial<Liability>) => setLoans(loans.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const save = () =>
    actions.mutate((s) => {
      const ids = new Set(loans.map((l) => l.id));
      const removed = s.data.liabilities.filter((l) => !ids.has(l.id)).map((l) => l.id);
      s.data.liabilities = loans.map((l) => ({ ...l, updatedAt: nowISO() }));
      s.data.commitments = s.data.commitments.filter((c) => !(c.linkedTo?.kind === 'liability' && removed.includes(c.linkedTo.id)));
      // EMI commitments are linked to their loan so the EMI is never counted twice.
      for (const l of loans) {
        if (l.type === 'credit-card' || l.emi === null) continue;
        const existing = s.data.commitments.find((c) => c.linkedTo?.id === l.id);
        if (existing) existing.amount = l.emi;
        else {
          const d = new Date();
          s.data.commitments.push({ id: uid('cm'), name: `${l.name} EMI`, type: 'emi', amount: l.emi, nextDue: new Date(d.getFullYear(), d.getMonth() + 1, 5, 9).toISOString(), recurrence: 'monthly', linkedTo: { kind: 'liability', id: l.id }, status: 'upcoming', source: 'manual', updatedAt: nowISO() });
        }
      }
    });
  return (
    <OnbScreen step="loans" title="Loans and liabilities" onSave={save}>
      <div className="stack">
        <h2 className="h2">Do you have any loans or dues?</h2>
        <p className="muted">Select all that apply. Skip any detail you don't know. We'll mark it as missing rather than guess.</p>
        <OptionList multi value={selected} onChange={toggle} options={LOAN_TYPES} />
        <button className={`option-card ${none && loans.length === 0 ? 'on' : ''}`} onClick={() => (setLoans([]), setNone(true))}>
          <span className="check round" /> I don't have any loans
        </button>
        {loans.map((l) => {
          const derivedEmi = l.emi === null && l.outstanding && l.rate !== null && l.remainingMonths ? Math.round(calculateEmi(l.outstanding, l.rate, l.remainingMonths)) : null;
          return (
            <div key={l.id} className="card outline stack">
              <span className="h3">{l.name}</span>
              <MoneyField label="Outstanding amount" value={l.outstanding} onChange={(v) => patch(l.id, { outstanding: v })} />
              {l.type !== 'credit-card' && (
                <>
                  <div className="grid-2">
                    <NumberField label="Interest rate" suffix="% p.a." value={l.rate} onChange={(v) => patch(l.id, { rate: v })} placeholder="If known" />
                    <NumberField label="Remaining tenure" suffix="months" value={l.remainingMonths} onChange={(v) => patch(l.id, { remainingMonths: v === null ? null : Math.round(v) })} placeholder="If known" />
                  </div>
                  <MoneyField label="Monthly EMI" value={l.emi} onChange={(v) => patch(l.id, { emi: v })} help={derivedEmi ? `Estimated from the details above: ${inr(derivedEmi)}. Enter your actual EMI if known.` : undefined} />
                </>
              )}
            </div>
          );
        })}
      </div>
    </OnbScreen>
  );
}

// ONB-09 ----------------------------------------------------------------------
const GOAL_OPTIONS: Array<{ value: GoalType; label: string }> = [
  { value: 'emergency', label: 'Emergency fund' },
  { value: 'car', label: 'Buying a car' },
  { value: 'house', label: 'Buying a house' },
  { value: 'marriage', label: 'Marriage' },
  { value: 'education', label: 'Education' },
  { value: 'travel', label: 'Travel' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'other', label: 'Other' },
];

function GoalsStep() {
  const { state, actions } = useApp();
  const existingTypes = state.data.goals.map((g) => g.type);
  const [sel, setSel] = useState<GoalType[]>(Array.from(new Set([...existingTypes, ...state.onboarding.selectedGoalTypes])));
  const [targets, setTargets] = useState<Record<string, { target: number | null; years: number | null }>>(() =>
    Object.fromEntries(state.data.goals.map((g) => [g.type, { target: g.target, years: g.targetDate ? new Date(g.targetDate).getFullYear() - new Date().getFullYear() : null }])),
  );
  const save = () =>
    actions.mutate((s) => {
      s.onboarding.selectedGoalTypes = sel;
      s.data.goals = s.data.goals.filter((g) => sel.includes(g.type));
      for (const t of sel) {
        const info = targets[t] ?? { target: null, years: null };
        const date = info.years ? new Date(new Date().getFullYear() + info.years, new Date().getMonth(), 1).toISOString() : null;
        const g = s.data.goals.find((x) => x.type === t);
        if (g) {
          g.target = info.target;
          g.targetDate = date;
        } else {
          s.data.goals.push({ id: uid('goal'), name: GOAL_OPTIONS.find((o) => o.value === t)!.label, type: t, target: info.target, startingAmount: 0, targetDate: date, priority: t === 'emergency' ? 'high' : 'medium', monthlyContribution: null, contributions: [], createdAt: nowISO(), updatedAt: nowISO() });
        }
      }
    });
  return (
    <OnbScreen step="goals" title="Goals" onSave={save}>
      <div className="stack">
        <h2 className="h2">What are you working towards?</h2>
        <p className="muted">Optional. Select any that apply. You can add details now or later.</p>
        <div className="chips">
          {GOAL_OPTIONS.map((o) => {
            const on = sel.includes(o.value);
            return (
              <button key={o.value} className={`chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => setSel(on ? sel.filter((x) => x !== o.value) : [...sel, o.value])}>
                {o.label}
              </button>
            );
          })}
        </div>
        {sel.map((t) => (
          <div key={t} className="card outline stack-sm">
            <span className="h3">{GOAL_OPTIONS.find((o) => o.value === t)!.label}</span>
            <div className="grid-2">
              <MoneyField label="Target amount" value={targets[t]?.target ?? null} onChange={(v) => setTargets({ ...targets, [t]: { ...(targets[t] ?? { years: null }), target: v } })} />
              <NumberField label="In how many years?" suffix="yrs" value={targets[t]?.years ?? null} onChange={(v) => setTargets({ ...targets, [t]: { ...(targets[t] ?? { target: null }), years: v === null ? null : Math.max(0, Math.round(v)) } })} />
            </div>
          </div>
        ))}
      </div>
    </OnbScreen>
  );
}

// ONB-10 ----------------------------------------------------------------------
const INSTITUTIONS = ['Sample Bank A · Savings', 'Sample Bank B · Credit card', 'Sample AMC · Mutual funds'];

function ConnectStep() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const { toast } = useFeedback();
  const nav = useStepNav('connect');
  const [mode, setMode] = useState<'choose' | 'consent' | 'connecting' | 'done'>(state.connections.length ? 'done' : 'choose');
  const [picked, setPicked] = useState<string[]>([INSTITUTIONS[0]]);
  const [agree, setAgree] = useState(false);
  const approve = () => {
    if (state.dev.offline) return navigate('/system/offline');
    setMode('connecting');
    setTimeout(() => {
      if (state.dev.failConnections) {
        setMode('consent');
        navigate('/system/connection-error?from=onboarding');
        return;
      }
      actions.mutate((s) => {
        for (const p of picked) {
          s.connections.push({ id: uid('conn'), institution: p.split(' · ')[0], accountType: p.split(' · ')[1], status: 'illustrative', consentGivenAt: nowISO(), lastSync: null, permissions: ['Account balance', 'Transaction summary (12 months)'] });
        }
      });
      setMode('done');
      toast('Illustrative connection created');
    }, 1200);
  };

  if (mode === 'consent' || mode === 'connecting')
    return (
      <Screen
        title="Consent"
        back
        onBack={() => setMode('choose')}
        footer={
          <button className="btn block" disabled={!agree || picked.length === 0 || mode === 'connecting'} onClick={approve}>
            {mode === 'connecting' ? 'Connecting…' : 'Approve consent'}
          </button>
        }
      >
        <div className="stack">
          <Banner tone="warn">Prototype only. No real Account Aggregator or bank connection is made, and no data is imported.</Banner>
          <h2 className="h2">Review what you're sharing</h2>
          <div className="card stack-sm">
            <KV k="Purpose" v="Personal financial overview" />
            <KV k="Data requested" v="Balances, transaction summary" />
            <KV k="Frequency" v="Once a day" />
            <KV k="Duration" v="12 months" />
            <KV k="Data retention" v="Until you revoke consent" />
          </div>
          <span className="h3 mt-8">Choose accounts</span>
          <OptionList multi value={picked} onChange={setPicked} options={INSTITUTIONS.map((i) => ({ value: i, label: i.split(' · ')[0], sub: i.split(' · ')[1] }))} />
          <Checkbox checked={agree} onChange={setAgree}>
            I consent to sharing the data above for the stated purpose. I can withdraw it at any time from Privacy and consent in Profile.
          </Checkbox>
        </div>
      </Screen>
    );

  return (
    <OnbScreen step="connect" title="Connect accounts" continueLabel={mode === 'done' ? 'Continue' : 'Continue manually'} onContinue={nav.next}>
      <div className="stack">
        <ShieldScene />
        <h2 className="h2">Keep your numbers up to date automatically</h2>
        <p className="muted">
          Where available, you can connect supported financial accounts through a consent-based integration. You choose which accounts, what data, and for how long, and you can revoke access at any time.
        </p>
        <div className="card stack-sm">
          <div className="row"><ShieldCheck size={18} /> <span>Read-only. We can never move money.</span></div>
          <div className="row"><Link2 size={18} /> <span>You approve each account individually.</span></div>
          <div className="row"><Building2 size={18} /> <span>Connected values are labelled "Connected".</span></div>
        </div>
        {mode === 'done' ? (
          <>
            <Banner tone="outline">
              {state.connections.length} illustrative connection{state.connections.length === 1 ? '' : 's'} created. In this prototype, no data is imported. Your figures stay as you entered them.
            </Banner>
            <List>
              {state.connections.map((c) => (
                <ListRow key={c.id} icon={Building2} title={c.institution} sub={`${c.accountType} · Illustrative`} />
              ))}
            </List>
          </>
        ) : (
          <button className="btn secondary block" onClick={() => setMode('consent')}>
            <Link2 size={18} /> Connect accounts
          </button>
        )}
      </div>
    </OnbScreen>
  );
}

// ONB-11 ----------------------------------------------------------------------
function ReviewStep() {
  const { state } = useApp();
  const f = useFinance();
  const nav = useStepNav('review');
  const d = state.data;
  const comp = profileCompleteness(d);
  const liquidAssets = d.assets.filter((a) => a.liquidity === 'liquid');
  const investments = d.assets.filter((a) => a.liquidity === 'market');
  const otherAssets = d.assets.filter((a) => a.liquidity === 'locked');
  const sum = (xs: Array<{ value: number | null }>) => xs.reduce((s, x) => s + (x.value ?? 0), 0);
  const sections: Array<{ title: string; step: OnboardingStep; value: ReactNode; detail: string; empty: boolean }> = [
    { title: 'Income', step: 'income', value: <Money value={f.income.value} />, detail: `${d.incomes.length} source(s) · per month`, empty: d.incomes.length === 0 },
    { title: 'Expenses', step: 'expenses', value: <Money value={f.expenses.value} />, detail: `${d.expenses.length} categories · per month`, empty: d.expenses.length === 0 },
    { title: 'Savings', step: 'savings', value: <Money value={sum(liquidAssets)} />, detail: `${liquidAssets.length} liquid account(s)`, empty: liquidAssets.length === 0 },
    { title: 'Investments', step: 'investments', value: <Money value={sum(investments)} />, detail: 'Your estimates', empty: investments.length === 0 },
    { title: 'Other assets', step: 'investments', value: <Money value={sum(otherAssets)} />, detail: 'Property, retirement', empty: otherAssets.length === 0 },
    { title: 'Liabilities', step: 'loans', value: <Money value={f.liabilities.value ?? 0} />, detail: `${d.liabilities.length} loan(s) · EMIs ${inr(f.emi.value ?? 0)}/mo`, empty: d.liabilities.length === 0 },
  ];
  return (
    <OnbScreen step="review" title="Review" continueLabel="Looks good" onContinue={nav.next}>
      <div className="stack">
        <h2 className="h2">Here's what you've told us</h2>
        <div className="card stack-sm">
          <div className="row-between">
            <span className="strong">Profile completeness</span>
            <span className="strong num">{Math.round(comp.score * 100)}%</span>
          </div>
          <ProgressBar value={comp.score} />
          <div className="chips mt-4">
            {comp.sections.map((s) => (
              <span key={s.name} className={`tag ${s.done ? 'dark' : 'dashed'}`}>{s.name}</span>
            ))}
          </div>
        </div>
        <List outline>
          {sections.map((s) => (
            <ListRow key={s.title} title={s.title} sub={s.empty ? 'Not provided' : s.detail} value={s.empty ? <span className="tag warn">Missing</span> : <strong>{s.value}</strong>} to={`/onboarding/${s.step}?return=review`} />
          ))}
        </List>
        {f.missing.length > 0 && (
          <Section title="Missing information">
            <div className="stack-sm">
              {f.missing.slice(0, 6).map((m) => (
                <Banner key={m.id} tone="outline">
                  <strong>{m.label}</strong>
                  <div className="caption">Affects: {m.affects.join(', ')}</div>
                </Banner>
              ))}
              <p className="caption">You can continue now. Missing information won't block you. Results that depend on it will be marked.</p>
            </div>
          </Section>
        )}
      </div>
    </OnbScreen>
  );
}

// ONB-12 ----------------------------------------------------------------------
function CompleteStep() {
  const { state, actions } = useApp();
  const f = useFinance();
  const navigate = useNavigate();
  const { toast } = useFeedback();
  const finish = (later: boolean) => {
    actions.setOnboarding({ completed: true, step: 'complete' });
    if (later) toast('You can complete your profile anytime from Profile');
    navigate('/home', { replace: true });
  };
  const understood = useMemo(
    () =>
      [
        f.income.value !== null && ['Monthly income', inr(f.income.value)],
        f.expenses.value !== null && ['Monthly expenses', inr(f.expenses.value)],
        f.emi.value ? ['Loan EMIs', inr(f.emi.value)] : null,
        f.surplus.value !== null && ['Estimated monthly surplus', inr(f.surplus.value)],
        f.liquid.value !== null && ['Liquid funds', inr(f.liquid.value)],
        f.netWorth.value !== null && ['Net worth', inr(f.netWorth.value)],
        state.data.goals.length ? ['Goals', String(state.data.goals.length)] : null,
      ].filter(Boolean) as Array<[string, string]>,
    [f, state.data.goals.length],
  );
  return (
    <Screen
      tone="ink"
      footer={
        <>
          <button className="btn block" onClick={() => finish(false)}>Explore my finances</button>
          <button className="btn ghost block" onClick={() => finish(true)}>Complete more details later</button>
        </>
      }
    >
      <div className="stack-lg" style={{ paddingTop: 0 }}>
        <div className="reveal"><SunriseScene /></div>
        <h1 className="h1">Your financial picture is taking shape.</h1>
        {understood.length ? (
          <div className="card" style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,.08)' }}>
            <p className="label mb-8">Here's what we understood (from your entries):</p>
            {understood.map(([k, v]) => (
              <KV key={k} k={k} v={v} />
            ))}
          </div>
        ) : (
          <Banner tone="outline">You haven't added financial details yet. You can still explore, and add information from Home or Profile.</Banner>
        )}
        {f.missing.length > 0 && <p className="muted" style={{ fontSize: 14 }}>{f.missing.length} item(s) are still missing. Calculations that depend on them will be marked as incomplete.</p>}
      </div>
    </Screen>
  );
}
