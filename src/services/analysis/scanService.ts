import { getGuardianBlocklist } from '../../types/guardian';

function extractDomain(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split(/[/?#]/)[0];
}

function matchesBlockedDomain(candidateDomain: string, blockedDomain: string): boolean {
  return candidateDomain === blockedDomain || candidateDomain.endsWith(`.${blockedDomain}`);
}

export interface GuardianBlockMatch {
  blockedUrl: string;
  domain: string;
}

export function findGuardianBlockMatch(url: string): GuardianBlockMatch | null {
  const domain = extractDomain(url);
  const blocklist = getGuardianBlocklist();

  const match = blocklist.find((entry) => matchesBlockedDomain(domain, entry.domain));
  if (!match) return null;

  return { blockedUrl: url, domain: match.domain };
}

export function checkGuardianBlocklist(url: string): boolean {
  return findGuardianBlockMatch(url) !== null;
}
