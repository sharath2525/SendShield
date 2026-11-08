'use client';
import { useState } from 'react';
import { CheckCircle2, ExternalLink, RefreshCw, Clock3, TriangleAlert } from 'lucide-react';
import type { TransferAttempt } from '@/types';
import { formatSol } from '@/lib/security/amounts';
import { explorer } from '@/lib/solana/rpc';
import { recheckAttempt } from '@/lib/solana/receipt';
import { recordAttempt } from '@/lib/storage/store';
import { FullAddress } from './address';
export default function ReceiptPanel({ attempt }: { attempt: TransferAttempt }) {
  const [checking, setChecking] = useState(false);
  const confirmed = attempt.status === 'confirmed';
  return <section className="card receipt stack" aria-label="Payment receipt"><div className="spread row"><h2 className="row">{confirmed ? <CheckCircle2 /> : attempt.status === 'failed' || attempt.status === 'blocked' ? <TriangleAlert /> : <Clock3 />}{confirmed ? 'Payment confirmed' : `Payment ${attempt.status.replace('_', ' ')}`}</h2><span className={`badge ${confirmed ? 'success' : 'warning'}`}>Devnet</span></div><p role="status">{attempt.message}</p><div className="metric-grid"><div className="metric"><span>Amount</span><strong>{formatSol(attempt.lamports)} SOL</strong><small>{attempt.lamports} lamports</small></div><div className="metric"><span>Last checked</span><strong>{new Date(attempt.updatedAt).toLocaleTimeString()}</strong><small>{new Date(attempt.updatedAt).toLocaleDateString()}</small></div>{attempt.slot && <div className="metric"><span>RPC slot</span><strong>{attempt.slot}</strong><small>Fee: {attempt.fee} lamports</small></div>}</div><div><span className="small muted">From</span><FullAddress value={attempt.walletAddress || 'No wallet connected'} /></div><div><span className="small muted">To</span><FullAddress value={attempt.recipientAddress} /></div>{attempt.transactionSignature && <><div><span className="small muted">Transaction signature</span><FullAddress value={attempt.transactionSignature} /></div><a className="button secondary" href={explorer(attempt.transactionSignature, attempt.cluster)} target="_blank" rel="noreferrer">View on Solana Explorer<ExternalLink size={16} /></a></>}{(attempt.transactionSignature || attempt.lastValidBlockHeight) && <button className="button ghost" disabled={checking} onClick={async () => { setChecking(true); try { recordAttempt(await recheckAttempt(attempt), attempt.updatedAt); } finally { setChecking(false); } }}><RefreshCw size={16} className={checking ? 'spinner' : ''} />{checking ? 'Checking RPC…' : 'Recheck settlement'}</button>}{!confirmed && <p className="small muted">A pending or unknown result is not a failed payment. Resolve the signature before sending again.</p>}</section>;
}
