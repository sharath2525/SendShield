'use client';
import { useState } from 'react';
import { useClient } from '@solana/react';
import { useConnectedWallet, useConnect, useDisconnect, useWallets } from '@solana/kit-plugin-wallet/react';
import { Wallet, LogOut } from 'lucide-react';
import type { AppClient } from './providers';
export default function WalletConnect({ disabled = false }: { disabled?: boolean }) {
  const client = useClient<AppClient>(); const wallets = useWallets(client); const connected = useConnectedWallet(client);
  const connect = useConnect(client); const disconnect = useDisconnect(client); const [open, setOpen] = useState(false);
  return <div className="wallet-control">
    {connected ? <button className="button secondary" disabled={disabled || disconnect.isRunning} onClick={() => disconnect.dispatch()}><LogOut size={17} />{connected.account.address.slice(0, 4)}…{connected.account.address.slice(-4)} · Disconnect</button> : <button className="button" disabled={disabled} aria-expanded={open} onClick={() => setOpen(!open)}><Wallet size={18} />Connect wallet</button>}
    {open && !connected && <div className="card stack wallet-menu"><strong>Connect for Devnet payments</strong>{wallets.map((wallet, i) => <button className="button secondary" key={`${wallet.name}-${i}`} disabled={connect.isRunning} onClick={async () => { try { await connect.dispatchAsync(wallet); setOpen(false); } catch { /* Hook renders error. */ } }}>{connect.isRunning ? 'Connecting…' : wallet.name}</button>)}{wallets.length === 0 && <p className="muted">No Devnet-compatible wallet detected. Open this app in a browser with a Wallet Standard extension, or in your wallet’s app browser. Enable its Devnet test network, then refresh.</p>}<p className="small muted">Connecting shares your public address. It does not send a payment. Never enter a recovery phrase here.</p></div>}
    {!!(connect.error || disconnect.error) && <p className="notice error" role="alert">Wallet request failed or was declined. Check your wallet and try again.</p>}
  </div>;
}
