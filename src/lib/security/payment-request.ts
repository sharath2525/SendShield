import { z } from 'zod';
import { parseAddress } from './address-parser';
import { formatSol, parseAmount } from './amounts';

const requestSchema = z.object({ v: z.literal('1'), network: z.literal('devnet'), asset: z.literal('SOL'), recipient: z.string().max(44), amount: z.string().max(24), label: z.string().max(60) }).strict();
export type PaymentRequest = z.infer<typeof requestSchema>;
export function validateRequest(value: unknown): PaymentRequest {
  const request = requestSchema.parse(value);
  const key = parseAddress(request.recipient);
  if (key.address !== request.recipient || !key.onCurve) throw new Error('Request requires an exact on-curve recipient. Account eligibility still needs live inspection.');
  if (/[\p{Cc}\p{Cf}]/u.test(request.label)) throw new Error('Label contains hidden or control characters.');
  return { ...request, amount: formatSol(parseAmount(request.amount)) };
}
export function createRequestUrl(origin: string, value: PaymentRequest): string {
  const request = validateRequest(value);
  const url = new URL('/request', origin);
  url.hash = new URLSearchParams(request).toString();
  return url.toString();
}
export function parseRequestUrl(raw: string, origin: string): PaymentRequest {
  if (raw.length > 2048) throw new Error('Request link is too large.');
  const url = new URL(raw);
  const allowed = [new URL(origin).origin, 'https://send-shield-solana.vercel.app'];
  if (!allowed.includes(url.origin) || url.pathname !== '/request' || url.search || url.username || url.password) throw new Error('Use a SendShield request link. External transaction URLs are not supported.');
  const params = new URLSearchParams(url.hash.slice(1));
  if ([...params.keys()].length !== 6 || new Set(params.keys()).size !== 6) throw new Error('Request has missing, duplicate or unsupported fields.');
  return validateRequest(Object.fromEntries(params));
}
