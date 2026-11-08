import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransferAttempt } from '@/types';

// LocalStorage substitute only for deterministic unit tests; does not touch the user's browser.
const sender = '4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi';
const recipient = 'FVen3X669xLzsi6N2V91DoiyzHzg1uAgqiT8jZ9nS96Z';
const createdAt = '2026-11-08T09:00:00.000Z';
const updatedAt = '2026-11-08T09:00:01.000Z';
const latestTime = '2026-11-08T09:00:02.000Z';
const draft: TransferAttempt = { id: 'unit-cas', walletAddress: sender, recipientAddress: recipient, lamports: '1000000', cluster: 'devnet', status: 'awaiting_wallet', createdAt, updatedAt, lastValidBlockHeight: '150' };
let data: Map<string, string>;
let storage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn>; removeItem: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };
let store: typeof import('@/lib/storage/store');

describe('storage stale-write guards and recovery', () => {
  beforeEach(async () => {
    vi.resetModules();
    data = new Map();
    storage = { getItem: vi.fn((key: string) => data.get(key) ?? null), setItem: vi.fn((key: string, value: string) => { data.set(key, value); }), removeItem: vi.fn((key: string) => { data.delete(key); }), clear: vi.fn(() => { data.clear(); }) };
    vi.stubGlobal('localStorage', storage);
    store = await import('@/lib/storage/store');
    store.initializeStore();
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('ignores a stale RPC update when another tab has since persisted the signature', () => {
    store.recordAttempt(draft);
    const newer: TransferAttempt = { ...draft, status: 'submitted', transactionSignature: '3'.repeat(88), updatedAt: latestTime };
    data.set(store.STORAGE_KEY, JSON.stringify({ version: 1, contacts: [], attempts: [newer] }));
    store.recordAttempt({ ...draft, status: 'expired', updatedAt: '2026-11-08T09:00:03.000Z' }, draft.updatedAt);
    expect(store.getSnapshot().attempts).toEqual([newer]);
    expect(store.decodeStorage(data.get(store.STORAGE_KEY)!).attempts).toEqual([newer]);
  });
  it('accepts an update when the expected previous timestamp matches', () => {
    store.recordAttempt(draft);
    store.recordAttempt({ ...draft, status: 'unknown', updatedAt: latestTime }, draft.updatedAt);
    expect(store.getSnapshot().attempts[0]).toMatchObject({ status: 'unknown', updatedAt: latestTime });
  });
  it('does not create a new record from an update for a vanished expected version', () => {
    store.recordAttempt({ ...draft, status: 'expired' }, draft.updatedAt);
    expect(store.getSnapshot().attempts).toEqual([]);
  });
  it('never drops a recorded signature or lifetime during a later partial update', () => {
    store.recordAttempt({ ...draft, transactionSignature: '3'.repeat(88), status: 'submitted' });
    store.recordAttempt({ ...draft, transactionSignature: undefined, lastValidBlockHeight: undefined, status: 'unknown', updatedAt: latestTime });
    expect(store.getSnapshot().attempts[0]).toMatchObject({ status: 'unknown', transactionSignature: '3'.repeat(88), lastValidBlockHeight: '150' });
  });
  it('does not replace a persisted signature and lifetime with contradictory update values', () => {
    store.recordAttempt({ ...draft, transactionSignature: '3'.repeat(88), status: 'submitted' });
    store.recordAttempt({ ...draft, transactionSignature: '4'.repeat(88), lastValidBlockHeight: '999', updatedAt: latestTime });
    expect(store.getSnapshot().attempts[0]).toMatchObject({ transactionSignature: '3'.repeat(88), lastValidBlockHeight: '150' });
  });
  it('preserves a recently saved attempt from another tab when recording this payment', () => {
    const other: TransferAttempt = { ...draft, id: 'other-tab', status: 'unknown' };
    data.set(store.STORAGE_KEY, JSON.stringify({ version: 1, contacts: [], attempts: [other] }));
    store.recordAttempt(draft);
    expect(store.getSnapshot().attempts.map(a => a.id)).toEqual(['unit-cas', 'other-tab']);
  });
  it('exposes an in-memory warning when writing storage is denied', () => {
    storage.setItem.mockImplementation(() => { throw new Error('unit quota denial'); });
    store.recordAttempt(draft);
    expect(store.getSnapshot().attempts[0]).toEqual(draft);
    expect(store.getSnapshot().notice).toMatch(/In-memory/);
  });
  it('requires a fresh RPC check for a persisted confirmed receipt on initialization', async () => {
    const confirmed: TransferAttempt = { ...draft, status: 'confirmed', transactionSignature: '3'.repeat(88) };
    data.set(store.STORAGE_KEY, JSON.stringify({ version: 1, contacts: [], attempts: [confirmed] }));
    vi.resetModules();
    store = await import('@/lib/storage/store');
    store.initializeStore();
    expect(store.getSnapshot().attempts[0]).toMatchObject({ status: 'confirming' });
  });
});
