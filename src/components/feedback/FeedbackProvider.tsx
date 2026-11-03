// Toasts, bottom sheets and confirmation dialogs, rendered inside the device screen.

import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

interface ToastItem {
  id: number;
  message: string;
  kind: 'success' | 'error' | 'info';
}
interface SheetItem {
  title: string;
  content: (close: () => void) => ReactNode;
}
interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface FeedbackApi {
  toast: (message: string, kind?: ToastItem['kind']) => void;
  openSheet: (title: string, content: (close: () => void) => ReactNode) => void;
  closeSheet: () => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const Ctx = createContext<FeedbackApi | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [sheet, setSheet] = useState<SheetItem | null>(null);
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const nextId = useRef(1);

  const toast = useCallback((message: string, kind: ToastItem['kind'] = 'success') => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);
  const openSheet = useCallback((title: string, content: SheetItem['content']) => setSheet({ title, content }), []);
  const closeSheet = useCallback(() => setSheet(null), []);
  const confirm = useCallback((opts: ConfirmOptions) => new Promise<boolean>((resolve) => setDialog({ ...opts, resolve })), []);

  const api = useMemo(() => ({ toast, openSheet, closeSheet, confirm }), [toast, openSheet, closeSheet, confirm]);
  const finish = (v: boolean) => {
    dialog?.resolve(v);
    setDialog(null);
  };

  return (
    <Ctx.Provider value={api}>
      {children}
      {sheet && (
        <div className="overlay" onClick={closeSheet} role="presentation">
          <div className="sheet" role="dialog" aria-modal="true" aria-label={sheet.title} onClick={(e) => e.stopPropagation()}>
            <div className="sheet-grab" />
            <div className="sheet-head">
              <h3>{sheet.title}</h3>
              <button className="icon-btn" aria-label="Close" onClick={closeSheet}>
                <X size={20} />
              </button>
            </div>
            <div className="sheet-body">{sheet.content(closeSheet)}</div>
          </div>
        </div>
      )}
      {dialog && (
        <div className="overlay center" role="presentation">
          <div className="dialog" role="alertdialog" aria-modal="true" aria-label={dialog.title}>
            <h3 className="h3">{dialog.title}</h3>
            {dialog.body && <div className="muted" style={{ fontSize: 14 }}>{dialog.body}</div>}
            <div className="actions">
              <button className="btn secondary" onClick={() => finish(false)}>
                {dialog.cancelLabel ?? 'Cancel'}
              </button>
              <button className={`btn ${dialog.danger ? 'danger' : ''}`} onClick={() => finish(true)}>
                {dialog.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="toast-wrap" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind === 'error' ? 'error' : ''}`}>
            {t.kind === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useFeedback() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFeedback must be used inside FeedbackProvider');
  return v;
}
