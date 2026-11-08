import { describe, it, expect } from 'vitest';
import { address, appendTransactionMessageInstruction, compileTransaction, createTransactionMessage, createNoopSigner, pipe, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, blockhash } from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import { assertReviewedMessage } from '@/lib/security/message-policy';
const signer = createNoopSigner(address('FVen3X669xLzsi6N2V91DoiyzHzg1uAgqiT8jZ9nS96Z'));
const destination = address('So11111111111111111111111111111111111111112');
// Message-policy fixtures only; no live recipient eligibility claim or RPC submission.
function build(amount = 1000000n, extra = false) {
  const message = pipe(createTransactionMessage({ version: 0 }), m => setTransactionMessageFeePayerSigner(signer, m), m => setTransactionMessageLifetimeUsingBlockhash({ blockhash: blockhash('11111111111111111111111111111111'), lastValidBlockHeight: 100n }, m), m => appendTransactionMessageInstruction(getTransferSolInstruction({ source: signer, destination, amount }), m));
  return compileTransaction(extra ? appendTransactionMessageInstruction(getTransferSolInstruction({ source: signer, destination, amount: 1n }), message) : message);
}
describe('reviewed message semantics', () => {
  it('accepts the approved message', () => expect(() => assertReviewedMessage(build(), build())).not.toThrow());
  it('rejects a changed amount', () => expect(() => assertReviewedMessage(build(), build(2n))).toThrow());
  it('rejects an extra value transfer', () => expect(() => assertReviewedMessage(build(), build(1000000n, true))).toThrow());
  it('rejects a noncanonical trailing byte', () => { const tx = build(); expect(() => assertReviewedMessage(tx, { ...tx, messageBytes: new Uint8Array([...tx.messageBytes, 0]) as unknown as typeof tx.messageBytes })).toThrow(); });
});
