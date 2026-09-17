'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCavos } from '@cavos/kit/react';
import { RefreshCw, ArrowDownToLine, Check, ExternalLink } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import { CHAINS, formatNative, type Chain } from '@/lib/chains';
import type { StellarBootstrapHandle } from '@/lib/stellar/bootstrap';
import { Section } from './BalanceSection';
import { StellarBalancePanel } from './StellarBalancePanel';

// Structural shapes for the chain-specific wallet members we use. The kit's
// wallet classes aren't exported from the React entry, so we narrow by the
// `chain` discriminant at runtime and cast to these minimal shapes.
// web3.js takes a `PublicKey`, not an address string. Declaring it as a string
// here made the cast assert a shape the library does not have, and the mistake
// surfaced only at runtime as `publicKey.toBase58 is not a function`.
type SolanaWallet = {
  chain: 'solana';
  connection: {
    getBalance: (a: PublicKey) => Promise<number>;
    requestAirdrop: (a: PublicKey, l: number) => Promise<string>;
  };
};
/** Starknet's balance is an ERC-20 read, done through the wallet's provider. */
type StarknetWallet = {
  chain: 'starknet';
  account: {
    callContract: (call: { contractAddress: string; entrypoint: string; calldata: string[] }) => Promise<string[]>;
  };
};

function asSolana(w: unknown): SolanaWallet {
  return w as SolanaWallet;
}
function asStarknet(w: unknown): StarknetWallet {
  return w as StarknetWallet;
}

interface Props {
  chain: Chain;
  stellar?: StellarBootstrapHandle;
}

/**
 * Native balance + testnet faucet.
 *
 * Solana has a true native asset and a programmatic faucet (airdrop).
 * Starknet's fee token is an ERC-20, so its balance is a `balanceOf` call and
 * its faucet is a captcha-gated web page — a link, not a button. Stellar is
 * delegated to StellarBalancePanel, which owns the claimable-balance state.
 */
export function BalancePanel({ chain, stellar }: Props) {
  if (chain === 'stellar' && stellar) {
    return <StellarBalancePanel chain="stellar" bootstrap={stellar} />;
  }
  return <NativeBalancePanel chain={chain} />;
}

function NativeBalancePanel({ chain }: { chain: Chain }) {
  const { wallet, address } = useCavos();
  const meta = CHAINS[chain];

  const [balance, setBalance] = useState<bigint | null>(null);
  const [balanceError, setBalanceError] = useState('');
  const [loading, setLoading] = useState(false);
  const [faucetState, setFaucetState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [faucetMsg, setFaucetMsg] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!wallet || !address) return;
    setLoading(true);
    setBalanceError('');
    try {
      if (chain === 'solana') {
        const lamports = await asSolana(wallet).connection.getBalance(new PublicKey(address));
        setBalance(BigInt(lamports));
      } else if (chain === 'starknet' && meta.feeToken) {
        // balanceOf returns a u256 as [low, high].
        const [low, high] = await asStarknet(wallet).account.callContract({
          contractAddress: meta.feeToken,
          entrypoint: 'balanceOf',
          calldata: [address],
        });
        setBalance((BigInt(high ?? 0) << 128n) + BigInt(low ?? 0));
      }
    } catch (e) {
      // Swallowing this turned every failure into the same em dash as "not
      // loaded yet", which is indistinguishable from a zero balance and made
      // the panel impossible to debug from the outside.
      setBalance(null);
      setBalanceError(e instanceof Error ? e.message : 'Balance read failed');
    } finally {
      setLoading(false);
    }
  }, [wallet, address, chain, meta.feeToken]);

  useEffect(() => {
    setBalance(null);
    setTxHash(null);
    setFaucetState('idle');
    refresh();
  }, [chain, refresh]);

  const runFaucet = async () => {
    if (!address) return;
    setFaucetState('loading');
    setFaucetMsg('');
    setTxHash(null);
    try {
      if (chain === 'solana') {
        const sig = await asSolana(wallet).connection.requestAirdrop(new PublicKey(address), 1_000_000_000); // 1 SOL
        setTxHash(sig);
        setFaucetState('done');
        setFaucetMsg('1 SOL requested');
        await new Promise((r) => setTimeout(r, 4000));
        refresh();
      }
    } catch {
      setFaucetState('error');
      setFaucetMsg('Faucet failed — try again');
    }
  };

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

      {balanceError && (
        <p className="mt-2 text-[12px] leading-relaxed text-red-600">{balanceError}</p>
      )}

      {/* No programmatic faucet: Starknet's is a captcha-gated page, so the
          honest affordance is a link out, not a button that cannot work. */}
      {meta.faucet === 'none' && meta.faucetUrl && (
        <a
          href={meta.faucetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink transition-colors hover:border-ink/40"
        >
          <ArrowDownToLine size={13} />
          Get {meta.symbol} from the faucet
          <ExternalLink size={12} className="text-muted" />
        </a>
      )}

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
