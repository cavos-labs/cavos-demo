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
  const { address, user, logout } = useCavos();
  const meta = CHAINS[chain];
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

      {/* Wallet address */}
      <div className="mt-5">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          device-signer wallet · {meta.label} testnet
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5">
          <code className="min-w-0 flex-1 truncate font-mono text-[13px] font-medium text-ink">
            {address ? shorten(address, 8, 8) : '—'}
          </code>
          {address && (
            <button
              onClick={() => copy(address, 'addr')}
              className="shrink-0 rounded p-1 text-muted transition-colors hover:bg-white hover:text-ink"
              aria-label="Copy address"
            >
              {copiedAddr ? <Check size={14} className="text-brand" /> : <Copy size={14} />}
            </button>
          )}
        </div>
        {address && (
          <a
            href={meta.explorer(address, 'address')}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:text-brand-hover"
          >
            View on {meta.label} Explorer
            <ArrowUpRight size={13} />
          </a>
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
