# SendShield: product assessment and priorities

Research checked November 8, 2026. Scores below are independent product judgments, not measured customer outcomes or predictions of judging results. This assessment distinguishes an implementation target from functionality actually verified in the build report.

## Strongest realistic concept

**A recipient check and payment receipt workflow for people sending native SOL to a known person.** Before the wallet opens, explain the destination's actual Solana account type, compare its entire address to contacts independently saved by the sender, and stop incompatible destinations or conflicting lookalikes. After signing, verify the transaction's actual sender, recipient and amount on Devnet.

The strongest demonstration is three concrete outcomes: an actual mint rejected; an explicitly simulated lookalike conflict explained; a genuine user-approved Devnet transfer reconciled with its onchain transaction. The value is understandable prevention and evidence. An extra AI explanation would add little and could create false confidence.

**Verdict:** useful hackathon project; modest original invention; currently a feature-sized business. A trustworthy demo and rigorous failure handling can make it competitive. A standalone destination-check website has an adoption problem: users already initiate payments inside wallets. Longer-term distribution through wallets or payment applications is more plausible than charging consumers to open another site.

## Competition and what it changes

| Alternative | Evidence | Implication for SendShield |
|---|---|---|
| Phantom | Phantom documents transaction previews, malicious-program warnings, and protections around common scams. Its own education warns against copying addresses from transaction history. [Security at Phantom](https://phantom.com/learn/blog/security-at-phantom), [Scam guidance](https://phantom.com/learn/crypto-101/common-crypto-scams) | “We warn before you sign” is not new. Demonstrate a specific SOL recipient-type mistake and explain the evidence better. Do not imply Phantom lacks these protections without testing its current behavior. |
| MetaMask | Its June 2026 announcement describes pasted-address comparisons with prior addresses, edge similarities, and first-time-recipient warnings across EVM networks. [Address poisoning detection](https://metamask.com/en-GB/news/address-poisoning-detection) | Edge-match warnings are established product behavior. Solana account semantics and transparent local contact comparison are a focused distinction, not proof of market novelty. |
| Solana Pay | Provides standardized payment links and transfer/transaction requests. [Solana Pay overview](https://docs.solanapay.com/core/overview) | Avoid becoming another generic payment form. A future verified request flow could reduce manual copying, but a payment link alone does not authenticate its sender. |
| Solana Explorer | Exposes cluster-specific blockchain and account/transaction inspection. [Solana Explorer](https://explorer.solana.com/) | Raw evidence already exists. SendShield's contribution is turning evidence into a comprehensible pre-send decision and independently checking a receipt. |
| Blockaid and scanners | Blockaid describes transaction security, address and token scanning. [Platform overview](https://blockaid.io/platform-overview) | Do not compete on universal threat intelligence with a local heuristic. Do not label an unknown address clean or claim comprehensive attack detection. |

Solana's official guidance explains that native SOL can reach an inappropriate account type; account ownership and data must be inspected, and curve status alone is insufficient. This is the technical foundation, not a new discovery by this project. [Solana recipient verification](https://solana.com/docs/payments/send-payments/verify-address)

## Scores out of ten

| Dimension | Score | Reason and what would improve it |
|---|---:|---|
| Innovation | 5 | Existing wallet protections and documented validation primitives limit novelty. A coherent Solana-specific evidence workflow is incremental differentiation. |
| User value | 7 | A concrete, costly mistake is understandable. Actual usefulness depends on users saving independently verified contacts and checking full addresses. Test with five novices. |
| Technical feasibility | 8 | No custom program or indexer is needed. Wallet compatibility, public RPC limits and ambiguous confirmation still require careful engineering. |
| Business potential | 4 | No demand, willingness-to-pay or distribution evidence yet. Consumer subscriptions are a weak initial assumption; integration into payout products is more plausible. |
| Hackathon competitiveness | 7 | Conditional on a genuine transfer, working public deployment, readable UX, and concise video. Without the real signed transfer, reduce this to 4. No result is guaranteed. |
| Startup potential | 5 | A narrowly useful component could grow through payment partners. Defensibility, retention, buyer ownership and measurable error reduction remain unproven. |

## Prioritized MVP and acceptance gates

1. **P0 — actual inspection and guarded transfer.** Strict 32-byte canonical parsing; genuine RPC account evidence; fail-closed classification; Devnet Wallet Standard signing; one plain System Program transfer; exact integer lamports; fresh pre-sign inspection; balance/fee checks; onchain receipt verification. A clean build alone is not a completed payment demo.
2. **P0 — submission evidence.** Fund a user-controlled Devnet wallet, send to a second user-controlled address, capture the actual signature and Explorer page, publish source, deploy, and record a public video no longer than two minutes. Keep the genuine transfer ahead of optional work.
3. **P1 — recipient confidence UX.** Locally stored contact CRUD, network-specific comparisons, complete selectable address differences, no hidden lookalike bypass, accessible deliberate review, and clear unknown-identity language.
4. **P1 — recovery.** Persist attempts before or during the signing lifecycle, retain known signatures, reconcile pending records after refresh, and distinguish wallet rejection, chain failure, expiry, RPC outage, and unknown submission. Do not encourage blind retries.
5. **P1 — verification.** Unit coverage for parsing, classification, similarity, amounts, persistence and receipt gates; browser checks at 375px, tablet and desktop; keyboard review dialog; live RPC inspection. Unit fixtures must never appear as live chain evidence.

No custom program, analytics dashboard, token swaps, chatbot, risk probability, cloud account system, or monetization flow before the submission. These dilute the proof of usefulness.

## Technical architecture recommendation

```text
Next.js / React pages
  -> strict parser + pure account classifier + contact comparator
  -> configured cluster RPC reads with bounded timeouts
  -> explicit review snapshot (sender, recipient, amount, cluster, contact revision)
  -> fresh recipient, balance, fee and blockhash checks
  -> Wallet Standard / Solana Kit signer (Devnet only)
  -> submit once; persist signature before confirmation
  -> signature status + fetched transaction/meta verification
  -> local receipt / activity + correct Devnet Explorer link
```

Use the documented compatible Kit package family and actual installed types. Keep classification and decision functions independent of React; persist versioned, validated records without secrets. Local storage is convenience state, never settlement proof. Avoid custom cryptography and a backend signer. Any optional RPC proxy must constrain methods and parameters; arbitrary proxying is unacceptable.

## Risks, assumptions and limits to make visible

- **Identity is the hardest unsolved problem.** An attacker-controlled ordinary wallet can pass every structural account check. An exact saved contact can be wrong from the day it was added. Labels are user notes, not authenticated identity.
- **A heuristic has misses and false positives.** Matching at least four prefix and four suffix characters is understandable, but not a calibrated fraud probability. Malicious addresses can fall outside the threshold. Compare all same-network contacts, avoid overlap, and show mismatches.
- **State can change between inspection and settlement.** Fresh checks narrow that interval but are not an atomic onchain policy enforcement guarantee. A custom program could change this design later, but adds excessive deadline risk now.
- **An RPC is a trust dependency.** Rate limiting or unavailable reads must disable sending. A dishonest provider can misrepresent state; this prototype is not a trustless light client. Never silently switch clusters.
- **Wallet prompts are external UI.** Feature discovery does not establish that a particular browser/wallet combination actually signs correctly. A real user wallet test remains essential.
- **Unknown submission is not failure.** Timeouts after broadcast may still settle. Preserve the known signature and prevent automatic duplicate payments.
- **Local persistence is limited.** Storage can be denied, cleared or modified by the user or other same-origin code. Show memory-only mode and recheck recorded chain claims.
- **Business evidence is absent.** Neither the existence of losses elsewhere nor positive hackathon feedback proves willingness to adopt this extra step. Avoid invented market size or prevented-loss statistics.

## UX recommendations

Show the full address before action and repeat it in the review dialog. Display separate conclusions for account eligibility and identity uncertainty; never a universal green “safe” badge. Use a short explanation first and expandable raw evidence below it. Keep inspection available without a wallet. Disable send with a reason rather than merely greying it out. Network, sender, amount and recipient must remain legible on mobile. Reserve teal for genuinely verified transaction outcomes; pair every color with text or an icon. Label a simulated comparison persistently and keep it separate from live RPC results.

## After the deadline: advanced features with evidence gates

| Priority | Candidate | Gate before building |
|---|---|---|
| Next | Small recipient-check library for payment apps | Interview at least three payout-product builders and confirm one integration use case. |
| Next | Domain-bound, expiring recipient ownership proof using a standard signing format | Threat-model replay, identity transfer and nonce storage; key ownership must not be presented as person verification. |
| Later | Solana Pay request import with explicit origin and address review | Validate whether it reduces copy errors without making phishing links look trusted. |
| Later | Contact export/import and encrypted backup | Demonstrated user demand; imported aliases must preserve their unverified provenance. |
| Later | Reviewed smart-wallet support | Program-specific authority evidence, tests and user expectations; do not broadly allow every off-curve account. |
| Later | Production deployment and stronger RPC resilience | Independent security review, operational monitoring, privacy review and real wallet compatibility testing. No mainnet sending merely because Devnet worked. |

A practical post-event experiment is five moderated tasks with newcomers: identify a mint, distinguish a changed middle address, and complete a test payment. Measure successful decisions, time and comprehension of “identity unverified.” If people still equate eligibility with safety, fix language before adding features. A future business test is a payment-app integration pilot, not a token or fee product.

## Event schedule and submission actions

The official event schedule lists **November 8, 2026, 8:30 PM IST initial submission** and **10:15 PM IST final submission/hacking ends**. The linked Challenges event page separately displays **1:00 PM EST = 11:30 PM IST** as its closing time. These sources conflict; use the earlier scheduled deadline and confirm the signed-in portal rather than relying on the later time. [Official schedule](https://events.mlh.com/events/15200-solana-hackathon), [Challenges event](https://www.mlh.com/events/solana-hackathon)

1. Register/check in through the official event page; verify team eligibility.
2. Publish the new source repository and Vercel deployment; replace submission URL placeholders with actual working URLs.
3. Complete the genuine wallet test and record/upload the public two-minute demonstration using `DEMO_SCRIPT.md`.
4. Open [Submit a Project](https://www.mlh.com/events/solana-hackathon/submissions/new), sign in, and complete the actual portal fields using `SUBMISSION.md`.
5. Enter the DeFi/payment category if the portal criteria accept the project. Overall consideration follows event eligibility. Do not claim AI functionality merely because Codex wrote code; do not claim beginner eligibility without checking the team.
6. Save and verify the portal's submission confirmation. Deployment, video publication and submission are separate actions.

The submission form redirected to MLH sign-in during research; authenticated required fields and any additional current rules were not inspected. The public-video, two-minute and public-source requirements are requirements of the supplied project brief; confirm them against the signed-in event rules. Nothing in this document claims a deployment, transaction, video or submission has already happened.
