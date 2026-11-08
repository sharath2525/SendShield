# SendShield
### Verify the recipient. Lock the intent. Prove the payment.

**Built for the MLH Solana Hackathon 
**Network:** Solana Devnet  
**Status:** Hackathon prototype

[Live Application](https://send-shield-solana.vercel.app/app) | [GitHub Repository](https://github.com/sharath2525/SendShield)

## The Problem

A transaction can succeed on Solana and still be the wrong payment.

A sender might paste a token mint instead of a recipient wallet, confuse two lookalike addresses, approve different payment details than intended, or mistake a wallet confirmation for successful on-chain settlement.

Traditional transaction explorers show what happened after payment. SendShield brings recipient inspection, payment review, authorization checks and settlement evidence into one connected workflow.

## Our Solution

SendShield is a non-custodial Solana payment-safety application that helps users:

1. **Inspect the destination** using live Solana RPC account information.
2. **Detect suspicious lookalikes** by comparing full addresses against locally saved contacts.
3. **Prove wallet control** using cryptographically verified off-chain message signatures.
4. **Generate payment requests** without automatically authorizing or sending transactions.
5. **Review and lock payment intent** before the wallet signs.
6. **Verify actual settlement** against the reviewed sender, recipient, amount and network.
7. **Recover uncertain payments** without blindly sending a duplicate transaction.

## What Makes SendShield Different?

**The core innovation is not another Send button. It is an evidence-driven payment workflow.**

SendShield connects three stages:

**Reviewed intent → Wallet authorization → On-chain settlement**

A payment is not marked verified merely because a wallet displays a success message. SendShield checks the recorded transaction against the intended payment and retrieves settlement evidence from Solana.

Individual protections already exist in wallets and blockchain tools. SendShield's contribution is combining Solana-specific account inspection, recipient-control evidence, conservative payment handling and independently checked receipts in a single experience.

## Features

### 1. Real Recipient Inspection

- Inspect Solana addresses through live RPC.
- Identify supported wallet accounts, token accounts, mints, programs and unsupported destinations.
- Validate account ownership, executable status and account data.
- Block unsupported native-SOL recipients.
- Allow read-only mainnet inspection while restricting payment execution to Devnet.
- Fail closed when critical RPC checks are unavailable.

### 2. Lookalike Address Protection

- Maintain locally saved trusted contacts.
- Compare full addresses rather than abbreviated display strings.
- Highlight matching and differing address characters.
- Block conflicting lookalike destinations.
- Provide a clearly labelled simulated example for education.

A similarity warning does not prove fraud, and a saved contact does not establish someone's real-world identity.

### 3. Cryptographic Wallet-Control Proof

- Generate a wallet-signature challenge.
- Verify the signature against the expected wallet address.
- Include domain, network, purpose, nonce and expiration metadata.
- Use a ten-minute proof validity window.
- Require no blockchain transaction or gas fee.

This proves control of the signing key during the challenge, not the legal identity of a recipient.

### 4. Payment Request Links

- Generate shareable Devnet SOL payment requests.
- Import the recipient address and requested amount.
- Reinspect the destination before payment.
- Require deliberate review and wallet approval.
- Reject unsupported payment-request formats.

Payment-request links are unsigned and are not independently authenticated invoices.

### 5. Guarded Devnet Payments

- Connect through Wallet Standard.
- Use exact integer lamport calculations.
- Revalidate the payment before signing.
- Show fees and destination details.
- Apply a maximum 0.1 SOL demonstration transfer cap.
- Prevent conflicting payment attempts.
- Submit signed transactions without granting the application custody of wallet keys.

### 6. Three-Layer Payment Evidence

SendShield distinguishes:

- **Intent:** The sender, recipient, amount and network the user reviewed.
- **Authorization:** The supported evidence about the wallet-signed transaction.
- **Settlement:** The transaction and execution result retrieved from Solana RPC.

The receipt includes the transaction signature, slot, amount, recipient, fee and a Solana Explorer link.

### 7. Payment Recovery

If RPC confirmation is delayed or unavailable, SendShield retains the known signature where available and reports the outcome as unresolved rather than falsely declaring failure.

Users can recheck existing transactions without creating another payment.

## Verified Blockchain Demonstration

The project documentation records a genuine user-approved Phantom transaction on Solana Devnet.

| Property | Verified example |
|---|---|
| Asset | Devnet SOL |
| Transfer amount | 0.001 SOL |
| Actual network fee | 0.000005 SOL |
| Confirmation | Finalized |
| Slot | 520065222 |
| Execution error | None |

The transaction's sender, recipient and amount were checked against the intended payment.

See [VERIFIED_PAYMENT.md](VERIFIED_PAYMENT.md) for the transaction signature and reproducible verification details.

**Verification scope:** This evidence covers the documented transaction and local verification workflow. It does not constitute a security audit or comprehensive production-wallet certification.

## Application Pages

| Page | Purpose |
|---|---|
| `/` | Product introduction |
| `/app` | Recipient verification and guarded payment |
| `/contacts` | Saved recipient contacts |
| `/activity` | Transaction activity and receipt recovery |
| `/learn` | Address-safety guidance and lookalike demonstration |
| `/prove` | Wallet-control proof creation and verification |
| `/request` | Payment request creation and import |

## Technology Stack

- **Frontend:** Next.js, React, TypeScript and Tailwind CSS
- **Blockchain:** Solana Devnet and Solana RPC
- **Wallets:** Wallet Standard and Solana Kit
- **Signing:** User-controlled wallet authorization
- **Cryptography:** Ed25519 verification using supported SDK and Web Crypto functionality
- **Validation:** Zod
- **Testing:** Vitest and Playwright
- **Hosting:** Vercel
- **Storage:** Browser-local, schema-validated storage

No custom smart contract, backend custodial signer, database or runtime AI service is required.

## Local Development

Requires Node.js 22.12 or a compatible newer version.

```bash
git clone https://github.com/sharath2525/SendShield.git
cd SendShield
npm ci
npm run dev
```

Open `http://localhost:3000/app`.

For optional RPC configuration, see `.env.example`. Never put confidential RPC credentials in public browser environment variables.

## Testing

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
npm run test:live
npx tsx scripts/verify-demo-payment.ts
```

The verification script inspects recorded payment evidence and does not initiate a new transfer.

## Try the Hackathon Demo

1. Inspect the wrapped SOL mint address and observe how an unsupported destination is blocked.
2. Use the simulated address comparison to see highlighted lookalike differences.
3. Generate and verify a recipient wallet-control signature.
4. Create and import a Devnet SOL payment request.
5. Inspect a second wallet, review the exact payment and approve through Phantom.
6. Compare the confirmed payment receipt against Solana Explorer.
7. Reload and recheck the transaction without sending again.

Use only wallets you control and small amounts of Devnet test SOL.

## Security and Limitations

SendShield is an **unaudited hackathon prototype**, not a universal fraud detector.

- An eligible account type does not prove recipient identity.
- A wallet-control signature proves key control, not real-world identity.
- Lookalike heuristics cannot detect every malicious address.
- Imported payment requests are not authenticated.
- Browser-local records are not permanent blockchain proofs.
- RPC data availability and wallet compatibility can vary.
- Mainnet transfers are intentionally not supported.
- The application does not hold user private keys or seed phrases.

## Why Solana?

SendShield uses Solana's account model, RPC data, transaction instructions, wallet signatures, and independently verifiable settlement to provide a safety-focused payment workflow.

Solana is an essential part of the product's verification and settlement logic—not an optional payment badge.

## Hackathon Submission

**Event:** MLH Solana Hackathon, November 6–8, 2026  
**Primary track:** DeFi Track  
**Additional consideration:** Top 3 Overall, subject to eligibility  
**Development:** Built with OpenAI Codex assistance

The project was developed as a new hackathon application and is separate from the author's earlier projects.

### Links

- Live app: https://send-shield-solana.vercel.app/app
- Source: https://github.com/sharath2525/SendShield
- Real payment evidence: [VERIFIED_PAYMENT.md](VERIFIED_PAYMENT.md)
- Testing and release notes: [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)
- Demo script: [DEMO_SCRIPT.md](DEMO_SCRIPT.md)

**SendShield — because a successful transaction should also be the intended transaction.**