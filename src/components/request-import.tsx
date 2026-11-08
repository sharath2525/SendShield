'use client';
import { useEffect, useRef, useState } from 'react';
import { parseRequestUrl, type PaymentRequest } from '@/lib/security/payment-request';
export default function RequestImport({ onLoad, compact = false }: { onLoad: (request: PaymentRequest) => void; compact?: boolean }) {
  const [raw, setRaw] = useState(''), [error, setError] = useState('');
  const details = useRef<HTMLDetailsElement>(null);
  const onLoadRef = useRef(onLoad);
  useEffect(() => { onLoadRef.current = onLoad; }, [onLoad]);
  useEffect(() => {
    const loadFromLocation = () => {
      if (!window.location.hash) return;
      const current = new URL(window.location.href); current.pathname = '/request';
      const link = current.toString();
      if (details.current) details.current.open = true;
      setRaw(link);
      try { onLoadRef.current(parseRequestUrl(link, window.location.origin)); setError(''); }
      catch { setError('This URL contains an invalid or unsupported payment request. Nothing was loaded.'); }
    };
    window.addEventListener('hashchange', loadFromLocation);
    const timer = window.setTimeout(loadFromLocation, 0);
    return () => { window.clearTimeout(timer); window.removeEventListener('hashchange', loadFromLocation); };
  }, []);
  const content = <><p className="small muted">Open a complete SendShield link to load it automatically, or paste one below. Nothing is inspected, signed or paid automatically.</p><label className="field">Request link<input value={raw} maxLength={2048} placeholder="https://send-shield-solana.vercel.app/request#…" onChange={e => { setRaw(e.target.value); setError(''); }} /></label><button className="button secondary" onClick={() => { try { if (!raw.trim()) { setError('Paste the complete generated link first, or open it in your browser.'); return; } const request = parseRequestUrl(raw, window.location.origin); onLoad(request); setError(''); } catch { setError('Invalid request. Only complete SendShield Devnet SOL links with an on-curve address and an amount up to 0.1 SOL are accepted.'); } }}>Load pasted request</button>{error && <p className="notice error" role="alert">{error}</p>}</>;
  return compact ? <details ref={details} className="card"><summary>Have a payment request? Load it here</summary><div className="stack">{content}</div></details> : <section className="card stack"><h2>Have a payment request?</h2>{content}</section>;
}
