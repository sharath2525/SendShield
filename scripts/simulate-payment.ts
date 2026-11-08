import { address, appendTransactionMessageInstruction, compileTransaction, createNoopSigner, createTransactionMessage, getBase64EncodedWireTransaction, pipe, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash } from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import { rpcFor, assertCluster, rpcOptions } from '../src/lib/solana/rpc';
import { computePolicyInstructions } from '../src/lib/solana/compute-policy';
import { inspectRecipient } from '../src/lib/solana/inspect';
const rpc = rpcFor('devnet'); await assertCluster('devnet');
const recent = await rpc.getSignaturesForAddress(address('So11111111111111111111111111111111111111112'), { limit: 10 }).send(rpcOptions());
let sender: string | undefined;
for (const item of recent) {
  const tx = await rpc.getTransaction(item.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0, commitment: 'confirmed' }).send(rpcOptions());
  const candidate = tx?.transaction.message.accountKeys[0]?.pubkey;
  if (candidate && (await inspectRecipient(candidate, 'devnet')).classification === 'WALLET_EXISTING') { sender = candidate; break; }
}
if (!sender) throw new Error('No eligible fee payer found for read-only simulation');
const signer = createNoopSigner(address(sender));
const { value: lifetime } = await rpc.getLatestBlockhash({ commitment: 'confirmed' }).send(rpcOptions());
const [limit, price] = computePolicyInstructions();
const message = pipe(createTransactionMessage({ version: 0 }), m => setTransactionMessageFeePayerSigner(signer, m), m => setTransactionMessageLifetimeUsingBlockhash(lifetime, m), m => appendTransactionMessageInstruction(limit,m), m => appendTransactionMessageInstruction(price,m), m => appendTransactionMessageInstruction(getTransferSolInstruction({ source: signer, destination: address('FVen3X669xLzsi6N2V91DoiyzHzg1uAgqiT8jZ9nS96Z'), amount: 1000000n }),m));
const result = await rpc.simulateTransaction(getBase64EncodedWireTransaction(compileTransaction(message)), { encoding: 'base64', sigVerify: false, replaceRecentBlockhash: true, commitment: 'confirmed' }).send(rpcOptions());
console.log(JSON.stringify({ simulationOnly: true, signed: false, broadcast: false, slot: String(result.context.slot), error: result.value.err, unitsConsumed: String(result.value.unitsConsumed), logs: result.value.logs }));
if (result.value.err) process.exitCode = 1;
