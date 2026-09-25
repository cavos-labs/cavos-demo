/**
 * Standing testnet offer so Reserve's USDC→XLM fee quote stays a direct trade.
 *
 * Sells native XLM, buys the configured USDC, at `--price` XLM per USDC.
 * An empty hop list cannot "path moved". Mainnet does not need this.
 *
 *   npm run stellar:fee-path -- --check
 *   npm run stellar:fee-path -- --price=9 --amount=4500
 *   npm run stellar:fee-path -- --price=9 --amount=4500 --topup
 *   npm run stellar:fee-path -- --cancel
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { HOSTED } from '@cavos/reserve';

const CIRCLE_USDC =
  'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const LEGACY_CAVOS_USDC =
  'USDC:GCKUFD5KAAM6DRSLODK55OVECMB5IJ5NSFQYFTBZRPOTJASUKTBZXGS2';

/** Dest XLM amounts Reserve buys for the two fee branches (measured on testnet). */
const FEE_PROBES = [
  { name: 'trustline', xlm: '0.0056' },
  { name: 'claimable', xlm: '1.20006' },
];

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const RESERVE_BASE = HOSTED.testnet.url.replace(/\/$/, '');
const HORIZON = 'https://horizon-testnet.stellar.org';
const server = new Horizon.Server(HORIZON);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fail(message) {
  console.error(message);
  process.exit(1);
}

function loadEnvFile(file) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return {};
  }
  const env = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[trimmed.slice(0, eq).trim()] = value;
  }
  return env;
}

function parseArgs(argv) {
  const out = {
    price: '9',
    amount: '4500',
    check: false,
    cancel: false,
    topup: false,
    cancelLegacy: false,
  };
  for (const arg of argv) {
    if (arg === '--check') out.check = true;
    else if (arg === '--cancel') out.cancel = true;
    else if (arg === '--topup') out.topup = true;
    else if (arg === '--cancel-legacy') out.cancelLegacy = true;
    else if (arg.startsWith('--price=')) out.price = arg.slice('--price='.length);
    else if (arg.startsWith('--amount=')) out.amount = arg.slice('--amount='.length);
    else fail(`Unknown flag ${arg}`);
  }
  if (out.cancel) out.amount = '0';
  return out;
}

function parseAsset(canonical) {
  const idx = canonical.indexOf(':');
  if (idx <= 0 || idx === canonical.length - 1) {
    fail(`Malformed asset "${canonical}" — expected CODE:ISSUER`);
  }
  return { code: canonical.slice(0, idx), issuer: canonical.slice(idx + 1) };
}

function toStroops(amount) {
  const t = String(amount).trim();
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const [whole, frac = ''] = t.split('.');
  if (frac.length > 7) return null;
  return BigInt(whole) * 10_000_000n + BigInt((frac + '0000000').slice(0, 7));
}

function fromStroops(stroops) {
  const whole = stroops / 10_000_000n;
  const frac = (stroops % 10_000_000n).toString().padStart(7, '0');
  return `${whole}.${frac}`;
}

function gcd(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

/** `--price` is XLM per USDC. manageSellOffer prices 1 XLM in USDC, so n/d = 1/price. */
function priceFraction(xlmPerUsdc) {
  if (!/^\d+(\.\d+)?$/.test(xlmPerUsdc) || Number(xlmPerUsdc) <= 0) {
    fail(`--price must be a positive decimal of XLM per USDC, got "${xlmPerUsdc}"`);
  }
  const [whole, frac = ''] = xlmPerUsdc.split('.');
  const scale = 10n ** BigInt(frac.length);
  const denom = BigInt(whole) * scale + BigInt(frac || '0');
  const g = gcd(scale, denom);
  const n = scale / g;
  const d = denom / g;
  const max = BigInt(2147483647);
  if (n > max || d > max || n === 0n) fail(`--price ${xlmPerUsdc} does not fit a Stellar price`);
  return { n: Number(n), d: Number(d) };
}

function isNative(asset) {
  return asset?.asset_type === 'native';
}

function isCredit(asset, code, issuer) {
  return asset?.asset_code === code && asset?.asset_issuer === issuer;
}

function samePrice(offer, fraction) {
  const r = offer.price_r;
  return r && Number(r.n) === fraction.n && Number(r.d) === fraction.d;
}

function horizonFailure(error) {
  const codes = error?.response?.data?.extras?.result_codes;
  if (codes) return JSON.stringify(codes);
  return error instanceof Error ? error.message : String(error);
}

function readQuote(token) {
  const [payload] = String(token).split('.');
  if (!payload) fail('Reserve quote token is malformed');
  const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  return JSON.parse(json);
}

async function listOffers(publicKey) {
  const records = [];
  let url = `${HORIZON}/accounts/${publicKey}/offers?limit=200&order=asc`;
  for (let page = 0; page < 10 && url; page++) {
    const res = await fetch(url);
    if (!res.ok) fail(`Horizon offers failed (${res.status})`);
    const json = await res.json();
    const batch = json._embedded?.records ?? [];
    records.push(...batch);
    if (batch.length < 200) break;
    url = json._links?.next?.href ?? '';
  }
  return records;
}

function xlmShortfall(account, offerAmount, hasTrust, existingAmount) {
  const native = account.balances.find((b) => b.asset_type === 'native');
  if (!native) return { short: true, balance: 0n, need: 0n };
  const balance = toStroops(native.balance) ?? 0n;
  const selling = toStroops(native.selling_liabilities || '0') ?? 0n;
  const existing = toStroops(existingAmount || '0') ?? 0n;
  const otherLiabilities = selling > existing ? selling - existing : 0n;
  const target = toStroops(offerAmount) ?? 0n;
  let extraSubs = 0;
  if (!hasTrust) extraSubs += 1;
  if (target > 0n && existing === 0n) extraSubs += 1;
  const min = BigInt(2 + Number(account.subentry_count) + extraSubs) * 5_000_000n;
  const need = target + otherLiabilities + min + 1_000_000n;
  return { short: balance < need, balance, need };
}

async function friendbot(publicKey) {
  const res = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`,
  );
  if (!res.ok) {
    const body = await res.text();
    fail(`Friendbot ${res.status} for ${publicKey}: ${body.slice(0, 240)}`);
  }
}

async function loadWhenFunded(publicKey) {
  let last;
  for (let i = 0; i < 10; i++) {
    try {
      return await server.loadAccount(publicKey);
    } catch (error) {
      last = error;
      await sleep(1000);
    }
  }
  fail(`Account ${publicKey} did not appear on Horizon: ${horizonFailure(last)}`);
}

/** Friendbot an ephemeral account, pay the treasury, then merge the remainder. */
async function topupOnce(treasuryPub) {
  const ephemeral = Keypair.random();
  await friendbot(ephemeral.publicKey());
  const epAccount = await loadWhenFunded(ephemeral.publicKey());
  const native = epAccount.balances.find((b) => b.asset_type === 'native');
  const balance = toStroops(native?.balance ?? '0');
  if (balance === null) fail('Ephemeral account has no native balance');
  const min = BigInt(2 + Number(epAccount.subentry_count)) * 5_000_000n;
  const fee = BigInt(BASE_FEE) * 2n;
  const pay = balance - min - fee;
  if (pay <= 0n) fail('Ephemeral balance is too small to forward');

  const tx = new TransactionBuilder(epAccount, {
    fee: fee.toString(),
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: treasuryPub,
        asset: Asset.native(),
        amount: fromStroops(pay),
      }),
    )
    .addOperation(Operation.accountMerge({ destination: treasuryPub }))
    .setTimeout(180)
    .build();
  tx.sign(ephemeral);
  const result = await server.submitTransaction(tx);
  console.log(`topup ${fromStroops(pay)} XLM → treasury (${result.hash})`);
}

async function horizonStrictReceive(usdc, destinationAmount) {
  const url = new URL(`${HORIZON}/paths/strict-receive`);
  url.searchParams.set('source_assets', usdc);
  url.searchParams.set('destination_asset_type', 'native');
  url.searchParams.set('destination_amount', destinationAmount);
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, detail: `HTTP ${res.status} ${JSON.stringify(json).slice(0, 240)}` };
  }
  const records = json._embedded?.records ?? [];
  if (records.length === 0) return { ok: false, detail: 'no route' };
  // A dust hop can be cheaper than 9 XLM/USDC for ~0.0056 XLM. The direct
  // route is still in the book; Reserve pins that empty path (see quote gate).
  const direct = records.find((r) => (r.path ?? []).length === 0);
  if (!direct) {
    const best = records[0];
    return {
      ok: false,
      detail: `no direct path; best source=${best.source_amount} path=${JSON.stringify(best.path ?? [])}`,
    };
  }
  const cheaperHop = records.find(
    (r) => (r.path ?? []).length !== 0 && Number(r.source_amount) < Number(direct.source_amount),
  );
  const hopNote = cheaperHop
    ? ` (dust hop source=${cheaperHop.source_amount} path=${JSON.stringify(cheaperHop.path)})`
    : '';
  return { ok: true, detail: `source=${direct.source_amount} path:[]${hopNote}` };
}

async function reserveQuote(source, usdc, branch) {
  const destination = Keypair.random().publicKey();
  const ops =
    branch === 'claimable'
      ? [
          {
            type: 'create_claimable_balance',
            destination,
            asset: usdc,
            amount: '1',
          },
        ]
      : [
          {
            type: 'payment',
            destination,
            asset: usdc,
            amount: '1',
          },
        ];
  const res = await fetch(`${RESERVE_BASE}/v1/quote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ source, fee_token: usdc, ops }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json.message || json.error || res.status;
    return { ok: false, detail: String(message).slice(0, 300) };
  }
  const payload = readQuote(json.quote);
  const path = payload.path ?? [];
  const detail = `charge_stroops=${payload.charge_stroops} path:${JSON.stringify(path)}`;
  if (path.length !== 0) return { ok: false, detail };
  return { ok: true, detail };
}

async function assertEmptyPaths(source, usdc, retries) {
  let last = '';
  for (let attempt = 1; attempt <= retries; attempt++) {
    const failures = [];
    for (const probe of FEE_PROBES) {
      const horizon = await horizonStrictReceive(usdc, probe.xlm);
      console.log(
        `horizon ${probe.name} dest=${probe.xlm} XLM ${horizon.ok ? 'ok' : 'FAIL'} ${horizon.detail}`,
      );
      if (!horizon.ok) failures.push(`horizon ${probe.name}: ${horizon.detail}`);

      const quote = await reserveQuote(source, usdc, probe.name);
      console.log(`reserve ${probe.name} ${quote.ok ? 'ok' : 'FAIL'} ${quote.detail}`);
      if (!quote.ok) failures.push(`reserve ${probe.name}: ${quote.detail}`);
    }
    if (failures.length === 0) {
      console.log('fee path ok: path:[]');
      return;
    }
    last = failures.join('; ');
    if (attempt < retries) {
      console.error(`check ${attempt}/${retries} failed — waiting for Horizon`);
      await sleep(3000);
    }
  }
  fail(`fee path is not direct (${last})`);
}

async function submit(account, ops, signer) {
  const fee = (BigInt(BASE_FEE) * BigInt(Math.max(ops.length, 1)) * 2n).toString();
  const tx = new TransactionBuilder(account, {
    fee,
    networkPassphrase: Networks.TESTNET,
  })
    .setTimeout(180);
  for (const op of ops) tx.addOperation(op);
  const built = tx.build();
  built.sign(signer);
  try {
    const result = await server.submitTransaction(built);
    console.log(`submitted ${result.hash}`);
    return result.hash;
  } catch (error) {
    fail(`Offer transaction failed: ${horizonFailure(error)}`);
  }
}

async function main() {
  if (HOSTED.testnet.horizonUrl !== HORIZON) {
    fail(`Vendor testnet Horizon is ${HOSTED.testnet.horizonUrl}, expected ${HORIZON}`);
  }

  const args = parseArgs(process.argv.slice(2));
  const fileEnv = loadEnvFile(join(root, '.env.local'));
  const secret = fileEnv.STELLAR_TREASURY_SECRET || process.env.STELLAR_TREASURY_SECRET || '';
  const usdc =
    fileEnv.NEXT_PUBLIC_STELLAR_USDC ||
    process.env.NEXT_PUBLIC_STELLAR_USDC ||
    CIRCLE_USDC;
  if (!secret) fail('STELLAR_TREASURY_SECRET is missing from .env.local');

  let treasury;
  try {
    treasury = Keypair.fromSecret(secret);
  } catch {
    fail('STELLAR_TREASURY_SECRET is not a valid Stellar secret key.');
  }

  const { code, issuer } = parseAsset(usdc);
  const asset = new Asset(code, issuer);
  const fraction = priceFraction(args.price);
  const target = toStroops(args.amount);
  if (target === null || (target === 0n && !args.cancel)) {
    fail(`--amount must be a positive 7-decimal amount, got "${args.amount}"`);
  }

  console.log(`reserve ${RESERVE_BASE}`);
  console.log(`horizon ${HORIZON}`);
  console.log(`asset ${usdc}`);
  console.log(`treasury ${treasury.publicKey()}`);
  console.log(
    `offer sell native / buy ${code} amount=${args.amount} price=${fraction.n}/${fraction.d} USDC per XLM (${args.price} XLM per USDC)`,
  );

  if (args.check) {
    await assertEmptyPaths(treasury.publicKey(), usdc, 1);
    return;
  }

  let account;
  try {
    account = await server.loadAccount(treasury.publicKey());
  } catch (error) {
    const status = error?.response?.status;
    if (status !== 404) fail(`Horizon could not load the treasury: ${horizonFailure(error)}`);
    if (!args.topup) fail('Treasury does not exist on testnet. Re-run with --topup.');
    console.log('treasury missing — funding it with Friendbot');
    await friendbot(treasury.publicKey());
    account = await loadWhenFunded(treasury.publicKey());
  }

  const hasTrust = (acct) =>
    acct.balances.some((b) => b.asset_code === code && b.asset_issuer === issuer);

  if (!args.cancel) {
    for (let i = 0; i < 5; i++) {
      const preview = await listOffers(treasury.publicKey());
      const existingOffer = preview.find(
        (o) => isNative(o.selling) && isCredit(o.buying, code, issuer),
      );
      const plan = xlmShortfall(
        account,
        args.amount,
        hasTrust(account),
        existingOffer?.amount ?? '0',
      );
      if (!plan.short) break;
      if (!args.topup) {
        fail(
          `Free XLM is low (have ${fromStroops(plan.balance)}, need ${fromStroops(plan.need)}). Re-run with --topup.`,
        );
      }
      console.log(
        `free XLM low (have ${fromStroops(plan.balance)}, need ${fromStroops(plan.need)}) — topping up`,
      );
      await topupOnce(treasury.publicKey());
      account = await loadWhenFunded(treasury.publicKey());
      if (i === 4) {
        const again = xlmShortfall(account, args.amount, hasTrust(account), existingOffer?.amount ?? '0');
        if (again.short) fail('Still short of XLM after top-ups.');
      }
    }
  }

  const offers = await listOffers(treasury.publicKey());
  const existing = offers.find((o) => isNative(o.selling) && isCredit(o.buying, code, issuer));
  const ops = [];

  if (!args.cancel && !hasTrust(account)) {
    ops.push(Operation.changeTrust({ asset }));
    console.log(`opening trustline to ${usdc}`);
  }

  if (args.cancelLegacy) {
    const legacy = parseAsset(LEGACY_CAVOS_USDC);
    const stale = offers.filter(
      (o) =>
        isNative(o.selling) &&
        isCredit(o.buying, legacy.code, legacy.issuer) &&
        !(legacy.code === code && legacy.issuer === issuer),
    );
    for (const offer of stale) {
      const r = offer.price_r ?? { n: 1, d: 1 };
      ops.push(
        Operation.manageSellOffer({
          selling: Asset.native(),
          buying: new Asset(legacy.code, legacy.issuer),
          amount: '0',
          price: { n: Number(r.n), d: Number(r.d) },
          offerId: offer.id,
        }),
      );
      console.log(`cancel legacy offer ${offer.id}`);
    }
  }

  const unchanged =
    existing &&
    samePrice(existing, fraction) &&
    toStroops(existing.amount) === target;

  if (args.cancel) {
    if (!existing) console.log('no offer to cancel');
    else {
      const r = existing.price_r ?? fraction;
      ops.push(
        Operation.manageSellOffer({
          selling: Asset.native(),
          buying: asset,
          amount: '0',
          price: { n: Number(r.n), d: Number(r.d) },
          offerId: existing.id,
        }),
      );
      console.log(`cancel offer ${existing.id}`);
    }
  } else if (unchanged) {
    console.log(`offer ${existing.id} already at amount=${args.amount} price=${args.price}`);
  } else {
    ops.push(
      Operation.manageSellOffer({
        selling: Asset.native(),
        buying: asset,
        amount: fromStroops(target),
        price: fraction,
        offerId: existing?.id ?? '0',
      }),
    );
    console.log(existing ? `update offer ${existing.id}` : 'create offer');
  }

  if (ops.length > 0) {
    account = await server.loadAccount(treasury.publicKey());
    await submit(account, ops, treasury);
  }

  await assertEmptyPaths(treasury.publicKey(), usdc, args.cancel ? 1 : 8);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
