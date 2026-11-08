# SendShield two-minute demo

This is a recording script, not a record of a completed transfer. Record during the event and keep the finished public video at or below 2:00. Rehearse once; retain the genuine wallet approval and actual receipt. Never substitute a mocked confirmation when RPC is slow.

## Preparation

- Open the deployed app, a Devnet-compatible wallet, and Solana Explorer on Devnet. Fund the sender through the official [Solana faucet](https://faucet.solana.com/).
- Independently copy the full recipient address from a second test wallet you control. Save it as a Devnet contact. Do not reuse the sender as the recipient.
- Have the real wrapped SOL mint `So11111111111111111111111111111111111111112` ready. Inspect it live on the selected network; use the resulting actual account evidence rather than assuming its state.
- Prepare a visibly labelled **SIMULATED LOOKALIKE EXAMPLE — NO REAL ON-CHAIN ATTACK DETECTED** using the app's comparison demonstration. Do not suggest this is a discovered attacker or an address controlled by the recipient.
- Set a 0.001 SOL amount and confirm sufficient Devnet balance, including fees. Hide unrelated wallet balances, account names, browser notifications and private information.

## Storyboard and narration

| Time | Screen/action | Spoken words |
|---|---|---|
| 0–12s | Landing, then launch app | “MLH Solana Hackathon, November 6–8, 2026. This is SendShield. A copied address can look familiar and still be the wrong destination for your SOL.” |
| 12–35s | Paste the real mint; click Inspect; show RPC owner, account type, slot and block | “This is a real token mint. We inspect its owner and data on Solana Devnet. A normal SOL transfer can reach the wrong account type. SendShield blocks this destination and shows the evidence.” |
| 35–60s | Show labelled simulated comparison and complete addresses | “This comparison is simulated; we have not detected a real attack. These addresses share their edges but differ in the middle. SendShield compares every same-network saved contact and blocks this conflict. A saved name is not proof of identity.” |
| 60–95s | Restore genuine recipient, inspect, review 0.001 SOL, checkbox, wallet approval; wait for receipt | “Now I use a second test wallet I control. The account type is eligible, but I must still verify who controls it. I review the full address and exact amount. The app rechecks before my wallet signs this real Devnet transfer.” |
| 95–112s | Open actual receipt's Explorer link, show recipient and amount | “This receipt appears only after checking the actual transaction, destination, amount and successful execution. Here is the matching Devnet signature in Solana Explorer.” |
| 112–120s | End on product and scope note | “Built from scratch this weekend with Codex assistance. No custom contract, mainnet sending, or promise that every eligible address is trustworthy.” |

## Recording contingencies

If confirmation is slower than the slot in the script, use a clearly labelled time cut after the actual wallet approval. Keep the real resulting signature and Explorer evidence consistent. If the transfer fails, resolve the actual issue and record again; never display a successful receipt from another payment as though it were this one. If no real transfer can be completed, state that limitation in the submission and show the honest failure state.

Use “Built from scratch this weekend” only when accurate for the final submitted source and event rules. Fill in public deployment, repository and video URLs in `SUBMISSION.md` after publication. Review the video in a signed-out browser to verify public access and its duration before submitting.
