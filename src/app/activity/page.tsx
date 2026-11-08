'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Clock3, RefreshCw } from 'lucide-react';
import { useLocalData } from '@/components/providers';
import { getSnapshot, recordAttempt } from '@/lib/storage/store';
import { recheckAttempt } from '@/lib/solana/receipt';
import ReceiptPanel from '@/components/receipt';
export default function ActivityPage() {
  const { attempts, ready } = useLocalData(); const started = useRef(false); const [checking, setChecking] = useState(false);
  async function reconcile() {
    setChecking(true);
    try { for (const attempt of getSnapshot().attempts.filter(a => a.transactionSignature || a.lastValidBlockHeight)) recordAttempt(await recheckAttempt(attempt), attempt.updatedAt); }
    finally { setChecking(false); }
  }
  useEffect(() => { if (!ready || started.current) return; started.current = true; void (async () => { for (const attempt of getSnapshot().attempts.filter(a => a.transactionSignature || a.lastValidBlockHeight)) recordAttempt(await recheckAttempt(attempt), attempt.updatedAt); })(); }, [ready]);
  return <main className="container app-main stack"><div className="page-heading"><div><span className="eyebrow">Evidence after the signature</span><h1>Your SendShield activity</h1><p>Only payments initiated here, in this browser. This is not your full wallet history.</p></div><button className="button secondary" disabled={checking || !attempts.length} onClick={() => void reconcile()}><RefreshCw size={18} className={checking ? 'spinner' : ''} />{checking ? 'Rechecking…' : 'Recheck receipts'}</button></div><div className="notice">Saved receipts are rechecked against Devnet RPC when this page opens. An unknown result is not permission to repeat a payment.</div>{attempts.length === 0 ? <section className="card empty"><Clock3 size={40} /><h2>No payments initiated here yet</h2><p>Your attempts, blocked sends and confirmed receipts will appear here.</p><Link className="button" href="/app">Inspect a recipient</Link></section> : attempts.map(a => <ReceiptPanel key={a.id} attempt={a} />)}</main>;
}
