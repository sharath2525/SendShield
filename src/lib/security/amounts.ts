export const DEMO_CAP = 100_000_000n;
export const FEE_RESERVE = 10_000n;
export function parseAmount(value: string): bigint {
  if (value.length > 24 || !/^(0|[1-9]\d*)(\.\d{1,9})?$/.test(value)) throw new Error('Use a decimal SOL amount with at most 9 decimal places.');
  const [whole, fraction = ''] = value.split('.');
  const amount = BigInt(whole) * 1_000_000_000n + BigInt(fraction.padEnd(9, '0'));
  if (amount <= 0n || amount > DEMO_CAP) throw new Error('Amount must be greater than zero and at most 0.1 Devnet SOL.');
  return amount;
}
export function formatSol(value: bigint | string): string {
  const n = BigInt(value); const fraction = (n % 1_000_000_000n).toString().padStart(9, '0').replace(/0+$/, '');
  return `${n / 1_000_000_000n}${fraction ? `.${fraction}` : ''}`;
}
