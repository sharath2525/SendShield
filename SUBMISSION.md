# SendShield — MLH submission material

**Pitch:** Inspect Solana recipients, prove wallet-key control, and reconcile reviewed Devnet payments with real on-chain evidence.

**Event:** MLH Solana Hackathon, November 6–8, 2026.
**Categories:** DeFi Track Top Prize and Top 3 Overall. No Gaming or runtime AI feature; Beginner eligibility is not established.

## Description

A successful blockchain transaction can still be the wrong payment. A copied Solana address might be a token mint rather than an ordinary wallet; familiar address edges can conceal a contact mismatch; and a wallet response is not proof that the intended payment settled.

SendShield makes payment evidence understandable. It inspects live account ownership and layout, compares full addresses against locally saved contacts, and requires explicit review and wallet approval for a capped Devnet SOL transfer. It validates the returned transaction against the reviewed message, records its signature before broadcasting, and checks actual transaction evidence before showing confirmation. Unknown results remain unknown and recoverable.

The application also creates and verifies domain-separated wallet-control messages with Ed25519 signatures and ten-minute expiry, generates strictly parsed Devnet payment-request links, and displays three layers of evidence: reviewed intent, locally observed wallet authorization, and confirmed chain result. Receipts can be exported as public JSON summaries.

Solana is essential: account ownership and data determine the recipient policy; Wallet Standard authorizes the native System Program transfer; and RPC evidence determines settlement. This is not a mock blockchain demo. An owner-approved Phantom transfer of 0.001 SOL was independently verified finalized at slot 520065222, with a 5,000-lamport fee and exact recipient/amount matching. The application verifier passed against that real transaction.

We built the application in this project using Next.js, React, TypeScript, Solana Kit and Wallet Standard, with Codex development assistance. Automated coverage includes strict parsing, transaction mutation, uncertain settlement, local storage, proof tampering/expiry, request validation and responsive browser interactions. See RELEASE_CHECKLIST.md for the latest exact results and manual gates.

Limits: this is an unaudited Devnet prototype. Key control is not real-world identity; offline proofs can be reused until expiry; request links are unsigned; receipt exports are unsigned summaries; contacts and history stay in the browser. No custody, mainnet sending, USDC flow, custom contract or runtime AI API is claimed. New wallet-message signing and deployed-wallet checks must be reported separately from automated cryptographic tests.

## Links

- Source: https://github.com/sharath2525/SendShield
- Live app: https://send-shield-solana.vercel.app/app
- Public demo video: **OWNER TO PROVIDE** — YouTube, Vimeo or Loom, maximum two minutes.
- Real finalized Devnet payment: https://explorer.solana.com/tx/2qNjF9VBhwb8vfe9X2Gbr78vV8ouzMkgdC8KAaaXXquJzKP79BmmXBCMwLmN5AbENhjpVS7xUPvW7upQPeN2uU8K?cluster=devnet
- Evidence: https://github.com/sharath2525/SendShield/blob/main/VERIFIED_PAYMENT.md

## Technologies

Solana, Solana Kit, Wallet Standard, System Program, Compute Budget Program, Next.js, React, TypeScript, Tailwind CSS, Zod, Lucide, Vitest, Playwright, Vercel, Web Crypto Ed25519. OpenAI Codex is development assistance, not a runtime API.

## Prize-category answers

**DeFi Track Top Prize:** SendShield improves native SOL payments through live destination inspection, contact-lookalike blocking, exact intent review and independent transaction reconciliation. Its recipient-control proofs, Devnet request links and three-layer receipts make the boundaries between key control, authorization and settlement visible without custody or invented safety guarantees.

**Top 3 Overall:** SendShield addresses a concrete, irreversible payment mistake through a usable evidence-based workflow. It combines genuine Solana integration and a verified real Phantom transfer with transparent failure recovery, responsive design, cryptographic proof validation and automated regression tests.

## Demo package

Read DEMO_SCRIPT.md for the word-for-word two-minute narration, recording actions, title, description and tags. Strongest opening: **“A transaction can succeed and still be the wrong payment.”**

Screenshots: actual live mint rejection; labelled simulated lookalike comparison; proof verifier (real success only after wallet test); full review; actual receipt with matching Explorer evidence. Do not use fake success or expose wallet secrets.

## Submission status

The existing MLH project is being updated, not duplicated. A draft, registration or check-in is not a submission. Record the returned submission and prize-entry confirmations here once MLH accepts them. The owner says the participant survey was saved on MLH; API acceptance still needs verification. Public demo video URL remains outstanding.
