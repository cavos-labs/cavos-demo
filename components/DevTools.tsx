'use client';

import { useState } from 'react';
import { useCavos } from '@cavos/kit/react';
import { Check, Copy, ArrowUpRight, LogOut } from 'lucide-react';
import { BalancePanel } from './devtools/BalancePanel';
import { SendPanel } from './devtools/SendPanel';
import { SignPanel } from './devtools/SignPanel';
import { SecurityPanel } from './devtools/SecurityPanel';
import { CHAINS, type Chain } from '@/lib/chains';

function shorten(s: string, lead = 6, tail = 6) {
  return s && s.length > lead + tail ? `${s.slice(0, lead)}…${s.slice(-tail)}` : s;
}

export function DevTools({ configCode, chain }: { configCode: string; chain: Chain }) {
  const { address, user, logout, session, configuredChains, setChain } = useCavos();
  const meta = CHAINS[chain];

  // One login holds a wallet on every configured chain, so show them all rather
  // than only the active one — the point of the multi-chain session is that the
  // others are not hypothetical. Clicking one makes it active; no re-login.
  const wallets = (configuredChains ?? [chain]).map((c) => ({
    chain: c,
    meta: CHAINS[c],
    address: (c === chain ? address : session?.wallet(c)?.address) ?? null,
  }));
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const copy = (text: string, which: 'addr' | 'code') => {
    navigator.clipboard.writeText(text);
    if (which === 'addr') {
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 1600);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1600);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_1px_3px_rgba(10,10,15,0.05)]">
      {/* Signed-in badge */}
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
          <Check size={16} />
        </span>
        <div className="leading-tight">
          <p className="text-[14px] font-semibold text-ink">You&apos;re signed in</p>
          {user?.email && <p className="text-[12px] text-muted">{user.email}</p>}
        </div>
      </div>

      {/* Wallets — every configured chain, active one first-class */}
      <div className="mt-5">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          device-signer wallets · testnet
        </p>
        <div className="space-y-1.5">
          {wallets.map((w) => {
            const isActive = w.chain === chain;
            return (
              <button
                key={w.chain}
                type="button"
                onClick={() => !isActive && setChain(w.chain)}
                disabled={isActive}
                // The active row is the only one that is not a control, so it
                // is the only one that does not react to a press. The others
                // lift on hover and take the global press feedback.
                className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-[border-color,background-color,box-shadow] duration-150 ${
                  isActive
                    ? 'border-brand bg-brand-soft/40 shadow-[0_1px_2px_rgba(10,10,15,0.04)] cursor-default'
                    : 'border-line bg-surface hover:border-line-strong hover:bg-white'
                }`}
              >
                <span className="shrink-0 text-[11px] font-medium text-muted">{w.meta.label}</span>
                <code className="min-w-0 flex-1 truncate font-mono text-[13px] font-medium text-ink">
                  {w.address ? shorten(w.address, 6, 6) : '—'}
                </code>
                {isActive && (
                  <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {address && (
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => copy(address, 'addr')}
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-muted hover:text-ink"
            >
              {copiedAddr ? <Check size={13} className="text-brand" /> : <Copy size={13} />}
              Copy {meta.label} address
            </button>
            <a
              href={meta.explorer(address, 'address')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:text-brand-hover"
            >
              Explorer
              <ArrowUpRight size={13} />
            </a>
          </div>
        )}
      </div>

      {/* ── Functional sections ── */}
      <div className="mt-6 space-y-5 border-t border-line pt-5">
        <BalancePanel chain={chain} />
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <SendPanel chain={chain} />
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <SignPanel chain={chain} />
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <SecurityPanel />
      </div>

      {/* Export config */}
      <div className="mt-6 border-t border-line pt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">your config</p>
          <button
            onClick={() => copy(configCode, 'code')}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:text-brand-hover"
          >
            {copiedCode ? <Check size={13} /> : <Copy size={13} />}
            {copiedCode ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="max-h-[220px] overflow-auto rounded-lg bg-ink p-4 font-mono text-[11.5px] leading-relaxed text-white/85">
          {configCode}
        </pre>
      </div>

      <button
        onClick={logout}
        className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted transition-colors hover:text-ink"
      >
        <LogOut size={13} />
        Reset demo
      </button>
    </div>
  );
}
