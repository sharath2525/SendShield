import { describe, expect, it } from 'vitest';
import { verifyTransactionEvidence } from '@/lib/solana/receipt';
import { SYSTEM, TOKEN } from '@/lib/solana/classify';
import type { TransferAttempt } from '@/types';

// Synthetic parsed-transaction fixtures only. These signatures were not submitted.
const sender = '4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi';
const recipient = 'FVen3X669xLzsi6N2V91DoiyzHzg1uAgqiT8jZ9nS96Z';
const sig = '3'.repeat(88);
const attempt: TransferAttempt = { id: 'unit-only', walletAddress: sender, recipientAddress: recipient, lamports: '1000000', cluster: 'devnet', status: 'submitted', transactionSignature: sig, createdAt: '2026-11-08T09:00:00.000Z', updatedAt: '2026-11-08T09:00:00.000Z' };
function transaction() {
  return {
    slot: 123456n,
    meta: { err: null, fee: 5000n },
    transaction: {
      signatures: [sig],
      message: {
        accountKeys: [{ pubkey: sender, signer: true, writable: true }, { pubkey: recipient, signer: false, writable: true }, { pubkey: SYSTEM, signer: false, writable: false }],
        instructions: [{ programId: SYSTEM, parsed: { type: 'transfer', info: { source: sender, destination: recipient, lamports: 1000000n } } }],
      },
    },
  };
}

describe('independent parsed-transaction receipt evidence', () => {
  it('verifies exact sender, recipient, lamports, fee, signature, and slot', () => {
    expect(verifyTransactionEvidence(transaction(), attempt)).toEqual({ slot: '123456', fee: '5000' });
  });
  it.each([null, undefined, {}, { confirmationStatus: 'confirmed' }, { value: { err: null } }])('never accepts missing transaction details as confirmation: %j', raw => {
    expect(() => verifyTransactionEvidence(raw, attempt)).toThrow();
  });
  it('rejects onchain instruction errors even when a signature exists', () => {
    const raw = transaction();
    const failed = { ...raw, meta: { fee: 5000n, err: { InstructionError: [0, 'InsufficientFunds'] } } };
    expect(() => verifyTransactionEvidence(failed, attempt)).toThrow();
  });
  it.each(['walletAddress', 'recipientAddress', 'lamports', 'transactionSignature'] as const)('rejects reviewed %s mismatch', field => {
    const other = field === 'lamports' ? '1000001' : field === 'transactionSignature' ? '4'.repeat(88) : SYSTEM;
    expect(() => verifyTransactionEvidence(transaction(), { ...attempt, [field]: other })).toThrow();
  });
  it('requires the reviewed source to be the fee payer', () => {
    const raw = transaction(); raw.transaction.message.accountKeys[0].pubkey = recipient;
    expect(() => verifyTransactionEvidence(raw, attempt)).toThrow();
  });
  it.each(['signer', 'writable'] as const)('requires the fee payer to be %s', field => {
    const raw = transaction(); raw.transaction.message.accountKeys[0][field] = false;
    expect(() => verifyTransactionEvidence(raw, attempt)).toThrow();
  });
  it('rejects an extra instruction instead of verifying only the first transfer', () => {
    const raw = transaction(); raw.transaction.message.instructions.push(raw.transaction.message.instructions[0]);
    expect(() => verifyTransactionEvidence(raw, attempt)).toThrow();
  });
  it('rejects extra transaction signatures', () => {
    const raw = transaction(); raw.transaction.signatures.push('4'.repeat(88));
    expect(() => verifyTransactionEvidence(raw, attempt)).toThrow();
  });
  it('rejects another program with a similar parsed transfer', () => {
    const raw = transaction(); raw.transaction.message.instructions[0].programId = TOKEN;
    expect(() => verifyTransactionEvidence(raw, attempt)).toThrow();
  });
  it('rejects a different System Program instruction type', () => {
    const raw = transaction(); raw.transaction.message.instructions[0].parsed.type = 'createAccount';
    expect(() => verifyTransactionEvidence(raw, attempt)).toThrow();
  });
  it('rejects a transfer whose source differs even with a correct fee payer', () => {
    const raw = transaction(); raw.transaction.message.instructions[0].parsed.info.source = recipient;
    expect(() => verifyTransactionEvidence(raw, attempt)).toThrow();
  });
  it('rejects unsafe JavaScript numeric evidence instead of silently rounding', () => {
    const raw = transaction();
    expect(() => verifyTransactionEvidence({ ...raw, slot: Number.MAX_SAFE_INTEGER + 1 }, attempt)).toThrow();
  });
  it('accepts exact decimal string representation of RPC integers', () => {
    const raw = transaction();
    expect(verifyTransactionEvidence({ ...raw, slot: '123456', meta: { err: null, fee: '5000' } }, attempt)).toEqual({ slot: '123456', fee: '5000' });
  });
});
