// Chain metadata for the demo. `Chain` matches the kit's internal union
// ('starknet' | 'solana' | 'stellar') — it isn't re-exported from the React
// entry, so we redeclare it here as a stable literal union.
export type Chain = 'solana' | 'stellar' | 'starknet';
export type NetworkEnv = 'mainnet' | 'testnet';

export interface ChainMeta {
  key: Chain;
  label: string;
  /** Native fee/asset token symbol shown in the UI. */
  symbol: string;
  /** Decimals of the native token (lamports=9, stroops=7, wei=18). */
  decimals: number;
  /** Builds an explorer URL for either a tx hash or an address. */
  explorer: (value: string, kind: 'tx' | 'address') => string;
  /** Faucet strategy for testnet funding. */
  faucet: 'airdrop' | 'friendbot' | 'none';
  /** Whether native send is supported in the demo. */
  canSendNative: boolean;
  /**
   * Starknet has no native balance: the "native" token is an ERC-20 like any
   * other, so both reading a balance and sending are contract calls against
   * this address. Absent on chains with a true native asset.
   */
  feeToken?: string;
  /** Where to get testnet funds when there is no programmatic faucet. */
  faucetUrl?: string;
}

const solanaExplorer = (value: string, kind: 'tx' | 'address') =>
  kind === 'tx'
    ? `https://explorer.solana.com/tx/${value}?cluster=devnet`
    : `https://explorer.solana.com/address/${value}?cluster=devnet`;

const stellarExplorer = (value: string, kind: 'tx' | 'address') =>
  kind === 'tx'
    ? `https://stellar.expert/explorer/testnet/tx/${value}`
    : `https://stellar.expert/explorer/testnet/address/${value}`;

const starknetExplorer = (value: string, kind: 'tx' | 'address') =>
  kind === 'tx'
    ? `https://sepolia.voyager.online/tx/${value}`
    : `https://sepolia.voyager.online/contract/${value}`;

export const CHAINS: Record<Chain, ChainMeta> = {
  solana: {
    key: 'solana',
    label: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    explorer: solanaExplorer,
    faucet: 'airdrop',
    canSendNative: true,
  },
  stellar: {
    key: 'stellar',
    label: 'Stellar',
    symbol: 'XLM',
    decimals: 7,
    explorer: stellarExplorer,
    faucet: 'friendbot',
    canSendNative: true,
  },
  starknet: {
    key: 'starknet',
    label: 'Starknet',
    symbol: 'STRK',
    decimals: 18,
    explorer: starknetExplorer,
    faucet: 'none',
    canSendNative: true,
    // STRK on Sepolia. Chosen over ETH because it is what the public faucet
    // dispenses, so a tester can actually get some.
    feeToken: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    faucetUrl: 'https://starknet-faucet.vercel.app',
  },
};

export const CHAIN_LIST = [CHAINS.starknet, CHAINS.solana, CHAINS.stellar];

/** Format a base-unit bigint amount as a human-readable string. */
export function formatNative(amount: bigint, decimals: number, maxFraction = 4): string {
  const neg = amount < 0n;
  const abs = neg ? -amount : amount;
  const base = abs.toString().padStart(decimals + 1, '0');
  const whole = base.slice(0, base.length - decimals) || '0';
  const fraction = base.slice(base.length - decimals).slice(0, maxFraction).replace(/0+$/, '');
  const out = fraction ? `${whole}.${fraction}` : whole;
  return neg ? `-${out}` : out;
}

/** Parse a human amount (e.g. "1.5") into base-unit bigint. */
export function parseNative(input: string, decimals: number): bigint {
  const trimmed = input.trim();
  if (!trimmed) return 0n;
  const [whole, frac = ''] = trimmed.split('.');
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals);
  const cleaned = `${(whole || '0').replace(/^0+(?=\d)/, '')}${fracPadded}` || '0';
  try {
    return BigInt(cleaned);
  } catch {
    return 0n;
  }
}
