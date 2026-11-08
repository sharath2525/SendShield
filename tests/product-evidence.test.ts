import { describe, it, expect } from 'vitest';
import { generateKeyPair, getAddressFromPublicKey, signBytes } from '@solana/kit';
import { createChallenge, challengeMessage, encodeProof, verifyControlProof, PROOF_LIFETIME } from '@/lib/security/control-proof';
import { createRequestUrl, parseRequestUrl, validateRequest } from '@/lib/security/payment-request';
import { publicReceipt } from '@/lib/security/receipt-export';
const origin = 'https://send-shield-solana.vercel.app';
const key = 'FVen3X669xLzsi6N2V91DoiyzHzg1uAgqiT8jZ9nS96Z';
const request = { v: '1' as const, network: 'devnet' as const, asset: 'SOL' as const, recipient: key, amount: '0.001', label: 'Untrusted label' };
async function fixture() {
  const pair = await generateKeyPair(), wallet = await getAddressFromPublicKey(pair.publicKey);
  const now = Date.now(), challenge = createChallenge(wallet, now);
  const raw = encodeProof(challenge, await signBytes(pair.privateKey, challengeMessage(challenge)));
  return { raw, wallet, now, challenge };
}
describe('offline wallet-control proof', () => {
  it('verifies exact signed bytes and explicitly allows reuse until expiry', async () => {
    const f = await fixture();
    expect((await verifyControlProof(f.raw, f.wallet, f.now)).challenge).toEqual(f.challenge);
    await expect(verifyControlProof(f.raw, f.wallet, f.now + 1)).resolves.toBeDefined();
    await expect(verifyControlProof(f.raw, f.wallet, f.now + PROOF_LIFETIME)).rejects.toThrow();
  });
  it('rejects another expected wallet', async () => { const f = await fixture(); await expect(verifyControlProof(f.raw, key, f.now)).rejects.toThrow(); });
  it.each(['wallet', 'nonce', 'purpose', 'domain', 'network', 'version', 'issuedAt', 'expiresAt'])('rejects tampering with %s', async field => {
    const f = await fixture(), parsed = JSON.parse(f.raw);
    parsed.challenge[field] = field === 'nonce' ? 'a'.repeat(64) : field === 'wallet' ? key : field === 'version' ? 2 : 'tampered';
    await expect(verifyControlProof(JSON.stringify(parsed), f.wallet, f.now)).rejects.toThrow();
  });
  it('rejects future issuance, extra properties, wrong signature and oversized input', async () => {
    const f = await fixture(); await expect(verifyControlProof(f.raw, f.wallet, f.now - 1)).rejects.toThrow();
    await expect(verifyControlProof(JSON.stringify({ ...JSON.parse(f.raw), extra: true }), f.wallet, f.now)).rejects.toThrow();
    const other = await fixture(); await expect(verifyControlProof(JSON.stringify({ ...JSON.parse(f.raw), signature: JSON.parse(other.raw).signature }), f.wallet, f.now)).rejects.toThrow();
    await expect(verifyControlProof('x'.repeat(4097), f.wallet)).rejects.toThrow();
  });
  it('creates a new random nonce for each challenge', () => { expect(createChallenge(key).nonce).not.toBe(createChallenge(key).nonce); });
});
describe('strict Devnet payment requests', () => {
  it('round trips the exact recipient and integer amount', () => { expect(parseRequestUrl(createRequestUrl(origin, request), origin)).toEqual(request); });
  it.each([{network:'mainnet-beta'}, {asset:'USDC'}, {amount:'0.100000001'}, {amount:'1e-3'}, {amount:'-1'}, {recipient:'wrong'}, {label:'a\u202eb'}, {extra:'unknown'}])('rejects unsupported or malformed fields %j', patch => { expect(() => validateRequest({ ...request, ...patch })).toThrow(); });
  it.each(['https://evil.example/request', 'solana:abc', 'javascript:alert(1)', `${origin}/other`])('rejects foreign URL %s', raw => { expect(() => parseRequestUrl(raw, origin)).toThrow(); });
  it('rejects duplicate fields, query parameters and credentials', () => {
    const url = createRequestUrl(origin, request);
    expect(() => parseRequestUrl(url + '&amount=0.002', origin)).toThrow();
    expect(() => parseRequestUrl(url.replace('/request#', '/request?redirect=evil#'), origin)).toThrow();
    expect(() => parseRequestUrl(url.replace('https://', 'https://attacker@'), origin)).toThrow();
  });
  it('does not authenticate a changed amount or claim label identity', () => { const url = createRequestUrl(origin, { ...request, amount:'0.002', label:'Famous Person' }); expect(parseRequestUrl(url, origin).amount).toBe('0.002'); });
});
it('receipt export never promotes pending estimates into chain facts', () => {
  const a = { id:'test', status:'unknown' as const, walletAddress:key, recipientAddress:key, cluster:'devnet' as const, lamports:'1000000', fee:'5000', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
  const exported = publicReceipt(a);
  expect(exported.chainResult.actualFeeLamports).toBeNull(); expect(exported.chainResult.commitment).toBeNull(); expect(exported.walletAuthorization.messagePolicyCheckedAt).toBeNull();
  expect(publicReceipt({ ...a, status:'confirmed', slot:'1' }).chainResult.actualFeeLamports).toBe('5000');
});
