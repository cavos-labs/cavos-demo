/** How a new device gets authorized. The app picks one; it is not discovered. */
export type DeviceApproval = 'enclave' | 'passkey';

const KEY = 'cavos-demo:device-approval';

/**
 * Kept across reloads so the choice survives the OAuth round trip — otherwise
 * picking passkey and signing in lands back on the enclave, and the path the
 * tester meant to exercise is the one that never runs.
 */
export function loadDeviceApproval(): DeviceApproval {
  if (typeof window === 'undefined') return 'enclave';
  try {
    return window.localStorage.getItem(KEY) === 'passkey' ? 'passkey' : 'enclave';
  } catch {
    return 'enclave';
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
  if (typeof window === 'undefined') return 'starknet';
  try {
    const stored = window.localStorage.getItem(CHAIN_KEY);
    return CHAINS.includes(stored as PasskeyChain) ? (stored as PasskeyChain) : 'starknet';
  } catch {
    return 'starknet';
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
