'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { address, isTransactionModifyingSigner } from '@solana/kit';
import { useClient } from '@solana/react';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import { ArrowRight, Check, CircleHelp, RefreshCw, Search, ShieldCheck, ShieldX, TriangleAlert, Wallet } from 'lucide-react';
import type { Cluster, RecipientInspection, TransferDraft } from '@/types';
import type { AppClient } from '@/components/providers';
import { useLocalData } from '@/components/providers';
import WalletConnect from '@/components/wallet-connect';
import { AddressDiff, FullAddress } from '@/components/address';
import ReviewDialog from '@/components/review-dialog';
import ReceiptPanel from '@/components/receipt';
import RequestImport from '@/components/request-import';
import PaymentRecovery from '@/components/payment-recovery';
import { inspectRecipient } from '@/lib/solana/inspect';
import { rpcFor, rpcOptions, RPC_URLS, assertCluster } from '@/lib/solana/rpc';
import { sendGuardedTransfer } from '@/lib/solana/send';
import { parseAmount, formatSol } from '@/lib/security/amounts';
import { compareContacts } from '@/lib/security/compare-addresses';
import { sendBlockReason } from '@/lib/security/decision';
import { getSnapshot, recordAttempt, syncStore } from '@/lib/storage/store';
type InspectionState = { kind: 'idle' } | { kind: 'loading'; key: string } | { kind: 'result'; key: string; value: RecipientInspection };
const MINT = 'So11111111111111111111111111111111111111112';
export default function VerifyPage() {
  const client = useClient<AppClient>(); const connected = useConnectedWallet(client); const data = useLocalData();
  const [network, setNetwork] = useState<Cluster>('devnet'); const [input, setInput] = useState(''); const [amount, setAmount] = useState('0.001');
  const [inspection, setInspection] = useState<InspectionState>({ kind: 'idle' });
  const [balance, setBalance] = useState<{ owner: string; value?: string; error?: string } | null>(null);
  const [balanceTick, setBalanceTick] = useState(0); const [review, setReview] = useState<{ key: string; draft: TransferDraft } | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [activeId, setActiveId] = useState('');
  const [requestNotice, setRequestNotice] = useState('');
  const sendLock = useRef(false); const revision = useRef(0);
  const walletAddress = connected?.account.address ?? '';
  const key = JSON.stringify([input.trim(), network, walletAddress, amount, data.contacts]);
  const result = inspection.kind === 'result' && inspection.key === key ? inspection.value : null;
  const loading = inspection.kind === 'loading' && inspection.key === key;
  const matches = result ? compareContacts(result.address, network, data.contacts) : [];
  const lookalikes = matches.filter(m => m.kind === 'LOOKALIKE_REVIEW'); const exact = matches.find(m => m.kind === 'MATCH');
  let lamports = '0'; let amountError = '';
  try { lamports = String(parseAmount(amount)); } catch (e) { amountError = (e as Error).message; }
  const draft: TransferDraft = { walletAddress, recipientAddress: result?.address ?? input.trim(), lamports, cluster: network };
  const block = amountError || sendBlockReason(draft, result, data.contacts, data.attempts) || (!connected?.signer || !isTransactionModifyingSigner(connected.signer) || !connected.supportedTransactionVersions.has(0) ? 'This wallet needs Devnet version-0 transaction signing without automatic broadcast.' : '');
  const active = data.attempts.find(a => a.id === activeId);
  const invalidate = () => { revision.current++; setReview(null); setInspection({ kind: 'idle' }); setError(''); setRequestNotice(''); };
  useEffect(() => {
    if (!walletAddress) return;
    let cancelled = false;
    const fetchBalance = async () => {
      try { await assertCluster('devnet'); const { value } = await rpcFor('devnet').getBalance(address(walletAddress), { commitment: 'confirmed' }).send(rpcOptions()); if (!cancelled) setBalance({ owner: walletAddress, value: String(value) }); }
      catch { if (!cancelled) setBalance({ owner: walletAddress, error: 'Balance unavailable. Retry RPC.' }); }
    };
    void fetchBalance(); return () => { cancelled = true; };
  }, [walletAddress, balanceTick]);
  async function inspect() {
    const currentKey = key; setInspection({ kind: 'loading', key: currentKey }); setError('');
    const value = await inspectRecipient(input, network); setInspection({ kind: 'result', key: currentKey, value });
  }
  async function send() {
    if (sendLock.current || !review || review.key !== key || block || !connected?.signer) return;
    sendLock.current = true; setBusy(true); setReview(null); setError('');
    const reviewed = review.draft; const signer = connected.signer; const startRevision = revision.current;
    const contactsFingerprint = JSON.stringify(data.contacts);
    try {
      if (!navigator.locks) throw new Error('This browser cannot coordinate safe sends across tabs. Use a current Chrome, Edge, Firefox or Safari browser.');
      await navigator.locks.request('sendshield:send', { ifAvailable: true }, async lock => {
        if (!lock) throw new Error('A payment is active in another SendShield tab. Finish it before sending again.');
        syncStore();
        const stillCurrent = () => revision.current === startRevision && client.wallet.getState().connected?.account.address === reviewed.walletAddress && JSON.stringify(getSnapshot().contacts) === contactsFingerprint;
        await sendGuardedTransfer({ draft: reviewed, signer, contacts: () => getSnapshot().contacts, attempts: () => getSnapshot().attempts, stillCurrent,
          onUpdate: attempt => { recordAttempt(attempt); setActiveId(attempt.id); } });
      });
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not start the payment.'); }
    finally { sendLock.current = false; setBusy(false); setBalanceTick(n => n + 1); }
  }
  const verdict = !result ? '' : result.rpcSourceStatus === 'unavailable' ? 'CHECK UNAVAILABLE' : !result.canReceiveNativeSol || lookalikes.length ? 'BLOCKED' : 'ELIGIBLE ACCOUNT TYPE';
  return <main className="container app-main stack">
    <div className="toolbar"><div className="row"><span className="network-dot" /><label className="sr-only" htmlFor="network">Inspection network</label><select id="network" value={network} disabled={busy} onChange={e => { invalidate(); setNetwork(e.target.value as Cluster); }}><option value="devnet">Solana Devnet</option><option value="mainnet-beta">Mainnet · read only</option></select><span className="small muted">{loading ? 'Querying RPC…' : result?.rpcSourceStatus === 'success' ? 'RPC responded' : result?.rpcSourceStatus === 'unavailable' ? 'RPC unavailable' : 'RPC not checked'}</span></div><WalletConnect disabled={busy} /></div>
    <div className="page-heading"><div><span className="eyebrow">A little certainty before you sign</span><h1>Verify first. Send with care.</h1><p>Check the account behind an address, compare your contacts, then make a deliberate payment.</p></div><span className="badge">{network === 'devnet' ? 'Test SOL only' : 'Inspection only'}</span></div>
    <ol className="steps" aria-label="Payment workflow"><li><span className="step-number">1</span>Inspect recipient</li><li><span className="step-number">2</span>Compare & review</li><li><span className="step-number">3</span>Sign in wallet</li><li><span className="step-number">4</span>Verify receipt</li></ol>
    <div className="row"><Link className="button secondary" href="/prove">Wallet-control proof</Link><Link className="button secondary" href="/request">Create payment request</Link><Link href="/learn">Lookalike demo & safety guide</Link></div>
    {!busy && <RequestImport compact onLoad={request => { invalidate(); setNetwork('devnet'); setInput(request.recipient); setAmount(request.amount); setRequestNotice('Request loaded. Its label is not identity evidence. Inspect this full address and independently confirm the amount before approval.'); }} />}
    {requestNotice && <p className="notice warning" role="status">{requestNotice}</p>}
    <PaymentRecovery walletAddress={walletAddress} disabled={busy} />
    <div className="grid-two workflow-grid"><section className="card stack"><div className="card-heading"><span className="step-number">1</span><div><h2>Recipient</h2><p className="small muted">Inspect without connecting a wallet.</p></div><Search size={20} /></div><form className="stack" onSubmit={e => { e.preventDefault(); if (!busy) void inspect(); }}><label className="field" htmlFor="recipient">Full Solana address<textarea id="recipient" className="mono" rows={3} placeholder="Paste the entire recipient address" value={input} autoComplete="off" spellCheck={false} maxLength={100} disabled={busy} onChange={e => { invalidate(); setInput(e.target.value); }} /></label><p className="small muted">You are inspecting {network === 'devnet' ? 'Devnet' : 'Mainnet'}. Use your keyboard or browser’s standard paste command.</p><button className="button" disabled={loading || busy || !input.trim()} type="submit">{loading ? <RefreshCw size={18} className="spinner" /> : <Search size={18} />}{loading ? 'Inspecting live account…' : 'Inspect address'}<ArrowRight size={17} /></button></form><div className="divider" /><div className="stack"><span className="small muted">TRY A REAL ON-CHAIN DESTINATION</span><button className="button secondary" disabled={busy} onClick={() => { invalidate(); setInput(MINT); }}>Load wrapped SOL mint<ArrowRight size={16} /></button><p className="small muted">A real mint address, checked against the selected network when you press Inspect. It is not a recipient wallet.</p></div><div className="notice"><CircleHelp size={18} /><span>Have a saved recipient? <Link href="/contacts">Open your contacts</Link>. An alias is a reminder, not proof of identity.</span></div></section>
    <section className="card stack" aria-labelledby="verification-title"><div className="spread row"><div className="row"><span className="step-number">2</span><h2 id="verification-title">Verification</h2></div>{result && <button className="button ghost" disabled={busy || loading} onClick={() => void inspect()}><RefreshCw size={16} />Recheck</button>}</div>
    {loading ? <div className="empty" role="status"><RefreshCw className="spinner" size={32} /><h3>Reading the account on chain</h3><p>Checking network identity, account owner, data and executable status.</p></div> : !result ? <div className="empty"><ShieldCheck size={42} /><h3>Every address has a story.</h3><p>Paste a full address to see what Solana says it is. No wallet connection needed.</p><div className="row small"><Check size={16} />Live RPC evidence · No safety scores</div></div> : <><div className={`notice ${verdict === 'ELIGIBLE ACCOUNT TYPE' ? 'success' : 'error'}`} role="status">{verdict === 'ELIGIBLE ACCOUNT TYPE' ? <ShieldCheck size={22} /> : <ShieldX size={22} />}<div><strong>{verdict}</strong><p>{result.explanation}</p></div></div><FullAddress value={result.address} /><div className="metric-grid"><div className="metric"><span>Syntax & curve</span><strong>{result.classification === 'INVALID' ? 'Invalid public key' : result.onCurve ? 'On-curve key' : 'Off-curve key'}</strong></div><div className="metric"><span>Account on {network}</span><strong>{result.exists === null ? 'Unknown' : result.exists ? 'Exists' : 'Unfunded / not found'}</strong></div><div className="metric"><span>Executable</span><strong>{result.executable === null ? '—' : result.executable ? 'Yes' : 'No'}</strong></div><div className="metric"><span>Allocated data</span><strong>{result.dataLength === null ? '—' : `${result.dataLength} bytes`}</strong></div></div><details><summary>Raw evidence & RPC source</summary><div className="stack small"><p>Classification: <strong>{result.classification}</strong></p><p>Owner program</p><FullAddress value={result.ownerProgram ?? 'No owner returned'} /><p>Slot: {result.rpcSlot ?? 'Not available'} · Checked {new Date(result.queriedAt).toLocaleString()}</p><p className="address">RPC endpoint: {new URL(RPC_URLS[network]).origin}</p><p>Selected cluster: {result.network} · RPC status: {result.rpcSourceStatus}</p></div></details><div className="divider" /><div className={`notice ${lookalikes.length ? 'error' : 'warning'}`}><TriangleAlert size={18} /><div><strong>{lookalikes.length ? 'RESEMBLES TRUSTED CONTACT' : exact ? 'MATCHES SAVED CONTACT' : 'CAUTION — IDENTITY UNVERIFIED'}</strong><p>{lookalikes.length ? 'These are different addresses. Sending is blocked. Independently resolve this mismatch; no bypass is offered.' : exact ? `Matches ${exact.contact.displayName}, saved by you. Still verify independently if details changed.` : 'No exact saved contact match. Confirm the full address using a trusted separate channel.'}</p></div></div>{lookalikes.map(m => <div key={m.contact.id} className="stack"><strong>Compared with {m.contact.displayName}</strong><AddressDiff candidate={result.address} trusted={m.contact.address} /><p className="small muted">Shared prefix: {m.prefix} · suffix: {m.suffix} · first difference: character {(m.firstMismatch ?? 0) + 1}. This heuristic does not prove an attack.</p></div>)}{matches.filter(m => m.kind === 'CAUTION').map(m => <p className="notice warning small" key={m.contact.id}>Short edge resemblance to {m.contact.displayName}. Compare the entire address independently.</p>)}<p className="small muted">{result.warnings[0]}</p></>}
    </section></div>
    <section className="card stack"><div className="spread row"><div className="row"><span className="step-number">3</span><div><h2>Make a deliberate send</h2><p className="muted small">Devnet only. One transfer. Your wallet’s approval.</p></div></div><span className="badge">0.1 SOL demo cap</span></div><div className="grid-two"><div className="stack"><div className="row"><Wallet size={18} /><strong>Your Devnet wallet</strong></div>{walletAddress ? <FullAddress value={walletAddress} /> : <p className="muted">Connect a wallet above to see its Devnet balance.</p>}<div className="row"><span className="small">Balance: {balance?.owner === walletAddress ? balance.value !== undefined ? `${formatSol(balance.value)} SOL` : balance.error : 'Not loaded'}</span>{walletAddress && <button aria-label="Refresh wallet balance" className="button ghost" disabled={busy} onClick={() => setBalanceTick(n => n + 1)}><RefreshCw size={16} /></button>}</div><a className="small" href="https://faucet.solana.com/" target="_blank" rel="noreferrer">Get Devnet test SOL from the Solana faucet ↗</a></div><div className="stack"><label className="field" htmlFor="amount">Amount in SOL<input id="amount" inputMode="decimal" value={amount} disabled={busy} onChange={e => { invalidate(); setAmount(e.target.value); }} /></label><p className="small muted">Exact integer lamports. Fee calculated before signing; rent and a 0.00001 SOL reserve are kept in your wallet.</p>{amountError && <p className="notice error">{amountError}</p>}</div></div>{result && <div><span className="small muted">Recipient for this payment</span><FullAddress value={result.address} /></div>}{block && <p className="notice warning">{block}</p>}{error && <p className="notice error" role="alert">{error}</p>}<div className="spread row"><p className="small muted">This is Devnet test SOL; transfers still cannot be reversed.</p><button className="button" disabled={!!block || busy || !data.ready} onClick={() => setReview({ key, draft })}>{busy ? <RefreshCw className="spinner" size={18} /> : <ShieldCheck size={18} />}{busy ? 'Payment in progress…' : 'Review payment'}<ArrowRight size={16} /></button></div></section>
    {active && <ReceiptPanel attempt={active} />}
    <div className="notice"><CircleHelp size={18} /><span>Account checks reduce specific recipient mistakes. They cannot prove who controls a key or protect against a compromised wallet. <Link href="/learn">Understand the boundaries</Link>.</span></div>
    {review && review.key === key && !busy && <ReviewDialog draft={review.draft} onClose={() => setReview(null)} onApprove={() => void send()} />}
  </main>;
}
