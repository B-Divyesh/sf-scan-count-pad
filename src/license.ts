const SLUG = 'scan-count-pad';
const KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${KEY}:verdict`;
const RETRY_KEY = `${KEY}:retry-after`;
const API = 'https://api.sociobot.in/api/v1';

export interface LicenseState { token?: string; valid: boolean; checkedAt?: number; reason?: string; }

export function captureLicense(): string | undefined {
  const url = new URL(location.href);
  const token = url.searchParams.get('license')?.trim();
  if (token) {
    if (localStorage.getItem(KEY) !== token) localStorage.removeItem(VERDICT_KEY);
    localStorage.setItem(KEY, token);
    url.searchParams.delete('license');
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }
  return token || localStorage.getItem(KEY) || undefined;
}

export function cachedLicense(): LicenseState {
  const token = localStorage.getItem(KEY) || undefined;
  try {
    const verdict = JSON.parse(localStorage.getItem(VERDICT_KEY) || '{}') as LicenseState;
    return { ...verdict, token, valid: Boolean(token && verdict.valid) };
  } catch { return { token, valid: false }; }
}

export async function verifyLicense(token: string): Promise<LicenseState> {
  const cached = cachedLicense();
  if (cached.token === token && cached.checkedAt && Date.now() - cached.checkedAt < 86_400_000) return cached;
  const retryAt = Number(localStorage.getItem(RETRY_KEY) || 0);
  if (retryAt > Date.now()) return { ...cached, token, reason: 'rate_limited' };
  try {
    localStorage.setItem(RETRY_KEY, String(Date.now() + 1000));
    const response = await fetch(`${API}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const seconds = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) : 60;
      localStorage.setItem(RETRY_KEY, String(Date.now() + seconds * 1000));
      return { ...cached, token, reason: 'rate_limited' };
    }
    if (!response.ok) throw new Error('verification unavailable');
    const result = await response.json() as { valid: boolean; reason?: string };
    const state = { token, valid: result.valid, reason: result.reason, checkedAt: Date.now() };
    localStorage.setItem(VERDICT_KEY, JSON.stringify(state));
    return state;
  } catch {
    return cached.token === token ? cached : { token, valid: false, reason: 'offline' };
  }
}

export function restoreLicense(token: string): void {
  localStorage.setItem(KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export const checkoutUrl = `${API}/products/${SLUG}/checkout`;
