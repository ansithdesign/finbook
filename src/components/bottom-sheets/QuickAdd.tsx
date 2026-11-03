import { Banknote, CalendarClock, Landmark, PiggyBank, Receipt, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { List, ListRow } from '@/components/cards/Cards';
import { useFeedback } from '@/components/feedback/FeedbackProvider';

const ITEMS = [
  { label: 'Income', sub: 'Salary, freelance, rental', icon: Banknote, to: '/records/new/income' },
  { label: 'Expense', sub: 'A recurring cost', icon: Receipt, to: '/records/new/expense' },
  { label: 'Asset', sub: 'Savings, investments, property', icon: PiggyBank, to: '/records/new/asset' },
  { label: 'Liability', sub: 'Loan or credit card due', icon: Landmark, to: '/records/new/liability' },
  { label: 'Commitment', sub: 'Upcoming or recurring payment', icon: CalendarClock, to: '/records/new/commitment' },
  { label: 'Goal', sub: 'Something you are saving for', icon: Target, to: '/goals/new' },
];

/** SYS-03 Quick-add menu. */
export function useQuickAdd() {
  const { openSheet } = useFeedback();
  const navigate = useNavigate();
  return () =>
    openSheet('Add to your finances', (close) => (
      <List>
        {ITEMS.map((i) => (
          <ListRow
            key={i.label}
            icon={i.icon}
            title={i.label}
            sub={i.sub}
            onClick={() => {
              close();
              navigate(i.to);
            }}
          />
        ))}
      </List>
    ));
}
