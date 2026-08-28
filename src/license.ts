const SLUG = 'scan-count-pad';
const KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${KEY}:verdict`;
const API = 'https://api.sociobot.in/api/v1';

export interface LicenseState { token?: string; valid: boolean; checkedAt?: number; reason?: string; }

export function captureLicense(): string | undefined {
  const url = new URL(location.href);
  const token = url.searchParams.get('license')?.trim();
  if (token) {
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
  try {
    const response = await fetch(`${API}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
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
