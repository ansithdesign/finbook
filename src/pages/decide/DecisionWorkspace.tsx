// DEC-05 Decision workspace (also DEC-10 when reopened), DEC-06 Alternatives, DEC-07 Explanation.

import { Bookmark, BookmarkCheck, Check, LineChart as LineIcon, SlidersHorizontal, Target, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Expandable, KV, List, ListRow, Section } from '@/components/cards/Cards';
import { DotPlot, LineChart } from '@/components/charts/Charts';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { Banner, Loading } from '@/components/feedback/States';
import { SliderField } from '@/components/forms/Fields';
import { Screen } from '@/components/layout/Screen';
import { visibleQuestions, type DecisionAnalysis, type DecisionOption } from '@/intelligence';
import type { SafeSpendExtras } from '@/intelligence/analyses/safeSpend';
import { useApp } from '@/hooks/useAppState';
import type { Decision } from '@/types';
import { inr, monthLabelFromNow, tenure } from '@/utils/format';
import {
  allQuestions,
  alternativeSettings,
  formatMetric,
  MissingDecision,
  QuestionInput,
  STATUS_LABEL,
  useDecision,
  useOpenInSimulator,
  validateQuestion,
} from '@/features/decisions/shared';

const KEY_METRICS: Record<string, string[]> = {
  car: ['emi', 'surplus', 'liquid', 'coverage', 'interest'],
  prepay: ['interest', 'saved', 'tenure', 'invest'],
  'safe-spend': ['net', 'end', 'min', 'coverage'],
};

function useDecisionActions(decision: Decision) {
  const { actions } = useApp();
  const { toast, confirm, openSheet } = useFeedback();
  const navigate = useNavigate();
  const { state } = useApp();
  return {
    save: () => {
      actions.upsertDecision({ ...decision, saved: !decision.saved });
      toast(decision.saved ? 'Removed from saved decisions' : 'Decision saved');
    },
    choose: (key: string) => {
      actions.upsertDecision({ ...decision, chosenOption: decision.chosenOption === key ? null : key });
      toast(decision.chosenOption === key ? 'Selection cleared' : `Option ${key} selected`);
    },
    complete: () => {
      actions.upsertDecision({ ...decision, status: decision.status === 'completed' ? 'in-progress' : 'completed', saved: true });
      toast(decision.status === 'completed' ? 'Decision reopened' : 'Marked as decided and saved');
    },
    remove: async () => {
      if (!(await confirm({ title: 'Delete this decision?', body: 'Its answers and selection will be removed.', confirmLabel: 'Delete', danger: true }))) return;
      actions.deleteDecision(decision.id);
      toast('Decision deleted');
      navigate('/decide', { replace: true });
    },
    toGoal: (opt: DecisionOption) => {
      if (!opt.goalSeed) return toast('This option does not need a savings goal', 'error');
      navigate('/goals/new', { state: { seed: { ...opt.goalSeed, origin: { kind: 'decision', id: decision.id } } } });
    },
    editAssumptions: () =>
      openSheet('Edit assumptions', (close) => (
        <AssumptionEditor
          decision={decision}
          onApply={(inputs) => {
            actions.upsertDecision({ ...decision, inputs });
            toast('Assumptions updated — results recalculated');
            close();
          }}
          questions={[...visibleQuestions(allQuestions(decision, state), decision.inputs), ...alternativeSettings(decision.intent)]}
        />
      )),
  };
}

function AssumptionEditor({ decision, questions, onApply }: { decision: Decision; questions: ReturnType<typeof alternativeSettings>; onApply: (i: Decision['inputs']) => void }) {
  const [inputs, setInputs] = useState(decision.inputs);
  const errors = Object.fromEntries(questions.map((q) => [q.key, validateQuestion(q, inputs[q.key])]));
  const valid = Object.values(errors).every((e) => !e);
  return (
    <div className="stack">
      {questions.map((q) => (
        <QuestionInput key={q.key} q={q} value={inputs[q.key]} onChange={(v) => setInputs({ ...inputs, [q.key]: v })} error={errors[q.key]} />
      ))}
      <button className="btn block" disabled={!valid} onClick={() => onApply(inputs)}>Apply and recalculate</button>
    </div>
  );
}

function OptionSummary({ opt, intent, chosen }: { opt: DecisionOption; intent: string; chosen: boolean }) {
  const { state } = useApp();
  const keys = KEY_METRICS[intent] ?? [];
  return (
    <div className={`card outline ${chosen ? 'selected' : ''}`}>
      <div className="row-between">
        <span className="strong">{opt.label}</span>
        {chosen && <span className="tag dark"><Check size={12} /> Selected</span>}
        {!opt.feasible && <span className="tag warn">Not feasible</span>}
      </div>
      <p className="caption mt-4">{opt.summary}</p>
      {opt.feasible ? (
        <div className="mt-8">
          {opt.metrics.filter((m) => keys.includes(m.key)).map((m) => <KV key={m.key} k={m.label} v={formatMetric(m, state.prefs.hideBalances)} />)}
        </div>
      ) : (
        <p className="caption warn-text mt-8">{opt.infeasibleReason}</p>
      )}
    </div>
  );
}

function SafeSpendPanel({ decision, analysis }: { decision: Decision; analysis: DecisionAnalysis }) {
  const { actions } = useApp();
  const ex = (analysis as DecisionAnalysis & { extras?: SafeSpendExtras }).extras;
  if (!ex) return null;
  const planned = Number(decision.inputs.plannedDiscretionary ?? 0);
  return (
    <>
      <Section title="Safe spending estimate">
        <div className="card">
          {ex.conservative === null ? (
            <>
              <div className="label">Typical month only</div>
              <div className="mid-number">{inr(ex.typical)}</div>
              <p className="caption warn-text mt-4">Not a safe estimate: add your lowest typical month to get a range.</p>
              <Link to={`/decide/${decision.id}/clarify`} className="link-btn">Add lowest month</Link>
            </>
          ) : (
            <>
              <div className="label">Discretionary spending per month</div>
              <div className="mid-number">{inr(ex.conservative)} – {inr(ex.typical)}</div>
              <p className="caption mt-4">Lower figure is safe in low months; the upper only in average months.</p>
            </>
          )}
          <div className="mt-8">
            <KV k="Essential commitments" v={inr(ex.essentialCore)} />
            <KV k="Suggested reserve target" v={inr(ex.reserveTarget)} />
            <KV k="Reserve gap" v={inr(ex.reserveGap)} />
            <KV k="Monthly reserve top-up (12 months)" v={inr(ex.reserveTopUp)} />
          </div>
        </div>
      </Section>
      <Section title="Impact of discretionary spending">
        <div className="card outline stack">
          <SliderField
            label="Planned discretionary spending"
            value={planned}
            min={0}
            max={Math.max(60000, planned * 2)}
            step={1000}
            format={inr}
            onChange={(v) => actions.upsertDecision({ ...decision, inputs: { ...decision.inputs, plannedDiscretionary: v } })}
          />
          <LineChart
            series={[
              { label: 'Average', values: ex.scenarioRows.average },
              { label: 'Low months', values: ex.scenarioRows.low },
              { label: 'Unexpected expense', values: ex.scenarioRows.unexpected },
            ]}
            xLabels={ex.scenarioRows.average.map((_, i) => monthLabelFromNow(i + 1))}
          />
          <p className="caption">Projected liquid funds over 12 months. Estimates based on your inputs; not a forecast.</p>
        </div>
      </Section>
    </>
  );
}

// DEC-05 / DEC-10
export function DecisionWorkspace() {
  const { decision, analysis } = useDecision();
  if (!decision || !analysis) return <MissingDecision />;
  return <WorkspaceView decision={decision} analysis={analysis} />;
}

function WorkspaceView({ decision, analysis }: { decision: Decision; analysis: DecisionAnalysis }) {
  const [params, setParams] = useSearchParams();
  const [calculating, setCalculating] = useState(params.get('calc') === '1');
  const openInSim = useOpenInSimulator();
  const act = useDecisionActions(decision);
  useEffect(() => {
    if (!calculating) return;
    const t = setTimeout(() => {
      setCalculating(false);
      setParams({}, { replace: true });
    }, 900);
    return () => clearTimeout(t);
  }, [calculating, setParams]);
  if (calculating)
    return (
      <Screen title="Decision" back>
        <Loading label="Comparing your options…" sub="Running EMI, cash-flow, reserve and goal calculations." />
      </Screen>
    );
  const chosen = analysis.options.find((o) => o.key === decision.chosenOption) ?? null;
  const focus = chosen ?? analysis.options[0];
  return (
    <Screen
      title="Decision"
      back="/decide"
      actions={
        <button className="icon-btn" aria-label={decision.saved ? 'Unsave decision' : 'Save decision'} onClick={act.save}>
          {decision.saved ? <BookmarkCheck size={22} /> : <Bookmark size={22} />}
        </button>
      }
      footer={
        analysis.ok ? (
          <div className="row">
            <Link to={`/decide/${decision.id}/alternatives`} className="btn flex-1">Compare alternatives</Link>
            <button className="btn secondary" onClick={act.save}>{decision.saved ? 'Saved' : 'Save'}</button>
          </div>
        ) : undefined
      }
    >
      <div className="stack">
        <div className="row wrap" style={{ gap: 6 }}>
          <span className="tag">{STATUS_LABEL[decision.status]}</span>
          {decision.saved && <span className="tag dark">Saved</span>}
          {chosen && <span className="tag">Option {chosen.key} selected</span>}
        </div>
        <h2 className="h2">{decision.title}</h2>
        <div><div className="label">Objective</div><p className="mt-4">{decision.question}</p></div>

        {!analysis.ok ? (
          <>
            <Banner tone="warn">
              <strong>{analysis.headline}</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{analysis.blockers.map((b) => <li key={b}>{b}</li>)}</ul>
            </Banner>
            <Link to={`/decide/${decision.id}/clarify`} className="btn secondary">Answer missing questions</Link>
            <Link to="/profile/completeness" className="btn ghost">Complete my profile</Link>
          </>
        ) : (
          <>
            <div className="card">
              <div className="label">Summary</div>
              <p className="strong mt-4">{analysis.headline}</p>
              <ul className="mt-8" style={{ paddingLeft: 18, margin: '8px 0 0', fontSize: 14 }}>
                {analysis.findings.slice(0, 3).map((f) => <li key={f} style={{ marginBottom: 4 }}>{f}</li>)}
              </ul>
              <Link to={`/decide/${decision.id}/explanation`} className="link-btn">Read the full explanation</Link>
            </div>
            {analysis.limitations.length > 0 && <Banner tone="warn">{analysis.limitations.join(' ')}</Banner>}

            {decision.intent === 'safe-spend' && <SafeSpendPanel decision={decision} analysis={analysis} />}

            <Section title="Primary assumptions" action={<button className="link-btn" onClick={act.editAssumptions}><SlidersHorizontal size={14} /> Edit</button>}>
              <div className="card outline">
                {analysis.assumptions.slice(0, 3).map((a) => <p key={a} className="caption" style={{ padding: '4px 0' }}>• {a}</p>)}
              </div>
            </Section>

            {decision.intent !== 'safe-spend' && focus && (
              <Section title={chosen ? `Your selected option` : 'Key metrics (option A)'}>
                <OptionSummary opt={focus} intent={decision.intent} chosen={!!chosen} />
              </Section>
            )}

            <Section title="Alternatives" action={<Link to={`/decide/${decision.id}/alternatives`} className="link-btn">Compare</Link>}>
              <List>
                {analysis.options.map((o) => (
                  <ListRow
                    key={o.key}
                    title={o.label}
                    sub={o.feasible ? o.summary : o.infeasibleReason}
                    value={o.key === decision.chosenOption ? <span className="tag dark">Selected</span> : !o.feasible ? <span className="tag warn">Not feasible</span> : undefined}
                    to={`/decide/${decision.id}/alternatives#${o.key}`}
                  />
                ))}
              </List>
            </Section>

            <Section title="Next steps">
              <List>
                <ListRow icon={LineIcon} title="Open in simulator" sub={`Explore ${focus.label.split(':')[0]} month by month`} onClick={() => openInSim(decision, focus)} />
                {focus.goalSeed && <ListRow icon={Target} title="Convert to a goal" sub={`${focus.goalSeed.name}: ${inr(focus.goalSeed.target)}`} onClick={() => act.toGoal(focus)} />}
                <ListRow icon={Check} title={decision.status === 'completed' ? 'Reopen decision' : 'Mark as decided'} sub="No money is moved — this only records your choice" onClick={act.complete} />
                <ListRow icon={SlidersHorizontal} title="Review context and answers" to={`/decide/${decision.id}/context`} />
              </List>
            </Section>
          </>
        )}
        <button className="btn danger mt-16" onClick={act.remove}><Trash2 size={18} /> Delete decision</button>
      </div>
    </Screen>
  );
}

// DEC-06
export function DecisionAlternatives() {
  const { decision, analysis } = useDecision();
  const { state } = useApp();
  if (!decision || !analysis) return <MissingDecision />;
  return <AlternativesView decision={decision} analysis={analysis} hidden={state.prefs.hideBalances} />;
}

function AlternativesView({ decision, analysis, hidden }: { decision: Decision; analysis: DecisionAnalysis; hidden: boolean }) {
  const act = useDecisionActions(decision);
  const openInSim = useOpenInSimulator();
  const opts = analysis.options;
  const feasible = opts.filter((o) => o.feasible);
  const metricKeys = opts[0]?.metrics.map((m) => m.key) ?? [];
  const best = (key: string) => {
    const m = opts[0]?.metrics.find((x) => x.key === key);
    if (!m || m.format === 'text' || m.lowerIsBetter === undefined && !['surplus', 'liquid', 'coverage', 'saved', 'invest', 'end', 'min', 'net'].includes(key)) return null;
    const vals = feasible.map((o) => ({ k: o.key, v: o.metrics.find((x) => x.key === key)?.value ?? null })).filter((x) => x.v !== null) as Array<{ k: string; v: number }>;
    if (vals.length < 2 || vals.every((x) => x.v === vals[0].v)) return null;
    const pick = m.lowerIsBetter ? vals.reduce((a, b) => (b.v < a.v ? b : a)) : vals.reduce((a, b) => (b.v > a.v ? b : a));
    return pick.k;
  };
  if (!analysis.ok)
    return (
      <Screen title="Alternatives" back>
        <Banner tone="warn">{analysis.blockers.join(' ')}</Banner>
      </Screen>
    );
  return (
    <Screen title="Alternatives" back footer={<Link to={`/decide/${decision.id}/explanation`} className="btn block">See trade-offs and explanation</Link>}>
      <div className="stack">
        <p className="muted" style={{ fontSize: 14 }}>
          Each dot is one option, placed on a shared scale. The ringed dot is the most favourable in that row, which is not a recommendation: priorities differ. Hollow dots are not feasible with current liquid funds.
        </p>
        <DotPlot
          rows={metricKeys
            .filter((k) => opts[0].metrics.find((m) => m.key === k)?.format !== 'text')
            .map((k) => {
              const m0 = opts[0].metrics.find((m) => m.key === k)!;
              const favourHigh = ['surplus', 'liquid', 'coverage', 'saved', 'invest', 'end', 'min', 'net'].includes(k);
              return {
                label: m0.label,
                lowerIsBetter: m0.lowerIsBetter ?? (favourHigh ? false : undefined),
                values: opts.map((o) => {
                  const m = o.metrics.find((x) => x.key === k)!;
                  return { key: o.key, value: m.value, display: formatMetric(m, hidden), feasible: o.feasible };
                }),
              };
            })
            .filter((r) => r.lowerIsBetter !== undefined)}
        />
        <Expandable title="Full comparison table">
        <div className="table-scroll">
          <table className="cmp">
            <thead>
              <tr>
                <th>Metric</th>
                {opts.map((o) => (
                  <th key={o.key}>{o.key}{!o.feasible && '*'}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricKeys.map((k) => {
                const b = best(k);
                return (
                  <tr key={k}>
                    <td>{opts[0].metrics.find((m) => m.key === k)!.label}</td>
                    {opts.map((o) => {
                      const m = o.metrics.find((x) => x.key === k)!;
                      return (
                        <td key={o.key} className={b === o.key ? 'best' : ''} style={{ opacity: o.feasible ? 1 : 0.5 }}>
                          {formatMetric(m, hidden)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </Expandable>
        {opts.some((o) => !o.feasible) && <p className="caption">* Not feasible with current liquid funds — shown for comparison.</p>}

        {opts.map((o) => (
          <div key={o.key} id={o.key} className={`card outline stack-sm ${decision.chosenOption === o.key ? 'selected' : ''}`}>
            <div className="row-between">
              <span className="strong">{o.label}</span>
              {!o.feasible && <span className="tag warn">Not feasible</span>}
            </div>
            <p className="caption">{o.summary}</p>
            {!o.feasible && <p className="caption warn-text">{o.infeasibleReason}</p>}
            {o.goalImpact.length > 0 && (
              <div className="caption">
                Goals: {o.goalImpact.map((g) => `${g.name} ${inr(g.before.funded)}→${inr(g.after.funded)}/mo${g.delayMonths && g.delayMonths > 0 ? ` (+${tenure(g.delayMonths)})` : ''}`).join('; ')}
              </div>
            )}
            <div className="row wrap" style={{ gap: 6 }}>
              <button className={`btn sm ${decision.chosenOption === o.key ? '' : 'secondary'}`} disabled={!o.feasible} onClick={() => act.choose(o.key)}>
                {decision.chosenOption === o.key ? <><Check size={14} /> Selected</> : 'Select this option'}
              </button>
              <button className="btn sm ghost" onClick={() => openInSim(decision, o)}>Simulate</button>
            </div>
          </div>
        ))}
        <Expandable title="View calculation details">
          {analysis.methodology.map((m) => <KV key={m.label} k={m.label} v={<span style={{ fontWeight: 400, fontSize: 12 }}>{m.formula}</span>} />)}
        </Expandable>
        <button className="btn secondary" onClick={act.editAssumptions}><SlidersHorizontal size={16} /> Edit assumptions</button>
      </div>
    </Screen>
  );
}

// DEC-07
export function DecisionExplanation() {
  const { decision, analysis } = useDecision();
  if (!decision || !analysis) return <MissingDecision />;
  return <ExplanationView decision={decision} analysis={analysis} />;
}

function ExplanationView({ decision, analysis }: { decision: Decision; analysis: DecisionAnalysis }) {
  const act = useDecisionActions(decision);
  return (
    <Screen
      title="Explanation"
      back
      footer={
        <div className="row">
          <button className="btn flex-1" onClick={act.save}>{decision.saved ? 'Saved' : 'Save decision'}</button>
          <Link to={`/decide/${decision.id}`} className="btn secondary">Workspace</Link>
        </div>
      }
    >
      <div className="stack">
        <h2 className="h2">{analysis.headline}</h2>
        <Section title="Summary of findings">
          <ul style={{ paddingLeft: 18, margin: 0, fontSize: 14 }}>{analysis.findings.map((f) => <li key={f} style={{ marginBottom: 6 }}>{f}</li>)}</ul>
        </Section>
        <Section title="Trade-offs by option">
          <div className="stack-sm">
            {analysis.options.map((o) => (
              <Expandable key={o.key} title={<span>{o.label}{!o.feasible && <span className="tag warn" style={{ marginLeft: 6 }}>Not feasible</span>}</span>}>
                <div className="stack-sm" style={{ fontSize: 14 }}>
                  <div><div className="label">Advantages</div><ul style={{ margin: '4px 0', paddingLeft: 18 }}>{o.advantages.length ? o.advantages.map((a) => <li key={a}>{a}</li>) : <li>—</li>}</ul></div>
                  <div><div className="label">Disadvantages</div><ul style={{ margin: '4px 0', paddingLeft: 18 }}>{o.disadvantages.length ? o.disadvantages.map((a) => <li key={a}>{a}</li>) : <li>—</li>}</ul></div>
                </div>
              </Expandable>
            ))}
          </div>
        </Section>
        <Section title="Assumptions">
          <ul className="caption" style={{ paddingLeft: 18, margin: 0 }}>{analysis.assumptions.map((a) => <li key={a} style={{ marginBottom: 4 }}>{a}</li>)}</ul>
          <button className="link-btn mt-8" onClick={act.editAssumptions}>Edit assumptions</button>
        </Section>
        <Section title="Risks">
          <ul className="caption" style={{ paddingLeft: 18, margin: 0 }}>{analysis.risks.map((a) => <li key={a} style={{ marginBottom: 4 }}>{a}</li>)}</ul>
        </Section>
        <Section title="What could change the outcome">
          <ul className="caption" style={{ paddingLeft: 18, margin: 0 }}>{analysis.whatCouldChange.map((a) => <li key={a} style={{ marginBottom: 4 }}>{a}</li>)}</ul>
        </Section>
        <Section title="How this was calculated">
          <div className="card outline">{analysis.methodology.map((m) => <KV key={m.label} k={m.label} v={<span style={{ fontWeight: 400, fontSize: 12 }}>{m.formula}</span>} />)}</div>
        </Section>
        <Banner tone="outline">
          No single option is right for everyone. This explains the trade-offs using your information; it is not regulated investment or financial advice, and nothing is executed on your behalf.
        </Banner>
      </div>
    </Screen>
  );
}
