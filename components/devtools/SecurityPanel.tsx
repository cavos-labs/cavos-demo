'use client';

import { useState } from 'react';
import { useCavos } from '@cavos/kit/react';
import { Shield, Fingerprint, KeyRound, Copy, Check, AlertCircle } from 'lucide-react';

/**
 * Security: passkey enrollment + recovery code setup. Both wrappers come from
 * `useCavos()` and work across all three chains.
 */
export function SecurityPanel() {
  const { walletStatus, enrollPasskeyDefault, setupRecovery, passkeySupported } = useCavos();

  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyError, setPasskeyError] = useState('');

  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryCopied, setRecoveryCopied] = useState(false);

  const hasPasskey = walletStatus.hasPasskey;
  // The kit doesn't expose a "recovery configured" flag, so we infer it from
  // a successful setup stored locally for this address.
  const [recoveryDone, setRecoveryDone] = useState(false);

  const handlePasskey = async () => {
    setPasskeyBusy(true);
    setPasskeyError('');
    try {
      await enrollPasskeyDefault();
    } catch (e) {
      setPasskeyError(e instanceof Error ? e.message : 'Could not enable passkey');
    } finally {
      setPasskeyBusy(false);
    }
  };

  const handleRecovery = async () => {
    setRecoveryBusy(true);
    setRecoveryError('');
    setRecoveryCode('');
    try {
      const code = await setupRecovery();
      setRecoveryCode(code);
      setRecoveryDone(true);
    } catch (e) {
      setRecoveryError(e instanceof Error ? e.message : 'Could not set up recovery');
    } finally {
      setRecoveryBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Shield size={14} className="text-ink" />
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Security</p>
      </div>

      <div className="space-y-2.5">
        {/* Passkey */}
        <div className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <Fingerprint size={16} className="text-ink" />
            <div className="leading-tight">
              <p className="text-[13px] font-medium text-ink">Passkey signer</p>
              <p className="text-[11px] text-muted">
                {hasPasskey ? 'Enabled' : 'Biometric / secure enclave'}
              </p>
            </div>
          </div>
          {hasPasskey ? (
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600">
              <Check size={13} /> On
            </span>
          ) : (
            <button
              onClick={handlePasskey}
              disabled={passkeyBusy || !passkeySupported}
              title={!passkeySupported ? 'Passkeys not supported in this browser' : undefined}
              className="rounded-md border border-line-strong bg-white px-2.5 py-1 text-[12px] font-semibold text-ink transition-colors hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {passkeyBusy ? 'Enrolling…' : 'Enable'}
            </button>
          )}
        </div>
        {passkeyError && (
          <p className="flex items-start gap-1.5 px-1 text-[11.5px] text-red-600">
            <AlertCircle size={12} className="mt-0.5 shrink-0" /> {passkeyError}
          </p>
        )}

        {/* Recovery */}
        <div className="rounded-lg border border-line bg-white px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <KeyRound size={16} className="text-ink" />
              <div className="leading-tight">
                <p className="text-[13px] font-medium text-ink">Recovery code</p>
                <p className="text-[11px] text-muted">
                  {recoveryDone ? 'Configured' : 'Restore access if you lose your device'}
                </p>
              </div>
            </div>
            {recoveryDone ? (
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600">
                <Check size={13} /> Set
              </span>
            ) : (
              <button
                onClick={handleRecovery}
                disabled={recoveryBusy}
                className="rounded-md border border-line-strong bg-white px-2.5 py-1 text-[12px] font-semibold text-ink transition-colors hover:border-ink/40 disabled:opacity-50"
              >
                {recoveryBusy ? 'Generating…' : 'Set up'}
              </button>
            )}
          </div>

          {recoveryCode && (
            <div className="mt-3 rounded-md bg-brand-soft px-3 py-2.5">
              <p className="mb-1.5 text-[11px] font-medium text-ink">
                Save this code — it won&apos;t be shown again
              </p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate font-mono text-[12px] font-semibold text-brand">
                  {recoveryCode}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(recoveryCode);
                    setRecoveryCopied(true);
                    setTimeout(() => setRecoveryCopied(false), 1800);
                  }}
                  aria-label="Copy recovery code"
                  className="shrink-0 rounded p-1 text-brand transition-colors hover:bg-white"
                >
                  {recoveryCopied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}
        </div>
        {recoveryError && (
          <p className="flex items-start gap-1.5 px-1 text-[11.5px] text-red-600">
            <AlertCircle size={12} className="mt-0.5 shrink-0" /> {recoveryError}
          </p>
        )}
      </div>
    </div>
  );
}
