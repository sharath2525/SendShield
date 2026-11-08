import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransferAttempt } from '@/types';
import { SYSTEM } from '@/lib/solana/classify';

// Deliberate RPC UNIT MOCKS. No network request, signed transaction, or live success occurs.
const mock = vi.hoisted(() => ({ assertCluster: vi.fn(), status: vi.fn(), transaction: vi.fn(), blockHeight: vi.fn() }));
vi.mock('@/lib/solana/rpc', () => ({
  assertCluster: mock.assertCluster,
  rpcOptions: () => ({}),
  rpcFor: () => ({
    getSignatureStatuses: () => ({ send: mock.status }),
    getTransaction: () => ({ send: mock.transaction }),
    getBlockHeight: () => ({ send: mock.blockHeight }),
  }),
}));
import { recheckAttempt } from '@/lib/solana/receipt';

const sender = '4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi';
const recipient = 'FVen3X669xLzsi6N2V91DoiyzHzg1uAgqiT8jZ9nS96Z';
const sig = '3'.repeat(88);
const attempt: TransferAttempt = { id: 'unit-confirmation', walletAddress: sender, recipientAddress: recipient, lamports: '1000000', cluster: 'devnet', status: 'submitted', transactionSignature: sig, lastValidBlockHeight: '150', createdAt: '2026-11-08T09:00:00.000Z', updatedAt: '2026-11-08T09:00:00.000Z' };
const tx = { slot: 100n, meta: { err: null, fee: 5000n }, transaction: { signatures: [sig], message: { accountKeys: [{ pubkey: sender, signer: true, writable: true }], instructions: [{ programId: SYSTEM, parsed: { type: 'transfer', info: { source: sender, destination: recipient, lamports: 1000000n } } }] } } };

describe('receipt confirmation state machine with explicit mocked RPC', () => {
  beforeEach(() => {
    mock.assertCluster.mockResolvedValue(undefined);
    mock.status.mockResolvedValue({ value: [null] });
    mock.transaction.mockResolvedValue(null);
    mock.blockHeight.mockResolvedValue(100n);
  });
  it('keeps a signature not yet found pending, never confirmed', async () => {
    expect((await recheckAttempt(attempt)).status).toBe('confirming');
    expect(mock.transaction).not.toHaveBeenCalled();
  });
  it('does not accept processed-only status as confirmation', async () => {
    mock.status.mockResolvedValue({ value: [{ confirmationStatus: 'processed', err: null }] });
    expect((await recheckAttempt(attempt)).status).toBe('confirming');
    expect(mock.transaction).not.toHaveBeenCalled();
  });
  it('requires transaction details even when the signature is confirmed', async () => {
    mock.status.mockResolvedValue({ value: [{ confirmationStatus: 'confirmed', err: null }] });
    expect((await recheckAttempt(attempt)).status).toBe('confirming');
  });
  it('marks confirmed only after matching actual parsed transaction evidence', async () => {
    mock.status.mockResolvedValue({ value: [{ confirmationStatus: 'confirmed', err: null }] });
    mock.transaction.mockResolvedValue(tx);
    expect(await recheckAttempt(attempt)).toMatchObject({ status: 'confirmed', slot: '100', fee: '5000' });
  });
  it('reports a mismatched transaction as unknown instead of confirmed', async () => {
    mock.status.mockResolvedValue({ value: [{ confirmationStatus: 'finalized', err: null }] });
    mock.transaction.mockResolvedValue({ ...tx, transaction: { ...tx.transaction, signatures: ['4'.repeat(88)] } });
    expect(await recheckAttempt(attempt)).toMatchObject({ status: 'unknown', errorCode: 'RECEIPT_MISMATCH' });
  });
  it('reports an onchain error as failed', async () => {
    mock.status.mockResolvedValue({ value: [{ confirmationStatus: 'confirmed', err: { InstructionError: [0, 'Custom'] } }] });
    expect(await recheckAttempt(attempt)).toMatchObject({ status: 'failed', errorCode: 'ONCHAIN_ERROR' });
  });
  it('expires an absent signature only after the finalized block height exceeds its lifetime', async () => {
    mock.blockHeight.mockResolvedValue(151n);
    expect((await recheckAttempt(attempt)).status).toBe('expired');
  });
  it('does not expire a signature that has already landed but is still processed', async () => {
    mock.blockHeight.mockResolvedValue(151n);
    mock.status.mockResolvedValue({ value: [{ confirmationStatus: 'processed', err: null }] });
    expect((await recheckAttempt(attempt)).status).toBe('confirming');
  });
  it('treats RPC timeout as unknown rather than failure or success', async () => {
    mock.status.mockRejectedValue(new Error('unit timeout'));
    expect((await recheckAttempt(attempt)).status).toBe('unknown');
  });
  it('fails closed for a mismatched RPC genesis', async () => {
    mock.assertCluster.mockRejectedValue(new Error('wrong cluster'));
    expect((await recheckAttempt(attempt)).status).toBe('unknown');
    expect(mock.status).not.toHaveBeenCalled();
  });
  it('does not accept missing submission signatures as confirmation', async () => {
    expect((await recheckAttempt({ ...attempt, transactionSignature: undefined })).status).toBe('unknown');
  });
  it.each(['failed', 'blocked', 'expired'] as const)('preserves a terminal %s attempt without a signature', async status => {
    const stopped = { ...attempt, status, transactionSignature: undefined };
    expect((await recheckAttempt(stopped)).status).toBe(status);
  });
});
