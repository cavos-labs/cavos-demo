'use client';

import { useMemo, useState } from 'react';
import { CavosProvider } from '@cavos/kit/react';
import type { CavosConfig } from '@cavos/kit/react';
import { Demo } from '@/components/Demo';
import type { DeviceApproval } from '@/lib/deviceApproval';
import { loadDeviceApproval, storeDeviceApproval } from '@/lib/deviceApproval';

const APP_ID = process.env.NEXT_PUBLIC_CAVOS_APP_ID ?? '';
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com';
const STARKNET_PAYMASTER = process.env.NEXT_PUBLIC_STARKNET_PAYMASTER_API_KEY ?? '';

export default function Page() {
  // How a new device gets authorized is the app's decision, so in a demo of the
  // SDK it has to be visible and switchable — otherwise only one of the two
  // paths is ever exercised. Kept here, above the provider, because that is
  // where an integrator would write it.
  const [deviceApproval, setDeviceApproval] = useState<DeviceApproval>(loadDeviceApproval);

  const config = useMemo<CavosConfig>(
    () => ({
      appId: APP_ID,
      chains: ['starknet', 'solana', 'stellar'],
      network: 'testnet',
      appSalt: 'cavos-demo-kit22-f',
      socialRecovery: true,
      deviceApproval,
      // Per chain, not one for all: a single `rpcUrl` reaches every chain, so
      // the Solana node ends up answering Starknet's calls with "Method not
      // found".
      rpcUrls: { solana: SOLANA_RPC },
      paymasterApiKey: STARKNET_PAYMASTER,
    }),
    [deviceApproval],
  );

  const chooseDeviceApproval = (next: DeviceApproval) => {
    storeDeviceApproval(next);
    setDeviceApproval(next);
  };

  // modal is undefined → the provider does NOT mount its own overlay modal;
  // the Demo renders an inline <CavosAuthModal> as a live preview instead.
  return (
    <CavosProvider config={config}>
      <Demo deviceApproval={deviceApproval} setDeviceApproval={chooseDeviceApproval} />
    </CavosProvider>
  );
}
