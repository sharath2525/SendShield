# Verified genuine Devnet payment

Owner supplied the public signature after testing the patched local application with Phantom. Independently fetched from official Devnet RPC on November 8, 2026.

- Commitment: **finalized**; signature status and transaction metadata both have no error.
- Amount: **0.001 SOL = 1,000,000 lamports**.
- Sender and fee payer: `2Mkgp89nuhWf7PLZDCwc9H3FGsyNmBnsKR1e43mZHjF2`.
- Recipient: `5qnGNxRAhCn3DLP76KVmDCfv1KjRs1iNURZ4YpK2jE6a`.
- Actual network fee: **5,000 lamports = 0.000005 SOL**.
- Sender debit: 1,005,000 lamports; recipient credit: 1,000,000 lamports.
- Slot: **520065222**; consumed compute units: **450**.
- Instructions: predefined compute-unit limit, zero compute-unit price, one System Program transfer. No inner instructions.
- Devnet genesis: `EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG`.

[Actual transaction on Solana Explorer](https://explorer.solana.com/tx/2qNjF9VBhwb8vfe9X2Gbr78vV8ouzMkgdC8KAaaXXquJzKP79BmmXBCMwLmN5AbENhjpVS7xUPvW7upQPeN2uU8K?cluster=devnet)

Recheck with `npx tsx scripts/verify-demo-payment.ts`; this is read-only and invokes the application's receipt verifier against the actual transaction. This evidence verifies one successful payment, not every wallet/browser combination or the production deployment's commit.
