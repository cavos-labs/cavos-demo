'use client';

import { useEffect, useMemo, useState } from 'react';
import { CavosProvider } from '@cavos/kit/react';
import type { CavosConfig } from '@cavos/kit/react';
import { Demo } from '@/components/Demo';
import type { Chain } from '@/lib/chains';
import type { DeviceApproval } from '@/lib/deviceApproval';
import {
  loadDeviceApproval,
  loadPasskeyChain,
  storeDeviceApproval,
  storePasskeyChain,
} from '@/lib/deviceApproval';

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

  // Which chain a passkey app runs on. The kit refuses passkey approval for a
  // multichain app, because a passkey is registered per chain and the others
  // would have no way to authorize a new device at all — so here the choice
  // becomes the whole session rather than a view of it.
  const [passkeyChain, setPasskeyChain] = useState<Chain>('starknet');

  // Both are read after mount, because the server has no localStorage and
  // seeding state from it renders one thing there and another here. Nothing is
  // rendered until they are: the provider is keyed on this choice, so mounting
  // with the default and correcting it a tick later would rebuild the session
  // in the middle of the OAuth callback it was busy consuming.
  const [settingsRead, setSettingsRead] = useState(false);
  useEffect(() => {
    setDeviceApproval(loadDeviceApproval());
    setPasskeyChain(loadPasskeyChain());
    setSettingsRead(true);
  }, []);
  const choosePasskeyChain = (next: Chain) => {
    storePasskeyChain(next as ReturnType<typeof loadPasskeyChain>);
    setPasskeyChain(next);
  };

  const config = useMemo<CavosConfig>(
    () => ({
      appId: APP_ID,
      chains: deviceApproval === 'passkey' ? [passkeyChain] : ['starknet', 'solana', 'stellar'],
      network: 'testnet',
      // Names this app's device-key slot, so it is stable forever: changing it
      // makes every returning user's device unknown to their wallet. The
      // -kit22-* values it went through were deliberate resets while the
      // address model was still moving.
      appSalt: 'cavos-demo',
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
  //
  // The key is the shape of the session, not the chain in view. A session holds
  // its wallets from the moment it connects, so changing which chains are
  // configured has to build a new one — switching to passkey approval makes the
  // session single-chain, and without this the old three-chain session stayed,
  // showing Stellar while acting on Starknet. Switching the active chain within
  // a multichain session still remounts nothing.
  const sessionKey = deviceApproval === 'passkey' ? `passkey:${passkeyChain}` : 'enclave';

  if (!settingsRead) {
    return (
      <div className="page-brand min-h-[100dvh]">
        <div className="mx-auto min-h-[100dvh] max-w-[1280px] border-x border-white/15">
          <div className="h-14 border-b border-white/15" />
          <div className="grid h-[calc(100dvh-3.5rem)] grid-cols-[minmax(300px,380px)_minmax(0,1fr)] divide-x divide-white/15">
            <div className="space-y-3 p-5">
              <div className="h-5 w-56 animate-pulse rounded-md bg-white/15" />
              <div className="h-3 w-40 animate-pulse rounded-md bg-white/10" />
            </div>
            <div className="animate-pulse bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <CavosProvider key={sessionKey} config={config}>
      <Demo
        deviceApproval={deviceApproval}
        setDeviceApproval={chooseDeviceApproval}
        passkeyChain={passkeyChain}
        setPasskeyChain={choosePasskeyChain}
      />
    </CavosProvider>
  );
}
