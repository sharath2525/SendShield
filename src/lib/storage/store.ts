import { z } from 'zod';
import { parseAddress } from '@/lib/security/address-parser';
import type { TrustedContact, TransferAttempt } from '@/types';
const keySchema = z.string().refine(v => { try { return parseAddress(v).address === v; } catch { return false; } });
const cluster = z.enum(['devnet', 'mainnet-beta']);
export const contactSchema = z.object({ id: z.string().min(1), displayName: z.string().trim().min(1).max(60), address: keySchema, cluster,
  method: z.literal('user_saved'), notes: z.string().max(500), addedAt: z.iso.datetime() });
export const attemptSchema = z.object({ id: z.string().min(1), walletAddress: z.union([keySchema, z.literal('')]), recipientAddress: z.string().max(100),
  cluster, lamports: z.string().regex(/^\d{1,20}$/), status: z.enum(['draft','blocked','awaiting_wallet','submitted','confirming','confirmed','failed','expired','unknown']),
  transactionSignature: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{64,88}$/).optional(), lastValidBlockHeight: z.string().regex(/^\d+$/).optional(),
  createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(), errorCode: z.string().max(200).optional(), message: z.string().max(1000).optional(),
  slot: z.string().regex(/^\d+$/).optional(), fee: z.string().regex(/^\d+$/).optional(),
});
export const STORAGE_KEY = 'sendshield:v1';
const schema = z.object({ version: z.literal(1), contacts: z.array(contactSchema).max(500), attempts: z.array(attemptSchema).max(200) });
export function decodeStorage(raw: string) {
  const result = schema.parse(JSON.parse(raw));
  const ids = new Set<string>();
  for (const c of result.contacts) { const key = `${c.cluster}:${c.address}`; if (ids.has(key)) throw new Error('Duplicate contacts'); ids.add(key); }
  if (new Set(result.contacts.map(c => c.id)).size !== result.contacts.length) throw new Error('Duplicate contact IDs');
  if (new Set(result.attempts.map(a => a.id)).size !== result.attempts.length) throw new Error('Duplicate attempts');
  return result;
}
type Snapshot = { contacts: TrustedContact[]; attempts: TransferAttempt[]; notice: string; ready: boolean };
const initial: Snapshot = { contacts: [], attempts: [], notice: '', ready: false };
let state: Snapshot = initial;
let persistenceEnabled = true;
const verifiedThisSession = new Map<string, string>();
const receiptFingerprint = (a: TransferAttempt) => JSON.stringify([a.transactionSignature, a.walletAddress, a.recipientAddress, a.lamports, a.cluster, a.slot, a.fee]);
function normalizeStored(attempts: TransferAttempt[]): TransferAttempt[] {
  return attempts.map(a => a.status === 'confirmed' && verifiedThisSession.get(a.id) !== receiptFingerprint(a)
    ? { ...a, status: 'confirming', message: 'Saved receipt requires a fresh RPC check.' } : a);
}
const listeners = new Set<() => void>();
export const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const getSnapshot = () => state;
export const getServerSnapshot = () => initial;
const emit = () => listeners.forEach(fn => fn());
export function initializeStore() {
  if (state.ready) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? decodeStorage(raw) : { contacts: [], attempts: [] };
    // A saved receipt is a claim until this browser session rechecks RPC.
    state = { ...state, ...data, attempts: data.attempts.map(a => a.status === 'confirmed' ? { ...a, status: 'confirming', message: 'Saved receipt requires a fresh RPC check.' } : a), ready: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, contacts: state.contacts, attempts: state.attempts }));
  } catch { persistenceEnabled = false; state = { ...state, ready: true, notice: 'Browser storage is unavailable or invalid. Working in memory; existing saved data was not trusted.' }; }
  emit();
}
export function syncStore() {
  if (!persistenceEnabled) return;
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const data = decodeStorage(raw); state = { ...state, ...data, attempts: normalizeStored(data.attempts) }; emit(); } }
  catch { state = { ...state, notice: 'Could not read browser storage. Recheck your contacts before sending.' }; emit(); }
}
function save() {
  try { if (persistenceEnabled) localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, contacts: state.contacts, attempts: state.attempts })); }
  catch { persistenceEnabled = false; state = { ...state, notice: 'Storage could not be saved. In-memory mode: keep this tab open until pending payments are resolved.' }; }
  emit();
}
export function saveContact(contact: TrustedContact) {
  const parsed = contactSchema.parse(contact);
  if (state.contacts.some(c => c.id !== parsed.id && c.cluster === parsed.cluster && c.address === parsed.address)) throw new Error('This address is already saved on this network. Edit its alias instead.');
  state = { ...state, contacts: [...state.contacts.filter(c => c.id !== parsed.id), parsed] }; save();
}
export function removeContact(id: string) { state = { ...state, contacts: state.contacts.filter(c => c.id !== id) }; save(); }
export function recordAttempt(attempt: TransferAttempt, expectedUpdatedAt?: string) {
  // Refresh first: another tab may have recorded a signature while this RPC request ran.
  try { const raw = persistenceEnabled ? localStorage.getItem(STORAGE_KEY) : null; if (raw) { const data = decodeStorage(raw); state = { ...state, ...data, attempts: normalizeStored(data.attempts) }; } } catch { /* In-memory mode. */ }
  const existing = state.attempts.find(a => a.id === attempt.id);
  if (expectedUpdatedAt !== undefined && existing?.updatedAt !== expectedUpdatedAt) { emit(); return; }
  const parsed = attemptSchema.parse({ ...attempt,
    transactionSignature: existing?.transactionSignature ?? attempt.transactionSignature,
    lastValidBlockHeight: existing?.lastValidBlockHeight ?? attempt.lastValidBlockHeight,
  });
  if (parsed.status === 'confirmed') verifiedThisSession.set(parsed.id, receiptFingerprint(parsed));
  // Never evict unresolved payments; they are duplicate-payment guards.
  const merged = [parsed, ...state.attempts.filter(a => a.id !== parsed.id)];
  state = { ...state, attempts: merged.filter((a, i) => i < 100 || ['draft','awaiting_wallet','submitted','confirming','unknown'].includes(a.status)).slice(0, 200) }; save();
}
