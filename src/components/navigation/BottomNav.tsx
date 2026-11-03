import { Compass, Home, LineChart, Target, User } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

// Decide is the product's core action, so it takes the raised centre slot.
const TABS = [
  { to: '/home', label: 'Home', icon: Home, match: ['/home', '/records', '/notifications', '/search'] },
  { to: '/simulate', label: 'Simulate', icon: LineChart, match: ['/simulate'] },
  { to: '/decide', label: 'Decide', icon: Compass, match: ['/decide'], hub: true },
  { to: '/goals', label: 'Goals', icon: Target, match: ['/goals'] },
  { to: '/profile', label: 'Profile', icon: User, match: ['/profile', '/system'] },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="bottom-nav has-nav" aria-label="Primary">
      {TABS.map((t) => {
        const active = t.match.some((m) => pathname.startsWith(m));
        const Icon = t.icon;
        return (
          <NavLink key={t.to} to={t.to} className={`${active ? 'active' : ''} ${t.hub ? 'hub' : ''}`} aria-current={active ? 'page' : undefined}>
            {t.hub ? (
              <span className="hub-btn">
                <Icon size={26} strokeWidth={2} />
              </span>
            ) : (
              <Icon size={24} strokeWidth={active ? 2.2 : 1.7} />
            )}
            {t.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
