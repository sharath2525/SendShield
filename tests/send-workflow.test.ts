import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assertIsTransactionWithBlockhashLifetime, assertIsTransactionWithinSizeLimit, generateKeyPairSigner, getCompiledTransactionMessageDecoder, type Transaction, type TransactionModifyingSigner, type TransactionWithLifetime, type TransactionWithinSizeLimit } from '@solana/kit';
import { getTransferSolInstructionDataDecoder } from '@solana-program/system';
import { classifyAccount, SYSTEM, TOKEN } from '@/lib/solana/classify';
import type { TransferAttempt, TransferDraft } from '@/types';

// UNIT TEST ONLY: real SDK message building and ephemeral in-memory signing; every RPC call is mocked.
// Nothing is submitted to Solana, no user wallet is accessed, and no signing key is stored or printed.
const mock = vi.hoisted(() => ({
  inspect: vi.fn(), assertCluster: vi.fn(), recheck: vi.fn(), latestBlockhash: vi.fn(), balance: vi.fn(), rent: vi.fn(), fee: vi.fn(), height: vi.fn(), broadcast: vi.fn(), sendTransaction: vi.fn(),
}));
vi.mock('@/lib/solana/inspect', () => ({ inspectRecipient: mock.inspect }));
vi.mock('@/lib/solana/receipt', () => ({ recheckAttempt: mock.recheck }));
vi.mock('@/lib/solana/rpc', () => ({
  assertCluster: mock.assertCluster,
  rpcOptions: () => ({}),
  rpcFor: () => ({
    getLatestBlockhash: () => ({ send: mock.latestBlockhash }),
    getBalance: () => ({ send: mock.balance }),
    getMinimumBalanceForRentExemption: () => ({ send: mock.rent }),
    getFeeForMessage: () => ({ send: mock.fee }),
    getBlockHeight: () => ({ send: mock.height }),
    sendTransaction: mock.sendTransaction,
  }),
}));
import { sendGuardedTransfer } from '@/lib/solana/send';
import { computePolicyInstructions, COMPUTE_PROGRAM } from '@/lib/solana/compute-policy';

const recipient = 'FVen3X669xLzsi6N2V91DoiyzHzg1uAgqiT8jZ9nS96Z';
const inspection = classifyAccount({ address: recipient, network: 'devnet', onCurve: true, account: { owner: SYSTEM, space: 0, executable: false } });
let signer: TransactionModifyingSigner;
let draft: TransferDraft;
let updates: TransferAttempt[];
let requestedTransactions: readonly Transaction[];
let sign: ReturnType<typeof vi.fn<TransactionModifyingSigner['modifyAndSignTransactions']>>;
let current: ReturnType<typeof vi.fn<() => boolean>>;

function options() {
  return { draft, signer, contacts: () => [], attempts: () => [], stillCurrent: current, onUpdate: (a: TransferAttempt) => { updates.push(a); } };
}

describe('guarded transfer workflow with mocked network and ephemeral unit signer', () => {
  beforeEach(async () => {
    const keypair = await generateKeyPairSigner();
    updates = []; requestedTransactions = []; current = vi.fn(() => true);
    sign = vi.fn(async transactions => {
      requestedTransactions = transactions;
      const signable = transactions.map(tx => { assertIsTransactionWithBlockhashLifetime(tx); assertIsTransactionWithinSizeLimit(tx); return tx; });
      const signatures = await keypair.signTransactions(signable);
      return signable.map((tx, i) => ({ ...tx, signatures: { ...tx.signatures, ...signatures[i] } }));
    });
    signer = { address: keypair.address, modifyAndSignTransactions: sign };
    draft = { walletAddress: keypair.address, recipientAddress: recipient, cluster: 'devnet', lamports: '1000000' };
    mock.inspect.mockResolvedValue(inspection);
    mock.assertCluster.mockResolvedValue(undefined);
    mock.latestBlockhash.mockResolvedValue({ value: { blockhash: SYSTEM, lastValidBlockHeight: 150n } });
    mock.balance.mockResolvedValue({ value: 1_000_000_000n });
    mock.rent.mockResolvedValue(890880n);
    mock.fee.mockResolvedValue({ value: 5000n });
    mock.height.mockResolvedValue(100n);
    mock.broadcast.mockImplementation(async () => updates.at(-1)?.transactionSignature);
    mock.sendTransaction.mockImplementation(() => ({ send: mock.broadcast }));
    mock.recheck.mockImplementation(async (a: TransferAttempt) => ({ ...a, status: 'confirmed', slot: '100', fee: '5000' }));
  });

  it('builds exactly one System Program SOL transfer with exact reviewed accounts and lamports', async () => {
    const result = await sendGuardedTransfer(options());
    expect(result.status).toBe('confirmed');
    expect(requestedTransactions).toHaveLength(1);
    const message = getCompiledTransactionMessageDecoder().decode(requestedTransactions[0].messageBytes);
    expect(message.version).toBe(0);
    if (message.version !== 0) throw new Error('Unit test expected v0 message');
    expect(message.staticAccounts[0]).toBe(draft.walletAddress);
    expect(message.instructions).toHaveLength(3);
    for (const [i, expected] of computePolicyInstructions().entries()) {
      expect(message.staticAccounts[message.instructions[i].programAddressIndex]).toBe(COMPUTE_PROGRAM);
      expect(message.instructions[i].data).toEqual(expected.data);
    }
    const instruction = message.instructions[2];
    expect(message.staticAccounts[instruction.programAddressIndex]).toBe(SYSTEM);
    expect(instruction.accountIndices?.map(i => message.staticAccounts[i])).toEqual([draft.walletAddress, recipient]);
    expect(getTransferSolInstructionDataDecoder().decode(instruction.data!)).toMatchObject({ amount: 1000000n });
    expect(mock.inspect).toHaveBeenCalledTimes(2);
    expect(sign).toHaveBeenCalledTimes(1);
    expect(mock.broadcast).toHaveBeenCalledTimes(1);
    expect(mock.sendTransaction.mock.calls[0][1]).toMatchObject({ skipPreflight: false, maxRetries: 0n, preflightCommitment: 'confirmed' });
    expect(updates.map(a => a.status)).toEqual(['awaiting_wallet', 'confirming', 'submitted', 'confirming', 'confirmed']);
    expect(updates[1].transactionSignature).toBeTruthy();
  });
  it('stops on wallet rejection without broadcast or a success receipt', async () => {
    sign.mockRejectedValue(new Error('User rejected this unit test request'));
    const result = await sendGuardedTransfer(options());
    expect(result.status).toBe('unknown');
    expect(result.transactionSignature).toBeUndefined();
    expect(mock.broadcast).not.toHaveBeenCalled();
    expect(mock.recheck).not.toHaveBeenCalled();
  });
  it('rejects wallet-modified message bytes before any broadcast', async () => {
    sign.mockImplementation(async transactions => transactions.map(tx => ({ ...tx, messageBytes: new Uint8Array([...tx.messageBytes, 0]) }) as unknown as Transaction & TransactionWithLifetime & TransactionWithinSizeLimit));
    const result = await sendGuardedTransfer(options());
    expect(result.status).toBe('unknown');
    expect(result.message).toMatch(/SendShield will not retry/);
    expect(mock.broadcast).not.toHaveBeenCalled();
  });
  it('retains the deterministic signature and does not retry an ambiguous broadcast', async () => {
    mock.broadcast.mockRejectedValue(new Error('Unit test HTTP response lost'));
    const result = await sendGuardedTransfer(options());
    expect(result).toMatchObject({ status: 'unknown', errorCode: 'WALLET_OUTCOME_UNCERTAIN' });
    expect(result.transactionSignature).toBeTruthy();
    expect(updates.find(a => a.status === 'submitted')?.transactionSignature).toBe(result.transactionSignature);
    expect(mock.broadcast).toHaveBeenCalledTimes(1);
    expect(sign).toHaveBeenCalledTimes(1);
  });
  it('blocks when recipient type changes between review and signing', async () => {
    mock.inspect.mockResolvedValueOnce(inspection).mockResolvedValueOnce(classifyAccount({ address: recipient, network: 'devnet', onCurve: true, account: { owner: TOKEN, parsedType: 'mint', executable: false, space: 82 } }));
    const result = await sendGuardedTransfer(options());
    expect(result.status).toBe('unknown');
    expect(mock.broadcast).not.toHaveBeenCalled();
  });
  it('blocks changed draft details before requesting the wallet', async () => {
    current.mockReturnValue(false);
    expect((await sendGuardedTransfer(options())).status).toBe('blocked');
    expect(sign).not.toHaveBeenCalled();
    expect(mock.broadcast).not.toHaveBeenCalled();
  });
  it('blocks changed draft details while the wallet dialog was open', async () => {
    current.mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValue(false);
    expect((await sendGuardedTransfer(options())).status).toBe('unknown');
    expect(sign).toHaveBeenCalledTimes(1);
    expect(mock.broadcast).not.toHaveBeenCalled();
  });
  it('expires a signed transaction before broadcast when its blockhash lifetime ended', async () => {
    mock.height.mockResolvedValue(151n);
    expect((await sendGuardedTransfer(options())).status).toBe('expired');
    expect(mock.broadcast).not.toHaveBeenCalled();
  });
  it('requires sufficient balance for amount, fee, rent and reserve before signing', async () => {
    mock.balance.mockResolvedValue({ value: 1_000_000n });
    const result = await sendGuardedTransfer(options());
    expect(result.status).toBe('blocked');
    expect(result.message).toMatch(/Insufficient/);
    expect(sign).not.toHaveBeenCalled();
  });
  it('requires a usable fee estimate before signing', async () => {
    mock.fee.mockResolvedValue({ value: null });
    expect((await sendGuardedTransfer(options())).status).toBe('blocked');
    expect(sign).not.toHaveBeenCalled();
  });
  it('blocks mainnet without calling inspection or the wallet', async () => {
    draft.cluster = 'mainnet-beta';
    expect((await sendGuardedTransfer(options())).status).toBe('blocked');
    expect(mock.inspect).not.toHaveBeenCalled();
    expect(sign).not.toHaveBeenCalled();
  });
  it('blocks an existing unresolved payment before signing another', async () => {
    const pending: TransferAttempt = { ...draft, id: 'earlier', status: 'unknown', createdAt: '2026-11-08T09:00:00.000Z', updatedAt: '2026-11-08T09:00:00.000Z' };
    expect((await sendGuardedTransfer({ ...options(), attempts: () => [pending] })).status).toBe('blocked');
    expect(sign).not.toHaveBeenCalled();
  });
});
