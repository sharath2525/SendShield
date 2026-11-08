import { signature, getBase58Encoder } from '@solana/kit';
import { z } from 'zod';
import type { TransferAttempt } from '@/types';
import { SYSTEM } from './classify';
import { assertCluster, rpcFor, rpcOptions } from './rpc';
import { COMPUTE_PROGRAM, computePolicyInstructions } from './compute-policy';
const uint = z.union([z.bigint(), z.number().int().safe(), z.string().regex(/^\d+$/)]).transform(v => BigInt(v));
const txSchema = z.object({ slot: uint, meta: z.object({ err: z.null(), fee: uint }), transaction: z.object({
  signatures: z.array(z.string()).length(1), message: z.object({
    accountKeys: z.array(z.object({ pubkey: z.string(), signer: z.boolean(), writable: z.boolean() })),
    instructions: z.array(z.object({ programId: z.literal(SYSTEM), parsed: z.object({ type: z.literal('transfer'), info: z.object({ source: z.string(), destination: z.string(), lamports: uint }) }) })).length(1),
  }),
}) });
export function verifyTransactionEvidence(raw: unknown, attempt: TransferAttempt): { slot: string; fee: string } {
  // Preserve old one-transfer receipts, and accept ONLY the exact current zero-priority policy.
  const envelope = z.object({ transaction: z.object({ message: z.object({ instructions: z.array(z.unknown()) }) }) }).parse(raw);
  const instructions = envelope.transaction.message.instructions;
  let normalized = raw;
  if (instructions.length === 3) {
    const expected = computePolicyInstructions();
    for (let i = 0; i < 2; i++) {
      const ix = z.object({ programId: z.literal(COMPUTE_PROGRAM), accounts: z.array(z.string()).length(0), data: z.string() }).parse(instructions[i]);
      const bytes = getBase58Encoder().encode(ix.data);
      if (bytes.length !== expected[i].data.length || bytes.some((b, j) => b !== expected[i].data[j])) throw new Error('Unapproved compute-budget or priority fee instruction');
    }
    const obj = raw as Record<string, unknown> & { transaction: Record<string, unknown> & { message: Record<string, unknown> } };
    normalized = { ...obj, transaction: { ...obj.transaction, message: { ...obj.transaction.message, instructions: [instructions[2]] } } };
  }
  const tx = txSchema.parse(normalized); const payer = tx.transaction.message.accountKeys[0]; const transfer = tx.transaction.message.instructions[0].parsed.info;
  if (tx.transaction.signatures[0] !== attempt.transactionSignature || !payer?.signer || !payer.writable || payer.pubkey !== attempt.walletAddress || transfer.source !== attempt.walletAddress || transfer.destination !== attempt.recipientAddress || transfer.lamports !== BigInt(attempt.lamports)) throw new Error('Confirmed transaction does not match the reviewed payment.');
  return { slot: String(tx.slot), fee: String(tx.meta.fee) };
}
export async function recheckAttempt(attempt: TransferAttempt): Promise<TransferAttempt> {
  if (!attempt.transactionSignature && ['failed', 'blocked', 'expired'].includes(attempt.status)) return attempt;
  const updatedAt = new Date().toISOString();
  try {
    if (attempt.cluster !== 'devnet') throw new Error('Only Devnet receipts are supported.');
    await assertCluster('devnet'); const rpc = rpcFor('devnet');
    if (!attempt.transactionSignature) {
      if (attempt.lastValidBlockHeight && await rpc.getBlockHeight({ commitment: 'finalized' }).send(rpcOptions()) > BigInt(attempt.lastValidBlockHeight)) return { ...attempt, status: 'expired', updatedAt, message: 'Signing window expired without a recorded submission.' };
      return { ...attempt, status: 'unknown', updatedAt, message: 'No submission signature was recorded. Wait for the signing window to expire and check your wallet activity.' };
    }
    const sig = signature(attempt.transactionSignature);
    const { value: [status] } = await rpc.getSignatureStatuses([sig], { searchTransactionHistory: true }).send(rpcOptions());
    if (status?.err) return { ...attempt, status: 'failed', updatedAt, message: 'RPC reports that this transaction failed on chain.', errorCode: 'ONCHAIN_ERROR' };
    if (status && ['confirmed', 'finalized'].includes(status.confirmationStatus ?? '')) {
      const tx = await rpc.getTransaction(sig, { encoding: 'jsonParsed', commitment: 'confirmed', maxSupportedTransactionVersion: 0 }).send(rpcOptions());
      if (!tx) return { ...attempt, status: 'confirming', updatedAt, message: 'Signature confirmed; waiting for transaction details to independently verify the receipt.' };
      try { const evidence = verifyTransactionEvidence(tx, attempt); return { ...attempt, ...evidence, status: 'confirmed', updatedAt, message: 'RPC confirmed settlement and the exact sender, recipient, amount and single transfer instruction.' }; }
      catch { return { ...attempt, status: 'unknown', updatedAt, errorCode: 'RECEIPT_MISMATCH', message: 'Transaction evidence does not match the reviewed transfer. Do not retry; inspect Explorer.' }; }
    }
    if (!status && attempt.errorCode !== 'WALLET_MESSAGE_MISMATCH' && attempt.lastValidBlockHeight && await rpc.getBlockHeight({ commitment: 'finalized' }).send(rpcOptions()) > BigInt(attempt.lastValidBlockHeight)) return { ...attempt, status: 'expired', updatedAt, message: 'The blockhash expired and RPC found no signature. Check Explorer before initiating a new payment.' };
    return { ...attempt, status: 'confirming', updatedAt, message: 'Waiting for confirmed settlement. Do not send again.' };
  } catch { return { ...attempt, status: 'unknown', updatedAt, message: 'RPC confirmation is unavailable. This is not proof of failure. Recheck this signature before sending again.' }; }
}
