export interface BlockedEntry {
  id: number;
  domain: string;
  category: string;
  note: string;
  addedAt: string;
}

export const GUARDIAN_ENABLED_KEY = 'guardian_enabled';
export const GUARDIAN_BLOCKLIST_KEY = 'guardian_blocklist';
export const GUARDIAN_PIN_HASH_KEY = 'guardian_pin_hash';
export const GUARDIAN_PIN_SESSION_KEY = 'guardian_pin_session';
export const GUARDIAN_BIOMETRIC_KEY = 'guardian_biometric_enabled';

export function getGuardianEnabled(): boolean {
  return localStorage.getItem(GUARDIAN_ENABLED_KEY) === 'true';
}

export function getGuardianBlocklist(): BlockedEntry[] {
  try {
    const raw = localStorage.getItem(GUARDIAN_BLOCKLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hasGuardianPin(): boolean {
  return localStorage.getItem(GUARDIAN_PIN_HASH_KEY) !== null;
}

export function saveGuardianBlocklist(entries: BlockedEntry[]): void {
  localStorage.setItem(GUARDIAN_BLOCKLIST_KEY, JSON.stringify(entries));
}

export function formatAddedAt(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
