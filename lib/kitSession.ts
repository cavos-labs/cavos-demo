/**
 * Kit persists identity in localStorage and the login token in sessionStorage.
 * The wallet registry requires that token, so a reconnect that still has the
 * identity but not a live token 401s — and on an OAuth return the kit will try
 * that reconnect in the same tick as it consumes the callback (it strips the
 * code from the URL first, so the restore effect no longer sees it).
 *
 * Drop the stale identity before CavosProvider mounts so only the callback
 * connect runs, and so a tab without a usable token does not fire an
 * unauthenticated registry lookup.
 */
const TOKEN_PREFIX = 'cavos-kit:token:';
const IDENTITY_PREFIX = 'cavos-kit:identity:';

export function prepareKitSession(appId: string): void {
  if (typeof window === 'undefined') return;

  const keyId = appId || 'default';
  const identityKey = `${IDENTITY_PREFIX}${keyId}`;
  const tokenKey = `${TOKEN_PREFIX}${keyId}`;

  try {
    if (isOAuthReturn()) {
      window.localStorage.removeItem(identityKey);
      return;
    }

    const token = window.sessionStorage.getItem(tokenKey);
    if (!token || jwtIsExpired(token)) {
      if (token) window.sessionStorage.removeItem(tokenKey);
      window.localStorage.removeItem(identityKey);
    }
  } catch {
    /* storage blocked: the kit already falls back to a fresh login */
  }
}

function isOAuthReturn(): boolean {
  const params = new URLSearchParams(window.location.search);
  return Boolean(
    params.get('cavos_auth_code') || params.get('auth_data') || params.get('zk_auth_data'),
  );
}

/** True when the JWT is missing `exp` we can read, or `exp` is within 30s. */
function jwtIsExpired(token: string): boolean {
  const exp = jwtExpSeconds(token);
  if (exp === null) return false;
  return exp * 1000 < Date.now() + 30_000;
}

function jwtExpSeconds(token: string): number | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}
