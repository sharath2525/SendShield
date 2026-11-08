import type { TransferAttempt } from '@/types';
import { formatSol } from './amounts';
export function publicReceipt(a: TransferAttempt) {
  return { format: 'SendShield public receipt', version: 1,
    notice: 'Unsigned public summary. Reverify the signature on Devnet.',
    reviewedIntent: { network: a.cluster, asset: 'SOL', sender: a.walletAddress, recipient: a.recipientAddress, lamports: a.lamports, sol: formatSol(a.lamports), recordedAt: a.createdAt },
    walletAuthorization: { messagePolicyCheckedAt: a.walletMessageVerifiedAt ?? null, signature: a.transactionSignature ?? null, source: 'Local application record; not wallet-screen attestation' },
    chainResult: { status: a.status, commitment: a.status === 'confirmed' ? 'confirmed or stronger' : null, signature: a.transactionSignature ?? null, feePayer: a.status === 'confirmed' ? a.walletAddress : null, actualFeeLamports: a.status === 'confirmed' ? a.fee ?? null : null, slot: a.status === 'confirmed' ? a.slot ?? null : null, checkedAt: a.updatedAt },
    estimatedFeeLamports: a.estimatedFee ?? null };
}
