'use client';

import { useEffect, useMemo, useState } from 'react';
import { CavosProvider } from '@cavos/kit/react';
import type { CavosConfig } from '@cavos/kit/react';
import { Demo } from '@/components/Demo';
import type { Chain } from '@/lib/chains';
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
  //
  // The stored choice is read after mount, not as the initial state: the server
  // has no localStorage, so seeding from it renders one thing on the server and
  // another on the client, and React discards the tree.
  const [deviceApproval, setDeviceApproval] = useState<DeviceApproval>('enclave');
  useEffect(() => setDeviceApproval(loadDeviceApproval()), []);

  // Which chain a passkey app runs on. The kit refuses passkey approval for a
  // multichain app, because a passkey is registered per chain and the others
  // would have no way to authorize a new device at all — so here the choice
  // becomes the whole session rather than a view of it.
  const [passkeyChain, setPasskeyChain] = useState<Chain>('starknet');

  const config = useMemo<CavosConfig>(
    () => ({
      appId: APP_ID,
      chains: deviceApproval === 'passkey' ? [passkeyChain] : ['starknet', 'solana', 'stellar'],
      network: 'testnet',
      appSalt: 'cavos-demo-kit22-g',
      socialRecovery: true,
      deviceApproval,
      // Per chain, not one for all: a single `rpcUrl` reaches every chain, so
      // the Solana node ends up answering Starknet's calls with "Method not
      // found".
      rpcUrls: { solana: SOLANA_RPC },
      paymasterApiKey: STARKNET_PAYMASTER,
    }),
    [deviceApproval, passkeyChain],
  );

  const chooseDeviceApproval = (next: DeviceApproval) => {
    storeDeviceApproval(next);
    setDeviceApproval(next);
  };

  // modal is undefined → the provider does NOT mount its own overlay modal;
  // the Demo renders an inline <CavosAuthModal> as a live preview instead.
  return (
    <CavosProvider config={config}>
      <Demo
        deviceApproval={deviceApproval}
        setDeviceApproval={chooseDeviceApproval}
        passkeyChain={passkeyChain}
        setPasskeyChain={setPasskeyChain}
      />
    </CavosProvider>
  );
}
