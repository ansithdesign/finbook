let counter = 0;

export function uid(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

/** Mock-only hash so passwords are never kept in plain text in localStorage. Not secure. */
export function mockHash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = (h * 33) ^ text.charCodeAt(i);
  return (h >>> 0).toString(16);
}
