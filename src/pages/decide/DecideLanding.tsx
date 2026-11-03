// DEC-01 Decision landing, DEC-08 Saved decisions, DEC-09 Decision history.

import { ArrowRight, Bookmark, History, Lightbulb, MessageSquareText, TrendDown, TrendUp } from '@/components/icons';
import { INTENT_ICON } from '@/components/topicIcons';
import { Link, useNavigate } from 'react-router-dom';
import { List, ListRow, Section, SectionLink } from '@/components/cards/Cards';
import { EmptyState } from '@/components/feedback/States';
import { Screen } from '@/components/layout/Screen';
import { INTENT_TEMPLATES } from '@/intelligence';
import { useApp } from '@/hooks/useAppState';
import { useFinance } from '@/hooks/useFinance';
import { fmtDate, relativeTime } from '@/utils/format';
import { STATUS_LABEL } from '@/features/decisions/shared';

const MORE_TEMPLATES = [
  { title: 'Can I invest more each month?', sub: 'See the effect on monthly cash in Simulate', icon: TrendUp, to: '/simulate/new?template=invest-more' },
  { title: 'What if my income drops?', sub: 'See how long savings would last in Simulate', icon: TrendDown, to: '/simulate/new?template=income-drop' },
];

export function DecideLanding() {
  const { state } = useApp();
  const f = useFinance();
  const navigate = useNavigate();
  const inProgress = state.decisions.filter((d) => d.status !== 'completed' && !d.saved).slice(0, 3);
  const saved = state.decisions.filter((d) => d.saved).slice(0, 3);
  const nextSteps = f.insights.filter((i) => i.severity === 'attention').slice(0, 2);
  return (
    <Screen large title="Decide">
      <p className="lede">Ask a money question. You get your options side by side, with the trade-offs spelled out.</p>
      <button className="ask-bar mt-16" onClick={() => navigate('/decide/ask')}>
        <MessageSquareText size={22} />
        <span className="flex-1">What are you deciding?</span>
        <span className="ask-go"><ArrowRight size={16} /></span>
      </button>

      <Section title="Common questions">
        <List>
          {INTENT_TEMPLATES.map((t) => (
            <ListRow key={t.intent} icon={INTENT_ICON[t.intent]} title={t.title} sub={t.question} to={`/decide/ask?q=${encodeURIComponent(t.question)}`} />
          ))}
          {MORE_TEMPLATES.map((t) => (
            <ListRow key={t.title} icon={t.icon} title={t.title} sub={t.sub} to={t.to} />
          ))}
        </List>
      </Section>

      {nextSteps.length > 0 && (
        <Section title="Worth deciding soon">
          <List>
            {nextSteps.map((i) => (
              <ListRow key={i.id} icon={Lightbulb} title={i.action.label} sub={`Because ${i.title.charAt(0).toLowerCase()}${i.title.slice(1)}`} to={i.action.to} />
            ))}
          </List>
        </Section>
      )}

      <Section title="Continue where you left off" action={<SectionLink to="/decide/history">History</SectionLink>}>
        {inProgress.length === 0 ? (
          <p className="caption">Nothing in progress. Questions you start will wait here.</p>
        ) : (
          <List>
            {inProgress.map((d) => (
              <ListRow key={d.id} icon={INTENT_ICON[d.intent]} title={d.title} sub={`${STATUS_LABEL[d.status]} · ${relativeTime(d.updatedAt)}`} to={d.status === 'draft' ? `/decide/${d.id}/clarify` : `/decide/${d.id}`} />
            ))}
          </List>
        )}
      </Section>

      <Section title="Saved decisions" action={<SectionLink to="/decide/saved">View all</SectionLink>}>
        {saved.length === 0 ? (
          <p className="caption">Decisions you save will appear here so you can revisit them.</p>
        ) : (
          <List>
            {saved.map((d) => (
              <ListRow key={d.id} icon={Bookmark} title={d.title} sub={`Saved ${fmtDate(d.updatedAt)}${d.chosenOption ? ` · Option ${d.chosenOption} selected` : ''}`} to={`/decide/${d.id}`} />
            ))}
          </List>
        )}
      </Section>
      <p className="caption mt-24">Answers come from your own numbers and the assumptions shown with each result. This is not regulated financial advice.</p>
    </Screen>
  );
}

export function DecisionList({ mode }: { mode: 'saved' | 'history' }) {
  const { state } = useApp();
  const list = (mode === 'saved' ? state.decisions.filter((d) => d.saved) : [...state.decisions]).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <Screen title={mode === 'saved' ? 'Saved decisions' : 'Decision history'} back="/decide">
      {list.length === 0 ? (
        <EmptyState
          icon={mode === 'saved' ? Bookmark : History}
          title={mode === 'saved' ? 'No saved decisions' : 'No decisions yet'}
          body="Ask a question to explore your first decision."
          action={<Link to="/decide/ask" className="btn sm">Ask a question</Link>}
        />
      ) : (
        <List>
          {list.map((d) => (
            <ListRow
              key={d.id}
              title={d.title}
              sub={
                <span className="row wrap" style={{ gap: 4 }}>
                  <span className="tag">{STATUS_LABEL[d.status]}</span>
                  {d.saved && <span className="tag dark">Saved</span>}
                  {mode === 'history' ? `Started ${fmtDate(d.createdAt)} · updated ${relativeTime(d.updatedAt)}` : fmtDate(d.updatedAt)}
                </span>
              }
              to={d.status === 'draft' ? `/decide/${d.id}/clarify` : `/decide/${d.id}`}
            />
          ))}
        </List>
      )}
    </Screen>
  );
}
