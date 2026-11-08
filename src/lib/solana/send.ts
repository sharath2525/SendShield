import { address, appendTransactionMessageInstruction, assertIsFullySignedTransaction, compileTransaction, createTransactionMessage, getBase64Decoder, getBase64EncodedWireTransaction, getSignatureFromTransaction, isTransactionModifyingSigner, pipe, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash } from '@solana/kit';
import type { WalletSigner } from '@solana/kit-plugin-wallet';
import type { TransactionMessageBytesBase64 } from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import type { TransferAttempt, TransferDraft, TrustedContact } from '@/types';
import { parseAmount, formatSol, FEE_RESERVE } from '@/lib/security/amounts';
import { sendBlockReason } from '@/lib/security/decision';
import { inspectRecipient } from './inspect';
import { assertCluster, rpcFor, rpcOptions } from './rpc';
import { recheckAttempt } from './receipt';
export async function sendGuardedTransfer(options: {
  draft: TransferDraft; signer: WalletSigner; contacts: () => TrustedContact[]; attempts: () => TransferAttempt[];
  stillCurrent: () => boolean; onUpdate: (attempt: TransferAttempt) => void;
}) {
  const { draft, signer, onUpdate } = options;
  let attempt: TransferAttempt = { ...draft, id: crypto.randomUUID(), status: 'draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const update = (patch: Partial<TransferAttempt>) => { attempt = { ...attempt, ...patch, updatedAt: new Date().toISOString() }; onUpdate(attempt); };
  let signed = false;
  try {
    if (!isTransactionModifyingSigner(signer)) throw new Error('This wallet must support signing without broadcasting (solana:signTransaction).');
    if (draft.cluster !== 'devnet' || signer.address !== draft.walletAddress) throw new Error('Devnet signer does not match the reviewed sender.');
    const amount = parseAmount(formatSol(draft.lamports));
    const inspection = await inspectRecipient(draft.recipientAddress, 'devnet');
    const reason = sendBlockReason(draft, inspection, options.contacts(), options.attempts());
    if (reason) throw new Error(reason);
    if (!options.stillCurrent()) throw new Error('Payment details or contacts changed. Review again.');
    const rpc = rpcFor('devnet');
    const [{ value: lifetime }, { value: balance }, rent] = await Promise.all([
      rpc.getLatestBlockhash({ commitment: 'confirmed' }).send(rpcOptions()),
      rpc.getBalance(address(draft.walletAddress), { commitment: 'confirmed' }).send(rpcOptions()),
      rpc.getMinimumBalanceForRentExemption(0n).send(rpcOptions()),
    ]);
    const message = pipe(createTransactionMessage({ version: 0 }), m => setTransactionMessageFeePayerSigner(signer, m), m => setTransactionMessageLifetimeUsingBlockhash(lifetime, m), m => appendTransactionMessageInstruction(getTransferSolInstruction({ source: signer, destination: address(draft.recipientAddress), amount }), m));
    const unsigned = compileTransaction(message);
    const { value: fee } = await rpc.getFeeForMessage(getBase64Decoder().decode(unsigned.messageBytes) as TransactionMessageBytesBase64, { commitment: 'confirmed' }).send(rpcOptions());
    if (fee === null) throw new Error('Could not estimate the fee. Recheck before signing.');
    if (balance < amount + fee + rent + FEE_RESERVE) throw new Error(`Insufficient Devnet balance. Leave ${formatSol(fee + rent + FEE_RESERVE)} SOL for fee, rent and reserve.`);
    if (!inspection.exists && amount < rent) throw new Error(`An unfunded recipient needs at least ${formatSol(rent)} SOL to remain rent-exempt.`);
    if (!options.stillCurrent()) throw new Error('Payment details changed. Review again.');
    update({ status: 'awaiting_wallet', lastValidBlockHeight: String(lifetime.lastValidBlockHeight), fee: String(fee), message: 'Approve the exact Devnet transfer in your wallet.' });
    const [transaction] = await signer.modifyAndSignTransactions([unsigned]);
    if (!transaction || transaction.messageBytes.length !== unsigned.messageBytes.length || transaction.messageBytes.some((b, i) => b !== unsigned.messageBytes[i])) throw new Error('Wallet changed the reviewed transaction. Nothing was broadcast by SendShield.');
    assertIsFullySignedTransaction(transaction);
    if (!options.stillCurrent()) throw new Error('Payment details changed while the wallet was open. Nothing was broadcast.');
    // Signing may have taken minutes. Recheck the chain and exact destination again before broadcast.
    await assertCluster('devnet');
    const finalInspection = await inspectRecipient(draft.recipientAddress, 'devnet');
    const finalReason = sendBlockReason(draft, finalInspection, options.contacts(), options.attempts().filter(a => a.id !== attempt.id));
    if (finalReason || !options.stillCurrent()) throw new Error(finalReason ?? 'Payment changed. Review again.');
    if (await rpc.getBlockHeight({ commitment: 'confirmed' }).send(rpcOptions()) > lifetime.lastValidBlockHeight) { update({ status: 'expired', message: 'Signing took too long. The blockhash expired before broadcast.' }); return attempt; }
    // Persist the deterministic signature BEFORE broadcast so a lost HTTP response is recoverable.
    const sig = getSignatureFromTransaction(transaction); signed = true;
    update({ transactionSignature: sig, status: 'submitted', message: 'Broadcasting once. The signature is recorded; never blindly retry.' });
    const returned = await rpc.sendTransaction(getBase64EncodedWireTransaction(transaction), { encoding: 'base64', skipPreflight: false, preflightCommitment: 'confirmed', maxRetries: 0n }).send(rpcOptions());
    if (returned !== sig) throw new Error('Unexpected submission signature.');
    update({ status: 'confirming', message: 'Submitted. Checking signature and transaction details on Devnet.' });
    for (let n = 0; n < 20; n++) {
      const checked = await recheckAttempt(attempt); update(checked);
      if (['confirmed', 'failed', 'expired'].includes(checked.status) || checked.errorCode === 'RECEIPT_MISMATCH') return attempt;
      await new Promise(r => setTimeout(r, 2000));
    }
    update({ status: 'unknown', message: 'Confirmation is taking longer. Recheck Activity; do not repeat this payment.' });
  } catch (error) {
    update({ status: signed ? 'unknown' : attempt.status === 'awaiting_wallet' ? 'failed' : 'blocked', errorCode: signed ? 'SUBMISSION_UNCERTAIN' : 'PRE_SUBMISSION_STOP', message: signed ? 'Submission outcome is uncertain. The signature was saved; check Activity before trying again.' : error instanceof Error ? error.message.slice(0, 700) : 'Wallet request stopped before broadcast.' });
  }
  return attempt;
}
