// DEC-01 Decision landing, DEC-08 Saved decisions, DEC-09 Decision history.

import { Bookmark, Compass, History, MessageSquareText, Lightbulb } from '@/components/icons';
import { Link, useNavigate } from 'react-router-dom';
import { List, ListRow, Section, SectionLink } from '@/components/cards/Cards';
import { EmptyState } from '@/components/feedback/States';
import { PathsScene } from '@/components/illustrations/Illustrations';
import { Screen } from '@/components/layout/Screen';
import { INTENT_TEMPLATES } from '@/intelligence';
import { useApp } from '@/hooks/useAppState';
import { useFinance } from '@/hooks/useFinance';
import { fmtDate, relativeTime } from '@/utils/format';
import { STATUS_LABEL } from '@/features/decisions/shared';

const MORE_TEMPLATES = [
  { title: 'Can I increase my monthly investment?', to: '/simulate/new?template=invest-more' },
  { title: 'What if my income decreases?', to: '/simulate/new?template=income-drop' },
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
      <div className="card" style={{ background: 'var(--green-tint)', padding: '8px 16px 16px' }}>
        <PathsScene />
        <p style={{ fontSize: 15, fontWeight: 600, textAlign: 'center' }}>Turn a financial question into a clear comparison of options.</p>
      </div>
      <button className="card outline mt-16" style={{ width: '100%', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'center', minHeight: 64 }} onClick={() => navigate('/decide/ask')}>
        <MessageSquareText size={22} />
        <span className="muted flex-1">What financial decision are you thinking about?</span>
      </button>

      <Section title="Start from a template">
        <List>
          {INTENT_TEMPLATES.map((t) => (
            <ListRow key={t.intent} icon={Compass} title={t.title} sub={t.question} to={`/decide/ask?q=${encodeURIComponent(t.question)}`} />
          ))}
          {MORE_TEMPLATES.map((t) => (
            <ListRow key={t.title} icon={Compass} title={t.title} sub="Opens a scenario in Simulate" to={t.to} />
          ))}
        </List>
      </Section>

      {nextSteps.length > 0 && (
        <Section title="Suggested next actions">
          <div className="stack-sm">
            {nextSteps.map((i) => (
              <Link key={i.id} to={i.action.to} className="card outline tight row" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Lightbulb size={18} />
                <span className="flex-1">
                  <span className="strong" style={{ display: 'block' }}>{i.action.label}</span>
                  <span className="caption">Because: {i.title.toLowerCase()}</span>
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section title="Continue where you left off" action={<SectionLink to="/decide/history">History</SectionLink>}>
        {inProgress.length === 0 ? (
          <p className="caption">No decisions in progress.</p>
        ) : (
          <List>
            {inProgress.map((d) => (
              <ListRow key={d.id} title={d.title} sub={`${STATUS_LABEL[d.status]} · ${relativeTime(d.updatedAt)}`} to={d.status === 'draft' ? `/decide/${d.id}/clarify` : `/decide/${d.id}`} />
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
      <p className="caption mt-24">Results are calculated from your own information and stated assumptions. This is not regulated financial advice.</p>
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
