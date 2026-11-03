import { Check, Eye, EyeOff } from '@/components/icons';
import { useEffect, useState, type ReactNode } from 'react';
import { groupDigits } from '@/utils/format';

interface BaseProps {
  label?: ReactNode;
  help?: ReactNode;
  error?: string | null;
  id?: string;
}

function FieldShell({ label, help, error, id, children }: BaseProps & { children: ReactNode }) {
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      {children}
      {error ? <span className="error" role="alert">{error}</span> : help ? <span className="help">{help}</span> : null}
    </div>
  );
}

let auto = 0;
const useId = (id?: string) => {
  const [v] = useState(() => id ?? `f${++auto}`);
  return v;
};

export function TextField(props: BaseProps & { value: string; onChange: (v: string) => void; type?: string; placeholder?: string; autoComplete?: string; inputMode?: 'text' | 'email' | 'tel' | 'numeric' }) {
  const id = useId(props.id);
  const [show, setShow] = useState(false);
  const isPw = props.type === 'password';
  return (
    <FieldShell {...props} id={id}>
      <div className={`input-wrap ${props.error ? 'invalid' : ''}`}>
        <input
          id={id}
          type={isPw && !show ? 'password' : isPw ? 'text' : props.type ?? 'text'}
          value={props.value}
          placeholder={props.placeholder}
          inputMode={props.inputMode}
          autoComplete={props.autoComplete}
          aria-invalid={!!props.error}
          onChange={(e) => props.onChange(e.target.value)}
        />
        {isPw && (
          <button type="button" className="icon-btn" style={{ width: 36, height: 36 }} aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </FieldShell>
  );
}

/**
 * Currency input with Indian digit grouping. Empty input means "unknown" (null), never zero.
 */
export function MoneyField(props: BaseProps & { value: number | null; onChange: (v: number | null) => void; placeholder?: string; suffix?: ReactNode }) {
  const id = useId(props.id);
  const [text, setText] = useState(groupDigits(props.value));
  useEffect(() => {
    const parsed = text === '' ? null : Number(text.replace(/[^\d]/g, ''));
    if (parsed !== props.value) setText(groupDigits(props.value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);
  return (
    <FieldShell {...props} id={id}>
      <div className={`input-wrap ${props.error ? 'invalid' : ''}`}>
        <span className="affix">₹</span>
        <input
          id={id}
          inputMode="numeric"
          value={text}
          placeholder={props.placeholder ?? 'Not provided'}
          aria-invalid={!!props.error}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^\d]/g, '').slice(0, 11);
            const n = digits === '' ? null : Number(digits);
            setText(n === null ? '' : groupDigits(n));
            props.onChange(n);
          }}
        />
        {props.suffix && <span className="affix">{props.suffix}</span>}
      </div>
    </FieldShell>
  );
}

export function NumberField(props: BaseProps & { value: number | null; onChange: (v: number | null) => void; suffix?: string; step?: number; placeholder?: string; min?: number; max?: number }) {
  const id = useId(props.id);
  return (
    <FieldShell {...props} id={id}>
      <div className={`input-wrap ${props.error ? 'invalid' : ''}`}>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={props.step ?? 'any'}
          min={props.min}
          max={props.max}
          value={props.value ?? ''}
          placeholder={props.placeholder ?? 'Not provided'}
          onChange={(e) => props.onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
        {props.suffix && <span className="affix">{props.suffix}</span>}
      </div>
    </FieldShell>
  );
}

export function SelectField<T extends string>(props: BaseProps & { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }> }) {
  const id = useId(props.id);
  return (
    <FieldShell {...props} id={id}>
      <div className="input-wrap">
        <select id={id} value={props.value} onChange={(e) => props.onChange(e.target.value as T)}>
          {props.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </FieldShell>
  );
}

export function DateField(props: BaseProps & { value: string | null; onChange: (v: string | null) => void }) {
  const id = useId(props.id);
  const v = props.value ? props.value.slice(0, 10) : '';
  return (
    <FieldShell {...props} id={id}>
      <div className={`input-wrap ${props.error ? 'invalid' : ''}`}>
        <input id={id} type="date" value={v} onChange={(e) => props.onChange(e.target.value ? new Date(e.target.value + 'T09:00:00').toISOString() : null)} />
      </div>
    </FieldShell>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }>; label?: string }) {
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <div className="segmented" role="tablist">
        {options.map((o) => (
          <button key={o.value} type="button" role="tab" aria-selected={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Chips<T extends string>({ value, onChange, options, multi }: { value: T[]; onChange: (v: T[]) => void; options: Array<{ value: T; label: string }>; multi?: boolean }) {
  return (
    <div className="chips">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            className={`chip ${on ? 'on' : ''}`}
            aria-pressed={on}
            onClick={() => onChange(multi ? (on ? value.filter((v) => v !== o.value) : [...value, o.value]) : [o.value])}
          >
            {on && <Check size={14} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function OptionList<T extends string>({ value, onChange, options, multi }: { value: T[]; onChange: (v: T[]) => void; options: Array<{ value: T; label: string; sub?: string }>; multi?: boolean }) {
  return (
    <div className="stack-sm">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            role={multi ? 'checkbox' : 'radio'}
            aria-checked={on}
            className={`option-card ${on ? 'on' : ''}`}
            onClick={() => onChange(multi ? (on ? value.filter((v) => v !== o.value) : [...value, o.value]) : [o.value])}
          >
            <span className={`check ${multi ? '' : 'round'}`}>{on && <Check size={14} />}</span>
            <span className="flex-1">
              <span className="strong">{o.label}</span>
              {o.sub && <span className="caption" style={{ display: 'block' }}>{o.sub}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />;
}

export function ToggleRow({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div className="list-row">
      <div className="main">
        <div className="title" style={{ whiteSpace: 'normal' }}>{label}</div>
        {sub && <div className="sub">{sub}</div>}
      </div>
      <Toggle on={on} onChange={onChange} label={label} />
    </div>
  );
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} className="row" style={{ background: 'none', border: 'none', padding: '6px 0', textAlign: 'left', alignItems: 'flex-start' }} onClick={() => onChange(!checked)}>
      <span className={`check ${checked ? 'on' : ''}`}>{checked && <Check size={14} />}</span>
      <span style={{ fontSize: 14 }}>{children}</span>
    </button>
  );
}

/** Slider + numeric input pair — every simulation input stays directly editable. */
export function SliderField({ label, value, onChange, min, max, step, format, help, assumption }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; format: (v: number) => string; help?: string; assumption?: boolean }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="field">
      <div className="slider-head">
        <span className="field-label">
          {label} {assumption && <span className="tag dashed">Assumption</span>}
        </span>
        {editing ? (
          <input
            autoFocus
            type="number"
            defaultValue={value}
            style={{ width: 110, textAlign: 'right', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '4px 6px' }}
            onBlur={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max * 10, n)));
              setEditing(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />
        ) : (
          <button type="button" className="link-btn num" onClick={() => setEditing(true)} aria-label={`Edit ${label}`}>
            {format(value)}
          </button>
        )}
      </div>
      <input type="range" min={min} max={max} step={step} value={Math.min(value, max)} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} />
      {help && <span className="help">{help}</span>}
    </div>
  );
}
