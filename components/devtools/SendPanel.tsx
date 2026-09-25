'use client';

import { useState } from 'react';
import { useCavos } from '@cavos/kit/react';
import { Send, ExternalLink, Check } from 'lucide-react';
import { CHAINS, parseNative, type Chain } from '@/lib/chains';
import type { StellarBootstrapHandle } from '@/lib/stellar/bootstrap';
import { CvBolt } from '../CavosIcons';

// Minimal shapes for the two `execute` signatures. The kit's wallet classes
// aren't exported from the React entry, so we cast through `unknown`.
type NativeSendWallet = { execute: (amount: bigint, destination: string) => Promise<string> };
function asNativeSender(w: unknown): NativeSendWallet {
  return w as NativeSendWallet;
}

/** Starknet executes a list of contract calls and returns the tx hash. */
type CallSendWallet = {
  execute: (calls: { contractAddress: string; entrypoint: string; calldata: string[] }[]) => Promise<{
    transactionHash: string;
  }>;
};
function asCallSender(w: unknown): CallSendWallet {
  return w as CallSendWallet;
}

/** Split a u256 into the `[low, high]` felt pair Cairo expects. */
function u256(value: bigint): [string, string] {
  const MASK = (1n << 128n) - 1n;
  return ['0x' + (value & MASK).toString(16), '0x' + (value >> 128n).toString(16)];
}

interface Props {
  chain: Chain;
  stellar?: StellarBootstrapHandle;
}

/**
 * Send the chain's native token via the wallet's gasless `execute`.
 *
 * Solana and Stellar take `(amount, destination)`. Starknet has no native
 * asset — its fee token is an ERC-20 like any other — so the same intent is an
 * ordinary `transfer` call, which is also the honest demonstration of the
 * account: an arbitrary contract call, signed by the device, gas sponsored.
 */
export function SendPanel({ chain, stellar }: Props) {
  const { wallet, address } = useCavos();
  const meta = CHAINS[chain];
  // A send from an account that does not exist would lazily create it empty,
  // without the waiting USDC — so anything but `active` locks the form.
  const stellarLocked = chain === 'stellar' && stellar ? stellar.state.kind !== 'active' : false;

  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!meta.canSendNative) {
    return (
      <Section title="Send">
        <p className="text-[12.5px] leading-relaxed text-muted">
          Native sends for {meta.label} are coming soon to the demo.
        </p>
      </Section>
    );
  }

  const reset = () => {
    setStatus('idle');
    setErrorMsg('');
    setTxHash(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || stellarLocked) return;
    reset();

    const dest = destination.trim();
    const amt = amount.trim();
    if (!dest) return setStatus('error'), setErrorMsg('Enter a destination address');
    if (!amt || Number(amt) <= 0) return setStatus('error'), setErrorMsg('Enter a valid amount');

    const baseAmount = parseNative(amt, meta.decimals);
    if (baseAmount <= 0n) return setStatus('error'), setErrorMsg('Amount too small');

    setStatus('sending');
    try {
      const hash = meta.feeToken
        ? (
            await asCallSender(wallet).execute([
              {
                contractAddress: meta.feeToken,
                entrypoint: 'transfer',
                calldata: [dest, ...u256(baseAmount)],
              },
            ])
          ).transactionHash
        : await asNativeSender(wallet).execute(baseAmount, dest);
      setTxHash(hash);
      setStatus('done');
      setDestination('');
      setAmount('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
    }
  };

  return (
    <Section title="Send">
      <form onSubmit={handleSend} className="space-y-2.5">
        <div>
          <label className="mb-1 block text-[11.5px] font-medium text-muted">Destination</label>
          <input
            value={destination}
            disabled={stellarLocked}
            onChange={(e) => {
              setDestination(e.target.value);
              if (status !== 'idle') reset();
            }}
            placeholder={`${meta.label} address`}
            className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 font-mono text-base text-ink outline-none transition-colors focus:border-ink sm:text-[12px]"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11.5px] font-medium text-muted">Amount</label>
          <div className="flex items-center gap-2">
            <input
              value={amount}
              disabled={stellarLocked}
              onChange={(e) => {
                setAmount(e.target.value);
                if (status !== 'idle') reset();
              }}
              inputMode="decimal"
              placeholder="0.0"
              className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-base text-ink outline-none transition-colors focus:border-ink sm:text-[13px]"
            />
            <span className="shrink-0 text-[12px] font-semibold text-muted">{meta.symbol}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={status === 'sending' || !wallet || stellarLocked}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-brand-hover active:scale-[0.99] disabled:opacity-60"
        >
          <Send size={14} />
          {status === 'sending' ? 'Sending…' : `Send ${meta.symbol}`}
        </button>

        {status === 'done' && txHash && (
          <div className="flex items-start gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
            <Check size={13} className="mt-0.5 shrink-0" />
            <span className="min-w-0">
              Sent.{' '}
              <a
                href={meta.explorer(txHash, 'tx')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-semibold underline"
              >
                view tx <ExternalLink size={10} />
              </a>
            </span>
          </div>
        )}
        {status === 'error' && (
          <p className="min-w-0 overflow-hidden rounded-lg bg-red-50 px-3 py-2 text-[12px] break-words text-red-600 [overflow-wrap:anywhere]">
            {errorMsg}
          </p>
        )}
      </form>

      {address && stellarLocked && (
        <p className="mt-2 text-[11px] text-muted">
          Activate the account first — a send from an account that does not exist would create it
          empty, without the USDC.
        </p>
      )}
      {address && !stellarLocked && (
        <p className="mt-2 text-[11px] text-muted">
          {chain === 'stellar' && stellar?.state.kind === 'active' && stellar.state.xlm === 0n
            ? 'This account holds 0 XLM (Reserve paid its reserves in USDC), so a native send will fail until it receives XLM.'
            : 'Tip: send to yourself at your own address above to test the round-trip.'}
        </p>
      )}
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{title}</p>
      {children}
    </div>
  );
}
