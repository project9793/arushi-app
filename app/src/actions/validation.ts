const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const BLOCKED_SCHEMES = ['javascript:', 'data:', 'file:', 'blob:', 'vbscript:', 'intent:', 'content:', 'about:'];

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateUrl(input: string): ValidationResult<string> {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return { ok: false, error: 'No URL was provided.' };
  if (trimmed.length > 2048) return { ok: false, error: 'That URL is too long.' };

  const lower = trimmed.toLowerCase().replace(/\s/g, '');
  for (const scheme of BLOCKED_SCHEMES) {
    if (lower.startsWith(scheme)) return { ok: false, error: `Blocked URL scheme "${scheme}".` };
  }

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, error: 'That does not look like a valid URL.' };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { ok: false, error: `Only http and https links can be opened (got "${parsed.protocol}").` };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, error: 'URLs with embedded credentials are not allowed.' };
  }
  if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
    return { ok: false, error: 'That URL has no valid host.' };
  }

  return { ok: true, value: parsed.toString() };
}

export function validatePhoneNumber(input: string): ValidationResult<{ dialable: string; display: string }> {
  const raw = (input ?? '').trim();
  if (!raw) return { ok: false, error: 'No phone number was provided.' };

  const cleaned = raw.replace(/[\s().-]/g, '');
  if (!/^\+?\d+$/.test(cleaned)) {
    return { ok: false, error: 'That phone number contains characters a dialer cannot use.' };
  }

  const digits = cleaned.replace(/^\+/, '');
  if (digits.length < 7) return { ok: false, error: 'That phone number is too short.' };
  if (digits.length > 15) return { ok: false, error: 'That phone number is too long.' };

  return {
    ok: true,
    value: {
      dialable: cleaned.startsWith('+') ? `+${digits}` : digits,
      display: cleaned,
    },
  };
}
