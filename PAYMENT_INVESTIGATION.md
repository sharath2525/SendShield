# Payment investigation — November 8, 2026

## Observed evidence
The supplied 58.83-second recording shows the production site opening Phantom's confirmation UI, then displaying “Wallet changed the reviewed transaction. Nothing was broadcast by SendShield.” At about 56 seconds the app permits another review. No transaction signature or successful on-chain settlement is visible. The exact wallet-added instruction cannot be determined from video alone.

The installed `@solana/wallet-account-signer` implementation maps `modifyAndSignTransactions` to `solana:signTransaction`, not `solana:signAndSendTransaction`. The existing app compares raw returned message bytes before extracting a signature. Any wallet mutation triggers that branch, and the catch previously called it failed, losing the returned signature and permitting retries.

## Local changes
- Resolve and compare message instructions, account privileges, payer, version and blockhash. Reject noncanonical encodings, lookups, changes to recipients/amounts, extra programs and unreviewed compute fees.
- Extract and record a fully signed response's public signature before checking its message policy.
- Treat uncertain post-wallet exceptions as unknown. Preserve the duplicate-payment guard and offer signature reconciliation. Do not assert that the wallet itself never broadcast.
- Keep sign-only as the single supported path; no additional sign-and-send fallback or automatic retry.

## Compatibility correction and remaining gate
Phantom's official priority-fee documentation states that unsigned dApp transactions without compute-budget instructions receive automatic fee instructions even through signTransaction: https://github.com/phantom/docs/blob/master/development-powertools/solana-priority-fees.md . The original message met these conditions. This is the evidence-supported explanation, although the recording does not expose the returned instruction bytes.

The corrected builder now includes official Compute Budget instructions specifying 20,000 units and zero micro-lamports per unit before the single SOL transfer. The fee estimator uses that message. The review discloses the policy; receipt verification accepts only its exact bytes or the old single-transfer format. Arbitrary wallet-added compute or value-transfer instructions remain rejected.

Real Devnet unsigned simulation passed at slot 520064799 with 450 compute units and no error. The user reports no entry for the original attempt in Phantom history. Neither fact is a confirmed payment. A genuine Phantom retest remains required before claiming interoperability is fixed or moving to Prompt 2 enhancements.

Local recording screenshots are ignored by Git because they include wallet/account UI. No signing keys or recording were uploaded.
