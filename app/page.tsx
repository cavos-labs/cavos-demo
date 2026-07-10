'use client';

import { CavosProvider } from '@cavos/kit/react';
import type { CavosConfig } from '@cavos/kit/react';
import { Demo } from '@/components/Demo';

const config: CavosConfig = {
  appId: process.env.NEXT_PUBLIC_CAVOS_APP_ID ?? '',
  chain: 'solana',
  network: 'testnet', // → solana-devnet
  appSalt: 'cavos-demo-v1',
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com',
};

export default function Page() {
  // modal is undefined → the provider does NOT mount its own overlay modal;
  // the Demo renders an inline <CavosAuthModal> as a live preview instead.
  return (
    <CavosProvider config={config}>
      <Demo />
    </CavosProvider>
  );
}
