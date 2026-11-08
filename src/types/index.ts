export type Cluster = 'devnet' | 'mainnet-beta';
export type Classification = 'WALLET_EXISTING' | 'WALLET_UNFUNDED' | 'PDA_OFF_CURVE' | 'TOKEN_ACCOUNT' | 'TOKEN_MINT' | 'PROGRAM_ACCOUNT' | 'SYSTEM_SPECIAL_ACCOUNT' | 'UNKNOWN_OR_UNSUPPORTED' | 'INVALID' | 'RPC_UNAVAILABLE';
export interface RecipientInspection {
  address: string; network: Cluster; queriedAt: string; rpcSlot: string | null;
  exists: boolean | null; onCurve: boolean | null; ownerProgram: string | null;
  executable: boolean | null; dataLength: number | null; classification: Classification;
  canReceiveNativeSol: boolean; reasonCodes: string[]; explanation: string; warnings: string[];
  rpcSourceStatus: 'success' | 'unavailable' | 'not_queried';
}
export interface TrustedContact {
  id: string; displayName: string; address: string; cluster: Cluster;
  method: 'user_saved'; notes: string; addedAt: string;
}
export interface SimilarityMatch {
  contact: TrustedContact; kind: 'MATCH' | 'LOOKALIKE_REVIEW' | 'CAUTION' | 'DIFFERENT';
  prefix: number; suffix: number; firstMismatch: number | null; changedPositions: number[];
}
export interface TransferDraft { walletAddress: string; recipientAddress: string; lamports: string; cluster: Cluster; }
export type TransferStatus = 'draft' | 'blocked' | 'awaiting_wallet' | 'submitted' | 'confirming' | 'confirmed' | 'failed' | 'expired' | 'unknown';
export interface TransferAttempt extends TransferDraft {
  id: string; status: TransferStatus; transactionSignature?: string; lastValidBlockHeight?: string;
  createdAt: string; updatedAt: string; errorCode?: string; message?: string; slot?: string; fee?: string;
}
export interface Receipt extends TransferAttempt { status: 'confirmed'; transactionSignature: string; slot: string; }
