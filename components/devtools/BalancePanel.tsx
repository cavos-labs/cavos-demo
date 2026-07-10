'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCavos } from '@cavos/kit/react';
import { RefreshCw, ArrowDownToLine, Check, ExternalLink } from 'lucide-react';
import { CHAINS, formatNative, type Chain } from '@/lib/chains';
import { CvWallet } from '../CavosIcons';

// Structural shapes for the chain-specific wallet members we use. The kit's
// wallet classes aren't exported from the React entry, so we narrow by the
// `chain` discriminant at runtime and cast to these minimal shapes.
type SolanaWallet = { chain: 'solana'; connection: { getBalance: (a: string) => Promise<number>; requestAirdrop: (a: string, l: number) => Promise<string> } };
type StellarWallet = { chain: 'stellar'; balance: () => Promise<bigint> };

function asSolana(w: unknown): SolanaWallet {
  return w as SolanaWallet;
}
function asStellar(w: unknown): StellarWallet {
  return w as StellarWallet;
}

interface Props {
  chain: Chain;
}

/**
 * Native balance + devnet faucet for Solana (airdrop) and Stellar (friendbot).
 * Starknet has no simple native balance read in the kit, so it shows a notice.
 */
export function BalancePanel({ chain }: Props) {
  const { wallet, address } = useCavos();
  const meta = CHAINS[chain];

  const [balance, setBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [faucetState, setFaucetState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [faucetMsg, setFaucetMsg] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!wallet || !address) return;
    if (chain === 'starknet') return; // no native balance read
    setLoading(true);
    try {
      if (chain === 'solana') {
        const lamports = await asSolana(wallet).connection.getBalance(address);
        setBalance(BigInt(lamports));
      } else if (chain === 'stellar') {
        const stroops = await asStellar(wallet).balance();
        setBalance(stroops);
      }
    } catch (e) {
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [wallet, address, chain]);

  useEffect(() => {
    setBalance(null);
    setTxHash(null);
    setFaucetState('idle');
    if (chain !== 'starknet') refresh();
  }, [chain, refresh]);

  const runFaucet = async () => {
    if (!address) return;
    setFaucetState('loading');
    setFaucetMsg('');
    setTxHash(null);
    try {
      if (chain === 'solana') {
        const sig = await asSolana(wallet).connection.requestAirdrop(address, 1_000_000_000); // 1 SOL
        setTxHash(sig);
        setFaucetState('done');
        setFaucetMsg('1 SOL requested');
        await new Promise((r) => setTimeout(r, 4000));
        refresh();
      } else if (chain === 'stellar') {
        const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`);
        if (!res.ok) throw new Error('Friendbot failed');
        setFaucetState('done');
        setFaucetMsg('10,000 XLM funded');
        await new Promise((r) => setTimeout(r, 2000));
        refresh();
      }
    } catch {
      setFaucetState('error');
      setFaucetMsg('Faucet failed — try again');
    }
  };

  if (chain === 'starknet') {
    return (
      <Section title="Balance">
        <p className="text-[12.5px] leading-relaxed text-muted">
          Balance tracking for Starknet is coming soon. Your wallet is deployed and ready.
        </p>
      </Section>
    );
  }

  return (
    <Section title="Balance">
      <div className="flex items-end justify-between">
        <div>
          {balance === null ? (
            <span className="font-mono text-[20px] text-muted">—</span>
          ) : (
            <span className="font-mono text-[20px] font-semibold text-ink">
              {formatNative(balance, meta.decimals)}
            </span>
          )}
          <span className="ml-1.5 text-[13px] font-medium text-muted">{meta.symbol}</span>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh balance"
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {meta.faucet !== 'none' && (
        <div className="mt-3">
          <button
            onClick={runFaucet}
            disabled={faucetState === 'loading'}
            className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink transition-colors hover:border-ink/40 disabled:opacity-60"
          >
            {faucetState === 'loading' ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : faucetState === 'done' ? (
              <Check size={13} className="text-emerald-600" />
            ) : (
              <ArrowDownToLine size={13} />
            )}
            {faucetState === 'loading'
              ? 'Requesting…'
              : faucetState === 'done'
                ? 'Funded'
                : `Get devnet ${meta.symbol}`}
          </button>
          {faucetMsg && (
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              {faucetMsg}
              {txHash && (
                <>
                  {' · '}
                  <a
                    href={meta.explorer(txHash, 'tx')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-semibold text-brand hover:text-brand-hover"
                  >
                    view tx <ExternalLink size={10} />
                  </a>
                </>
              )}
            </p>
          )}
        </div>
      )}
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <CvWallet size={20} />
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{title}</p>
      </div>
      {children}
    </div>
  );
}
