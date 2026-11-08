'use client';
import { useState } from 'react';
import { AddressDiff } from './address';
import { compareAddresses } from '@/lib/security/compare-addresses';
import type { TrustedContact } from '@/types';
// Explicit illustrative public strings. Neither is presented as a controlled recipient.
const saved = '9xQeWvG816bUx9EPfDd3G3UDUqW2JA2riYhKbBLdD8tE';
const candidate = '9xQeWvG816bUx9EPfDd3H3UDUqW2JA2riYhKbBLdD8tE';
const contact: TrustedContact = { id: 'illustration', displayName: 'Illustrative contact', address: saved, cluster: 'devnet', method: 'user_saved', notes: 'Simulation only', addedAt: '2026-11-08T00:00:00Z' };
export default function LookalikeDemo() {
  const [show, setShow] = useState(false); const match = compareAddresses(candidate, contact);
  return <section className="card stack" id="lookalike-example"><span className="eyebrow">Learn to read the entire address</span><h2>Similar edges. A different destination.</h2><p className="notice warning"><strong>SIMULATED LOOKALIKE EXAMPLE — NO REAL ON-CHAIN ATTACK DETECTED</strong></p><p>These are illustrative base58 strings, not a verified recipient or a live RPC result. Nothing here is saved to your contacts or connected to a send action.</p><button className="button secondary" aria-expanded={show} onClick={() => setShow(!show)}>{show ? 'Hide comparison' : 'Compare simulated addresses'}</button>{show && <><div className="notice error"><strong>LOOKALIKE_REVIEW · These are different addresses.</strong></div><AddressDiff candidate={candidate} trusted={saved} /><p className="small muted">Shared prefix: {match.prefix} characters. Shared suffix: {match.suffix}. Changed character: {(match.firstMismatch ?? 0) + 1}. The same rule blocks a conflicting recipient in the live payment flow.</p></>}</section>;
}
