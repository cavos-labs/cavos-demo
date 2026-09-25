# Cavos Demo

Privy-style interactive demo for [`@cavos/kit`](https://www.npmjs.com/package/@cavos/kit). Customize the embedded login modal live (background, accent, corner radius, logo, providers), then sign in to create a **real device-signer wallet on Solana devnet** — no install, no seed phrase.

## Run locally

```bash
cp .env.example .env.local   # fill NEXT_PUBLIC_CAVOS_APP_ID
npm install
npm run dev
```

Open http://localhost:3000.

## Environment

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_CAVOS_APP_ID` | Cavos app id — activates the gasless relayer + branding. Register at cavos.xyz. |
| `NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL` | Devnet RPC (Alchemy/Helius). Public devnet fails from the browser. |
| `STELLAR_TREASURY_SECRET` | Server-only testnet treasury secret for "Receive a USDC payment". |
| `NEXT_PUBLIC_STELLAR_USDC` | `CODE:ISSUER` the demo pays and Reserve charges in. Defaults to Circle testnet USDC. |
| `STELLAR_CLAIMABLE_AMOUNT` | USDC per claimable balance (default `25`). Must exceed the activate ceiling (5). |

## Stellar: XLM or USDC

A fresh Stellar address can come to life two ways, and the Balance panel offers both side by side — but only while the account does not exist:

- **Get devnet XLM** — Friendbot creates the account with 10,000 XLM. One-way, plain-XLM path: it is only shown in the `unfunded` state because Friendbot only creates accounts (it 400s on existing ones), and taking it means that address skips Reserve entirely.
- **Receive a USDC payment → Activate account** — the demo treasury pays a claimable balance to the address (no account needed), then one signature through [Cavos Reserve](https://www.npmjs.com/package/@cavos/reserve) creates the account, opens the USDC trustline, and claims the balance. Reserves and fees are paid out of the claimed USDC, so the account holds 0 XLM by design.

### Treasury provisioning

1. Generate a keypair in [Stellar Lab](https://lab.stellar.org) and fund it via Friendbot.
2. Open a trustline from the treasury to the chosen USDC issuer.
3. Fund it with USDC from the Cavos issuer (`GCKUFD5K…`, see Reserve `/v1/tokens`), or from <https://faucet.circle.com> for Circle's testnet USDC (`USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`) — set `NEXT_PUBLIC_STELLAR_USDC` accordingly. Testnet USDC cannot be bought on the DEX; there is no XLM→USDC path.
4. Put the secret in `.env.local` as `STELLAR_TREASURY_SECRET` (never `NEXT_PUBLIC_`).

Each unclaimed claimable locks 25 USDC + 0.5 XLM of treasury reserve. A Reserve-created account has no Cavos on-chain envelope, so it only unlocks on the browser that created it.

## Fee route (testnet)

Send USDC pays Reserve's fee by buying XLM with USDC. On testnet that book is thin, so the quote pins a hop that disappears before submit (`path moved`). The treasury posts one standing offer — sell XLM, buy Circle USDC — so the direct route wins and the quoted hop list stays empty.

```bash
npm run stellar:fee-path -- --price=9 --amount=4500
```

`STELLAR_TREASURY_SECRET` lives in `.env.local` (server only). Add `--topup` if the treasury is short of XLM, and `--check` to confirm Horizon and Reserve both return `path:[]`. Mainnet Circle USDC already has a deep direct book, so production does not need this seed.

## The kit dependency

This demo uses [`@cavos/kit@0.2.4`](https://www.npmjs.com/package/@cavos/kit): multi-chain session, Cavos vault, lazy deploy, and the modal's `inline` render mode plus `backgroundColor` / `radius` / `appLogo` theming.
