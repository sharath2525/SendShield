import { z } from 'zod';
import { getBase58Decoder, getBase58Encoder, getPublicKeyFromAddress, signatureBytes, verifySignature } from '@solana/kit';
import { parseAddress } from './address-parser';

export const PROOF_DOMAIN = 'send-shield-solana.vercel.app';
export const PROOF_LIFETIME = 10 * 60 * 1000;
const challengeSchema = z.object({
  protocol: z.literal('SendShield wallet-control proof'), version: z.literal(1),
  domain: z.literal(PROOF_DOMAIN), network: z.literal('devnet'),
  wallet: z.string().max(44), purpose: z.literal('Prove control of this wallet key; not identity or payment authorization'),
  nonce: z.string().regex(/^[0-9a-f]{64}$/), issuedAt: z.iso.datetime(), expiresAt: z.iso.datetime(),
}).strict();
const proofSchema = z.object({ challenge: challengeSchema, signature: z.string().min(64).max(88) }).strict();
export type ControlChallenge = z.infer<typeof challengeSchema>;
export type ControlProof = z.infer<typeof proofSchema>;
export function createChallenge(wallet: string, now = Date.now()): ControlChallenge {
  const parsed = parseAddress(wallet);
  if (parsed.address !== wallet || !parsed.onCurve) throw new Error('Use the exact on-curve wallet address.');
  return { protocol: 'SendShield wallet-control proof', version: 1, domain: PROOF_DOMAIN, network: 'devnet', wallet,
    purpose: 'Prove control of this wallet key; not identity or payment authorization',
    nonce: Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join(''),
    issuedAt: new Date(now).toISOString(), expiresAt: new Date(now + PROOF_LIFETIME).toISOString() };
}
export function challengeMessage(challenge: ControlChallenge): Uint8Array {
  const c = challengeSchema.parse(challenge);
  return new TextEncoder().encode(`${c.protocol}\nVersion: ${c.version}\nDomain: ${c.domain}\nNetwork: ${c.network}\nWallet: ${c.wallet}\nPurpose: ${c.purpose}\nNonce: ${c.nonce}\nIssued at: ${c.issuedAt}\nExpires at: ${c.expiresAt}`);
}
export function encodeProof(challenge: ControlChallenge, signature: Uint8Array | Readonly<Uint8Array>): string {
  return JSON.stringify({ challenge, signature: getBase58Decoder().decode(signature) }, null, 2);
}
export async function verifyControlProof(raw: string, expectedWallet: string, now = Date.now()): Promise<ControlProof> {
  if (raw.length > 4096) throw new Error('Proof is too large.');
  const proof = proofSchema.parse(JSON.parse(raw));
  const c = proof.challenge;
  const wallet = parseAddress(c.wallet);
  if (!wallet.onCurve || wallet.address !== c.wallet || c.wallet !== expectedWallet) throw new Error('Proof does not match the expected wallet.');
  const issued = Date.parse(c.issuedAt), expires = Date.parse(c.expiresAt);
  if (issued > now || expires <= now || expires <= issued || expires - issued > PROOF_LIFETIME) throw new Error('Proof expired or has invalid timestamps. Create a fresh proof.');
  const bytes = getBase58Encoder().encode(proof.signature);
  if (getBase58Decoder().decode(bytes) !== proof.signature || !await verifySignature(await getPublicKeyFromAddress(wallet.address), signatureBytes(bytes), challengeMessage(c))) throw new Error('Signature does not verify the exact challenge.');
  return proof;
}
