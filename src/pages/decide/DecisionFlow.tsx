// DEC-03 Decision clarification and DEC-04 Financial context review.

import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { List, ListRow } from '@/components/cards/Cards';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { Banner, Money, SourceTag } from '@/components/feedback/States';
import { Screen } from '@/components/layout/Screen';
import { missingContext, recognizeIntent, retrieveContext, visibleQuestions } from '@/intelligence';
import { useApp } from '@/hooks/useAppState';
import type { Decision } from '@/types';
import { inrCompact } from '@/utils/format';
import { allQuestions, MissingDecision, QuestionInput, useDecision, validateQuestion } from '@/features/decisions/shared';

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

function Steps({ at }: { at: number }) {
  return (
    <div style={{ padding: '0 20px 10px' }}>
      <div className="stepper">{[0, 1, 2].map((i) => <div key={i} className={i <= at ? 'done' : ''} />)}</div>
      <div className="caption mt-4">{['Clarify', 'Review context', 'Compare options'][at]} · step {at + 1} of 3</div>
    </div>
  );
}

// DEC-03
export function DecisionClarify() {
  const { decision } = useDecision();
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const { toast } = useFeedback();
  const [inputs, setInputs] = useState<Decision['inputs']>(decision?.inputs ?? {});
  const [submitted, setSubmitted] = useState(false);
  if (!decision) return <MissingDecision />;

  const qs = allQuestions(decision, state);
  const visible = visibleQuestions(qs, inputs);
  const errors = Object.fromEntries(visible.map((q) => [q.key, validateQuestion(q, inputs[q.key])]));
  const valid = Object.values(errors).every((e) => !e);
  const understood = recognizeIntent(decision.question);
  const fromProfile = retrieveContext(decision.intent, state.data).filter((c) => c.source !== 'missing').slice(0, 5);

  const setInput = (key: string, v: number | string | null) => {
    const next = { ...inputs, [key]: v };
    // Keep car alternatives proportional when the price changes and the user hasn't customised them.
    if (decision.intent === 'car' && key === 'price' && typeof v === 'number') {
      const old = Number(inputs.price) || 0;
      if (!inputs.downPayment || inputs.downPayment === roundTo(old * 0.2, 10000)) next.downPayment = roundTo(v * 0.2, 10000);
      if (!inputs.largerDownPayment || inputs.largerDownPayment === roundTo(old * 0.4, 10000)) next.largerDownPayment = roundTo(v * 0.4, 10000);
      if (!inputs.lowerPrice || inputs.lowerPrice === roundTo(old * 0.7, 50000)) next.lowerPrice = roundTo(v * 0.7, 50000);
    }
    if (decision.intent === 'car' && key === 'financing' && v === 'cash') next.downPayment = next.price ?? null;
    setInputs(next);
  };
  const persist = (status: Decision['status']) => actions.upsertDecision({ ...decision, inputs, status, title: decision.intent === 'car' && inputs.price ? `Car purchase · ${inrCompact(Number(inputs.price))}` : decision.title });
  const next = () => {
    setSubmitted(true);
    if (!valid) return toast('Please answer the highlighted questions', 'error');
    persist(decision.status === 'draft' ? 'in-progress' : decision.status);
    navigate(`/decide/${decision.id}/context`);
  };

  return (
    <Screen
      title="Clarify"
      back
      onBack={() => {
        persist(decision.status);
        navigate(-1);
      }}
      subheader={<Steps at={0} />}
      footer={<button className="btn block" onClick={next}>Continue</button>}
    >
      <div className="stack">
        <div className="card">
          <div className="label">Your question</div>
          <p className="strong mt-4">"{decision.question}"</p>
          <p className="caption mt-8">{understood.understanding}</p>
        </div>
        {fromProfile.length > 0 && (
          <div>
            <div className="label mb-8">Already known from your profile — not asked again</div>
            <div className="chips">
              {fromProfile.map((c) => (
                <span key={c.key} className="tag"><CheckCircle2 size={12} /> {c.label}</span>
              ))}
            </div>
          </div>
        )}
        <h2 className="h3 mt-8">A few details to compare options accurately</h2>
        {visible.length === 0 && <Banner>Everything needed is already in your profile. Continue to review it.</Banner>}
        {visible.map((q) => (
          <QuestionInput key={q.key} q={q} value={inputs[q.key]} onChange={(v) => setInput(q.key, v)} error={submitted ? errors[q.key] : null} />
        ))}
        <p className="caption">You can change any of these later from the decision workspace.</p>
      </div>
    </Screen>
  );
}

// DEC-04
export function DecisionContext() {
  const { decision } = useDecision();
  const { state } = useApp();
  const navigate = useNavigate();
  if (!decision) return <MissingDecision />;
  const ctx = retrieveContext(decision.intent, state.data);
  const missing = missingContext(ctx);
  return (
    <Screen
      title="Review your context"
      back
      subheader={<Steps at={1} />}
      footer={
        <>
          <button className="btn block" onClick={() => navigate(`/decide/${decision.id}?calc=1`)}>
            {missing.length ? 'Continue with what I have' : 'Looks right — compare options'}
          </button>
        </>
      }
    >
      <div className="stack">
        <p className="muted" style={{ fontSize: 14 }}>This is the information we'll use, taken from your profile. Correct anything that's out of date — changes update your profile too.</p>
        {missing.length > 0 && (
          <Banner tone="warn">
            {missing.length} item{missing.length > 1 ? 's are' : ' is'} missing: {missing.map((m) => m.label.toLowerCase()).join(', ')}. Results will be limited or marked as estimates.
          </Banner>
        )}
        <List>
          {ctx.map((c) => (
            <ListRow
              key={c.key}
              title={c.label}
              sub={
                <span className="row wrap" style={{ gap: 4 }}>
                  <SourceTag source={c.source} /> {c.note}
                </span>
              }
              value={c.key === 'goals' ? <span className="caption" style={{ maxWidth: 120, display: 'inline-block' }}>{c.display}</span> : c.value === null ? <span className="caption">{c.display}</span> : <strong>{typeof c.value === 'number' && c.key !== 'goals' ? <Money value={c.value} /> : c.display}</strong>}
              to={c.editTo}
            />
          ))}
        </List>
        <div className="card outline">
          <div className="label mb-8">Your answers</div>
          {Object.entries(decision.inputs)
            .filter(([, v]) => v !== null && v !== '')
            .slice(0, 8)
            .map(([k, v]) => (
              <div key={k} className="kv">
                <span className="k">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                <span className="v">{typeof v === 'number' && v > 1000 ? `₹${v.toLocaleString('en-IN')}` : String(v)}</span>
              </div>
            ))}
          <Link to={`/decide/${decision.id}/clarify`} className="link-btn">Edit answers</Link>
        </div>
      </div>
    </Screen>
  );
}
