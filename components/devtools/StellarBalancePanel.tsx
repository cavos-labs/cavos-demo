'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCavos } from '@cavos/kit/react';
import { Reserve, ReserveError } from '@cavos/reserve';
import { RefreshCw, ArrowDownToLine, Check, ExternalLink, Zap } from 'lucide-react';
import { CHAINS, formatNative } from '@/lib/chains';
import {
  ACTIVATE_MAX_SEND,
  CLAIMABLE_AMOUNT,
  STELLAR_USDC,
  assetLabel,
  checkReserveAccepts,
  parseAsset,
} from '@/lib/stellar/asset';
import type { StellarBootstrapHandle } from '@/lib/stellar/bootstrap';
import { Section } from './BalanceSection';

// The kit's wallet classes aren't exported from the React entry, so we cast
// through `unknown` to the minimal shape we use, like the other panels do.
type StellarWallet = { chain: 'stellar'; signXdr: (xdr: string) => Promise<string> };
const asStellar = (w: unknown) => w as StellarWallet;

const BTN =
  'inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-white px-3 py-1.5 ' +
  'text-[12.5px] font-semibold text-ink transition-colors hover:border-ink/40 disabled:opacity-60';

const shortId = (id: string) => `${id.slice(0, 8)}…${id.slice(-6)}`;

type ActionState = 'idle' | 'running' | 'done' | 'error';

/**
 * Stellar balance + the two ways a fresh address can come to life: Friendbot's
 * one-way plain-XLM path, or a USDC claimable balance activated through Cavos
 * Reserve, which costs the account no XLM.
 */
export function StellarBalancePanel({ bootstrap }: { chain: 'stellar'; bootstrap: StellarBootstrapHandle }) {
  const { wallet, address } = useCavos();
  const meta = CHAINS.stellar;
  const state = bootstrap.state;

  const [refreshing, setRefreshing] = useState(false);
  const [domain, setDomain] = useState('');
  const [status, setStatus] = useState<ActionState>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [actor, setActor] = useState<'receive' | 'friendbot' | 'activate' | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Reserve.connect hits the service; keep one per panel, built lazily.
  const reserveRef = useRef<Promise<Reserve> | null>(null);
  const getReserve = useCallback(() => {
    reserveRef.current ??= Reserve.connect('testnet');
    return reserveRef.current;
  }, []);

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

  const refresh = async () => {
    setRefreshing(true);
    try {
      await bootstrap.refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const friendbot = async () => {
    if (!address) return;
    setActor('friendbot');
    setStatus('running');
    setStatusMsg('');
    try {
      const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`);
      if (!res.ok) throw new Error('Friendbot failed');
      setStatus('done');
      setStatusMsg('10,000 XLM funded');
      await new Promise((r) => setTimeout(r, 2000));
      await bootstrap.refresh();
    } catch {
      setStatus('error');
      setStatusMsg('Faucet failed — try again');
    }
  };

  const receive = async () => {
    if (!address) return;
    setActor('receive');
    setStatus('running');
    setStatusMsg('');
    setTxHash(null);
    try {
      const res = await fetch('/api/stellar/receive', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ destination: address }),
      });
      const body = (await res.json()) as { hash?: string; message?: string; error?: string };
      if (res.ok) {
        setTxHash(body.hash ?? null);
        setStatus('done');
        setStatusMsg('Payment sent.');
        const seen = await bootstrap.waitFor('has_claimable');
        if (!seen) {
          setStatusMsg('Payment sent, but Horizon has not shown the claimable yet — hit refresh in a moment.');
        }
      } else if (res.status === 409 && body.error === 'already_pending') {
        setStatus('done');
        setStatusMsg('A payment is already waiting for this account.');
        await bootstrap.refresh();
      } else {
        setStatus('error');
        setStatusMsg(body.message ?? 'Receive failed');
      }
    } catch (e) {
      setStatus('error');
      setStatusMsg(e instanceof Error ? e.message : 'Receive failed');
    }
  };

  const activate = async () => {
    if (!address || !wallet || state.kind !== 'has_claimable') return;
    setActor('activate');
    setStatus('running');
    setStatusMsg('');
    setTxHash(null);
    try {
      const reserve = await getReserve();
      const check = await checkReserveAccepts(reserve, STELLAR_USDC);
      if (!check.ok) {
        setStatus('error');
        setStatusMsg(check.message);
        return;
      }
      // The state may have moved under us — re-check before signing.
      const fresh = await bootstrap.refresh();
      if (fresh.kind !== 'has_claimable') {
        setStatus('error');
        setStatusMsg(`Account state changed to ${fresh.kind} — Activate is no longer needed.`);
        return;
      }
      const balanceId = fresh.balanceId;
      let lastErr: unknown;
      for (let attempt = 0; attempt <= 3; attempt++) {
        try {
          const { hash } = await reserve.activate(
            { address, token: STELLAR_USDC, balanceId, maxSend: ACTIVATE_MAX_SEND },
            (xdr) => asStellar(wallet).signXdr(xdr),
          );
          setTxHash(hash);
          setStatus('done');
          setStatusMsg('Account activated.');
          await bootstrap.waitFor('active');
          return;
        } catch (e) {
          lastErr = e;
          if (e instanceof ReserveError && e.code === 'bootstrap_busy' && attempt < 3) {
            setStatusMsg(`Reserve is busy sponsoring another account — retrying (${attempt + 1}/3)…`);
            await new Promise((r) => setTimeout(r, 2_000 * 2 ** attempt));
            continue;
          }
          throw e;
        }
      }
      throw lastErr;
    } catch (e) {
      setStatus('error');
      setStatusMsg(e instanceof Error ? e.message : 'Activation failed');
    }
  };

  const busy = status === 'running';
  const xlmDisplay =
    state.kind === 'active' || state.kind === 'stranded'
      ? formatNative(state.xlm, 7)
      : state.kind === 'loading' || state.kind === 'unavailable'
        ? null
        : '0';

  return (
    <Section title="Balance">
      <div className="flex items-end justify-between">
        <div>
          {xlmDisplay === null ? (
            <span className="font-mono text-[20px] text-muted">—</span>
          ) : (
            <span className="font-mono text-[20px] font-semibold text-ink">{xlmDisplay}</span>
          )}
          <span className="ml-1.5 text-[13px] font-medium text-muted">XLM</span>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          aria-label="Refresh balance"
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <p className="font-mono text-[13px] font-medium text-muted">
        {state.kind === 'active' || state.kind === 'stranded'
          ? `${state.usdc ?? '—'} ${usdcLabel}`
          : state.kind === 'has_claimable'
            ? `${state.amount} ${usdcLabel} pending`
            : `— ${usdcLabel}`}
      </p>

      {state.kind === 'unfunded' && (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={receive} disabled={busy} className={BTN}>
              {busy && actor === 'receive' ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <ArrowDownToLine size={13} />
              )}
              {busy && actor === 'receive' ? 'Sending…' : 'Receive a USDC payment'}
            </button>
            <button onClick={friendbot} disabled={busy} className={BTN}>
              {busy && actor === 'friendbot' ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : status === 'done' && actor === 'friendbot' ? (
                <Check size={13} className="text-emerald-600" />
              ) : (
                <ArrowDownToLine size={13} />
              )}
              {busy && actor === 'friendbot'
                ? 'Requesting…'
                : status === 'done' && actor === 'friendbot'
                  ? 'Funded'
                  : 'Get devnet XLM'}
            </button>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
            Receive pays {CLAIMABLE_AMOUNT} {usdcLabel} to this address as a claimable
            balance — the account does not need to exist yet, and activating it costs no XLM. Get
            devnet XLM creates the account with 10,000 XLM from Friendbot instead; that path skips
            Reserve for this address.
          </p>
        </>
      )}

      {state.kind === 'has_claimable' && (
        <>
          <div className="mt-3">
            <button onClick={activate} disabled={busy} className={BTN}>
              {busy ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
              {busy ? 'Activating…' : 'Activate account'}
            </button>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
            {state.amount} {usdcLabel} is waiting. One signature creates the account, opens
            the USDC trustline, and claims it. Reserves and fees are paid from that USDC via Cavos
            Reserve.
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted">claimable {shortId(state.balanceId)}</p>
        </>
      )}

      {state.kind === 'active' && (
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
          {state.xlm === 0n && state.usdc
            ? 'Account live. Reserves and fees were paid in USDC through Cavos Reserve — it holds 0 XLM by design.'
            : 'Account live.'}
        </p>
      )}

      {state.kind === 'stranded' && (
        <>
          <p className="mt-2 text-[11.5px] leading-relaxed text-amber-700">
            A claimable balance ({state.amount} {usdcLabel}) is waiting but the account
            already exists, so Activate cannot run. Claiming into a live account is not part of this
            demo.
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted">claimable {shortId(state.balanceId)}</p>
        </>
      )}

      {state.kind === 'unavailable' && (
        <p className="mt-2 text-[12px] text-red-600">{state.message}</p>
      )}

      {status === 'done' && statusMsg && (
        <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
          <Check size={13} className="mt-0.5 shrink-0" />
          <span className="min-w-0">
            {statusMsg}
            {txHash && (
              <>
                {' '}
                <a
                  href={meta.explorer(txHash, 'tx')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 font-semibold underline"
                >
                  view tx <ExternalLink size={10} />
                </a>
              </>
            )}
          </span>
        </div>
      )}
      {status === 'error' && statusMsg && (
        <p className="mt-3 text-[12px] text-red-600">{statusMsg}</p>
      )}
      {status === 'running' && statusMsg && (
        <p className="mt-3 text-[11.5px] text-muted">{statusMsg}</p>
      )}
    </Section>
  );
}
