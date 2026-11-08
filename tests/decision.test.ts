import { describe, expect, it } from 'vitest';
import { sendBlockReason, unresolved } from '@/lib/security/decision';
import { classifyAccount, SYSTEM } from '@/lib/solana/classify';
import type { TransferAttempt, TransferDraft, TrustedContact } from '@/types';

const recipient = 'FVen3X669xLzsi6N2V91DoiyzHzg1uAgqiT8jZ9nS96Z';
const sender = '4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi';
const draft: TransferDraft = { walletAddress: sender, recipientAddress: recipient, cluster: 'devnet', lamports: '1000000' };
const eligible = classifyAccount({ address: recipient, network: 'devnet', onCurve: true, account: { owner: SYSTEM, space: 0, executable: false } });
const prior: TransferAttempt = { ...draft, id: 'unit-attempt', status: 'submitted', createdAt: '2026-11-08T09:00:00.000Z', updatedAt: '2026-11-08T09:00:00.000Z' };

describe('send eligibility and duplicate-payment guards', () => {
  it('permits an eligible unknown recipient to reach deliberate review, without claiming identity', () => {
    expect(sendBlockReason(draft, eligible, [])).toBeNull();
    expect(eligible.warnings.join(' ')).toContain('does not prove identity');
  });
  it('blocks mainnet even if the inspection itself is eligible', () => {
    expect(sendBlockReason({ ...draft, cluster: 'mainnet-beta' }, { ...eligible, network: 'mainnet-beta' }, [])).toMatch(/read-only/);
  });
  it('requires a connected wallet', () => {
    expect(sendBlockReason({ ...draft, walletAddress: '' }, eligible, [])).toMatch(/Connect/);
  });
  it('invalidates the old result when the address changes', () => {
    expect(sendBlockReason({ ...draft, recipientAddress: sender }, eligible, [])).toMatch(/exact recipient/);
  });
  it('invalidates an inspection from another network', () => {
    expect(sendBlockReason(draft, { ...eligible, network: 'mainnet-beta' }, [])).toMatch(/selected network/);
  });
  it('does not send without an inspection', () => {
    expect(sendBlockReason(draft, null, [])).toMatch(/Inspect/);
  });
  it('fails closed on unavailable RPC regardless of an old eligible field', () => {
    expect(sendBlockReason(draft, { ...eligible, rpcSourceStatus: 'unavailable', explanation: 'RPC unavailable' }, [])).toBe('RPC unavailable');
  });
  it('blocks self-transfer', () => {
    expect(sendBlockReason({ ...draft, walletAddress: recipient }, eligible, [])).toMatch(/connected wallet/);
  });
  it('blocks a newly added similar contact even after prior successful inspection', () => {
    const contact: TrustedContact = { id: 'lookalike', address: `${recipient.slice(0, 20)}1${recipient.slice(21)}`, displayName: 'Unit fixture', cluster: 'devnet', method: 'user_saved', notes: '', addedAt: prior.createdAt };
    expect(sendBlockReason(draft, eligible, [contact])).toMatch(/resembles/);
  });
  it.each(['draft', 'awaiting_wallet', 'submitted', 'confirming', 'unknown'] as const)('blocks a second payment while an earlier attempt is %s', status => {
    expect(unresolved({ ...prior, status })).toBe(true);
    expect(sendBlockReason(draft, eligible, [], [{ ...prior, status, recipientAddress: sender }])).toMatch(/unresolved/);
  });
  it.each(['blocked', 'confirmed', 'failed', 'expired'] as const)('does not consider a terminal %s payment unresolved', status => {
    expect(unresolved({ ...prior, status })).toBe(false);
    expect(sendBlockReason(draft, eligible, [], [{ ...prior, status }])).toBeNull();
  });
  it('does not apply another sender’s pending-payment lock', () => {
    expect(sendBlockReason(draft, eligible, [], [{ ...prior, walletAddress: recipient }])).toBeNull();
  });
});
