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
  loadSelectedChains,
  loadViewChain,
  storeDeviceApproval,
  storePasskeyChain,
  storeSelectedChains,
  storeViewChain,
} from '@/lib/deviceApproval';

const APP_ID = process.env.NEXT_PUBLIC_CAVOS_APP_ID ?? '';
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com';
const STARKNET_PAYMASTER = process.env.NEXT_PUBLIC_STARKNET_PAYMASTER_API_KEY ?? '';
const VAULT_URL = process.env.NEXT_PUBLIC_CAVOS_VAULT_URL;

export default function Page() {
  // How a new device gets authorized is the app's decision, so in a demo of the
  // SDK it has to be visible and switchable — otherwise only one of the two
  // paths is ever exercised. Kept here, above the provider, because that is
  // where an integrator would write it.
  //
  // The stored choice is read after mount, not as the initial state: the server
  // has no localStorage, so seeding from it renders one thing on the server and
  // another on the client, and React discards the tree.
  const [deviceApproval, setDeviceApproval] = useState<DeviceApproval>('passkey');

  // Which chains the session configures, and which one is in view. All three
  // can share an enclave session. A passkey is still one chain.
  const [viewChain, setViewChain] = useState<Chain>('solana');
  const [selectedChains, setSelectedChains] = useState<Chain[]>(['solana']);

  // Both are read after mount, because the server has no localStorage and
  // seeding state from it renders one thing there and another here. Nothing is
  // rendered until they are: the provider is keyed on this choice, so mounting
  // with the default and correcting it a tick later would rebuild the session
  // in the middle of the OAuth callback it was busy consuming.
  const [settingsRead, setSettingsRead] = useState(false);
  useEffect(() => {
    const chains = loadSelectedChains();
    storeSelectedChains(chains);
    setSelectedChains(chains);
    const view = chains.includes(loadViewChain()) ? loadViewChain() : chains[0];
    storeViewChain(view as ReturnType<typeof loadViewChain>);
    setViewChain(view);
    if (chains.length === 1) {
      storePasskeyChain(chains[0] as ReturnType<typeof loadPasskeyChain>);
    }
    // More than one chain has no passkey. Force the method the kit will
    // actually accept, so a stored toggle cannot throw on first render after
    // OAuth. Stellar follows the same rule as Solana: enclave or passkey.
    if (chains.length > 1) {
      storeDeviceApproval('enclave');
      setDeviceApproval('enclave');
    } else {
      const method = loadDeviceApproval();
      storeDeviceApproval(method);
      setDeviceApproval(method);
    }
    setSettingsRead(true);
  }, []);
  const chooseSelectedChains = (next: Chain[]) => {
    storeSelectedChains(next);
    setSelectedChains(next);
    const view = next.includes(viewChain) ? viewChain : next[0];
    storeViewChain(view as ReturnType<typeof loadViewChain>);
    setViewChain(view);
    if (next.length === 1) {
      storePasskeyChain(next[0] as ReturnType<typeof loadPasskeyChain>);
    }
    if (next.length > 1) {
      storeDeviceApproval('enclave');
      setDeviceApproval('enclave');
    }
  };

  const deviceApprovalForSession: DeviceApproval =
    selectedChains.length > 1 ? 'enclave' : deviceApproval;

  const config = useMemo<CavosConfig>(
    () => ({
      appId: APP_ID,
      persistSession: false, // the demo signs out when its tab closes
      chains: selectedChains,
      defaultChain: selectedChains.includes(viewChain) ? viewChain : selectedChains[0],
      network: 'testnet',
      chain: selectedChains.includes(viewChain) ? viewChain : selectedChains[0],
      // Names this app's device-key slot, so it is stable forever: changing it
      // makes every returning user's device unknown to their wallet. v9 is a
      // fresh-account reset for keys held in the Cavos vault; v12 resets again
      // for passkeys that restore native wallets (@cavos/kit 0.2.1).
      appSalt: 'cavos-demo-v12',
      socialRecovery: deviceApprovalForSession === 'enclave',
      deviceApproval: deviceApprovalForSession,
      // Per chain, not one for all: a single `rpcUrl` reaches every chain, so
      // the Solana node ends up answering Starknet's calls with "Method not
      // found".
      rpcUrls: selectedChains.includes('solana') ? { solana: SOLANA_RPC } : undefined,
      paymasterApiKey: selectedChains.includes('starknet') ? STARKNET_PAYMASTER : undefined,
      // Unset uses the hosted vault; a local cavos-web serves it at /vault.
      ...(VAULT_URL ? { vault: { url: VAULT_URL } } : {}),
    }),
    [deviceApprovalForSession, selectedChains, viewChain],
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
  const sessionKey = `${deviceApprovalForSession}:${selectedChains.join(',')}`;

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
        deviceApproval={deviceApprovalForSession}
        setDeviceApproval={chooseDeviceApproval}
        viewChain={viewChain}
        selectedChains={selectedChains}
        setSelectedChains={chooseSelectedChains}
      />
    </CavosProvider>
  );
}
