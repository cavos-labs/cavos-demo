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
