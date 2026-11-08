# SendShield

**One-line pitch:** Verify Solana recipients, catch account-type mistakes and contact lookalikes, then confirm the exact Devnet payment on chain.

**Event:** MLH Solana Hackathon, November 6–8, 2026.

**Categories:** DeFi Track Top Prize and Top 3 Overall. Gaming and runtime AI are not implemented. Beginner eligibility has not been established.

## Description

Native SOL can be sent successfully to the wrong account type. Familiar-looking address edges also encourage users to trust a pasted destination without checking its full value. SendShield makes that decision explicit: inspect live Solana account ownership and layout, compare the entire destination with independently saved contacts, review one Devnet payment, and reconcile its actual chain result.

We built a Next.js application with Wallet Standard connection, real Kit RPC inspection, strict address and amount parsing, a conservative native-SOL policy, contact comparison, guarded wallet signing and locally persisted receipt recovery. The live UI never substitutes mocked blockchain success. Its educational lookalike example is labelled simulated.

Solana is essential: account ownership/type determines the recipient policy, wallet authorization signs the actual System Program transfer, and RPC transaction evidence determines confirmation. The app has no custody, custom contract, mainnet payment flow or runtime AI model.

Current limitation: the local Phantom compatibility fix specifies compute-budget instructions and zero priority fee before signing, addressing documented wallet injection behavior. It has passed unsigned real Devnet simulation, but a genuine owner-approved retest and deployment verification remain required. Do not describe these as completed before adding evidence.

## Links

- Source: https://github.com/sharath2525/SendShield
- Live app: https://send-shield-solana.vercel.app/app
- Public demo video: **OWNER MUST PROVIDE** (YouTube, Vimeo or Loom; at most two minutes).
- Genuine verified transaction: **NOT YET RECORDED**.

## Technologies

Solana, Solana Kit, Wallet Standard, System Program, Compute Budget Program, Next.js, React, TypeScript, Tailwind CSS, Zod, Lucide, Vitest, Playwright, Vercel. OpenAI is development assistance, not a runtime application API.

## Prize-category answers

**DeFi Track Top Prize:** SendShield improves the native SOL payment workflow by rejecting incompatible recipients and conflicting contact lookalikes before signing. It uses Solana account inspection, explicit payment intent and independent transaction reconciliation to make payment outcomes understandable.

**Top 3 Overall:** SendShield turns a specific blockchain mistake into a clear inspect–compare–review–confirm experience. It combines genuine Solana integration, responsive design, conservative failure handling and automated regression coverage, with its remaining wallet-verification limits disclosed.

## Video and publicity

YouTube title: **SendShield — Verify Before You Send | MLH Solana Hackathon 2026**

Description: SendShield checks actual Solana destinations and compares saved contacts before a deliberate Devnet payment. Built with Solana Kit, Wallet Standard and Next.js. An account-type check does not prove identity. Source: https://github.com/sharath2525/SendShield — app: https://send-shield-solana.vercel.app/app. Codex assisted development. Only show a confirmed payment after a genuine successful transfer.

Tags: Solana, MLH, DeFi, WalletStandard, SendShield.

Screenshot checklist: landing; real blocked mint with RPC evidence; labelled simulated address diff; review dialog without private data; genuine verified receipt only once available. Do not upload private wallet/account screenshots from the troubleshooting recording.
