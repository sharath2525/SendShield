'use client';
import { createClient } from '@solana/kit';
import { solanaRpc } from '@solana/kit-plugin-rpc';
import { walletSigner } from '@solana/kit-plugin-wallet';
import { ClientProvider } from '@solana/react';
import { useEffect, useSyncExternalStore } from 'react';
import { RPC_URLS } from '@/lib/solana/rpc';
import { getServerSnapshot, getSnapshot, initializeStore, subscribe, syncStore, STORAGE_KEY } from '@/lib/storage/store';
const client = createClient().use(walletSigner({ chain: 'solana:devnet', autoConnect: false })).use(solanaRpc({ rpcUrl: RPC_URLS.devnet }));
export type AppClient = Awaited<typeof client>;
export const useLocalData = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
export default function Providers({ children }: { children: React.ReactNode }) {
  const data = useLocalData();
  useEffect(() => { initializeStore(); const sync = (event: StorageEvent) => { if (event.key === STORAGE_KEY) syncStore(); }; window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync); }, []);
  return <ClientProvider client={client}>{data.notice && <div className="container notice warning" role="status">{data.notice}</div>}{children}</ClientProvider>;
}
