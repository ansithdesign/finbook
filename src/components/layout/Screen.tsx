import { ChevronLeft } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useAppState';

interface ScreenProps {
  title?: ReactNode;
  /** true = history back; string = explicit route. */
  back?: boolean | string;
  /** Called instead of navigating back (e.g. unsaved-changes guard). */
  onBack?: () => void | Promise<void>;
  large?: boolean;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  noPad?: boolean;
  /** Content shown above the scroll area, below the header (e.g. stepper). */
  subheader?: ReactNode;
  /** `ink` = full dark screen for key moments. */
  tone?: 'light' | 'ink';
}

/** Reusable mobile screen template: header, scrollable body, optional sticky footer CTA. */
export function Screen({ title, back, onBack, large, actions, footer, children, noPad, subheader, tone = 'light' }: ScreenProps) {
  const navigate = useNavigate();
  const { state } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const goBack = () => {
    if (onBack) return void onBack();
    if (typeof back === 'string') navigate(back);
    else navigate(-1);
  };
  const toneClass = tone === 'light' ? '' : `tone-${tone}`;
  return (
    <div className={`screen-view ${toneClass}`}>
      <header className={`screen-header ${large ? 'large' : ''} ${scrolled && tone === 'light' ? 'scrolled' : ''}`}>
        {!large && (
          <div>
            {back && (
              <button className="icon-btn" aria-label="Back" onClick={goBack}>
                <ChevronLeft size={26} />
              </button>
            )}
          </div>
        )}
        <h1 className="title">{title}</h1>
        <div className="actions">{actions}</div>
      </header>
      {state.dev.offline && <div className="offline-bar">You're offline. Changes are saved on this device.</div>}
      {subheader}
      <div className={`screen-body ${noPad ? 'no-pad' : ''}`} onScroll={(e) => setScrolled((e.target as HTMLDivElement).scrollTop > 4)}>
        {children}
      </div>
      {footer && <div className="screen-footer">{footer}</div>}
    </div>
  );
}
