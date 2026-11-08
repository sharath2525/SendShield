import type { Cluster, SimilarityMatch, TrustedContact } from '@/types';
export function compareAddresses(candidate: string, contact: TrustedContact): SimilarityMatch {
  const trusted = contact.address; const shortest = Math.min(candidate.length, trusted.length);
  let prefix = 0; while (prefix < shortest && candidate[prefix] === trusted[prefix]) prefix++;
  let suffix = 0; while (suffix < shortest - prefix && candidate[candidate.length - suffix - 1] === trusted[trusted.length - suffix - 1]) suffix++;
  const exact = candidate === trusted;
  const changedPositions = candidate.length === trusted.length ? [...candidate].flatMap((c, i) => c === trusted[i] ? [] : [i]) : [];
  // Two 4-character edges, or a near-identical address with a single edge changed.
  const near = (prefix >= 4 && suffix >= 4) || (candidate.length === trusted.length && changedPositions.length <= 2);
  return { contact, prefix, suffix, changedPositions, firstMismatch: exact ? null : prefix,
    kind: exact ? 'MATCH' : near ? 'LOOKALIKE_REVIEW' : prefix >= 3 || suffix >= 3 ? 'CAUTION' : 'DIFFERENT' };
}
export function compareContacts(candidate: string, cluster: Cluster, contacts: TrustedContact[]) {
  return contacts.filter(c => c.cluster === cluster).map(c => compareAddresses(candidate, c));
}
