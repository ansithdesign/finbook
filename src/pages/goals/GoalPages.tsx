// GOAL-01 … GOAL-06.

import { Plus, Target, Trash2 } from '@/components/icons';
import { GOAL_ICON } from '@/components/topicIcons';
import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { KV, List, ListRow, Section, Shift } from '@/components/cards/Cards';
import { LineChart, PathToTarget } from '@/components/charts/Charts';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { Banner, EmptyState, Money, ProgressBar } from '@/components/feedback/States';
import { DateField, MoneyField, NumberField, Segmented, SelectField, TextField } from '@/components/forms/Fields';
import { Screen } from '@/components/layout/Screen';
import { allocateToGoals, calculateGoalContribution, calculateGoalProgress, goalSaved, monthsToReach, sortGoals } from '@/calculations/financial/goals';
import { baselineGoalCapacity, impactsFromSaved } from '@/features/goals/impact';
import { useApp } from '@/hooks/useAppState';
import type { Goal, GoalType, Priority } from '@/types';
import { fmtDate, fmtMonth, inr, pct, tenure } from '@/utils/format';
import { nowISO, uid } from '@/utils/id';

export const GOAL_TYPE_LABEL: Record<GoalType, string> = {
  emergency: 'Emergency fund',
  car: 'Car',
  house: 'House',
  marriage: 'Marriage',
  education: 'Education',
  travel: 'Travel',
  retirement: 'Retirement',
  other: 'Other',
};

function useGoal() {
  const { id } = useParams();
  const { state } = useApp();
  return state.data.goals.find((g) => g.id === id) ?? null;
}

function MissingGoal() {
  return (
    <Screen title="Goal" back="/goals">
      <EmptyState icon={Target} title="Goal not found" body="It may have been deleted." action={<Link to="/goals" className="btn sm">All goals</Link>} />
    </Screen>
  );
}

// GOAL-01
export function GoalsOverview() {
  const { state } = useApp();
  const navigate = useNavigate();
  const goals = sortGoals(state.data.goals);
  const capacity = baselineGoalCapacity(state);
  const alloc = capacity === null ? [] : allocateToGoals(goals, capacity);
  const totalNeeded = goals.reduce((s, g) => s + (g.monthlyContribution ?? calculateGoalContribution(g).required ?? 0), 0);
  const suggestions = (Object.keys(GOAL_TYPE_LABEL) as GoalType[]).filter((t) => t !== 'other' && !goals.some((g) => g.type === t));
  return (
    <Screen large title="Goals" actions={<Link to="/goals/new" className="icon-btn" aria-label="Create goal"><Plus size={24} /></Link>}>
      <div className="stat-grid mt-8">
        <div className="stat">
          <div className="label">Planned each month</div>
          <div className="v"><Money value={totalNeeded} /></div>
        </div>
        <div className="stat">
          <div className="label">Free each month</div>
          <div className="v"><Money value={capacity} /></div>
        </div>
      </div>
      {capacity !== null && totalNeeded > capacity && <div className="mt-12"><span className="level prepare">Be prepared</span><p className="caption mt-4">You've planned {inr(totalNeeded - capacity)} a month more than you have free. Lower-priority goals will fall behind first.</p></div>}
      {capacity === null && <p className="caption mt-8">Add income and expenses to see what's free for goals.</p>}

      <Section title="Your goals">
        {goals.length === 0 ? (
          <EmptyState icon={Target} title="No goals yet" body="Goals help you see whether decisions keep you on track." action={<Link to="/goals/new" className="btn sm">Create a goal</Link>} />
        ) : (
          <div className="stack-sm">
            {goals.map((g) => {
              const p = calculateGoalProgress(g);
              const req = calculateGoalContribution(g);
              const a = alloc.find((x) => x.goalId === g.id);
              return (
                <Link key={g.id} to={`/goals/${g.id}`} className="card goal-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div className="row" style={{ gap: 12 }}>
                    <span className="topic-badge">{(() => { const I = GOAL_ICON[g.type]; return <I size={20} weight="duotone" />; })()}</span>
                    <span className="flex-1" style={{ minWidth: 0 }}>
                      <span className="strong truncate" style={{ display: 'block' }}>{g.name}</span>
                      <span className="caption">{g.targetDate ? `By ${fmtMonth(g.targetDate)}` : 'No target date'}</span>
                    </span>
                    {a && a.onTrack === false ? <span className="level prepare">Behind</span> : p.progress !== null ? <span className="level ok">On pace</span> : null}
                  </div>
                  <div className="row-between mt-16" style={{ alignItems: 'baseline' }}>
                    <span className="mid-number" style={{ fontSize: 24 }}><Money value={p.saved} compact /></span>
                    <span className="caption">of {p.target === null ? 'no target yet' : <Money value={p.target} compact />}</span>
                  </div>
                  <div className="mt-8"><ProgressBar value={p.progress} /></div>
                  <div className="caption mt-8">{req.required === null ? req.reason : `${inr(req.required)} a month needed`}</div>
                </Link>
              );
            })}
          </div>
        )}
      </Section>
      {suggestions.length > 0 && (
        <Section title="Add a goal">
          <div className="chips">
            {suggestions.map((t) => (
              <button key={t} className="chip" onClick={() => navigate(`/goals/new?type=${t}`)}>
                {(() => { const I = GOAL_ICON[t]; return <I size={17} weight="duotone" />; })()} {GOAL_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </Section>
      )}
    </Screen>
  );
}

// GOAL-02 / GOAL-03
export function GoalForm() {
  const existing = useGoal();
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { toast, confirm } = useFeedback();
  const seed = (location.state as { seed?: Partial<Goal> & { months?: number } } | null)?.seed;
  const presetType = (params.get('type') as GoalType) ?? seed?.type ?? 'other';
  const contribSum = existing ? existing.contributions.reduce((s, c) => s + c.amount, 0) : 0;
  const initial = useMemo(() => {
    if (existing) return { ...existing, current: goalSaved(existing) as number | null };
    const d = new Date();
    const m = seed?.months ?? 24;
    return {
      id: uid('goal'),
      name: seed?.name ?? (presetType === 'other' ? '' : GOAL_TYPE_LABEL[presetType] + (presetType === 'emergency' ? '' : ' fund')),
      type: presetType,
      target: seed?.target ?? null,
      startingAmount: 0,
      targetDate: new Date(d.getFullYear(), d.getMonth() + m, 1).toISOString(),
      priority: (presetType === 'emergency' ? 'high' : 'medium') as Priority,
      monthlyContribution: null,
      contributions: [],
      createdAt: nowISO(),
      updatedAt: nowISO(),
      origin: seed?.origin,
      current: 0 as number | null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);
  const [g, setG] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const set = (p: Partial<typeof g>) => setG({ ...g, ...p });
  const draftGoal: Goal = { ...g, startingAmount: Math.max(0, (g.current ?? 0) - contribSum) };
  const req = calculateGoalContribution(draftGoal);
  const horizonMonths = g.targetDate ? Math.max(0, Math.round((new Date(g.targetDate).getTime() - Date.now()) / (30.44 * 86400000))) : null;
  const errors = {
    name: g.name.trim() ? null : 'Goal name is required.',
    target: g.target === null ? 'Target amount is required.' : g.target <= 0 ? 'Target must be more than zero.' : null,
    date: g.targetDate && new Date(g.targetDate) < new Date() ? 'Target date must be in the future.' : null,
    current: g.current !== null && g.target !== null && g.current > g.target ? 'Current savings exceed the target.' : null,
  };
  const valid = !errors.name && !errors.target && !errors.date;
  const dirty = JSON.stringify(g) !== JSON.stringify(initial);
  const save = () => {
    setSubmitted(true);
    if (!valid) return toast('Please fix the highlighted fields', 'error');
    const { current: _c, ...rest } = g;
    void _c;
    actions.upsertGoal({ ...rest, startingAmount: draftGoal.startingAmount });
    toast(existing ? 'Goal updated' : 'Goal created');
    if (existing) navigate(-1);
    else navigate(`/goals/${g.id}`, { replace: true });
  };
  const capacity = baselineGoalCapacity(state);
  return (
    <Screen
      title={existing ? 'Configure goal' : 'Create goal'}
      back
      onBack={async () => {
        if (dirty && !(await confirm({ title: 'Discard changes?', confirmLabel: 'Discard', danger: true }))) return;
        navigate(-1);
      }}
      footer={<button className="btn block" onClick={save}>{existing ? 'Save goal' : 'Create goal'}</button>}
    >
      <div className="stack">
        {g.origin && <Banner tone="outline">Created from a saved {g.origin.kind}. Values are pre-filled and editable.</Banner>}
        <TextField label="Goal name" value={g.name} onChange={(v) => set({ name: v })} error={submitted ? errors.name : null} />
        <SelectField label="Goal type" value={g.type} onChange={(v) => set({ type: v })} options={(Object.keys(GOAL_TYPE_LABEL) as GoalType[]).map((t) => ({ value: t, label: GOAL_TYPE_LABEL[t] }))} />
        <MoneyField label="Target amount" value={g.target} onChange={(v) => set({ target: v })} error={submitted ? errors.target : null} />
        <MoneyField label="Current amount saved" value={g.current} onChange={(v) => set({ current: v })} error={errors.current} help={existing && contribSum ? `Includes ${inr(contribSum)} of recorded contributions.` : 'Money already set aside for this goal.'} />
        <div className="grid-2">
          <DateField label="Target date" value={g.targetDate} onChange={(v) => set({ targetDate: v })} error={submitted ? errors.date : null} />
          <NumberField
            label="Time horizon"
            suffix="months"
            value={horizonMonths}
            onChange={(v) => {
              if (v === null) return;
              const d = new Date();
              set({ targetDate: new Date(d.getFullYear(), d.getMonth() + Math.max(1, Math.round(v)), 1).toISOString() });
            }}
          />
        </div>
        <Segmented label="Priority" value={g.priority} onChange={(v) => set({ priority: v })} options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
        <MoneyField
          label="Planned monthly contribution"
          value={g.monthlyContribution}
          onChange={(v) => set({ monthlyContribution: v })}
          help={req.required !== null ? `To reach the target on time you'd need about ${inr(req.required)} a month.` : req.reason}
        />
        {req.required !== null && g.monthlyContribution === null && (
          <button className="btn secondary sm" style={{ alignSelf: 'flex-start' }} onClick={() => set({ monthlyContribution: req.required })}>
            Use {inr(req.required)} a month
          </button>
        )}
        {g.monthlyContribution !== null && req.required !== null && g.monthlyContribution < req.required && (
          <Banner tone="warn">At {inr(g.monthlyContribution)} a month, you'd reach the target in about {tenure(monthsToReach(draftGoal, g.monthlyContribution))}, later than planned.</Banner>
        )}
        {capacity !== null && <p className="caption">Your current estimated surplus after SIPs is {inr(capacity)} a month. No investment returns are assumed for goal savings.</p>}
      </div>
    </Screen>
  );
}

// GOAL-04
export function GoalDetail() {
  const g = useGoal();
  const { actions } = useApp();
  const navigate = useNavigate();
  const { openSheet, toast, confirm } = useFeedback();
  if (!g) return <MissingGoal />;
  const p = calculateGoalProgress(g);
  const req = calculateGoalContribution(g);
  const onTrack = req.required === null || g.monthlyContribution === null ? null : g.monthlyContribution >= req.required;
  const addContribution = () =>
    openSheet('Add contribution', (close) => <ContributionForm onSubmit={(amount, note) => {
      actions.addContribution(g.id, { amount, note, date: nowISO() });
      toast('Contribution added');
      close();
    }} />);
  return (
    <Screen
      title={g.name}
      back="/goals"
      actions={<Link to={`/goals/${g.id}/edit`} className="link-btn" style={{ padding: '0 8px' }}>Edit</Link>}
      footer={<button className="btn block" onClick={addContribution}><Plus size={18} /> Add contribution</button>}
    >
      <div className="tile ink reveal">
        <div className="row-between">
          <span className="label">{GOAL_TYPE_LABEL[g.type]} · {g.priority} priority</span>
          <span className="delta">{p.progress === null ? 'No target' : pct(p.progress)}</span>
        </div>
        <div className="display-num mt-8" style={{ fontSize: 52 }}><Money value={p.saved} animate /></div>
        <div className="caption mt-4">saved of {p.target === null ? 'no target set' : inr(p.target)}{req.monthsLeft !== null ? ` · ${req.monthsLeft} months left` : ''}</div>
        <div className="mt-16"><ProgressBar value={p.progress} /></div>
      </div>
      {p.target !== null && g.targetDate && req.monthsLeft !== null && (
        <div className="card mt-12 reveal d1">
          <div className="row-between mb-8"><span className="strong">Path to target</span><span className="caption">no returns assumed</span></div>
          <PathToTarget saved={p.saved} target={p.target} months={Math.max(1, req.monthsLeft)} planned={g.monthlyContribution} required={req.required} />
        </div>
      )}
      <div className="card mt-12">
        <KV k="Target amount" v={<Money value={p.target} />} />
        <KV k="Current savings" v={<Money value={p.saved} />} />
        <KV k="Remaining" v={<Money value={p.remaining} />} />
        <KV k="Target date" v={g.targetDate ? fmtDate(g.targetDate) : 'Not set'} />
        <KV k="Months left" v={req.monthsLeft ?? '—'} />
        <KV k="Required per month" v={req.required === null ? req.reason : inr(req.required)} />
        <KV k="Planned per month" v={g.monthlyContribution === null ? 'Not set' : inr(g.monthlyContribution)} />
      </div>
      {onTrack === false && <div className="mt-12"><Banner tone="warn">Your planned contribution is {inr((req.required ?? 0) - (g.monthlyContribution ?? 0))} short of what's needed each month to reach the target on time.</Banner></div>}
      {onTrack === true && <div className="mt-12"><Banner>At your planned contribution, you're on track for the target date.</Banner></div>}
      <Section>
        <List>
          <ListRow title="Progress and contributions" sub={`${g.contributions.length} contribution(s)`} to={`/goals/${g.id}/progress`} />
          <ListRow title="Impact of decisions and scenarios" sub="How saved choices affect this goal" to={`/goals/${g.id}/impact`} />
          <ListRow title="Configure goal" to={`/goals/${g.id}/edit`} />
        </List>
      </Section>
      <Section>
        <button
          className="btn danger block"
          onClick={async () => {
            if (!(await confirm({ title: `Delete ${g.name}?`, body: 'Its contribution history will also be removed.', confirmLabel: 'Delete', danger: true }))) return;
            actions.deleteGoal(g.id);
            toast('Goal deleted');
            navigate('/goals', { replace: true });
          }}
        >
          <Trash2 size={18} /> Delete goal
        </button>
      </Section>
    </Screen>
  );
}

function ContributionForm({ onSubmit }: { onSubmit: (amount: number, note?: string) => void }) {
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="stack">
      <MoneyField label="Amount" value={amount} onChange={(v) => (setAmount(v), setErr(null))} error={err} />
      <TextField label="Note (optional)" value={note} onChange={setNote} />
      <p className="caption">Records money you've set aside. It doesn't move any money.</p>
      <button className="btn block" onClick={() => (!amount || amount <= 0 ? setErr('Enter an amount greater than zero.') : onSubmit(amount, note || undefined))}>
        Add contribution
      </button>
    </div>
  );
}

// GOAL-05
export function GoalProgressPage() {
  const g = useGoal();
  if (!g) return <MissingGoal />;
  const p = calculateGoalProgress(g);
  const sorted = [...g.contributions].sort((a, b) => a.date.localeCompare(b.date));
  let running = g.startingAmount;
  const series = [g.startingAmount, ...sorted.map((c) => (running += c.amount))];
  return (
    <Screen title="Goal progress" back>
      <div className="card">
        <div className="row-between"><span className="label">Progress</span><span className="mid-number">{p.progress === null ? '—' : pct(p.progress)}</span></div>
        <div className="mt-8"><ProgressBar value={p.progress} /></div>
        <div className="grid-2 mt-12">
          <div><div className="label">Saved</div><strong><Money value={p.saved} /></strong></div>
          <div><div className="label">Remaining</div><strong><Money value={p.remaining} /></strong></div>
        </div>
      </div>
      <Section title="Progress history">
        {sorted.length >= 2 ? (
          <LineChart series={[{ label: 'Saved', values: series }]} xLabels={['Start', ...sorted.map((c) => new Date(c.date).toLocaleDateString('en-IN', { month: 'short' }))]} />
        ) : (
          <Banner tone="outline">History appears after at least two contributions are recorded.</Banner>
        )}
      </Section>
      <Section title="Contributions">
        <List>
          <ListRow title="Starting amount" value={<Money value={g.startingAmount} />} />
          {[...sorted].reverse().map((c) => (
            <ListRow key={c.id} title={inr(c.amount)} sub={`${fmtDate(c.date)}${c.note ? ' · ' + c.note : ''}`} />
          ))}
        </List>
      </Section>
    </Screen>
  );
}

// GOAL-06
export function GoalImpact() {
  const g = useGoal();
  const { state } = useApp();
  if (!g) return <MissingGoal />;
  const impacts = impactsFromSaved(state)
    .map((i) => ({ ...i, row: i.rows.find((r) => r.goalId === g.id) }))
    .filter((i) => i.row);
  const capacity = baselineGoalCapacity(state);
  return (
    <Screen title="Goal impact" back>
      <div className="stack">
        <h2 className="h2">{g.name}</h2>
        <p className="muted" style={{ fontSize: 14 }}>
          How saved decisions and scenarios change what's available for this goal. Goals are funded in priority order from your monthly surplus after SIPs ({inr(capacity)} today).
        </p>
        {impacts.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No saved decisions or scenarios yet"
            body="Save a decision or scenario to see how it affects this goal."
            action={
              <div className="row">
                <Link to="/decide" className="btn sm">Explore a decision</Link>
                <Link to="/simulate" className="btn sm secondary">Run a scenario</Link>
              </div>
            }
          />
        ) : (
          impacts.map((i) => {
            const r = i.row!;
            const reduced = r.after.funded < r.before.funded;
            return (
              <div key={i.kind + i.id} className="card outline stack-sm">
                <div className="row-between">
                  <span className="strong">{i.title}</span>
                  <span className="tag">{i.kind}</span>
                </div>
                <span className="caption">{i.detail}</span>
                <p style={{ fontSize: 14 }}>
                  {reduced
                    ? `If you go ahead with this, your monthly contribution towards ${g.name} may need to decrease from ${inr(r.before.funded)} to ${inr(r.after.funded)}.`
                    : `This keeps your contribution towards ${g.name} at ${inr(r.after.funded)} a month.`}
                </p>
                <KV k="Available for goals" v={<Shift from={inr(i.before)} to={inr(i.after)} />} />
                <KV k="Funded for this goal" v={<Shift from={inr(r.before.funded)} to={inr(r.after.funded)} />} />
                <KV k="Time to reach target" v={`${tenure(r.before.monthsToTarget)} → ${r.after.monthsToTarget === null ? 'Not reachable at this rate' : tenure(r.after.monthsToTarget)}`} />
                {r.delayMonths !== null && r.delayMonths > 0 && <span className="tag warn" style={{ alignSelf: 'flex-start' }}>About {r.delayMonths} months later</span>}
                <Link to={i.kind === 'decision' ? `/decide/${i.id}` : `/simulate/${i.id}`} className="link-btn" style={{ alignSelf: 'flex-start' }}>Open {i.kind}</Link>
              </div>
            );
          })
        )}
        <Section title="Assumptions">
          <ul className="caption" style={{ paddingLeft: 18, margin: 0 }}>
            <li>Goals are funded in order of priority, then target date.</li>
            <li>No investment returns are assumed on goal savings.</li>
            <li>Uses the selected option for decisions (or option A if none is selected).</li>
          </ul>
        </Section>
      </div>
    </Screen>
  );
}
