'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { HORIZON_TESTNET, STELLAR_USDC, parseAsset } from './asset';

/**
 * The one Stellar account state. `has_claimable` = money waiting for an
 * account that does not exist yet; `stranded` = money waiting for an account
 * that already does (reachable via curl or a second tab, not from the UI).
 */
export type StellarBootstrap =
  | { kind: 'loading' }
  | { kind: 'unfunded' }
  | { kind: 'has_claimable'; balanceId: string; amount: string }
  | { kind: 'active'; xlm: bigint; usdc: string | null }
  | { kind: 'stranded'; balanceId: string; amount: string; xlm: bigint; usdc: string | null }
  | { kind: 'unavailable'; message: string };

interface HorizonAccount {
  balances: {
    asset_type: string;
    asset_code?: string;
    asset_issuer?: string;
    balance: string;
  }[];
}

interface HorizonClaimables {
  _embedded?: {
    records: {
      id: string;
      amount: string;
      asset: string;
      claimants: { destination: string }[];
    }[];
  };
}

/** Decimal XLM string → stroops bigint (7 dp). stellar-sdk stays server-side. */
function toStroops(amount: string): bigint {
  const [whole, frac = ''] = amount.trim().split('.');
  const fracPadded = (frac + '0000000').slice(0, 7);
  return BigInt(whole || '0') * 10_000_000n + BigInt(fracPadded || '0');
}

export async function readBootstrap(
  address: string,
  asset = STELLAR_USDC,
): Promise<StellarBootstrap> {
  let accountRes: Response;
  let claimRes: Response;
  try {
    [accountRes, claimRes] = await Promise.all([
      fetch(`${HORIZON_TESTNET}/accounts/${address}`),
      fetch(
        `${HORIZON_TESTNET}/claimable_balances?claimant=${address}` +
          `&asset=${encodeURIComponent(asset)}&limit=10`,
      ),
    ]);
  } catch (e) {
    return { kind: 'unavailable', message: e instanceof Error ? e.message : 'Network error' };
  }

  if (accountRes.status !== 200 && accountRes.status !== 404) {
    return { kind: 'unavailable', message: `Horizon ${accountRes.status}` };
  }
  if (!claimRes.ok) {
    return { kind: 'unavailable', message: `Horizon ${claimRes.status}` };
  }

  let xlm = 0n;
  let usdc: string | null = null;
  const exists = accountRes.status === 200;
  if (exists) {
    const account = (await accountRes.json()) as HorizonAccount;
    const { code, issuer } = parseAsset(asset);
    for (const b of account.balances) {
      if (b.asset_type === 'native') xlm = toStroops(b.balance);
      if (b.asset_code === code && b.asset_issuer === issuer) usdc = b.balance;
    }
  }

  const claimables = (await claimRes.json()) as HorizonClaimables;
  const pending = (claimables._embedded?.records ?? []).find(
    (r) => r.asset === asset && r.claimants.some((c) => c.destination === address),
  );

  if (!exists && !pending) return { kind: 'unfunded' };
  if (!exists && pending) return { kind: 'has_claimable', balanceId: pending.id, amount: pending.amount };
  if (!pending) return { kind: 'active', xlm, usdc };
  return { kind: 'stranded', balanceId: pending.id, amount: pending.amount, xlm, usdc };
}

export interface StellarBootstrapHandle {
  state: StellarBootstrap;
  refresh: () => Promise<StellarBootstrap>;
  waitFor: (kind: StellarBootstrap['kind'], timeoutMs?: number, intervalMs?: number) => Promise<boolean>;
}

export function useStellarBootstrap(address: string | null, enabled: boolean): StellarBootstrapHandle {
  const [state, setState] = useState<StellarBootstrap>({ kind: 'loading' });
  // A refresh can land after the address changed or a newer refresh started;
  // only the latest request may publish.
  const request = useRef(0);

  const refresh = useCallback(async (): Promise<StellarBootstrap> => {
    const id = ++request.current;
    if (!enabled || !address) return { kind: 'loading' };
    const next = await readBootstrap(address);
    if (id === request.current) setState(next);
    return next;
  }, [address, enabled]);

  useEffect(() => {
    setState({ kind: 'loading' });
    if (enabled && address) void refresh();
  }, [address, enabled, refresh]);

  const waitFor = useCallback(
    async (kind: StellarBootstrap['kind'], timeoutMs = 30_000, intervalMs = 2_000) => {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const next = await refresh();
        if (next.kind === kind) return true;
        await new Promise((r) => setTimeout(r, intervalMs));
      }
      return false;
    },
    [refresh],
  );

  return { state, refresh, waitFor };
}
