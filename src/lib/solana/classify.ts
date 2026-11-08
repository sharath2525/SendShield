import type { Cluster, Classification, RecipientInspection } from '@/types';
export const SYSTEM = '11111111111111111111111111111111';
export const TOKEN = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const TOKEN_2022 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
export interface AccountEvidence { owner: string; executable: boolean; space: number; parsedType?: string; }
const explanations: Record<Classification, string> = {
  WALLET_EXISTING: 'On-curve, non-executable System Program account with no allocated data. Its account type is eligible for native SOL.',
  WALLET_UNFUNDED: 'RPC returned no account for this on-curve key. It can become a wallet when funded, but nobody has proven control of it.',
  PDA_OFF_CURVE: 'This off-curve address cannot sign using a standard private key. Smart wallets and PDAs are unsupported for this demo.',
  TOKEN_ACCOUNT: 'This is a token account, not a standard wallet. Native SOL could become inaccessible here.',
  TOKEN_MINT: 'This is a token mint, not a recipient wallet. A successful SOL transfer here could lock your funds.',
  PROGRAM_ACCOUNT: 'This account is executable or controlled by another program. Native SOL sending is blocked.',
  SYSTEM_SPECIAL_ACCOUNT: 'This System Program account contains allocated state. It is not a regular empty-data wallet.',
  UNKNOWN_OR_UNSUPPORTED: 'The account layout is not recognized. Sending remains blocked.',
  INVALID: 'This is not a canonical Solana public key.',
  RPC_UNAVAILABLE: 'Could not verify the destination with RPC. No transfer is available; retry the inspection.',
};
export function classifyAccount(input: { address: string; network: Cluster; onCurve: boolean | null; account?: AccountEvidence | null; slot?: string; error?: 'INVALID' | 'RPC_UNAVAILABLE'; detail?: string }): RecipientInspection {
  const a = input.account; let classification: Classification;
  if (input.error) classification = input.error;
  else if (a === undefined) classification = 'RPC_UNAVAILABLE';
  else if (a?.executable) classification = 'PROGRAM_ACCOUNT';
  else if (a && [TOKEN, TOKEN_2022].includes(a.owner)) classification = a.parsedType === 'mint' ? 'TOKEN_MINT' : a.parsedType === 'account' ? 'TOKEN_ACCOUNT' : 'UNKNOWN_OR_UNSUPPORTED';
  else if (input.onCurve === false) classification = 'PDA_OFF_CURVE';
  else if (input.onCurve !== true) classification = 'UNKNOWN_OR_UNSUPPORTED';
  else if (a === null) classification = 'WALLET_UNFUNDED';
  else if (a.owner !== SYSTEM) classification = 'PROGRAM_ACCOUNT';
  else if (a.space !== 0) classification = 'SYSTEM_SPECIAL_ACCOUNT';
  else classification = 'WALLET_EXISTING';
  return { address: input.address, network: input.network, queriedAt: new Date().toISOString(), rpcSlot: input.slot ?? null,
    exists: input.error || a === undefined ? null : a !== null, onCurve: input.onCurve,
    ownerProgram: a?.owner ?? null, executable: a?.executable ?? null, dataLength: a?.space ?? null,
    classification, canReceiveNativeSol: ['WALLET_EXISTING', 'WALLET_UNFUNDED'].includes(classification),
    reasonCodes: [classification], explanation: input.detail ?? explanations[classification],
    warnings: ['Account structure does not prove identity, ownership, or honest intent. Verify the full address through a trusted separate channel.'],
    rpcSourceStatus: classification === 'INVALID' ? 'not_queried' : classification === 'RPC_UNAVAILABLE' ? 'unavailable' : 'success' };
}
