# SendShield — Verify before you send

SendShield inspects the actual Solana recipient before a native SOL payment, compares the full address against locally saved contacts, and independently checks the resulting transaction receipt.

Built for **MLH Solana Hackathon, November 6–8, 2026**, DeFi/payments. This is an unaudited Devnet prototype, not a universal scam detector.

- Public app: https://send-shield-solana.vercel.app/app
- Source: https://github.com/sharath2525/SendShield
- Release evidence: [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)
- Payment investigation: [PAYMENT_INVESTIGATION.md](PAYMENT_INVESTIGATION.md)

## Features

- Real RPC account inspection, strict canonical public keys, SDK curve checks, and cluster-genesis verification.
- Native SOL eligibility restricted to ordinary on-curve System Program wallets with empty account data, or on-curve unfunded addresses.
- Explicit rejection of token mints/accounts, programs, unsupported layouts and off-curve recipients. RPC failure blocks sending.
- Same-network contact comparisons with full-address differences. Conflicting lookalikes block payment. Contacts are user assertions, not identity proofs.
- Wallet Standard connection and sign-only authorization; Devnet payments capped at 0.1 SOL with exact integer lamports.
- Explicit 20,000-unit compute limit and zero priority-fee policy. Fee estimation uses the built message. Unexpected wallet changes remain rejected.
- Browser-local activity, signature persistence before broadcast, single-send locking and receipt rechecks.
- Five responsive routes: `/`, `/app`, `/contacts`, `/activity`, `/learn`. The lookalike teaching example is permanently marked simulated.

## Verification status

The initial Phantom issue was reproduced visually from the user's recording. Phantom's documented automatic priority-fee injection explains why the original unsigned, budget-free message could differ after signing. The local correction predefines the fee policy rather than accepting arbitrary wallet instructions.

The corrected transaction passed a genuine **read-only Devnet simulation** with 450 compute units and no error (slot 520064799). Simulation is **not settlement**. The user reported no transaction in Phantom history for the original failed attempt. A real Phantom retest is still required. Do not claim the production deployment includes local patches until the deployed commit is verified.

## Quick start

Use Node 22.12+ and npm:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000/app. Default public endpoints work without credentials. Optionally copy `.env.example` to `.env.local` and set public RPC URLs, then restart. `NEXT_PUBLIC_*` values are public browser configuration: never put secret provider keys there. No database or backend signer is required.

## Genuine Devnet test

1. Open the app in a browser with a Devnet-compatible Wallet Standard wallet supporting `solana:signTransaction` and version-0 messages. Enable Devnet in the wallet.
2. Fund a test sender at https://faucet.solana.com/. Use a second wallet you control as recipient; independently copy its full address.
3. Connect, enter 0.001 SOL and the recipient, inspect, then review the full address, amount, network and zero priority-fee policy.
4. Approve exactly once in your wallet. Wait for a receipt. Open its Devnet Explorer link and compare sender, recipient, amount and fee.
5. If the result is unknown, check Activity and the existing signature. Never retry blindly. A signed response or simulation is not confirmation.

No private keys or seed phrases belong in this app or repository. Do not send real mainnet assets; mainnet inspection is read-only.

## Architecture and safety model

Next.js App Router / React / TypeScript → pure address, amount and comparison policies → Solana Kit RPC → Wallet Standard sign-only capability → message-policy validation → one app-controlled broadcast → signature status and parsed transaction verification.

Key modules: `src/lib/security`, `src/lib/solana`, `src/lib/storage`, `src/components`, `src/app`. Zod validates persisted data and receipt evidence. Solana Kit handles public-key parsing, curve checks, transaction encoding and wallet integration; System and Compute Budget instructions use official generated libraries. UI uses Tailwind CSS and Lucide. Vitest and Playwright provide regression coverage.

The threat model covers mistaken account types, heuristic lookalikes, stale review state, malformed local data, uncertain RPC responses and duplicate payment interactions. It does not cover a compromised browser/wallet, dishonest RPC operator, stolen recipient keys or social engineering that defeats independent identity verification. Full account type eligibility is not proof of identity or key control. No signed recipient-control proof is implemented yet.

Storage is local, versioned, and schema validated. Denied storage falls back to visible in-memory mode; closing that tab can lose pending history. Web Locks coordinate sends across supported browser tabs. Clearing browser storage removes contacts and recovery records. No cloud synchronization or general wallet-history indexing exists.

## Checks and deployment

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:live
npx tsx scripts/simulate-payment.ts
```

The last script performs unsigned simulation only. Unit mocks and ephemeral test signers are confined to tests; they never substitute for live app RPC.

Vercel: import this repository with root `.`; select Next.js, Node 22 or a compatible newer runtime, install `npm ci`, build `npm run build`, and default framework output. Use the existing production project/domain. Public environment changes require rebuilding. Verify all routes and a genuine wallet transfer on the deployed commit before release. Do not force-push history.

Known dependency audit: installation reports eight moderate development-tool dependency advisories; production runtime exposure was not established by that install output. Do not blindly run a breaking `npm audit fix --force` before submission.

## Attribution and AI disclosure

Application source was created in this project during the hackathon with OpenAI Codex assistance. No runtime AI API is used, and the project does not claim the AI prize merely because AI helped write code. Public libraries retain their respective licenses; no prior personal project source was reused in the initial build. A project-source license has not yet been selected by the owner.

Primary references: [Solana Next.js + Kit](https://solana.com/docs/frontend/nextjs-solana), [recipient verification](https://solana.com/docs/payments/send-payments/verify-address), [Phantom priority fee behavior](https://github.com/phantom/docs/blob/master/development-powertools/solana-priority-fees.md). Product assessment and competitors are documented in [PRODUCT_REVIEW.md](PRODUCT_REVIEW.md).
