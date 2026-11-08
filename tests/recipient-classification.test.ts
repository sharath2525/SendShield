import { describe, expect, it } from 'vitest';
import { parseAddress } from '@/lib/security/address-parser';
import { classifyAccount, SYSTEM, TOKEN, TOKEN_2022 } from '@/lib/solana/classify';
import type { AccountEvidence } from '@/lib/solana/classify';

// Public keys used exclusively as deterministic unit fixtures. No live account claims.
const ON_CURVE = 'FVen3X669xLzsi6N2V91DoiyzHzg1uAgqiT8jZ9nS96Z';
const OFF_CURVE = '8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR';
const base = { address: ON_CURVE, network: 'devnet' as const, onCurve: true, slot: '12345' };
const wallet: AccountEvidence = { owner: SYSTEM, executable: false, space: 0 };

describe('strict public-key parsing', () => {
  it.each(['', ' ', '\t\n', '0'.repeat(44), 'O'.repeat(44), 'l'.repeat(44), '1'.repeat(31), '1'.repeat(33), '1'.repeat(1000), `${ON_CURVE}1`])('rejects malformed value %j', (value) => {
    expect(() => parseAddress(value)).toThrow();
  });
  it.each([`${ON_CURVE.slice(0, 10)} ${ON_CURVE.slice(10)}`, `\u200b${ON_CURVE}`, `${ON_CURVE}\u200b`, `${ON_CURVE}\u00a0`, `\ufeff${ON_CURVE}`, ON_CURVE.replace('F', 'Ｆ'), `${ON_CURVE.slice(0, 10)}\n${ON_CURVE.slice(10)}`])('rejects hidden/internal/unicode characters %j', value => {
    expect(() => parseAddress(value)).toThrow();
  });
  it('trims only ordinary outer whitespace and preserves the exact canonical key', () => {
    expect(parseAddress(` \t${ON_CURVE}\r\n`)).toEqual({ address: ON_CURVE, onCurve: true });
  });
  it('uses the SDK curve checker for a deterministic off-curve key', () => {
    expect(parseAddress(OFF_CURVE)).toEqual({ address: OFF_CURVE, onCurve: false });
  });
  it('accepts a 32-byte all-zero public key encoding, not 31 or 33 bytes', () => {
    expect(parseAddress(SYSTEM).address).toBe(SYSTEM);
  });
});

describe('recipient account classification (unit evidence only)', () => {
  it('allows only an on-curve, empty-data, non-executable system wallet', () => {
    const result = classifyAccount({ ...base, account: wallet });
    expect(result).toMatchObject({ classification: 'WALLET_EXISTING', canReceiveNativeSol: true, exists: true, rpcSlot: '12345', ownerProgram: SYSTEM, dataLength: 0, rpcSourceStatus: 'success' });
    expect(result.warnings.join(' ')).toMatch(/does not prove identity/i);
    expect(Number.isNaN(Date.parse(result.queriedAt))).toBe(false);
  });
  it('distinguishes a successful null account from missing/error data', () => {
    expect(classifyAccount({ ...base, account: null })).toMatchObject({ classification: 'WALLET_UNFUNDED', canReceiveNativeSol: true, exists: false, rpcSourceStatus: 'success' });
    expect(classifyAccount(base)).toMatchObject({ classification: 'RPC_UNAVAILABLE', canReceiveNativeSol: false, exists: null, rpcSourceStatus: 'unavailable' });
  });
  it.each([null, wallet])('blocks an off-curve address even if system owned or absent', account => {
    expect(classifyAccount({ ...base, address: OFF_CURVE, onCurve: false, account })).toMatchObject({ classification: 'PDA_OFF_CURVE', canReceiveNativeSol: false });
  });
  it.each([TOKEN, TOKEN_2022])('recognizes decoded mint and token account types for %s', owner => {
    expect(classifyAccount({ ...base, account: { owner, executable: false, space: 82, parsedType: 'mint' } })).toMatchObject({ classification: 'TOKEN_MINT', canReceiveNativeSol: false });
    expect(classifyAccount({ ...base, account: { owner, executable: false, space: 165, parsedType: 'account' } })).toMatchObject({ classification: 'TOKEN_ACCOUNT', canReceiveNativeSol: false });
    expect(classifyAccount({ ...base, account: { owner, executable: false, space: 82 } })).toMatchObject({ classification: 'UNKNOWN_OR_UNSUPPORTED', canReceiveNativeSol: false });
  });
  it('blocks an executable account even when owned by System Program', () => {
    expect(classifyAccount({ ...base, account: { ...wallet, executable: true } })).toMatchObject({ classification: 'PROGRAM_ACCOUNT', canReceiveNativeSol: false });
  });
  it('blocks a non-system program-owned account', () => {
    expect(classifyAccount({ ...base, account: { ...wallet, owner: ON_CURVE } })).toMatchObject({ classification: 'PROGRAM_ACCOUNT', canReceiveNativeSol: false });
  });
  it('blocks allocated system state', () => {
    expect(classifyAccount({ ...base, account: { ...wallet, space: 80 } })).toMatchObject({ classification: 'SYSTEM_SPECIAL_ACCOUNT', canReceiveNativeSol: false });
  });
  it('never infers eligibility when the curve check is unavailable', () => {
    expect(classifyAccount({ ...base, onCurve: null, account: null })).toMatchObject({ classification: 'UNKNOWN_OR_UNSUPPORTED', canReceiveNativeSol: false });
  });
  it.each(['INVALID', 'RPC_UNAVAILABLE'] as const)('fails closed on explicit %s despite other eligible evidence', error => {
    expect(classifyAccount({ ...base, account: wallet, error })).toMatchObject({ classification: error, canReceiveNativeSol: false, exists: null });
  });
});
