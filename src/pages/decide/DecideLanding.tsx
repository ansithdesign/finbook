// DEC-01 Decision landing, DEC-08 Saved decisions, DEC-09 Decision history.

import { ArrowRight, Bookmark, History, MessageSquareText } from '@/components/icons';
import { INTENT_ICON } from '@/components/topicIcons';
import { Link, useNavigate } from 'react-router-dom';
import { List, ListRow, Section, SectionLink } from '@/components/cards/Cards';
import { EmptyState } from '@/components/feedback/States';
import { Screen } from '@/components/layout/Screen';
import { INTENT_TEMPLATES } from '@/intelligence';
import { useApp } from '@/hooks/useAppState';
import { fmtDate, relativeTime } from '@/utils/format';
import { STATUS_LABEL } from '@/features/decisions/shared';

export function DecideLanding() {
  const { state } = useApp();
  const navigate = useNavigate();
  const mine = [...state.decisions]
    .sort((x, y) => Number(y.status !== 'completed') - Number(x.status !== 'completed') || y.updatedAt.localeCompare(x.updatedAt))
    .slice(0, 3);
  return (
    <Screen large title="Decide">
      <p className="lede">Ask a money question. See your options side by side.</p>
      <button className="ask-bar mt-16" onClick={() => navigate('/decide/ask')}>
        <MessageSquareText size={22} />
        <span className="flex-1">What are you deciding?</span>
        <span className="ask-go"><ArrowRight size={16} /></span>
      </button>

      <Section title="Common questions">
        <List>
          {INTENT_TEMPLATES.map((t) => (
            <ListRow key={t.intent} icon={INTENT_ICON[t.intent]} title={t.title} to={`/decide/ask?q=${encodeURIComponent(t.question)}`} />
          ))}
        </List>
      </Section>

      {mine.length > 0 && (
        <Section title="Your decisions" action={<SectionLink to="/decide/history">All</SectionLink>}>
          <List>
            {mine.map((d) => (
              <ListRow
                key={d.id}
                icon={INTENT_ICON[d.intent]}
                title={d.title}
                sub={d.saved ? `Saved ${fmtDate(d.updatedAt)}` : `${STATUS_LABEL[d.status]} · ${relativeTime(d.updatedAt)}`}
                to={d.status === 'draft' ? `/decide/${d.id}/clarify` : `/decide/${d.id}`}
              />
            ))}
          </List>
        </Section>
      )}
      <p className="caption mt-24">Answers use your own numbers and the assumptions shown. Not regulated financial advice.</p>
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
