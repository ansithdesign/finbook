export function validateRequired(v: string, label: string): string | null {
  return v.trim() ? null : `${label} is required.`;
}

export function validateEmail(v: string): string | null {
  if (!v.trim()) return 'Email address is required.';
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? null : 'Enter a valid email address.';
}

export function validateMobile(v: string): string | null {
  const d = v.replace(/\D/g, '');
  if (!d) return 'Mobile number is required.';
  return /^[6-9]\d{9}$/.test(d) ? null : 'Enter a valid 10-digit Indian mobile number.';
}

export function validatePassword(v: string): string | null {
  if (v.length < 8) return 'Password must be at least 8 characters.';
  if (!/\d/.test(v)) return 'Include at least one number.';
  return null;
}

export function validateAmount(v: number | null, opts: { required?: boolean; label?: string; min?: number; max?: number } = {}): string | null {
  const label = opts.label ?? 'Amount';
  if (v === null) return opts.required ? `${label} is required.` : null;
  if (v < 0) return `${label} cannot be negative.`;
  if (opts.min !== undefined && v < opts.min) return `${label} must be at least ${opts.min.toLocaleString('en-IN')}.`;
  if (opts.max !== undefined && v > opts.max) return `${label} must be at most ${opts.max.toLocaleString('en-IN')}.`;
  return null;
}
