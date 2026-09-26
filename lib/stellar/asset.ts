// Stellar asset identity for the demo. Client-safe on purpose: plain fetch
// against Horizon and the small `@cavos/reserve` client — `stellar-sdk` stays
// in the server route, out of the browser bundle.
import type { Reserve } from '@cavos/reserve';

export const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org';

// Circle testnet USDC (centre.io). Cavos USDC (`USDC:GCKUFD5K…`, cavos.xyz)
// has no faucet and an empty ask book — the demo cannot depend on a team mint.
export const DEFAULT_STELLAR_USDC =
  'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
export const STELLAR_USDC = process.env.NEXT_PUBLIC_STELLAR_USDC || DEFAULT_STELLAR_USDC;

/** Display-only default; the server route reads its own env for the real amount. */
export const CLAIMABLE_AMOUNT = '25';
/** Ceiling on what Activate may take from the claimed USDC. */
export const ACTIVATE_MAX_SEND = '5';
/** Ceiling on what a USDC payment may take as fee when the destination can receive. */
export const PAY_MAX_FEE = '0.05';
/**
 * Ceiling when Reserve leaves a claimable balance instead of a payment.
 * Measured testnet fee (XLM bought with USDC): trustline path ~0.0056 XLM,
 * claimable ~1.20006 XLM. At the seeded book (9 XLM per USDC) both sit under 0.5 USDC.
 */
export const CLAIMABLE_MAX_FEE = '0.5';

/** Split `CODE:ISSUER` into its parts. Throws on anything else. */
export function parseAsset(canonical: string): { code: string; issuer: string } {
  const idx = canonical.indexOf(':');
  if (idx <= 0 || idx === canonical.length - 1) {
    throw new Error(`Malformed asset "${canonical}" — expected CODE:ISSUER`);
  }
  return { code: canonical.slice(0, idx), issuer: canonical.slice(idx + 1) };
}

export function shortenKey(g: string): string {
  return g && g.length > 10 ? `${g.slice(0, 6)}…${g.slice(-4)}` : g;
}

/** "USDC · cavos.xyz", falling back to a shortened issuer when no domain is known. */
export function assetLabel(a: { code: string; issuer: string; domain?: string }): string {
  return `${a.code} · ${a.domain || shortenKey(a.issuer)}`;
}

export type ReserveTokenCheck = { ok: true; domain: string } | { ok: false; message: string };

/**
 * Ask the deployment whether it still accepts `canonical`, and pick up the
 * issuer's home_domain for display while we are there.
 */
export async function checkReserveAccepts(
  reserve: Reserve,
  canonical: string,
): Promise<ReserveTokenCheck> {
  const { tokens, known } = await reserve.tokens();
  if (!tokens.includes(canonical)) {
    return {
      ok: false,
      message: `Reserve no longer accepts ${canonical} on testnet. Nothing was sent.`,
    };
  }
  const domain = known.find((k) => k.asset === canonical)?.domain ?? '';
  return { ok: true, domain };
}
