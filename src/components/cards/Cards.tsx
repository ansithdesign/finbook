import { ArrowRight, ChevronRight, type LucideIcon } from '@/components/icons';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function Section({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`section ${className ?? ''}`}>
      {(title || action) && (
        <div className="section-head">
          {title && <h2>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function SectionLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="link-btn">
      {children}
    </Link>
  );
}

interface RowProps {
  icon?: LucideIcon;
  title: ReactNode;
  sub?: ReactNode;
  value?: ReactNode;
  to?: string;
  onClick?: () => void;
  chevron?: boolean;
}

export function ListRow({ icon: Icon, title, sub, value, to, onClick, chevron }: RowProps) {
  const inner = (
    <>
      {Icon && (
        <span className="icon-box">
          <Icon size={19} weight="duotone" />
        </span>
      )}
      <span className="main">
        <span className="title">{title}</span>
        {sub && <span className="sub" style={{ display: 'block' }}>{sub}</span>}
      </span>
      {value !== undefined && <span className="value">{value}</span>}
      {(chevron ?? !!(to || onClick)) && <ChevronRight size={18} className="chev" />}
    </>
  );
  if (to)
    return (
      <Link to={to} className="list-row">
        {inner}
      </Link>
    );
  if (onClick)
    return (
      <button type="button" className="list-row" onClick={onClick}>
        {inner}
      </button>
    );
  return <div className="list-row">{inner}</div>;
}

export function List({ children, outline }: { children: ReactNode; outline?: boolean }) {
  return <div className={`list ${outline ? 'outline' : ''}`}>{children}</div>;
}

export function KV({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="kv">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}

export function Stat({ label, value, sub, to }: { label: string; value: ReactNode; sub?: ReactNode; to?: string }) {
  const body = (
    <>
      <div className="label">{label}</div>
      <div className="v">{value}</div>
      {sub && <div className="caption mt-4">{sub}</div>}
    </>
  );
  return to ? (
    <Link to={to} className="stat" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      {body}
    </Link>
  ) : (
    <div className="stat">{body}</div>
  );
}

export function Expandable({ title, children, defaultOpen }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="expand" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        <ChevronRight size={18} className="chev chev-rot" />
      </summary>
      <div className="expand-body">{children}</div>
    </details>
  );
}

/** A value changing from one figure to another, with a drawn arrow between them. */
export function Shift({ from, to }: { from: ReactNode; to: ReactNode }) {
  return (
    <span className="shift">
      <span>{from}</span>
      <ArrowRight size={12} />
      <span>{to}</span>
    </span>
  );
}
