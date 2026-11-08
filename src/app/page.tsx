import Link from "next/link";
import { ArrowRight, Check, Fingerprint, ScanLine, ShieldCheck, Wallet, LockKeyhole, ChevronRight, CircleAlert } from "lucide-react";

export default function Home() {
  return (
    <main className="container landing">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="solana-mark" aria-hidden="true"><i /><i /><i /></span> A little more certainty. Before you send.</div>
          <h1>Verify the address.<br /><span>Then send.</span></h1>
          <p className="hero-description">An address can look right and still be the wrong destination. Check its Solana account type, compare it with your trusted contacts, and review every detail before you sign.</p>
          <div className="row hero-actions">
            <Link href="/app" className="button">Launch SendShield <ArrowRight size={18} /></Link>
            <Link href="/learn" className="button ghost">How it works <ChevronRight size={17} /></Link>
          </div>
          <p className="small muted hero-note"><LockKeyhole size={14} /> Devnet demo · No mainnet payments · Your wallet stays yours</p>
        </div>
        <div className="hero-visual" aria-label="Illustration of the recipient verification workflow">
          <div className="visual-topline"><span className="eyebrow">A second look, built in</span><ShieldCheck size={20} /></div>
          <div className="illustration-address"><span className="small muted">THE DESTINATION MATTERS</span><div className="address-glyphs" aria-hidden="true"><span>4d8K</span><span className="glyph-middle">···· ···· ····</span><span>7wQp</span></div><span className="illustration-label">Illustrative address fragment — not a payment recipient</span></div>
          <div className="illustration-check"><span className="illustration-icon"><ScanLine size={20} /></span><div><strong>Inspect the account</strong><p>Wallet, token mint, or program?</p></div><Check size={18} /></div>
          <div className="illustration-check"><span className="illustration-icon"><Fingerprint size={20} /></span><div><strong>Compare the full address</strong><p>Small differences deserve a closer look.</p></div><Check size={18} /></div>
          <div className="illustration-check"><span className="illustration-icon"><Wallet size={20} /></span><div><strong>You review. Your wallet signs.</strong><p>A real onchain receipt follows confirmation.</p></div><ArrowRight size={18} /></div>
          <div className="visual-footnote"><CircleAlert size={16} /><span>Account checks help prevent mistakes.<br />They cannot prove who is behind an address.</span></div>
        </div>
      </section>

      <section className="how-section" aria-labelledby="how-heading">
        <div className="section-intro"><div><span className="eyebrow">ONE PAYMENT. THREE DELIBERATE STEPS.</span><h2 id="how-heading">Make the checks that matter.</h2></div><p className="muted">No trust scores. No guessing.<br />Just clear evidence, before your signature.</p></div>
        <div className="feature-grid">
          <article className="feature-card"><span className="feature-number">01 / INSPECT</span><ScanLine className="feature-icon" size={26} /><h3>Know the destination.</h3><p>Read the actual account on Solana. Sending native SOL to a mint, token account, or program is blocked here.</p><span className="feature-caption">Live RPC account evidence</span></article>
          <article className="feature-card"><span className="feature-number">02 / COMPARE</span><Fingerprint className="feature-icon" size={26} /><h3>Look past the first letters.</h3><p>Compare against contacts you saved. Similar-looking addresses get a full-address comparison and a pause before payment.</p><span className="feature-caption">Your contacts, stored on this device</span></article>
          <article className="feature-card"><span className="feature-number">03 / CONFIRM</span><ShieldCheck className="feature-icon" size={26} /><h3>Send with the details in view.</h3><p>Review the recipient, amount, and Devnet network. Sign in your wallet, then verify the resulting transaction onchain.</p><span className="feature-caption">Wallet authorization · Verified receipt</span></article>
        </div>
      </section>
      <section className="landing-boundary"><ShieldCheck size={26} /><div><h3>Helpful checks. Honest limits.</h3><p>This prototype checks account structure and local address similarities. It does not authenticate people, detect every scam, or protect a compromised wallet.</p></div><Link href="/learn">Understand the limits <ArrowRight size={17} /></Link></section>
    </main>
  );
}
