import { describe, expect, it } from 'vitest';
import { compareAddresses, compareContacts } from '@/lib/security/compare-addresses';
import type { TrustedContact } from '@/types';

// All comparisons here are deterministic synthetic strings, never live attack detections.
const original = 'FVen3X669xLzsi6N2V91DoiyzHzg1uAgqiT8jZ9nS96Z';
const contact: TrustedContact = { id: 'unit-contact', displayName: 'Unit fixture', address: original, cluster: 'devnet', method: 'user_saved', notes: '', addedAt: '2026-11-08T09:00:00.000Z' };

describe('full-address comparison', () => {
  it('reports canonical equality without overlap between prefix and suffix', () => {
    const result = compareAddresses(original, contact);
    expect(result).toMatchObject({ kind: 'MATCH', prefix: original.length, suffix: 0, firstMismatch: null, changedPositions: [] });
  });
  it('finds a one-character middle replacement and exact changed index', () => {
    const candidate = `${original.slice(0, 20)}1${original.slice(21)}`;
    expect(compareAddresses(candidate, contact)).toMatchObject({ kind: 'LOOKALIKE_REVIEW', prefix: 20, suffix: original.length - 21, firstMismatch: 20, changedPositions: [20] });
  });
  it('blocks a one-character change at the last edge', () => {
    expect(compareAddresses(`${original.slice(0, -1)}1`, contact)).toMatchObject({ kind: 'LOOKALIKE_REVIEW', suffix: 0, changedPositions: [original.length - 1] });
  });
  it('blocks a one-character change at the first edge', () => {
    expect(compareAddresses(`1${original.slice(1)}`, contact)).toMatchObject({ kind: 'LOOKALIKE_REVIEW', prefix: 0, changedPositions: [0] });
  });
  it('blocks four shared characters at both edges despite a different middle', () => {
    const candidate = `${original.slice(0, 4)}${'1'.repeat(original.length - 8)}${original.slice(-4)}`;
    const result = compareAddresses(candidate, contact);
    expect(result.kind).toBe('LOOKALIKE_REVIEW');
    expect(result.prefix).toBe(4); expect(result.suffix).toBe(4);
  });
  it('does not turn three shared edge characters into full trust', () => {
    const candidate = `${original.slice(0, 3)}${'1'.repeat(original.length - 3)}`;
    expect(compareAddresses(candidate, contact).kind).toBe('CAUTION');
  });
  it('handles different lengths without inventing aligned changed positions', () => {
    expect(compareAddresses(`${original.slice(0, 8)}111${original.slice(-8)}`, contact)).toMatchObject({ kind: 'LOOKALIKE_REVIEW', changedPositions: [] });
  });
  it('reports unrelated addresses as different', () => {
    expect(compareAddresses('1'.repeat(32), contact).kind).toBe('DIFFERENT');
  });
  it('never uses contacts from a different cluster as evidence', () => {
    expect(compareContacts(original, 'mainnet-beta', [contact])).toEqual([]);
    expect(compareContacts(original, 'devnet', [contact, { ...contact, id: 'mainnet', cluster: 'mainnet-beta' }])).toHaveLength(1);
  });
  it('compares every same-network contact even when there is an exact match', () => {
    const similar = { ...contact, id: 'near', address: `${original.slice(0, 20)}1${original.slice(21)}` };
    expect(compareContacts(original, 'devnet', [contact, similar]).map(m => m.kind)).toEqual(['MATCH', 'LOOKALIKE_REVIEW']);
  });
});
