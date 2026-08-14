'use client';

import { useEffect, useState } from 'react';
import { CavosProvider } from '@cavos/kit/react';
import type { CavosConfig } from '@cavos/kit/react';
import { Demo } from '@/components/Demo';
import type { Chain } from '@/lib/chains';

const APP_ID = process.env.NEXT_PUBLIC_CAVOS_APP_ID ?? '';
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com';
const STARKNET_PAYMASTER = process.env.NEXT_PUBLIC_STARKNET_PAYMASTER_API_KEY ?? '';

function buildConfig(chain: Chain): CavosConfig {
  // `appSalt` bumped to v2 with the 2026-08-01 sepolia class hash — the salt is
  // part of the address derivation, so a new salt gives every user a fresh
  // account on the current class instead of an address on the retired one.
  // `socialRecovery: true` pins the enclave measurements shipped in the kit; the
  // feature must also be enabled for this app in the Cavos dashboard.
  const base = {
    appId: APP_ID,
    chain,
    network: 'testnet' as const,
    appSalt: 'cavos-demo-v2',
    socialRecovery: true,
  };
  switch (chain) {
    case 'solana':
      return { ...base, rpcUrl: SOLANA_RPC };
    case 'stellar':
      return { ...base };
    case 'starknet':
      return { ...base, paymasterApiKey: STARKNET_PAYMASTER };
  }
}

export default function Page() {
  const [chain, setChain] = useState<Chain>('solana');

  // Restore the last-selected chain so a reload keeps context.
  useEffect(() => {
    const saved = localStorage.getItem('cavos-demo-chain') as Chain | null;
    if (saved && saved !== chain) setChain(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetChain = (c: Chain) => {
    setChain(c);
    localStorage.setItem('cavos-demo-chain', c);
  };

  const config = buildConfig(chain);

  // modal is undefined → the provider does NOT mount its own overlay modal;
  // the Demo renders an inline <CavosAuthModal> as a live preview instead.
  // `key={chain}` forces a clean remount of the provider (and all auth state)
  // whenever the chain changes — effectively a sign-out + fresh wallet.
  return (
    <CavosProvider key={chain} config={config}>
      <Demo chain={chain} setChain={handleSetChain} />
    </CavosProvider>
  );
}
