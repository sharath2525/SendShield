import { describe, expect, it } from 'vitest';
import { decodeStorage } from '@/lib/storage/store';
import type { TransferAttempt, TrustedContact } from '@/types';

const address = 'FVen3X669xLzsi6N2V91DoiyzHzg1uAgqiT8jZ9nS96Z';
const date = '2026-11-08T09:00:00.000Z';
const contact: TrustedContact = { id: 'unit-contact', displayName: 'Test recipient', address, cluster: 'devnet', method: 'user_saved', notes: 'Synthetic unit fixture, no identity claim.', addedAt: date };
const attempt: TransferAttempt = { id: 'unit-attempt', walletAddress: address, recipientAddress: address, cluster: 'devnet', lamports: '1000000', status: 'submitted', transactionSignature: '3'.repeat(88), createdAt: date, updatedAt: date };
const encode = (contacts: unknown[] = [contact], attempts: unknown[] = [attempt]) => JSON.stringify({ version: 1, contacts, attempts });

describe('versioned, schema-validated local browser data', () => {
  it('round-trips contacts and pending attempts across JSON persistence', () => {
    const result = decodeStorage(encode());
    expect(result.contacts).toEqual([contact]);
    expect(result.attempts).toEqual([attempt]);
    expect(decodeStorage(JSON.stringify(result))).toEqual(result);
  });
  it.each(['', '{', 'null', '[]', '{"version":99,"contacts":[],"attempts":[]}', '{"version":1}'])('rejects malformed or unsupported storage: %j', value => {
    expect(() => decodeStorage(value)).toThrow();
  });
  it('rejects duplicate same-network addresses rather than silently overriding trust', () => {
    expect(() => decodeStorage(encode([contact, { ...contact, id: 'duplicate', displayName: 'Another label' }]))).toThrow(/Duplicate contacts/);
  });
  it('keeps the same address on different networks separate', () => {
    expect(decodeStorage(encode([contact, { ...contact, id: 'mainnet-copy', cluster: 'mainnet-beta' }])).contacts).toHaveLength(2);
  });
  it('rejects duplicate transfer attempt IDs', () => {
    expect(() => decodeStorage(encode([], [attempt, attempt]))).toThrow(/Duplicate attempts/);
  });
  it('rejects duplicate contact IDs even when addresses and networks differ', () => {
    expect(() => decodeStorage(encode([contact, { ...contact, cluster: 'mainnet-beta' }], []))).toThrow(/Duplicate contact IDs/);
  });
  it.each([
    { address: 'not-an-address' },
    { address: `${address} ` },
    { method: 'signed_ownership_proof' },
    { cluster: 'testnet' },
    { displayName: '' },
    { displayName: 'x'.repeat(61) },
    { notes: 'x'.repeat(501) },
    { addedAt: 'yesterday' },
  ])('rejects invalid contact fields %j', patch => {
    expect(() => decodeStorage(encode([{ ...contact, ...patch }], []))).toThrow();
  });
  it.each([
    { lamports: '-1' },
    { lamports: '0.001' },
    { lamports: '1e6' },
    { lamports: '9'.repeat(21) },
    { status: 'success' },
    { transactionSignature: 'fake transaction' },
    { lastValidBlockHeight: 'NaN' },
    { updatedAt: 'not-a-date' },
    { walletAddress: 'not-a-key' },
  ])('rejects invalid attempt fields %j', patch => {
    expect(() => decodeStorage(encode([], [{ ...attempt, ...patch }]))).toThrow();
  });
  it('bounds imported contact and attempt counts', () => {
    expect(() => decodeStorage(encode(Array.from({ length: 501 }, () => contact), []))).toThrow();
    expect(() => decodeStorage(encode([], Array.from({ length: 201 }, () => attempt)))).toThrow();
  });
});
