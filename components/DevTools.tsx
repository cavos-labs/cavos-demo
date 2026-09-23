'use client';

import { useState } from 'react';
import { useCavos } from '@cavos/kit/react';
import { BalancePanel } from './devtools/BalancePanel';
import { SendPanel } from './devtools/SendPanel';
import { SignPanel } from './devtools/SignPanel';
import { SecurityPanel } from './devtools/SecurityPanel';
import { CHAINS, type Chain } from '@/lib/chains';
import type { DeviceApproval } from '@/lib/deviceApproval';
import { useStellarBootstrap } from '@/lib/stellar/bootstrap';

function shorten(s: string, lead = 6, tail = 6) {
  return s && s.length > lead + tail ? `${s.slice(0, lead)}…${s.slice(-tail)}` : s;
}

export function DevTools({ chain, deviceApproval }: { chain: Chain; deviceApproval: DeviceApproval }) {
  const { address, user, logout, session, configuredChains, setChain } = useCavos();
  const meta = CHAINS[chain];
  const stellar = useStellarBootstrap(address ?? null, chain === 'stellar');

  const wallets = (configuredChains ?? [chain]).map((c) => ({
    chain: c,
    meta: CHAINS[c],
    address: (c === chain ? address : session?.wallet(c)?.address) ?? null,
  }));
  const [copiedAddr, setCopiedAddr] = useState(false);

  const copyAddr = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 1600);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ink">Signed in</p>
          {user?.email && <p className="truncate text-[12.5px] text-muted">{user.email}</p>}
        </div>
        <button
          type="button"
          onClick={logout}
          className="shrink-0 text-[13px] font-medium text-muted transition-colors duration-150 hover:text-ink"
        >
          Reset demo
        </button>
      </header>

      <div className="grid flex-1 divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0">
        <div className="divide-y divide-line">
          <div className="px-5 py-4">
            <h3 className="text-[15px] font-medium text-ink">Wallets</h3>
            <p className="mt-1 text-[12px] text-muted">Device-signer addresses on testnet.</p>
            <div className="mt-4 divide-y divide-line rounded-md border border-line">
              {wallets.map((w) => {
                const isActive = w.chain === chain;
                return (
                  <button
                    key={w.chain}
                    type="button"
                    onClick={() => !isActive && setChain(w.chain)}
                    disabled={isActive}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-left first:rounded-t-md last:rounded-b-md ${
                      isActive ? 'cursor-default bg-brand-soft/50' : 'bg-white hover:bg-surface'
                    }`}
                  >
                    <span className="w-16 shrink-0 text-[12px] font-medium text-muted">{w.meta.label}</span>
                    <code className="min-w-0 flex-1 truncate font-mono text-[13px] font-medium tabular-nums text-ink">
                      {w.address ? shorten(w.address, 6, 6) : '—'}
                    </code>
                    {isActive && (
                      <span className="shrink-0 text-[11px] font-semibold text-brand">Active</span>
                    )}
                  </button>
                );
              })}
            </div>
            {address && (
              <div className="mt-3 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => copyAddr(address)}
                  className="text-[12.5px] font-semibold text-muted hover:text-ink"
                >
                  {copiedAddr ? 'Copied' : `Copy ${meta.label} address`}
                </button>
                <a
                  href={meta.explorer(address, 'address')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12.5px] font-semibold text-brand hover:text-brand-hover"
                >
                  Explorer
                </a>
              </div>
            )}
          </div>
          <div className="px-5 py-4">
            <SecurityPanel deviceApproval={deviceApproval} />
          </div>
        </div>

        <div className="divide-y divide-line">
          <div className="px-5 py-4">
            <BalancePanel chain={chain} stellar={stellar} />
          </div>
          <div className="px-5 py-4">
            <SendPanel chain={chain} stellar={stellar} />
          </div>
          <div className="px-5 py-4">
            <SignPanel chain={chain} />
          </div>
        </div>
      </div>
    </div>
  );
}
