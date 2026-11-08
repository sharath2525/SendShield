# SendShield: two-minute demo script

Read this at a natural pace. Target 1:50–1:58. The strongest story is **a successful transaction is not necessarily the intended payment**. Demonstrate evidence, not promises of total safety.

## Before recording

Open the tested app, `/learn`, `/prove`, and the genuine Devnet Explorer receipt. Connect a funded Devnet test wallet; hide unrelated account names, balances, notifications and bookmarks. Use a second wallet you control. Rehearse the clicks once. New proofs expire after ten minutes, so create one shortly before recording.

## Say this, while showing the screen

**0:00–0:12 — landing / app**

“Hi, I'm Sharath. I built SendShield for the MLH Solana Hackathon. A transaction can succeed and still send SOL to the wrong destination. SendShield checks the recipient before approval and the result afterward.”

**0:12–0:32 — Load wrapped SOL mint → Inspect → show live evidence**

“This is a real token mint, not an ordinary wallet. SendShield reads its owner and account data from Solana Devnet and blocks this native-SOL payment. It shows the reason and RPC evidence instead of a vague safety score.”

**0:32–0:45 — Safety guide → Compare simulated addresses**

“This example is explicitly simulated. The address edges look familiar, but the middle differs. SendShield highlights those differences and blocks conflicting saved-contact lookalikes.”

**0:45–1:00 — proof page, actual verified message proof**

“A recipient can also sign a message proving control of their wallet key. We verify its exact address, domain, signature and expiry. That proves key control—not the person's identity. The offline proof is reusable until it expires.”

**1:00–1:12 — request page, generated link / full address and amount**

“A Devnet request carries the full recipient and exact amount. The link is unsigned, so it still goes through inspection, contact comparison and manual review. Nothing pays automatically.”

**1:12–1:38 — actual recipient inspection → Review → real wallet approval**

“Now I review a real 0.001 SOL transfer to my second test wallet. The priority fee is zero, and the wallet must approve. SendShield checks the returned transaction against the reviewed intent and records its signature before broadcasting.”

**1:38–1:53 — resulting receipt and matching Explorer transaction**

“The receipt separates what I reviewed, what the application observed from the wallet, and what actually settled on chain. Here are the matching recipient, amount and signature in Solana Explorer. A timeout never becomes fake success.”

**1:53–2:00 — end card**

“SendShield: recipient evidence to payment proof. Non-custodial, Devnet-only, built with Solana Kit and Codex assistance.”

## If you need a shorter take

Cut the request-link section first. Keep the real mint rejection, genuine transfer evidence and honest limitations. Do not promise to win or say “100% safe.”

## Honest editing rules

- If confirmation takes time, cut the waiting interval and label it “confirmation wait shortened.” Keep the approval and resulting signature consistent.
- You may show the previously verified payment, but say **“This is our earlier successful Devnet test”**. Do not present its receipt as the result of a new approval.
- If real wallet message signing has not passed, omit the proof success scene. Do not substitute a fixture for a real proof.
- If the deployed version is not verified, demonstrate the tested local app and disclose that; do not imply it is the public build.
- Never show a seed phrase/private key. Test SOL addresses and public signatures are sufficient.

## Upload

Title: **SendShield — Recipient Evidence to Payment Proof | MLH Solana Hackathon 2026**

Description: SendShield inspects real Solana account types, compares full recipient addresses, verifies wallet-control messages, and reconciles intended Devnet transfers with actual chain evidence. Key control is not identity; payment links are unsigned; this is an unaudited Devnet prototype. Built with Solana Kit, Wallet Standard, Next.js and Codex assistance.

App: https://send-shield-solana.vercel.app/app
Source: https://github.com/sharath2525/SendShield

Tags: Solana, MLH, DeFi, WalletStandard, SendShield.

Upload to YouTube (public or unlisted), Vimeo or Loom; check it signed out and send the public URL for MLH submission. No local MP4 path can replace that URL.
