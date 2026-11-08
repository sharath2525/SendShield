# Release checklist — November 8, 2026

**Verdict: automated release checks PASS; real local Phantom payment PASS; local wallet-message test PASS (owner screenshots); enhancement deployment e377f4d verified.** This is an unaudited Devnet hackathon prototype, not a mainnet-ready payment service. The subsequent request/recovery UI correction is checked separately below.

## Repository and build

- PASS — existing `main` at `95f803b957950ed45b2e0c43c7f46ffdd92d4bc9` matched freshly fetched `origin/main`; no newer remote work overwritten.
- PASS — GitHub reports Vercel success for that payment-fix commit. Enhancement deployment must be checked separately.
- PASS — clean `npm ci` using the exact package.json and lockfile in an isolated temporary directory; 462 packages installed. The running user wallet test was not interrupted.
- PASS — `npm run typecheck`, `npm run lint`, `npm test`: **212 tests in 11 files**.
- PASS — `npm run test:e2e`: **20 desktop/mobile browser tests**, including live mint rejection, RPC-outage failure, request round trip, malformed-proof handling, empty-import guidance and recovery of the existing real Devnet transaction. Latest typecheck, lint, 212 unit tests and build also passed at approximately 22:11 IST.
- PASS — `npm run build`: seven user-facing routes generated, including `/prove` and `/request`; final build after commit-header addition passed.
- PASS — `npm audit --omit=dev --audit-level=moderate`: zero production dependency vulnerabilities reported. Clean full install reports eight moderate dev-tool advisories and deprecated ESLint 9; no force upgrade applied before release.
- PASS — `.env.example` contains public RPC URLs only; no secret environment file tracked. No private keys are used by app code. Troubleshooting script now accepts a local recording path as an argument instead of embedding the owner's path.

## Live blockchain evidence

- PASS — `npm run test:live` at 2026-11-08 16:28 UTC: live Devnet token mint and program rejected; on-curve unfunded key classified; genesis verified. Read-only checks, no broadcast.
- PASS — `npx tsx scripts/verify-demo-payment.ts` at 16:28:14 UTC: independently fetched **finalized**, exact **1,000,000 lamports**, fee **5,000 lamports**, slot **520065222**; actual application receipt verifier passed.
- Signature: `2qNjF9VBhwb8vfe9X2Gbr78vV8ouzMkgdC8KAaaXXquJzKP79BmmXBCMwLmN5AbENhjpVS7xUPvW7upQPeN2uU8K`.
- See [VERIFIED_PAYMENT.md](VERIFIED_PAYMENT.md). This was an owner-approved local Phantom payment, not a new automated or production transfer.

## Enhancement gates

- PASS — Ed25519 proof verification with ephemeral test keys: exact bytes, wrong wallet, wrong signature, altered nonce/domain/purpose/network/version/timestamps, expiry, future issuance, malformed/oversized input; reusable-before-expiry behavior explicitly tested.
- PASS — request validation: canonical on-curve address, integer amount cap, unknown asset/network, foreign URL/scheme, duplicate fields, control-character labels; editing a valid unsigned request is explicitly not authenticated.
- PASS — request import remains behind manual live inspection, review and wallet approval; original transfer regression tests pass.
- PASS — receipt export does not present a pending fee estimate as actual chain evidence; older wallet authorization metadata is labelled unavailable.
- PASS — new page mobile screenshots inspected at 375px. Browser layout tests report no horizontal overflow.
- PASS (owner-observed local test) — screenshots show connected wallet message signing and “Key-control signature verified” at 22:01:32 IST, issued 16:31:00.629 UTC and expiring 16:41:00.629 UTC. This is screenshot evidence of the app result, not an independent re-verification of the signature from its complete JSON.
- DEFERRED — QR, USDC, authenticated invoices, durable one-time proof service, identity registry and cloud sync. No unrelated features added.

## Deployment and submission

- Production: https://send-shield-solana.vercel.app/app
- PASS — Vercel success for `e377f4d03e87a7d0d21874073e787be5681a3384`; all seven public routes returned 200 at 375/768/1280px, no overflow/page errors, expected security headers and exact commit header, checked 16:33:20 UTC. `X-SendShield-Commit` reports the build commit. Subsequent recovery UI correction is ready for deployment after its passing tests.
- Run `node scripts/production-smoke.mjs <expected-full-SHA>` after deployment. It checks all seven routes at 375/768/1280px, HTTP status, overflow, page errors, security headers and exact commit header.
- MANUAL — one owner-approved wallet test on the deployed build, using Devnet and a second controlled wallet. Do not claim the earlier local test is a deployed-build test.
- PASS — README explains the exact problem, product differentiation, architecture, limitations and test setup. SUBMISSION.md and the timed word-for-word DEMO_SCRIPT.md are prepared.
- PENDING — public video URL. Upload a <=2-minute video to YouTube, Vimeo or Loom and check it signed out.
- BLOCKED — MLH submission API rejected the request because the seven survey answers were missing. The owner reports saving them in the website draft; API did not reuse those answers. No accepted submission or prize entry is claimed. The public video remains owner-managed; do not repeatedly request it.

## Screenshot-driven recovery correction

- Images 1–2: local key-control proof success recorded above.
- Image 3: generated request existed, but importer was empty and the page URL contained no request. Added an explicit “Open generated request” link and clear empty-input guidance. Localhost links only work on the same computer; generate public links on the deployed site.
- Image 4: unresolved-payment guard blocked a new send. Saved confirmations are intentionally downgraded on reload until RPC rechecks them; the screenshot alone does not identify which saved attempt blocked the wallet. Added “Recheck earlier payments” and Activity navigation directly on the payment page. No guard removal, forced success, resend or deletion.
- PASS — live browser recovery test seeded only the saved history for the already verified public signature, then used real Devnet RPC to restore confirmation on desktop/mobile. It initiated no transaction.

No guaranteed safety, guaranteed prize, fake blockchain success or universal wallet compatibility is claimed.
