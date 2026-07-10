'use client';

import { useMemo, useState } from 'react';
import { CavosAuthModal, useCavos } from '@cavos/kit/react';
import { ArrowRight, Copy, Check, Sparkles, Lock, Compass, Code2 } from 'lucide-react';
import { CavosMark } from './CavosMark';
import { CustomizePanel, type Background, type ProviderKey } from './CustomizePanel';
import { DevTools } from './DevTools';

const BG_MAP: Record<Background, { theme: 'light' | 'dark'; backgroundColor: string }> = {
  white: { theme: 'light', backgroundColor: '#ffffff' },
  dark: { theme: 'dark', backgroundColor: '#0A0A0F' },
  soft: { theme: 'light', backgroundColor: '#F5F4FF' },
};

export function Demo() {
  const { walletStatus } = useCavos();

  // ── Customize state ──
  const [background, setBackground] = useState<Background>('white');
  const [accent, setAccent] = useState('#402AFF');
  const [appName, setAppName] = useState('Acme');
  const [appLogo, setAppLogo] = useState('');
  const [radius, setRadius] = useState(16);
  const [providers, setProviders] = useState<ProviderKey[]>(['email', 'google', 'apple']);

  const { theme, backgroundColor } = BG_MAP[background];
  const isReady = walletStatus.isReady;

  const configCode = useMemo(
    () =>
      `import { CavosProvider } from '@cavos/kit/react';

<CavosProvider
  config={{
    appId: 'YOUR_APP_ID',
    chain: 'solana',
    network: 'testnet',
    appSalt: 'my-app',
  }}
  modal={{
    appName: '${appName}',
    theme: '${theme}',
    primaryColor: '${accent}',${
      background !== 'white' ? `\n    backgroundColor: '${backgroundColor}',` : ''
    }
    radius: ${radius},
    providers: [${providers.map((p) => `'${p}'`).join(', ')}],
    emailMode: 'otp',
  }}
>
  <App />
</CavosProvider>`,
    [appName, theme, accent, background, backgroundColor, radius, providers],
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-line bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-2.5">
            <span className="text-ink">
              <CavosMark size={22} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-ink">cavos</span>
            <span className="rounded-full border border-brand/25 bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">
              Demo
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[13px] text-muted sm:block">Cavos takes ~5 minutes to set up</span>
            <a
              href="https://cavos.xyz/register"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover active:scale-[0.98]"
            >
              Get started now
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-5 py-8 md:px-8 lg:grid-cols-[300px_1fr_320px]">
        {/* Left — Customize */}
        <CustomizePanel
          background={background}
          setBackground={setBackground}
          accent={accent}
          setAccent={setAccent}
          appName={appName}
          setAppName={setAppName}
          appLogo={appLogo}
          setAppLogo={setAppLogo}
          radius={radius}
          setRadius={setRadius}
          providers={providers}
          setProviders={setProviders}
        />

        {/* Center — live preview / dev tools */}
        <section className="flex min-h-[560px] items-center justify-center rounded-2xl border border-line bg-white p-6 dot-grid">
          <div className="w-full max-w-[400px]">
            {isReady ? (
              <DevTools configCode={configCode} />
            ) : (
              <CavosAuthModal
                inline
                open
                onClose={() => {}}
                appName={appName}
                appLogo={appLogo || undefined}
                providers={providers}
                emailMode="otp"
                primaryColor={accent}
                theme={theme}
                backgroundColor={backgroundColor}
                radius={radius}
                secureStep="off"
              />
            )}
          </div>
        </section>

        {/* Right — rail */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-brand/25 bg-white p-5 shadow-[0_1px_3px_rgba(10,10,15,0.04)]">
            <div className="flex items-center gap-2 text-brand">
              <Sparkles size={16} />
              <h3 className="text-[15px] font-semibold text-ink">Explore Cavos</h3>
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
              The verifiable, MPC-free way to give every user a self-custodial wallet. Sign in to
              spin up a real device-signer wallet on Solana.
            </p>
            <a
              href="https://docs.cavos.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-white px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-ink/40"
            >
              <Compass size={14} />
              Explore the docs
            </a>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_3px_rgba(10,10,15,0.04)]">
            <div className="flex items-center gap-2">
              <Code2 size={16} className="text-ink" />
              <h3 className="text-[15px] font-semibold text-ink">Export this configuration</h3>
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
              Cavos is fully client-configurable — reuse this exact theme in your app.
            </p>
            <CopyConfigButton code={configCode} />
          </div>

          <div className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-white px-5 py-3 text-[12px] text-muted">
            <Lock size={13} />
            Non-custodial · keys never leave the device
          </div>
        </aside>
      </main>
    </div>
  );
}

function CopyConfigButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-white px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-ink/40"
    >
      {copied ? <Check size={14} className="text-brand" /> : <Copy size={14} />}
      {copied ? 'Copied' : 'Copy to clipboard'}
    </button>
  );
}
