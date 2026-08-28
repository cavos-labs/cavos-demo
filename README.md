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

## The kit dependency

This demo uses [`@cavos/kit@0.1.10`](https://www.npmjs.com/package/@cavos/kit): a multi-chain session, lazy deploy, and the modal's `inline` render mode plus `backgroundColor` / `radius` / `appLogo` theming.
