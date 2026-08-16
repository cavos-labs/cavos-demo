'use client';

import { useEffect, useState } from 'react';
import { CavosProvider } from '@cavos/kit/react';
import type { CavosConfig } from '@cavos/kit/react';
import { Demo } from '@/components/Demo';
import { CHAINS } from '@/lib/chains';
import type { Chain } from '@/lib/chains';

const APP_ID = process.env.NEXT_PUBLIC_CAVOS_APP_ID ?? '';
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com';
const STARKNET_PAYMASTER = process.env.NEXT_PUBLIC_STARKNET_PAYMASTER_API_KEY ?? '';

function buildConfig(chain: Chain): CavosConfig {
  // The salt is part of the address derivation, so bumping it gives every user a
  // fresh account. v2 came with the 2026-08-01 sepolia class hash, to move off
  // the retired one. Every bump since has been for social recovery, which enrols
  // once per wallet and answers 409 for a wallet that already holds a record —
  // so a wallet whose enrolment failed can never retry, and testing a fix needs
  // an address that has never tried. v3 ran against a control plane that still forced one provider per
  // environment; v4 against one that takes the provider from the credential but
  // an enclave that could not reach Apple's JWKS; v5 is for the enclave that can.
  // `socialRecovery: true` pins the enclave measurements shipped in the kit; the
  // feature must also be enabled for this app in the Cavos dashboard.
  const base = {
    appId: APP_ID,
    chain,
    network: 'testnet' as const,
    appSalt: 'cavos-demo-v5',
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
  // `null` until the saved chain is read. localStorage isn't available during
  // SSR, so it can't seed useState without a hydration mismatch — but mounting
  // the provider on a default chain and switching a tick later would remount it
  // through `key`, and that loses an OAuth callback: the first provider strips
  // the one-time code from the URL before the second one can read it, dropping
  // the user back on the sign-in screen. So mount the provider once, after the
  // chain is known.
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
  // `key={chain}` forces a clean remount of the provider (and all auth state)
  // whenever the chain changes — effectively a sign-out + fresh wallet.
  return (
    <CavosProvider key={chain} config={config}>
      <Demo chain={chain} setChain={handleSetChain} />
    </CavosProvider>
  );
}
