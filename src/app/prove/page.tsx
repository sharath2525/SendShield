'use client';
import { useState } from 'react';
import { useClient } from '@solana/react';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import Link from 'next/link';
import type { AppClient } from '@/components/providers';
import WalletConnect from '@/components/wallet-connect';
import { challengeMessage, createChallenge, encodeProof, verifyControlProof, type ControlProof } from '@/lib/security/control-proof';

export default function ProofPage() {
  const client = useClient<AppClient>(), connected = useConnectedWallet(client);
  const [raw, setRaw] = useState(''), [expected, setExpected] = useState(''), [result, setResult] = useState<ControlProof | null>(null);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [checkedAt, setCheckedAt] = useState('');
  async function create() {
    setBusy(true); setError(''); setResult(null); setRaw('');
    try {
      const wallet = connected?.account.address;
      if (!wallet) throw new Error('Connect the recipient wallet first.');
      if (!connected.account.features.includes('solana:signMessage')) throw new Error('This wallet does not support message signing. Payments remain available in Verify & send.');
      const challenge = createChallenge(wallet);
      const signature = await client.wallet.signMessage(challengeMessage(challenge));
      if (client.wallet.getState().connected?.account.address !== wallet) throw new Error('Wallet changed. Create a new proof.');
      const encoded = encodeProof(challenge, signature);
      const verified = await verifyControlProof(encoded, wallet);
      setExpected(wallet); setRaw(encoded); setResult(verified); setCheckedAt(new Date().toISOString());
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create proof.'); }
    finally { setBusy(false); }
  }
  return <main className="container app-main stack"><div className="page-heading"><div><span className="eyebrow">Evidence before trust</span><h1>Prove wallet control.</h1><p>A signed message proves control of a key. It does not prove a person’s identity.</p></div><WalletConnect disabled={busy} /></div>
    <div className="notice warning">Offline proofs are reusable until their 10-minute expiry. A random nonce distinguishes proofs; there is no server enforcing one-time use. Share through an independently trusted channel.</div>
    <div className="grid-two"><section className="card stack"><h2>1. Recipient: create a proof</h2><p>Connect the wallet you want to prove. Your wallet signs a plain message bound to SendShield’s production domain, Devnet, address, purpose, nonce and expiry. This does not authorize a payment.</p><button className="button" disabled={busy || !connected} onClick={() => void create()}>{busy ? 'Waiting for wallet…' : 'Sign wallet-control proof'}</button>{!connected && <p className="small muted">Connect your recipient wallet to enable signing.</p>}<Link href="/request">Create a Devnet payment request →</Link></section>
    <section className="card stack"><h2>2. Sender: verify a proof</h2><label className="field">Expected full wallet address<input className="mono" value={expected} maxLength={44} onChange={e => { setExpected(e.target.value); setResult(null); }} /></label><label className="field">Proof JSON<textarea className="mono" rows={12} maxLength={4096} value={raw} onChange={e => { setRaw(e.target.value); setResult(null); }} /></label><button className="button secondary" disabled={busy || !raw || !expected} onClick={async () => { setResult(null); setError(''); try { setResult(await verifyControlProof(raw, expected)); setCheckedAt(new Date().toISOString()); } catch (e) { setError(e instanceof Error && e.name !== 'ZodError' ? e.message : 'Invalid proof format, domain or version. Paste a complete SendShield proof.'); } }}>Verify exact message & signature</button><p className="small muted">Copy the proof text to share it. Never paste a seed phrase or private key.</p></section></div>
    {error && <p className="notice error" role="alert">{error}</p>}
    {result && <section className="card stack" role="status"><h2>Key-control signature verified</h2><p>Valid when checked at {new Date(checkedAt).toLocaleTimeString()}. Reverify before relying on it; this display does not extend its expiry.</p><p className="address mono">Wallet: {result.challenge.wallet}</p><p>Domain: {result.challenge.domain} · Network: Devnet</p><p>Issued: {result.challenge.issuedAt}<br />Expires: {result.challenge.expiresAt}</p><details><summary>Exact signed message and signature</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{new TextDecoder().decode(challengeMessage(result.challenge))}</pre><p className="address mono">{result.signature}</p></details><p className="notice warning">This is not identity verification, account eligibility, or permission to transfer. Inspect the address and independently confirm whom you are paying.</p><Link className="button secondary" href="/app">Continue to recipient inspection</Link></section>}
  </main>;
}
