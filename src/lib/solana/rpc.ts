import { createSolanaRpc } from '@solana/kit';
import type { Cluster } from '@/types';
export const RPC_URLS = {
  devnet: process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com',
  'mainnet-beta': process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com',
};
export const GENESIS = { devnet: 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG', 'mainnet-beta': '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d' };
export function rpcFor(cluster: Cluster) { return createSolanaRpc(RPC_URLS[cluster]); }
export const rpcOptions = () => ({ abortSignal: AbortSignal.timeout(15_000) });
export async function assertCluster(cluster: Cluster) {
  const genesis = await rpcFor(cluster).getGenesisHash().send(rpcOptions());
  if (genesis !== GENESIS[cluster]) throw new Error('RPC network does not match the selected cluster. Check configuration.');
}
export function explorer(signature: string, cluster: Cluster) { return `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=${cluster}`; }
