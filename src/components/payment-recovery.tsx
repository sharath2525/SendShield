'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLocalData } from './providers';
import { getSnapshot, recordAttempt, syncStore } from '@/lib/storage/store';
import { unresolved } from '@/lib/security/decision';
import { recheckAttempt } from '@/lib/solana/receipt';
export default function PaymentRecovery({ walletAddress, disabled }: { walletAddress: string; disabled: boolean }) {
  const data = useLocalData();
  const [checking, setChecking] = useState(false), [message, setMessage] = useState('');
  const pending = data.attempts.filter(a => unresolved(a) && (!walletAddress || a.walletAddress === walletAddress));
  if (!pending.length) return message ? <p className="notice" role="status">{message}</p> : null;
  return <section className="card stack" aria-label="Earlier payment recovery"><h2>Resolve the earlier payment</h2><p>There {pending.length === 1 ? 'is 1 saved payment' : `are ${pending.length} saved payments`} awaiting a fresh chain check. Reloading the app makes saved confirmations require verification again. This does not mean your earlier payment failed.</p><p className="small muted">Rechecking only reads Devnet; it never signs, resends or deletes a payment.</p><div className="row"><button className="button secondary" disabled={disabled || checking} onClick={async () => {
    setChecking(true); setMessage('');
    try {
      syncStore();
      for (const attempt of getSnapshot().attempts.filter(a => unresolved(a) && (!walletAddress || a.walletAddress === walletAddress))) recordAttempt(await recheckAttempt(attempt), attempt.updatedAt);
      const remaining = getSnapshot().attempts.filter(a => unresolved(a) && (!walletAddress || a.walletAddress === walletAddress));
      setMessage(remaining.length ? 'Some payments remain unresolved. Open Activity to inspect their status and signature; do not send again yet.' : 'Earlier payments reconciled. Review their outcomes in Activity before deciding whether another payment is needed.');
    } catch { setMessage('Could not finish rechecking. Open Activity for the saved evidence. No payment was resent.'); }
    finally { setChecking(false); }
  }}>{checking ? 'Checking Devnet…' : 'Recheck earlier payments'}</button><Link className="button secondary" href="/activity">Open Activity & receipts</Link></div>{message && <p role="status">{message}</p>}</section>;
}
