import { NextResponse } from 'next/server';
import {
  Asset,
  BASE_FEE,
  Claimant,
  Horizon,
  Keypair,
  Networks,
  Operation,
  StrKey,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk';
import { DEFAULT_STELLAR_USDC, HORIZON_TESTNET, parseAsset, shortenKey } from '@/lib/stellar/asset';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const server = new Horizon.Server(HORIZON_TESTNET);

function err(status: number, error: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, message, ...extra }, { status });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Positive decimal with at most 7 fractional digits. */
function isValidAmount(amount: string): boolean {
  return /^\d+(\.\d{1,7})?$/.test(amount) && Number(amount) > 0;
}

async function pendingClaimable(destination: string, asset: string) {
  const res = await fetch(
    `${HORIZON_TESTNET}/claimable_balances?claimant=${destination}` +
      `&asset=${encodeURIComponent(asset)}&limit=10`,
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    _embedded?: { records: { id: string; asset: string; claimants: { destination: string }[] }[] };
  };
  return (json._embedded?.records ?? []).find(
    (r) => r.asset === asset && r.claimants.some((c) => c.destination === destination),
  );
}

export async function POST(request: Request) {
  const secret = process.env.STELLAR_TREASURY_SECRET;
  if (!secret) {
    return err(500, 'treasury_not_configured', 'STELLAR_TREASURY_SECRET is not set on the server.');
  }
  const asset = process.env.STELLAR_USDC || process.env.NEXT_PUBLIC_STELLAR_USDC || DEFAULT_STELLAR_USDC;
  const amount = process.env.STELLAR_CLAIMABLE_AMOUNT || '25';
  if (!isValidAmount(amount)) {
    return err(500, 'treasury_not_configured', `STELLAR_CLAIMABLE_AMOUNT "${amount}" is not a positive decimal.`);
  }

  let destination: string;
  try {
    destination = ((await request.json()) as { destination?: string }).destination ?? '';
  } catch {
    destination = '';
  }
  let treasury: Keypair;
  try {
    treasury = Keypair.fromSecret(secret);
  } catch {
    return err(500, 'treasury_not_configured', 'STELLAR_TREASURY_SECRET is not a valid Stellar secret key.');
  }
  if (!StrKey.isValidEd25519PublicKey(destination)) {
    return err(400, 'invalid_destination', `"${destination || '(empty)'}" is not a Stellar public key.`);
  }
  if (destination === treasury.publicKey()) {
    return err(400, 'invalid_destination', 'Destination is the treasury itself.');
  }

  // Receive only serves accounts that do not exist yet.
  try {
    await server.loadAccount(destination);
    return err(
      409,
      'account_exists',
      'This account already exists on Stellar. Receive is only for accounts that do not exist yet.',
    );
  } catch (e) {
    const status = (e as { response?: { status?: number } }).response?.status;
    if (status !== 404) {
      return err(502, 'horizon', `Horizon ${status ?? 'error'} while checking the destination account.`);
    }
  }

  // Idempotency: a double click must not lock a second claimable.
  const existing = await pendingClaimable(destination, asset);
  if (existing) {
    return err(409, 'already_pending', `A claimable balance is already waiting for this account.`, {
      balanceId: existing.id,
    });
  }

  const { code, issuer } = parseAsset(asset);
  const claimableAsset = new Asset(code, issuer);

  let treasuryAccount;
  try {
    treasuryAccount = await server.loadAccount(treasury.publicKey());
  } catch (e) {
    const status = (e as { response?: { status?: number } }).response?.status;
    if (status === 404) {
      return err(
        503,
        'treasury_unfunded',
        `Treasury ${shortenKey(treasury.publicKey())} does not exist on testnet yet. ` +
          `Fund it with Friendbot, open the ${asset} trustline, then send it USDC — see README "Treasury provisioning".`,
      );
    }
    return err(502, 'horizon', `Horizon ${status ?? 'error'} while loading the treasury account.`);
  }
  const holding = treasuryAccount.balances.find(
    (b) => 'asset_code' in b && b.asset_code === code && b.asset_issuer === issuer,
  );
  if (!holding || Number(holding.balance) < Number(amount)) {
    return err(
      503,
      'treasury_unfunded',
      `Treasury ${shortenKey(treasury.publicKey())} does not hold enough ${asset} to pay ${amount}. ` +
        `Fund it with ${asset} first — see README "Treasury provisioning".`,
    );
  }

  const tx = new TransactionBuilder(treasuryAccount, {
    fee: (Number(BASE_FEE) * 10).toString(),
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.createClaimableBalance({
        asset: claimableAsset,
        amount,
        claimants: [new Claimant(destination, Claimant.predicateUnconditional())],
      }),
    )
    .setTimeout(60)
    .build();
  tx.sign(treasury);

  let result: Horizon.HorizonApi.SubmitTransactionResponse;
  try {
    result = await server.submitTransaction(tx);
  } catch (e) {
    const res = e as { response?: { status?: number; data?: { extras?: { result_codes?: unknown } } } };
    const codes = res.response?.data?.extras?.result_codes;
    const detail = codes ? ` result_codes: ${JSON.stringify(codes)}` : '';
    return err(502, 'horizon', `Claimable balance transaction failed.${detail}`);
  }

  // The balance id is the XDR hex of the claimableBalanceId union. If parsing
  // ever changes under us, re-ask Horizon for the claimant's claimables.
  let balanceId = '';
  try {
    balanceId = xdr.TransactionResult.fromXDR(result.result_xdr ?? '', 'base64')
      .result()
      .results()[0]
      .tr()
      .createClaimableBalanceResult()
      .balanceId()
      .toXDR('hex');
  } catch {
    for (let i = 0; i < 5 && !balanceId; i++) {
      await sleep(1000);
      balanceId = (await pendingClaimable(destination, asset))?.id ?? '';
    }
  }

  return NextResponse.json({ balanceId, hash: result.hash, amount, asset });
}
