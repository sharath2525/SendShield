'use client';
import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import type { TransferDraft } from '@/types';
import { formatSol } from '@/lib/security/amounts';
import { FullAddress } from './address';
export default function ReviewDialog({ draft, onClose, onApprove }: { draft: TransferDraft; onClose: () => void; onApprove: () => void }) {
  const ref = useRef<HTMLDialogElement>(null); const [checked, setChecked] = useState(false);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="dialog" aria-labelledby="review-title" onCancel={onClose} onClose={onClose}><div className="stack"><span className="eyebrow">One deliberate decision</span><h2 id="review-title">Review your Devnet payment</h2><div className="notice warning">Account type is eligible. Identity is not proven. This is test SOL, but the transfer cannot be reversed.</div><div className="review-amount">{formatSol(draft.lamports)} <span>SOL</span></div><p className="small muted">{draft.lamports} lamports · Network: Solana Devnet · Maximum 0.1 SOL</p><div><strong>From your wallet</strong><FullAddress value={draft.walletAddress} /></div><ArrowRight size={20} /><div><strong>Entire recipient address</strong><FullAddress value={draft.recipientAddress} /></div><p className="small muted">Priority fee: 0 SOL. Compute limit: 20,000 units. A fresh RPC inspection and fee estimate for this exact message run before your wallet opens. The wallet must approve this one SOL transfer; SendShield charges no platform fee.</p><label className="checkbox"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} /><span>I independently verified this entire recipient address through a trusted channel and reviewed the amount and Devnet network.</span></label><div className="dialog-actions"><button className="button secondary" onClick={onClose}>Go back</button><button className="button" disabled={!checked} onClick={() => { if (checked) onApprove(); }}><ShieldCheck size={18} />Approve in wallet</button></div></div></dialog>;
}
