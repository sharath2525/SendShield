'use client';
import { useState } from 'react';
import { parseRequestUrl, type PaymentRequest } from '@/lib/security/payment-request';
export default function RequestImport({ onLoad }: { onLoad: (request: PaymentRequest) => void }) {
  const [raw, setRaw] = useState(''), [error, setError] = useState('');
  return <section className="card stack"><h2>Have a payment request?</h2><p className="small muted">Paste a SendShield link, or load the request carried by this page’s URL. Nothing is inspected, signed or paid automatically.</p><label className="field">Request link<input value={raw} maxLength={2048} placeholder="https://send-shield-solana.vercel.app/request#…" onChange={e => { setRaw(e.target.value); setError(''); }} /></label><button className="button secondary" onClick={() => { try { const current = new URL(window.location.href); current.pathname = '/request'; const request = parseRequestUrl(raw || current.toString(), window.location.origin); onLoad(request); setError(''); } catch { setError('Invalid request. Only complete SendShield Devnet SOL links with an on-curve address and an amount up to 0.1 SOL are accepted.'); } }}>Load request for review</button>{error && <p className="notice error" role="alert">{error}</p>}</section>;
}
