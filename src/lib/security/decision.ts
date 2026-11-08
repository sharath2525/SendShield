import type { RecipientInspection, TransferDraft, TransferAttempt, TrustedContact } from '@/types';
import { compareContacts } from './compare-addresses';
export const unresolved = (attempt: TransferAttempt) => ['draft', 'awaiting_wallet', 'submitted', 'confirming', 'unknown'].includes(attempt.status);
export function sendBlockReason(draft: TransferDraft, result: RecipientInspection | null, contacts: TrustedContact[], attempts: TransferAttempt[] = []): string | null {
  if (draft.cluster !== 'devnet') return 'Mainnet is read-only. Payments are available on Devnet only.';
  if (!draft.walletAddress) return 'Connect a Devnet-compatible wallet to send.';
  if (!result || result.address !== draft.recipientAddress || result.network !== draft.cluster) return 'Inspect this exact recipient on the selected network first.';
  if (result.rpcSourceStatus !== 'success' || !result.canReceiveNativeSol) return result.explanation;
  if (draft.walletAddress === draft.recipientAddress) return 'Sending to the connected wallet is blocked for this demo.';
  if (compareContacts(draft.recipientAddress, draft.cluster, contacts).some(m => m.kind === 'LOOKALIKE_REVIEW')) return 'This address resembles a saved contact. Independently resolve the mismatch before sending.';
  if (attempts.some(a => a.walletAddress === draft.walletAddress && unresolved(a))) return 'An earlier payment is unresolved. Recheck Activity before initiating another payment.';
  return null;
}
