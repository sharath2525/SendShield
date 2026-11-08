'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
export function FullAddress({ value, copy = true }: { value: string; copy?: boolean }) {
  const [message, setMessage] = useState('');
  return <div className="full-address"><code className="address">{value}</code>{copy && <button className="button ghost copy-button" type="button" aria-label="Copy full address or signature" onClick={async () => { try { await navigator.clipboard.writeText(value); setMessage('Copied'); } catch { setMessage('Select and copy the full text manually.'); } }}>{message === 'Copied' ? <Check size={16} /> : <Copy size={16} />}</button>}<span className="sr-only" role="status">{message}</span></div>;
}
export function AddressDiff({ candidate, trusted }: { candidate: string; trusted: string }) {
  return <div className="stack"><div><span className="small muted">Entered address</span><code className="address diff-address" aria-label={`Entered address: ${candidate}`}>{[...candidate].map((c, i) => <span className={c !== trusted[i] ? 'diff-char' : ''} key={i}>{c}</span>)}</code></div><div><span className="small muted">Saved address</span><code className="address diff-address" aria-label={`Saved address: ${trusted}`}>{[...trusted].map((c, i) => <span className={c !== candidate[i] ? 'diff-char' : ''} key={i}>{c}</span>)}</code></div></div>;
}
