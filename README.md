# SendShield — From recipient evidence to payment proof

**A Solana payment can succeed on chain and still go to the wrong destination. SendShield helps you inspect the recipient, review the exact payment, and verify what actually settled.**

Built for the **MLH Solana Hackathon, November 6–8, 2026**, DeFi/payments track.

[Live app](https://send-shield-solana.vercel.app/app) · [Source](https://github.com/sharath2525/SendShield) · [Two-minute demo script](DEMO_SCRIPT.md) · [Verified real payment](VERIFIED_PAYMENT.md) · [Release evidence](RELEASE_CHECKLIST.md)

## The problem

A Solana address is not necessarily a normal wallet. It can identify a token mint, token account, executable program, or another account type. Pasting a syntactically valid address is therefore not enough for a deliberate native SOL payment. Users can also mistake an address with familiar first and last characters for a saved recipient, or interpret a wallet popup or network timeout as proof of payment success or failure.

SendShield is for people making their first Solana payments and teams demonstrating safer payment workflows. It makes the evidence visible before approval and keeps uncertain outcomes recoverable afterward.

## What makes it special

The contribution is a connected **recipient → intent → authorization → settlement** workflow. These individual techniques are not inventions, and wallet warnings and Solana Pay already exist. SendShield brings them into one inspectable, conservative native-SOL experience:

| Question | Evidence SendShield provides | What it does not prove |
|---|---|---|
| Is this an eligible native-SOL destination? | Live RPC owner, layout, curve, executable status and cluster genesis | The recipient's identity or honesty |
| Does it resemble a saved contact? | Full-address comparison and highlighted differences; conflicting lookalikes block sending | That every lookalike is malicious or every attack is detected |
| Can someone control this wallet key? | Domain-separated Ed25519 message proof, exact address match and ten-minute expiry | Legal identity, current exclusive control, or one-time use |
| What am I being asked to pay? | Strict Devnet SOL request parsing, full destination and exact integer amount | Authenticated invoice ownership; request links are unsigned |
| Did the payment actually match? | Three-layer receipt: intent, observed signed-message policy, and independently fetched transaction | A wallet-screen attestation or protection from a dishonest RPC |

No custody, seed phrases, runtime AI, opaque safety score, platform fee, or automatic payment. The UI calls unknown outcomes **unknown**, records a signature before broadcast, and directs users to recheck instead of blindly retrying.

## Implemented features

- Live Solana RPC inspection, canonical address parsing and cluster-genesis checks. Mainnet inspection is read-only.
- Native SOL eligibility limited to ordinary on-curve System Program wallets with empty data, or on-curve unfunded addresses. Mint/token/program/off-curve/unsupported recipients are blocked. RPC failures fail closed.
- Browser-local contacts, address differences, lookalike conflict blocking, and an explicitly labelled simulated teaching example.
- Wallet Standard connection and sign-only version-0 transactions. Devnet transfers are capped at 0.1 SOL with exact integer lamports, fresh recipient checks and cross-tab send locking.
- Explicit 20,000-unit compute limit and zero priority fee. Unexpected wallet message changes remain rejected; actual fees are estimated before signing.
- `/prove`: create and cryptographically verify an off-chain wallet-control proof. Domain, version, network, wallet, purpose, random nonce and timestamps are signed. Unsupported message-signing wallets do not disable ordinary payments.
- `/request`: locally generate and parse shareable Devnet SOL links. Data is carried in the URL fragment. Unsupported networks/assets, external transaction URLs, duplicate fields and invalid amounts are rejected. Imports must use the ordinary inspect/review/approve flow.
- Three-layer receipts, local recovery, live RPC rechecks, Explorer links and public JSON export. Older receipts explicitly disclose missing authorization metadata.
- Routes: `/`, `/app`, `/contacts`, `/activity`, `/learn`, `/prove`, `/request`.

## Actual blockchain evidence

A genuine owner-approved Phantom payment was independently verified **finalized** on Devnet: **0.001 SOL**, **5,000 lamports fee**, slot **520065222**, exact expected sender and recipient, with no on-chain error. The application's receipt verifier also accepted that live transaction. [Evidence and reproducible verification](VERIFIED_PAYMENT.md).

The earlier Phantom mismatch was addressed by constructing the explicit zero-priority-fee compute policy before wallet signing. Phantom documents automatic priority-fee instruction injection for budget-free messages. We retained strict message validation rather than accepting arbitrary wallet changes.

This validates one real Phantom/local workflow. It is not a claim that every wallet or the current production deployment passed. See the release checklist for deployment and new message-signing test status.

## Quick start

Use Node 22.12+:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000/app. Public endpoints work without credentials. Optional public RPC configuration is documented in `.env.example`. `NEXT_PUBLIC_*` values are visible to every browser: never include confidential keys. No database or backend signer is required.

## Try it

1. **Reject a real wrong account type:** on Verify & send, load the wrapped SOL mint and inspect its actual RPC evidence.
2. **Explain lookalikes:** open Safety guide and run the permanently labelled simulated comparison.
3. **Prove key control:** connect a recipient wallet at `/prove`, sign the plain message, and share the proof through an independently trusted channel. A sender pastes the proof and the expected full address to verify it.
4. **Request a payment:** create a Devnet request at `/request`. Open the link, load it for review, continue to Verify & send, load the request, and inspect. A label is unverified text, never identity evidence.
5. **Make a genuine transfer:** connect a funded Devnet sender, use a second test wallet you control, inspect, review 0.001 SOL, and approve once. Compare the actual receipt with Explorer. If an earlier payment blocks sending, use **Recheck earlier payments** on the payment page or **Activity → Recheck receipts**. Saved confirmations require fresh RPC verification after reload. Never clear history to bypass an unresolved outcome.

Creating a request does not automatically import it. Use **Open generated request**, or paste its full URL into the request-import field. A `127.0.0.1` link works only on the same computer; create links for other people on the public app.

Get test SOL from [Solana's faucet](https://faucet.solana.com/). Never use a private key or seed phrase in SendShield.

## Architecture

Next.js App Router / React / TypeScript → strict address, amount, proof and request policies → Solana Kit RPC → Wallet Standard signing → signed-message policy validation → single app-controlled broadcast → status and parsed transaction verification.

Official System and Compute Budget instruction libraries build the transaction. Solana Kit and Web Crypto perform Ed25519 verification. Zod validates local storage and external input. Tailwind CSS and Lucide provide the UI; Vitest and Playwright provide regression tests. There is no custom on-chain program: this prototype operates on existing Solana accounts and native transfers.

## Limits and threat model

This is an **unaudited Devnet prototype**, not a universal scam detector or a mainnet-ready payment service. A compromised browser/wallet, stolen recipient key, dishonest RPC or successful social engineering remains outside its protection.

Offline proofs are reusable until expiry. A nonce distinguishes challenges; it does not enforce one-time use without durable server state. They are not bound to a specific invoice or requester. Requests are unsigned, and editing a valid address or amount cannot be detected cryptographically: full independent review is required. JSON receipts are unsigned public summaries, not independently authenticated certificates.

Contacts and history are browser-local, schema validated and not encrypted. Clearing storage removes recovery records; blocked storage falls back to visibly disclosed in-memory mode. Stored confirmations require fresh RPC checks after reload. Web Locks require a supported modern browser. Proof signing requires `solana:signMessage`; payments require sign-only version-0 support. No USDC, QR generation, identity registry, cloud sync, or automatic refund is implemented.

## Checks and Vercel deployment

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
npm run test:live
npx tsx scripts/verify-demo-payment.ts
```

The last command reads the real recorded payment; it never broadcasts. Test fixtures and ephemeral signers are confined to tests and never substitute for live data.

Vercel: use this repository's root, Next.js framework, Node 22 or compatible newer runtime, `npm ci`, `npm run build`, and default output. Public RPC environment changes require a rebuild. Verify the deployed commit and real wallet behavior before calling it production-ready. Exact results and unresolved gates are in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md).

## Attribution

Created for this project with OpenAI Codex development assistance. No runtime AI API is used; AI assistance alone is not an AI-track feature. Public dependencies retain their licenses. A project-source license has not been selected by the owner.

References: [Solana recipient verification](https://solana.com/docs/payments/send-payments/verify-address), [Solana Kit frontend](https://solana.com/docs/frontend/nextjs-solana), [Phantom priority-fee behavior](https://github.com/phantom/docs/blob/master/development-powertools/solana-priority-fees.md). See [PRODUCT_REVIEW.md](PRODUCT_REVIEW.md) for competitor analysis and candid tradeoffs.
