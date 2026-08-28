'use client';

import { CavosProvider } from '@cavos/kit/react';
import type { CavosConfig } from '@cavos/kit/react';
import { Demo } from '@/components/Demo';

const APP_ID = process.env.NEXT_PUBLIC_CAVOS_APP_ID ?? '';
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com';
const STARKNET_PAYMASTER = process.env.NEXT_PUBLIC_STARKNET_PAYMASTER_API_KEY ?? '';

// One session, every chain. The provider mounts ONCE and holds a wallet per
// configured chain; `setChain` switches which one is active without a new login
// or a remount. Chain is therefore configuration, not runtime state — which is
// why there is no `key` here and no chain in this component at all.
const config: CavosConfig = {
  appId: APP_ID,
  chains: ['starknet', 'solana', 'stellar'],
  network: 'testnet',
  appSalt: 'cavos-demo-kit22',
  // Off while the recovery enclave host is down: the control plane's `enabled`
  // flag is the environment setting, not enclave health, so with this on the UI
  // offers a flow that cannot complete.
  socialRecovery: false,
  rpcUrl: SOLANA_RPC,
  paymasterApiKey: STARKNET_PAYMASTER,
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
