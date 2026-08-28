'use client';

import { useEffect, useState } from 'react';
import { CavosProvider } from '@cavos/kit/react';
import type { CavosConfig } from '@cavos/kit/react';
import { Demo } from '@/components/Demo';
import { CHAINS } from '@/lib/chains';
import type { Chain } from '@/lib/chains';

const APP_ID = process.env.NEXT_PUBLIC_CAVOS_APP_ID ?? '';
const STARKNET_PAYMASTER = process.env.NEXT_PUBLIC_STARKNET_PAYMASTER_API_KEY ?? '';

const DEMO_CHAINS: Chain[] = ['solana', 'stellar', 'starknet'];

function buildConfig(defaultChain: Chain): CavosConfig {
  // The salt names this app's device-key slot. Bumping it gives QA a fresh set
  // of accounts without colliding with production (v7) or the previous local
  // lazy-deploy pass (v9-lazy). v10 is the kit#22 multi-chain session.
  // `socialRecovery: true` pins the enclave measurements shipped in the kit; the
  // feature must also be enabled for this app in the Cavos dashboard.
  //
  // A single `rpcUrl` is applied to every chain, so a Solana RPC would break
  // Starknet. Omit it: Solana uses the kit's public devnet default, Starknet
  // uses the kit's sepolia default.
  return {
    appId: APP_ID,
    chains: DEMO_CHAINS,
    defaultChain,
    network: 'testnet',
    appSalt: 'cavos-demo-v10-kit22',
    socialRecovery: true,
    paymasterApiKey: STARKNET_PAYMASTER,
  };
}

export default function Page() {
  // `null` until the saved chain is read. localStorage isn't available during
  // SSR, so it can't seed useState without a hydration mismatch. Mount the
  // provider once, after the default chain is known, so an OAuth callback is
  // not lost to a second mount.
  const [chain, setChain] = useState<Chain | null>(null);

  // Restore the last-selected chain so a reload keeps context.
  useEffect(() => {
    const saved = localStorage.getItem('cavos-demo-chain') as Chain | null;
    setChain(saved && saved in CHAINS ? saved : 'solana');
  }, []);

  const handleSetChain = (c: Chain) => {
    setChain(c);
    localStorage.setItem('cavos-demo-chain', c);
  };

  // One paint on the demo's own background while the chain resolves.
  if (!chain) return <div className="min-h-screen bg-surface" />;

  const config = buildConfig(chain);

  // modal is undefined → the provider does NOT mount its own overlay modal;
  // the Demo renders an inline <CavosAuthModal> as a live preview instead.
  // One provider for all configured chains. Switching chain calls kit
  // `setChain` (see Demo) and does not remount — connect stays, wallets
  // stay, only the selected chain changes.
  return (
    <CavosProvider config={config}>
      <Demo chain={chain} setChain={handleSetChain} />
    </CavosProvider>
  );
}
