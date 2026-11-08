import { describe, expect, it } from 'vitest';
import { DEMO_CAP, FEE_RESERVE, formatSol, parseAmount } from '@/lib/security/amounts';

describe('exact integer lamport amounts', () => {
  it.each([['0.001', 1_000_000n], ['0.000000001', 1n], ['0.1', 100_000_000n], ['0.100000000', 100_000_000n], ['0.010000001', 10_000_001n]])('parses %s without floating point rounding', (value, expected) => {
    expect(parseAmount(value)).toBe(expected);
  });
  it.each(['', '0', '0.000000000', '-1', '-0.001', '+0.01', '0.100000001', '1', '1e-3', '1E-3', 'NaN', 'Infinity', '0.0000000001', ' 0.01', '0.01 ', '.01', '0.', '00.01', '1,000', '999999999999999999999999999999999999999', '０.０１'])('rejects unsafe or ambiguous amount %j', value => {
    expect(() => parseAmount(value)).toThrow();
  });
  it.each([1n, 11n, 999n, 1_000_000n, 10_000_001n, DEMO_CAP])('round-trips %s lamports exactly', lamports => {
    expect(parseAmount(formatSol(lamports))).toBe(lamports);
  });
  it('formats a full SOL and zero without exponent notation', () => {
    expect(formatSol('1000000000')).toBe('1');
    expect(formatSol(0n)).toBe('0');
    expect(formatSol(1n)).toBe('0.000000001');
    expect(FEE_RESERVE).toBeGreaterThan(0n);
  });
});
