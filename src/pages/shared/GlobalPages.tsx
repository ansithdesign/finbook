// SYS-01 Global search, SYS-02 Notifications.

import { Bell, Search } from '@/components/icons';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, ListRow, Section } from '@/components/cards/Cards';
import { EmptyState } from '@/components/feedback/States';
import { Screen } from '@/components/layout/Screen';
import { useApp } from '@/hooks/useAppState';
import { inr, relativeTime } from '@/utils/format';

export function GlobalSearch() {
  const { state } = useApp();
  const [q, setQ] = useState('');
  const index = useMemo(() => {
    const d = state.data;
    return [
      ...d.incomes.map((r) => ({ type: 'Income', title: r.name, sub: inr(r.amount), to: `/records/income/${r.id}` })),
      ...d.expenses.map((r) => ({ type: 'Expense', title: r.name, sub: inr(r.amount), to: `/records/expense/${r.id}` })),
      ...d.assets.map((r) => ({ type: 'Asset', title: r.name, sub: inr(r.value), to: `/records/asset/${r.id}` })),
      ...d.liabilities.map((r) => ({ type: 'Liability', title: r.name, sub: inr(r.outstanding), to: `/records/liability/${r.id}` })),
      ...d.commitments.map((r) => ({ type: 'Commitment', title: r.name, sub: inr(r.amount), to: `/records/commitment/${r.id}` })),
      ...d.goals.map((g) => ({ type: 'Goal', title: g.name, sub: inr(g.target), to: `/goals/${g.id}` })),
      ...state.decisions.map((x) => ({ type: 'Decision', title: x.title, sub: x.question, to: `/decide/${x.id}` })),
      ...state.scenarios.map((x) => ({ type: 'Scenario', title: x.name, sub: x.saved ? 'Saved' : 'Not saved', to: `/simulate/${x.id}` })),
    ];
  }, [state]);
  const results = q.trim().length < 2 ? [] : index.filter((r) => `${r.title} ${r.type} ${r.sub}`.toLowerCase().includes(q.toLowerCase()));
  const groups = Array.from(new Set(results.map((r) => r.type)));
  return (
    <Screen title="Search" back>
      <div className="input-wrap">
        <Search size={18} />
        <input autoFocus placeholder="Search records, goals, decisions…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
      </div>
      {q.trim().length < 2 ? (
        <p className="caption mt-16">Type at least two characters. Try "loan", "rent" or "car".</p>
      ) : results.length === 0 ? (
        <EmptyState icon={Search} title="No results" body={`Nothing matches "${q}".`} />
      ) : (
        groups.map((g) => (
          <Section key={g} title={<span className="label">{g}</span>}>
            <List>{results.filter((r) => r.type === g).map((r) => <ListRow key={r.to} title={r.title} sub={r.sub} to={r.to} />)}</List>
          </Section>
        ))
      )}
    </Screen>
  );
}

export function NotificationsPage() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const list = [...state.notifications].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <Screen title="Notifications" back actions={list.some((n) => !n.read) ? <button className="link-btn" style={{ padding: '0 8px' }} onClick={actions.markAllNotificationsRead}>Mark all read</button> : null}>
      {list.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" body="Reminders and insights will appear here." />
      ) : (
        <List>
          {list.map((n) => (
            <ListRow
              key={n.id}
              icon={Bell}
              title={<span style={{ fontWeight: n.read ? 400 : 700 }}>{n.title}</span>}
              sub={`${n.body} · ${relativeTime(n.at)}`}
              onClick={() => {
                actions.markNotificationRead(n.id);
                if (n.link) navigate(n.link);
              }}
            />
          ))}
        </List>
      )}
      <p className="caption mt-12">Manage what you receive in Profile → Notifications.</p>
    </Screen>
  );
}
