/** How a new device gets authorized. The app picks one; it is not discovered. */
export type DeviceApproval = 'enclave' | 'passkey';

const KEY = 'cavos-demo:device-approval';

/**
 * Kept across reloads so the choice survives the OAuth round trip — otherwise
 * picking passkey and signing in lands back on the enclave, and the path the
 * tester meant to exercise is the one that never runs.
 */
export function loadDeviceApproval(): DeviceApproval {
  if (typeof window === 'undefined') return 'passkey';
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored === 'enclave') return 'enclave';
    return 'passkey';
  } catch {
    return 'passkey';
  }
}

export function storeDeviceApproval(value: DeviceApproval): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    /* a demo setting is not worth failing over */
  }
}

const CHAIN_KEY = 'cavos-demo:passkey-chain';
const CHAINS = ['starknet', 'solana', 'stellar'] as const;
export type PasskeyChain = (typeof CHAINS)[number];

/**
 * The chain a passkey session runs on, kept for the same reason as the method
 * above: it has to survive the OAuth round trip. On passkeys the chain IS the
 * session, so losing it does not reset a view — it signs the user into a
 * different wallet than the one they chose.
 */
export function loadPasskeyChain(): PasskeyChain {
  if (typeof window === 'undefined') return 'solana';
  try {
    const stored = window.localStorage.getItem(CHAIN_KEY);
    return CHAINS.includes(stored as PasskeyChain) ? (stored as PasskeyChain) : 'solana';
  } catch {
    return 'solana';
  }
}

export function storePasskeyChain(value: PasskeyChain): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHAIN_KEY, value);
  } catch {
    /* a demo setting is not worth failing over */
  }
}

const SELECTED_KEY = 'cavos-demo:selected-chains';

/**
 * Which chains the demo session configures. Native Stellar unwraps the same
 * MasterDEK as Solana, so it can sit next to the others under the enclave.
 * A passkey is still one chain: the kit refuses that mix, and the toggle
 * forces enclave as soon as a second chain is checked.
 */
export function loadSelectedChains(): PasskeyChain[] {
  if (typeof window === 'undefined') return ['solana'];
  try {
    const raw = window.localStorage.getItem(SELECTED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((c): c is PasskeyChain => CHAINS.includes(c as PasskeyChain));
        if (valid.length > 0) return valid;
      }
    }
  } catch {
    /* fall through to the previous single-chain keys */
  }
  return [loadViewChain()];
}

export function storeSelectedChains(value: PasskeyChain[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SELECTED_KEY, JSON.stringify(value));
  } catch {
    /* a demo setting is not worth failing over */
  }
}

/** Checking a chain adds it; unchecking drops it. The last one cannot be cleared. */
export function toggleSelectedChain(current: PasskeyChain[], key: PasskeyChain): PasskeyChain[] {
  const on = current.includes(key);
  if (on) {
    const next = current.filter((c) => c !== key);
    return next.length > 0 ? next : current;
  }
  return [...current, key];
}

const VIEW_CHAIN_KEY = 'cavos-demo:view-chain';

/**
 * The chain in view for a multichain (enclave) session. Same persistence as
 * the passkey chain: Google's redirect reloads the page, and without this the
 * return always lands on Starknet even if the tester picked Stellar.
 */
export function loadViewChain(): PasskeyChain {
  if (typeof window === 'undefined') return 'solana';
  try {
    const stored = window.localStorage.getItem(VIEW_CHAIN_KEY);
    return CHAINS.includes(stored as PasskeyChain) ? (stored as PasskeyChain) : 'solana';
  } catch {
    return 'solana';
  }
}

export function storeViewChain(value: PasskeyChain): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(VIEW_CHAIN_KEY, value);
  } catch {
    /* a demo setting is not worth failing over */
  }
}
