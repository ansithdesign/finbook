// DEC-02 Ask a question → intent recognition → creates a draft decision.

import { Compass, LineChart } from '@/components/icons';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { List, ListRow } from '@/components/cards/Cards';
import { Banner, Loading } from '@/components/feedback/States';
import { Screen } from '@/components/layout/Screen';
import { defaultInputs, EXAMPLE_QUESTIONS, INTENT_TEMPLATES, recognizeIntent } from '@/intelligence';
import { useApp } from '@/hooks/useAppState';
import type { Decision, DecisionIntent } from '@/types';
import { nowISO, uid } from '@/utils/id';

export function DecideAsk() {
  const [params] = useSearchParams();
  const [text, setText] = useState(params.get('q') ?? '');
  const [phase, setPhase] = useState<'input' | 'thinking' | 'unrecognized'>('input');
  const [error, setError] = useState<string | null>(null);
  const { state, actions } = useApp();
  const navigate = useNavigate();

  const create = (intent: DecisionIntent, question: string) => {
    const r = recognizeIntent(question);
    const amount = intent === r.intent ? r.amount : null;
    const title = intent === r.intent ? r.title : recognizeIntent(INTENT_TEMPLATES.find((t) => t.intent === intent)!.question).title;
    const d: Decision = {
      id: uid('dec'),
      title: intent === 'car' && !amount ? 'Car purchase' : title,
      question,
      intent,
      status: 'draft',
      inputs: defaultInputs(intent, state.data, amount),
      chosenOption: null,
      saved: false,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    actions.upsertDecision(d);
    navigate(`/decide/${d.id}/clarify`, { replace: true });
  };

  const explore = () => {
    if (text.trim().length < 8) return setError('Describe the decision in a few more words.');
    setError(null);
    setPhase('thinking');
    setTimeout(() => {
      const r = recognizeIntent(text);
      if (r.intent === 'generic') setPhase('unrecognized');
      else create(r.intent, text.trim());
    }, 700);
  };

  if (phase === 'thinking')
    return (
      <Screen title="Ask a question" back>
        <Loading label="Understanding your question…" sub="Matching it to a decision type and checking your profile." />
      </Screen>
    );

  if (phase === 'unrecognized')
    return (
      <Screen title="Ask a question" back onBack={() => setPhase('input')}>
        <div className="stack">
          <div className="card"><div className="label">You asked</div><p className="mt-4">"{text}"</p></div>
          <Banner tone="outline">{recognizeIntent(text).understanding}</Banner>
          <h2 className="h3">Closest decision types</h2>
          <List>
            {INTENT_TEMPLATES.map((t) => (
              <ListRow key={t.intent} icon={Compass} title={t.title} onClick={() => create(t.intent, text.trim())} />
            ))}
            <ListRow icon={LineChart} title="Build a custom scenario instead" to="/simulate/new?template=custom" />
          </List>
          <button className="btn secondary" onClick={() => setPhase('input')}>Rephrase my question</button>
        </div>
      </Screen>
    );

  return (
    <Screen title="Ask a question" back footer={<button className="btn block" disabled={!text.trim()} onClick={explore}>Explore this decision</button>}>
      <div className="stack">
        <label htmlFor="q" className="h2">What financial decision are you thinking about?</label>
        <textarea id="q" className="big-input" placeholder="What financial decision are you thinking about?" value={text} onChange={(e) => (setText(e.target.value), setError(null))} />
        {error && <span className="caption warn-text">{error}</span>}
        <div className="label mt-8">Try an example</div>
        <div className="stack-sm">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button key={q} className="chip-btn" onClick={() => setText(q)}>{q}</button>
          ))}
        </div>
        <Banner tone="outline">
          The prototype understands car purchases, loan prepayment vs investing, and safe spending with variable income. Answers come from your data and fixed formulas — not from a live AI model. <Link to="/profile/help"><u>How it works</u></Link>
        </Banner>
      </div>
    </Screen>
  );
}
