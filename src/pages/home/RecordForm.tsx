// HOME-11 Add financial record / HOME-12 Edit financial record (income, expense, asset, liability, commitment).

import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { Banner } from '@/components/feedback/States';
import { DateField, MoneyField, NumberField, Segmented, SelectField, TextField, ToggleRow } from '@/components/forms/Fields';
import { Screen } from '@/components/layout/Screen';
import { calculateEmi } from '@/calculations/financial/loans';
import { RECORD_COLLECTION, RECORD_LABEL, useApp } from '@/hooks/useAppState';
import type { Asset, AssetCategory, Commitment, Expense, IncomeSource, Liability, LiabilityType, RecordKind } from '@/types';
import { inr } from '@/utils/format';
import { nowISO, uid } from '@/utils/id';
import { validateAmount } from '@/utils/validation';

const KINDS: RecordKind[] = ['income', 'expense', 'asset', 'liability', 'commitment'];
type AnyRecord = IncomeSource | Expense | Asset | Liability | Commitment;

const FREQ = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half-yearly', label: 'Half-yearly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

const ASSET_DEFAULTS: Record<AssetCategory, { liquidity: Asset['liquidity']; emergency: boolean }> = {
  savings: { liquidity: 'liquid', emergency: true },
  current: { liquidity: 'liquid', emergency: true },
  cash: { liquidity: 'liquid', emergency: true },
  fd: { liquidity: 'liquid', emergency: true },
  'liquid-other': { liquidity: 'liquid', emergency: true },
  'mutual-funds': { liquidity: 'market', emergency: false },
  stocks: { liquidity: 'market', emergency: false },
  gold: { liquidity: 'market', emergency: false },
  property: { liquidity: 'locked', emergency: false },
  retirement: { liquidity: 'locked', emergency: false },
  other: { liquidity: 'market', emergency: false },
};

function blank(kind: RecordKind, params: URLSearchParams): AnyRecord {
  const base = { id: uid(kind), source: 'manual' as const, updatedAt: nowISO() };
  switch (kind) {
    case 'income':
      return { ...base, name: '', kind: 'salary', amount: null, frequency: 'monthly', isAdditional: false };
    case 'expense':
      return { ...base, name: '', category: 'other', amount: null, frequency: 'monthly', essential: true };
    case 'asset':
      return { ...base, name: '', category: 'savings', value: null, liquidity: 'liquid', emergencyEligible: true };
    case 'liability':
      return { ...base, name: '', type: (params.get('type') as LiabilityType) ?? 'personal', outstanding: null, rate: null, emi: null, remainingMonths: null };
    case 'commitment': {
      const d = new Date();
      return { ...base, name: '', type: 'other', amount: null, nextDue: new Date(d.getFullYear(), d.getMonth() + 1, 1, 9).toISOString(), recurrence: 'monthly', linkedTo: null, status: 'upcoming' };
    }
  }
}

export function RecordForm() {
  const { kind: kindParam, id } = useParams();
  const [params] = useSearchParams();
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const { toast, confirm } = useFeedback();
  const kind = kindParam as RecordKind;
  const existing = useMemo(() => {
    if (!KINDS.includes(kind) || !id) return null;
    return (state.data[RECORD_COLLECTION[kind]] as AnyRecord[]).find((r) => r.id === id) ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, id]);
  const [initial] = useState<AnyRecord | null>(() => (KINDS.includes(kind) ? existing ?? blank(kind, params) : null));
  const [rec, setRec] = useState<AnyRecord | null>(initial);
  const [submitted, setSubmitted] = useState(false);

  if (!KINDS.includes(kind) || !rec) return <Navigate to="/home" replace />;
  if (id && !existing)
    return (
      <Screen title={RECORD_LABEL[kind]} back>
        <Banner tone="warn">This record no longer exists. It may have been deleted.</Banner>
      </Screen>
    );

  const isNew = !existing;
  const dirty = JSON.stringify(rec) !== JSON.stringify(initial);
  const set = (p: Partial<AnyRecord>) => setRec({ ...rec, ...p } as AnyRecord);

  const errors: Record<string, string | null> = { name: rec.name.trim() ? null : 'Name is required.' };
  if (kind === 'income') {
    const r = rec as IncomeSource;
    errors.amount = validateAmount(r.amount, { label: 'Amount' });
    if (r.min != null && r.max != null && r.min > r.max) errors.range = 'Lowest month cannot exceed highest month.';
  }
  if (kind === 'expense') errors.amount = validateAmount((rec as Expense).amount);
  if (kind === 'asset') errors.amount = validateAmount((rec as Asset).value, { label: 'Value' });
  if (kind === 'liability') {
    const r = rec as Liability;
    errors.rate = r.rate !== null && (r.rate < 0 || r.rate > 60) ? 'Enter a rate between 0 and 60%.' : null;
  }
  if (kind === 'commitment') errors.amount = validateAmount((rec as Commitment).amount, { required: true });
  const valid = Object.values(errors).every((e) => !e);
  const err = (k: string) => (submitted ? errors[k] ?? null : null);

  const leave = async () => {
    if (dirty && !(await confirm({ title: 'Discard changes?', body: 'Your edits to this record have not been saved.', confirmLabel: 'Discard', danger: true }))) return;
    navigate(-1);
  };
  const save = () => {
    setSubmitted(true);
    if (!valid) return toast('Please fix the highlighted fields', 'error');
    actions.upsertRecord(kind, { ...rec, name: rec.name.trim() } as never);
    toast(`${RECORD_LABEL[kind]} ${isNew ? 'added' : 'updated'}`);
    navigate(-1);
  };
  const remove = async () => {
    const ok = await confirm({
      title: `Delete ${rec.name || RECORD_LABEL[kind].toLowerCase()}?`,
      body: 'This removes it from your overview and all calculations. This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    actions.deleteRecord(kind, rec.id);
    toast(`${RECORD_LABEL[kind]} deleted`);
    navigate(-1);
  };

  const sourceToggle = (
    <Segmented
      label="How reliable is this figure?"
      value={rec.source === 'estimated' ? 'estimated' : 'manual'}
      onChange={(v) => set({ source: v })}
      options={[
        { value: 'manual', label: 'Exact (manual)' },
        { value: 'estimated', label: 'Estimate' },
      ]}
    />
  );

  return (
    <Screen
      title={`${isNew ? 'Add' : 'Edit'} ${RECORD_LABEL[kind].toLowerCase()}`}
      back
      onBack={leave}
      footer={
        <>
          <button className="btn block" onClick={save}>{isNew ? `Add ${RECORD_LABEL[kind].toLowerCase()}` : 'Save changes'}</button>
          {!isNew && (
            <button className="btn danger block" onClick={remove}>
              <Trash2 size={18} /> Delete
            </button>
          )}
        </>
      }
    >
      <div className="stack">
        {kind === 'income' && (() => {
          const r = rec as IncomeSource;
          const variable = r.kind === 'freelance' || r.kind === 'business' || r.kind === 'variable-salary';
          return (
            <>
              <TextField label="Name" value={r.name} onChange={(v) => set({ name: v })} placeholder="e.g. Salary, Rental income" error={err('name')} />
              <SelectField label="Type" value={r.kind} onChange={(v) => set({ kind: v } as Partial<IncomeSource>)} options={[
                { value: 'salary', label: 'Salary (fixed)' }, { value: 'variable-salary', label: 'Variable salary' }, { value: 'freelance', label: 'Freelance / project' },
                { value: 'business', label: 'Business' }, { value: 'rental', label: 'Rental' }, { value: 'interest', label: 'Interest / dividends' }, { value: 'other', label: 'Other' },
              ]} />
              <div className="grid-2">
                <MoneyField label={variable ? 'Typical amount' : 'Amount'} value={r.amount} onChange={(v) => set({ amount: v })} error={err('amount')} />
                <SelectField label="Frequency" value={r.frequency} onChange={(v) => set({ frequency: v })} options={[...FREQ]} />
              </div>
              {variable && (
                <div className="grid-2">
                  <MoneyField label="Lowest typical" value={r.min ?? null} onChange={(v) => set({ min: v } as Partial<IncomeSource>)} error={err('range')} />
                  <MoneyField label="Highest typical" value={r.max ?? null} onChange={(v) => set({ max: v } as Partial<IncomeSource>)} />
                </div>
              )}
              <div className="list"><ToggleRow label="Additional income" sub="Side income on top of your main income" on={r.isAdditional} onChange={(v) => set({ isAdditional: v } as Partial<IncomeSource>)} /></div>
              {sourceToggle}
            </>
          );
        })()}

        {kind === 'expense' && (() => {
          const r = rec as Expense;
          return (
            <>
              <TextField label="Name" value={r.name} onChange={(v) => set({ name: v })} error={err('name')} />
              <SelectField label="Category" value={r.category} onChange={(v) => set({ category: v } as Partial<Expense>)} options={[
                { value: 'housing', label: 'Housing / Rent' }, { value: 'food', label: 'Food and groceries' }, { value: 'transport', label: 'Transportation' }, { value: 'utilities', label: 'Utilities' },
                { value: 'lifestyle', label: 'Lifestyle' }, { value: 'healthcare', label: 'Healthcare' }, { value: 'education', label: 'Education' }, { value: 'family', label: 'Family responsibilities' },
                { value: 'insurance', label: 'Insurance' }, { value: 'subscriptions', label: 'Subscriptions' }, { value: 'other', label: 'Other' },
              ]} />
              <div className="grid-2">
                <MoneyField label="Amount" value={r.amount} onChange={(v) => set({ amount: v })} error={err('amount')} />
                <SelectField label="Frequency" value={r.frequency} onChange={(v) => set({ frequency: v })} options={[...FREQ]} />
              </div>
              <Segmented label="Type" value={r.essential ? 'e' : 'd'} onChange={(v) => set({ essential: v === 'e' } as Partial<Expense>)} options={[{ value: 'e', label: 'Essential' }, { value: 'd', label: 'Discretionary' }]} />
              <p className="caption">Don't add loan EMIs as expenses — add the loan as a liability so the EMI is counted once.</p>
              {sourceToggle}
            </>
          );
        })()}

        {kind === 'asset' && (() => {
          const r = rec as Asset;
          return (
            <>
              <TextField label="Name" value={r.name} onChange={(v) => set({ name: v })} error={err('name')} />
              <SelectField
                label="Category"
                value={r.category}
                onChange={(v) => set({ category: v, liquidity: ASSET_DEFAULTS[v].liquidity, emergencyEligible: ASSET_DEFAULTS[v].emergency } as Partial<Asset>)}
                options={Object.keys(ASSET_DEFAULTS).map((k) => ({ value: k as AssetCategory, label: k.replace('-', ' ').replace(/^\w/, (c) => c.toUpperCase()) }))}
              />
              <MoneyField label="Current value" value={r.value} onChange={(v) => set({ value: v } as Partial<Asset>)} error={err('amount')} help="Leave blank if unknown — it will be flagged as missing, not counted as zero." />
              <SelectField label="How accessible is it?" value={r.liquidity} onChange={(v) => set({ liquidity: v } as Partial<Asset>)} options={[
                { value: 'liquid', label: 'Liquid — usable within days' }, { value: 'market', label: 'Market-linked — sellable, value fluctuates' }, { value: 'locked', label: 'Locked — property, retirement' },
              ]} />
              <div className="list"><ToggleRow label="Count towards emergency reserve" on={r.emergencyEligible} onChange={(v) => set({ emergencyEligible: v } as Partial<Asset>)} /></div>
              {sourceToggle}
            </>
          );
        })()}

        {kind === 'liability' && (() => {
          const r = rec as Liability;
          const derived = r.emi === null && r.outstanding && r.rate !== null && r.remainingMonths ? Math.round(calculateEmi(r.outstanding, r.rate, r.remainingMonths)) : null;
          return (
            <>
              <TextField label="Name" value={r.name} onChange={(v) => set({ name: v })} error={err('name')} />
              <SelectField label="Type" value={r.type} onChange={(v) => set({ type: v } as Partial<Liability>)} options={[
                { value: 'home', label: 'Home loan' }, { value: 'vehicle', label: 'Vehicle loan' }, { value: 'personal', label: 'Personal loan' },
                { value: 'education', label: 'Education loan' }, { value: 'credit-card', label: 'Credit card outstanding' }, { value: 'other', label: 'Other' },
              ]} />
              <MoneyField label="Outstanding amount" value={r.outstanding} onChange={(v) => set({ outstanding: v } as Partial<Liability>)} />
              {r.type !== 'credit-card' && (
                <>
                  <div className="grid-2">
                    <NumberField label="Interest rate" suffix="% p.a." value={r.rate} onChange={(v) => set({ rate: v } as Partial<Liability>)} error={err('rate')} placeholder="If known" />
                    <NumberField label="Remaining" suffix="months" value={r.remainingMonths} onChange={(v) => set({ remainingMonths: v === null ? null : Math.round(v) } as Partial<Liability>)} placeholder="If known" />
                  </div>
                  <MoneyField label="Monthly EMI" value={r.emi} onChange={(v) => set({ emi: v } as Partial<Liability>)} help={derived ? `Estimated from loan details: ${inr(derived)}` : 'If unknown, add rate and tenure to estimate it.'} />
                </>
              )}
              {sourceToggle}
            </>
          );
        })()}

        {kind === 'commitment' && (() => {
          const r = rec as Commitment;
          const linkOptions = [
            { value: '', label: 'Not linked — count separately' },
            ...state.data.expenses.map((e) => ({ value: `expense:${e.id}`, label: `Expense: ${e.name}` })),
            ...state.data.liabilities.map((l) => ({ value: `liability:${l.id}`, label: `Loan: ${l.name}` })),
          ];
          return (
            <>
              <TextField label="Name" value={r.name} onChange={(v) => set({ name: v })} error={err('name')} />
              <SelectField label="Type" value={r.type} onChange={(v) => set({ type: v } as Partial<Commitment>)} options={[
                { value: 'emi', label: 'EMI' }, { value: 'rent', label: 'Rent' }, { value: 'insurance', label: 'Insurance premium' }, { value: 'credit-card', label: 'Credit card payment' },
                { value: 'sip', label: 'SIP / investment' }, { value: 'school-fees', label: 'School fees' }, { value: 'other', label: 'Other' },
              ]} />
              <div className="grid-2">
                <MoneyField label="Amount" value={r.amount} onChange={(v) => set({ amount: v } as Partial<Commitment>)} error={err('amount')} />
                <SelectField label="Recurrence" value={r.recurrence} onChange={(v) => set({ recurrence: v } as Partial<Commitment>)} options={[...FREQ, { value: 'once', label: 'One-time' }]} />
              </div>
              <DateField label="Next due date" value={r.nextDue} onChange={(v) => v && set({ nextDue: v } as Partial<Commitment>)} />
              <SelectField
                label="Already counted in…"
                value={r.linkedTo ? `${r.linkedTo.kind}:${r.linkedTo.id}` : ''}
                onChange={(v) => set({ linkedTo: v ? { kind: v.split(':')[0] as 'expense' | 'liability', id: v.split(':')[1] } : null } as Partial<Commitment>)}
                options={linkOptions}
              />
              <p className="caption">Linking avoids double-counting: a linked rent or EMI is not subtracted from your surplus a second time. SIPs are treated as investing, not spending.</p>
              <Segmented label="Status" value={r.status} onChange={(v) => set({ status: v } as Partial<Commitment>)} options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'paid', label: 'Paid' }, { value: 'overdue', label: 'Overdue' }]} />
            </>
          );
        })()}
        {!isNew && <p className="caption">Last updated {new Date(rec.updatedAt).toLocaleString('en-IN')}</p>}
      </div>
    </Screen>
  );
}
