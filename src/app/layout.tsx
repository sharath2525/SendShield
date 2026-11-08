import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import Header from '@/components/header';
import Providers from '@/components/providers';
import './globals.css';
export const metadata: Metadata = { title: 'SendShield — Verify before you send', description: 'Inspect Solana recipients, compare trusted contacts, and deliberately send Devnet SOL with verified receipts.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Header /><Suspense fallback={<main className="container empty">Loading SendShield…</main>}><Providers>{children}</Providers></Suspense><footer className="container site-footer"><span>SendShield · Built for careful sends.</span><span>Unaudited prototype · Devnet payments only · <Link href="/learn">Know the limits</Link></span></footer></body></html>;
}
