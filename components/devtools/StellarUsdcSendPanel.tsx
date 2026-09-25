'use client';

import { useEffect, useState } from 'react';
import { useCavos } from '@cavos/kit/react';
import { Send, ExternalLink, Check } from 'lucide-react';
import { CHAINS } from '@/lib/chains';
import {
  PAY_MAX_FEE,
  STELLAR_USDC,
  assetLabel,
  checkReserveAccepts,
  parseAsset,
} from '@/lib/stellar/asset';
import type { StellarBootstrapHandle } from '@/lib/stellar/bootstrap';
import { useReserve } from '@/lib/stellar/useReserve';

// The kit's wallet classes aren't exported from the React entry, so we cast
// through `unknown` to the minimal shape we use, like the other panels do.
type StellarWallet = { chain: 'stellar'; signXdr: (xdr: string) => Promise<string> };
const asStellar = (w: unknown) => w as StellarWallet;

const STELLAR_ADDR = /^G[A-Z2-7]{55}$/;

/** Scale a decimal string to stroops (7 dp). Rejects >7 fractional digits; no rounding. */
function toStroops(amount: string): bigint | null {
  const t = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const [whole, frac = ''] = t.split('.');
  if (frac.length > 7) return null;
  return BigInt(whole) * 10_000_000n + BigInt((frac + '0000000').slice(0, 7));
}

function hasUsdc(usdc: string | null): boolean {
  return usdc !== null && usdc !== '0' && usdc !== '0.0000000';
}

interface Props {
  stellar: StellarBootstrapHandle;
}

/**
 * Send testnet USDC via Reserve.pay. Fee is USDC (PAY_MAX_FEE), so 0 XLM can still pay.
 * SendPanel stays responsible for native XLM.
 */
export function StellarUsdcSendPanel({ stellar }: Props) {
  const { wallet, address } = useCavos();
  const meta = CHAINS.stellar;
  const state = stellar.state;
  const getReserve = useReserve();

  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [domain, setDomain] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [sentReady, setSentReady] = useState(false);

  useEffect(() => {
    let live = true;
    getReserve()
      .then((r) => checkReserveAccepts(r, STELLAR_USDC))
      .then((check) => {
        if (live && check.ok) setDomain(check.domain);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [getReserve]);

  const usdcLabel = assetLabel({ ...parseAsset(STELLAR_USDC), domain });

  const inactive = state.kind !== 'active';
  const noUsdc = state.kind === 'active' && !hasUsdc(state.usdc);
  const formLocked = inactive || noUsdc;
  const lockMessage = inactive
    ? 'Activate the account first.'
    : noUsdc
      ? 'This account holds no USDC.'
      : null;

  const reset = () => {
    setStatus('idle');
    setErrorMsg('');
    setTxHash(null);
    setSentReady(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !address || formLocked || state.kind !== 'active') return;
    reset();

    const dest = destination.trim();
    const amt = amount.trim();

    if (!dest || !STELLAR_ADDR.test(dest)) {
      setStatus('error');
      setErrorMsg('Enter a destination address');
      return;
    }
    if (dest === address) {
      setStatus('error');
      setErrorMsg("You can't send to yourself");
      return;
    }

    const amountStroops = toStroops(amt);
    if (amountStroops === null) {
      setStatus('error');
      setErrorMsg(
        /^\d+\.\d{8,}$/.test(amt.trim())
          ? 'Use at most 7 decimal places'
          : 'Enter a valid amount',
      );
      return;
    }
    if (amountStroops <= 0n) {
      setStatus('error');
      setErrorMsg('Enter a valid amount');
      return;
    }

    const balanceStroops = toStroops(state.usdc ?? '0');
    const feeStroops = toStroops(PAY_MAX_FEE);
    if (balanceStroops === null || feeStroops === null) {
      setStatus('error');
      setErrorMsg('Enter a valid amount');
      return;
    }
    if (amountStroops + feeStroops > balanceStroops) {
      setStatus('error');
      setErrorMsg('Not enough USDC (keep up to 0.05 for the fee)');
      return;
    }

    setStatus('sending');
    try {
      const reserve = await getReserve();
      const check = await checkReserveAccepts(reserve, STELLAR_USDC);
      if (!check.ok) {
        setStatus('error');
        setErrorMsg(check.message);
        return;
      }

      const ready = await reserve.destinationReady(dest, STELLAR_USDC);
      const { hash } = await reserve.pay(
        {
          source: address,
          destination: dest,
          amount: amt,
          token: STELLAR_USDC,
          maxSend: PAY_MAX_FEE,
        },
        (xdr) => asStellar(wallet).signXdr(xdr),
      );

      setTxHash(hash);
      setSentReady(ready);
      setStatus('done');
      setDestination('');
      setAmount('');

      try {
        await stellar.refresh();
      } catch {
        // pay resolved — keep the success note even if refresh fails
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
    }
  };

  return (
    <Section title="Send USDC">
      {state.kind === 'active' && hasUsdc(state.usdc) && (
        <p className="mb-2.5 font-mono text-[13px] font-medium text-muted">
          Balance: {state.usdc} {usdcLabel}
        </p>
      )}

      <form onSubmit={handleSend} className="space-y-2.5">
        <div>
          <label className="mb-1 block text-[11.5px] font-medium text-muted">Destination</label>
          <input
            value={destination}
            disabled={formLocked || status === 'sending'}
            onChange={(e) => {
              setDestination(e.target.value);
              if (status !== 'idle') reset();
            }}
            placeholder="Stellar address"
            className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 font-mono text-[12px] text-ink outline-none transition-colors focus:border-ink disabled:opacity-60"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11.5px] font-medium text-muted">Amount</label>
          <div className="flex items-center gap-2">
            <input
              value={amount}
              disabled={formLocked || status === 'sending'}
              onChange={(e) => {
                setAmount(e.target.value);
                if (status !== 'idle') reset();
              }}
              inputMode="decimal"
              placeholder="0.0"
              className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-ink disabled:opacity-60"
            />
            <span className="shrink-0 text-[12px] font-semibold text-muted">{usdcLabel}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={status === 'sending' || !wallet || formLocked}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-brand-hover active:scale-[0.99] disabled:opacity-60"
        >
          <Send size={14} />
          {status === 'sending' ? 'Sending…' : 'Send USDC'}
        </button>

        {status === 'done' && txHash && (
          <div className="flex items-start gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
            <Check size={13} className="mt-0.5 shrink-0" />
            <span className="min-w-0">
              {sentReady
                ? 'Sent.'
                : 'Left as a claimable balance: the recipient claims it with Activate. You can take it back after 7 days.'}{' '}
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
          <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">{errorMsg}</p>
        )}
      </form>

      {lockMessage && (
        <p className="mt-2 text-[11px] text-muted">{lockMessage}</p>
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
