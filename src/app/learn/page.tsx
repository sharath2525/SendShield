import Link from "next/link";
import LookalikeDemo from '@/components/lookalike-demo';
import { ArrowRight, BookOpen, ShieldAlert, CheckCircle2, ExternalLink } from "lucide-react";

const lessons = [
  { number: "01", title: "A valid address can still be the wrong recipient", text: "Solana addresses identify accounts. Some accounts are wallets; others are token mints, token accounts, or programs. A native SOL transfer can succeed into an unintended account type even when you cannot recover the funds. SendShield only permits ordinary on-curve System Program wallets with no allocated data, or on-curve addresses that the selected network confirms do not yet exist." },
  { number: "02", title: "Address poisoning exploits a quick glance", text: "An attacker may use an address whose beginning and ending resemble an address you recognize. Copying from untrusted history or checking only a few characters can send funds to someone else. SendShield compares the full candidate with every contact saved for the selected network. A near match is a reason to stop and verify, not proof that an attack occurred." },
  { number: "03", title: "On-curve describes a key, not a person", text: "An on-curve address is compatible with an Ed25519 public key. That does not tell us who controls it or whether anyone has its private key. Off-curve addresses can be legitimate program-derived accounts and smart wallets, but this demo does not support sending SOL to them. Blocking them is a conservative product boundary, not an accusation." },
  { number: "04", title: "A saved contact is only as reliable as your source", text: "Names such as Alice or Treasury are labels you enter. Saving an address does not prove ownership. Contacts stay in this browser, are separated by network, and are not synced or independently authenticated. Verify an address through a separate trusted channel before saving it, and repeat that verification when payment details change." },
  { number: "05", title: "Confirmation needs evidence from the network", text: "A wallet signature or an RPC submission response is not a confirmed payment. SendShield checks the transaction status and the actual transaction, including its sender, recipient, amount, and error state. If a response is uncertain, check the existing signature before trying again. An unknown outcome must not be treated as permission to make a second payment." },
  { number: "06", title: "Devnet is a place to test", text: "This app signs payments only on Solana Devnet, capped at 0.1 test SOL per payment. Devnet SOL is for testing. Use a separate test wallet and verify the network in your wallet. If read-only Mainnet inspection is enabled, it never enables Mainnet signing. Never share a seed phrase or private key with this app." },
];

export default function LearnPage() {
  return (
    <main className="container guide-page">
      <div className="page-heading"><div className="eyebrow"><BookOpen size={16} /> THE SENDSHIELD SAFETY GUIDE</div><h1>A better check.<br />An informed decision.</h1><p className="muted">Understand what the app can establish, and what you still need to verify yourself.</p></div>
      <LookalikeDemo />
      <div className="guide-layout">
        <div className="stack">{lessons.map((lesson) => <article key={lesson.number} className="card lesson"><span className="feature-number">{lesson.number}</span><h2>{lesson.title}</h2><p>{lesson.text}</p></article>)}</div>
        <aside className="guide-aside stack">
          <section className="card"><CheckCircle2 size={24} className="guide-check" /><h2>Before you send</h2><ol className="safety-list"><li>Ask the recipient for their full address using a channel you already trust.</li><li>Compare the entire address, including the middle.</li><li>Inspect the account on the intended network.</li><li>Review the full recipient and exact amount in both SendShield and your wallet.</li><li>Keep the transaction signature and check the receipt.</li></ol><Link className="button" href="/app">Inspect an address <ArrowRight size={17} /></Link></section>
          <section className="notice warning"><ShieldAlert size={22} /><h3>What this cannot guarantee</h3><p>No universal scam detection, recipient identity verification, wallet compromise protection, or recovery of mistaken payments. This is an unaudited hackathon prototype.</p></section>
          <section className="guide-resources"><h3>Go to the source</h3><a href="https://solana.com/docs/payments/send-payments/verify-address" target="_blank" rel="noreferrer">Solana address verification <ExternalLink size={14} /></a><a href="https://faucet.solana.com/" target="_blank" rel="noreferrer">Get Devnet test SOL <ExternalLink size={14} /></a><a href="https://explorer.solana.com/?cluster=devnet" target="_blank" rel="noreferrer">Open Solana Devnet Explorer <ExternalLink size={14} /></a></section>
        </aside>
      </div>
    </main>
  );
}
