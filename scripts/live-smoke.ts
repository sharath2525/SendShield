import { inspectRecipient } from '../src/lib/solana/inspect';
import { rpcFor, assertCluster } from '../src/lib/solana/rpc';
import { address, getAddressDecoder, isOffCurveAddress } from '@solana/kit';
import assert from 'node:assert/strict';
await assertCluster('devnet');
for (const [destination, expected] of [
  ['So11111111111111111111111111111111111111112', 'TOKEN_MINT'],
  ['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', 'PROGRAM_ACCOUNT'],
] as const) {
  const result = await inspectRecipient(destination, 'devnet');
  console.log(JSON.stringify(result));
  assert.equal(result.classification, expected); assert.equal(result.canReceiveNativeSol, false);
}
// Public random bytes only, no private/signing key is created. Never a demo transfer destination.
let randomAddress;
do { randomAddress = getAddressDecoder().decode(crypto.getRandomValues(new Uint8Array(32))); } while (isOffCurveAddress(randomAddress));
const missing = await inspectRecipient(randomAddress, 'devnet');
console.log(JSON.stringify(missing)); assert.equal(missing.classification, 'WALLET_UNFUNDED');
const signatures = await rpcFor('devnet').getSignaturesForAddress(address('So11111111111111111111111111111111111111112'), { limit: 1 }).send();
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), devnetReadable: true, latestMintActivityFound: signatures.length > 0, realTransferTested: false }));
