'use client';

import { useState } from 'react';
import { useCavos } from '@cavos/kit/react';
import type { MessageSignature } from '@cavos/kit';
import { FileSignature, Copy, Check, AlertCircle } from 'lucide-react';
import { CHAINS, type Chain } from '@/lib/chains';

interface Props {
  chain: Chain;
}

/** Convert a Uint8Array to a 0x-prefixed hex string. */
function toHex(bytes: Uint8Array): string {
  return (
    '0x' +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Off-chain message signing demo. Lets the user sign an arbitrary message with
 * the wallet's key and inspect the resulting signature (curve / publicKey /
 * hex). Works on all three chains via `useCavos().signMessage`.
 */
export function SignPanel({ chain }: Props) {
  const { signMessage } = useCavos();
  const meta = CHAINS[chain];

  const [message, setMessage] = useState('Sign in to dapp.com at ' + new Date().toISOString().slice(0, 16));
  const [status, setStatus] = useState<'idle' | 'signing' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<MessageSignature | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setStatus('idle');
    setErrorMsg('');
    setResult(null);
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = message.trim();
    if (!msg) return;
    reset();
    setStatus('signing');
    try {
      const sig = await signMessage(msg);
      setResult(sig);
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Signing failed');
    }
  };

  const sigHex = result ? toHex(result.signature) : '';

  return (
    <Section title="Sign message">
      <form onSubmit={handleSign} className="space-y-2.5">
        <div>
          <label className="mb-1 block text-[11.5px] font-medium text-muted">Message</label>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (status !== 'idle') reset();
            }}
            rows={2}
            placeholder="Anything you want to prove you own this wallet for"
            className="w-full resize-none rounded-lg border border-line-strong bg-white px-3 py-2 text-base text-ink outline-none transition-colors focus:border-ink sm:text-[13px]"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'signing'}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-brand-hover active:scale-[0.99] disabled:opacity-60"
        >
          <FileSignature size={14} />
          {status === 'signing' ? 'Signing…' : 'Sign message'}
        </button>

        {status === 'error' && (
          <p className="flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">
            <AlertCircle size={13} className="mt-0.5 shrink-0" /> {errorMsg}
          </p>
        )}
      </form>

      {result && (
        <div className="mt-3 space-y-2 rounded-lg border border-line bg-surface p-3">
          {/* Signature */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted">Signature ({result.curve})</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sigHex);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand-hover"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <code className="block max-h-[80px] overflow-auto break-all rounded bg-white px-2 py-1.5 font-mono text-[11px] text-ink">
              {sigHex}
            </code>
          </div>

          {/* Public key / curve meta */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted">Curve</span>
              <p className="font-mono text-[11.5px] text-ink">{result.curve}</p>
            </div>
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted">Public key</span>
              <p className="truncate font-mono text-[11.5px] text-ink" title={result.publicKey}>
                {result.publicKey.slice(0, 18)}…
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        Off-chain — nothing is sent or broadcast. The signature proves the{' '}
        {meta.label} wallet owner endorsed the message. Verification format
        depends on the chain ({result?.curve ?? 'secp256r1 / ed25519'}).
      </p>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{title}</p>
      {children}
    </div>
  );
}
