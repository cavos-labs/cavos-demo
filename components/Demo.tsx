'use client';

import { useEffect, useMemo, useState } from 'react';
import { CavosAuthModal, useCavos } from '@cavos/kit/react';
import { CavosMark } from './CavosMark';
import { CustomizePanel, type Background, type ProviderKey } from './CustomizePanel';
import { DevTools } from './DevTools';
import type { Chain } from '@/lib/chains';
import type { DeviceApproval } from '@/lib/deviceApproval';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

const BG_MAP: Record<Exclude<Background, 'custom'>, { theme: 'light' | 'dark'; backgroundColor: string }> = {
  white: { theme: 'light', backgroundColor: '#ffffff' },
  dark: { theme: 'dark', backgroundColor: '#0A0A0F' },
  soft: { theme: 'light', backgroundColor: '#F4F4F7' },
};

function themeForHex(hex: string): 'light' | 'dark' {
  const m = hex.replace('#', '');
  if (m.length !== 6) return 'light';
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.45 ? 'light' : 'dark';
}

function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function Demo({
  deviceApproval,
  setDeviceApproval,
  passkeyChain,
  setPasskeyChain,
}: {
  deviceApproval: DeviceApproval;
  setDeviceApproval: (v: DeviceApproval) => void;
  passkeyChain: Chain;
  setPasskeyChain: (c: Chain) => void;
}) {
  const { walletStatus, chain: sessionChain, setChain: setSessionChain, isAuthenticated, address, logout } =
    useCavos();

  const switchApproval = (next: DeviceApproval) => {
    if (next === deviceApproval) return;
    logout();
    setDeviceApproval(next);
  };
  const switchPasskeyChain = (next: Chain) => {
    if (next === passkeyChain) return;
    logout();
    setPasskeyChain(next);
  };
  const [previewChain, setPreviewChain] = useState<Chain>('starknet');
  const chain = deviceApproval === 'passkey' ? passkeyChain : isAuthenticated ? sessionChain : previewChain;
  const setChain = (next: Chain) => {
    if (deviceApproval === 'passkey') {
      switchPasskeyChain(next);
      return;
    }
    setPreviewChain(next);
    if (isAuthenticated) setSessionChain(next);
  };
  const isMobile = useIsMobile();
  const [authOpen, setAuthOpen] = useState(false);

  const [background, setBackground] = useState<Background>('white');
  const [customBg, setCustomBg] = useState('#ffffff');
  const [accent, setAccent] = useState('#402AFF');
  const [appName, setAppName] = useState('');
  const [appLogo, setAppLogo] = useState('');
  const [radius, setRadius] = useState(16);
  const [providers, setProviders] = useState<ProviderKey[]>(['email', 'google', 'apple']);

  const { theme, backgroundColor } =
    background === 'custom'
      ? { theme: themeForHex(customBg), backgroundColor: customBg }
      : BG_MAP[background];
  const isReady = isAuthenticated && !!address;

  const configCode = useMemo(() => {
    const chainExtras =
      `\n    paymasterApiKey: 'YOUR_PAYMASTER_KEY',` + `\n    rpcUrl: 'YOUR_SOLANA_RPC',`;
    return `import { CavosProvider } from '@cavos/kit/react';

<CavosProvider
  config={{
    appId: 'YOUR_APP_ID',
    environment: 'production',
    chains: ${deviceApproval === 'passkey' ? `['${chain}']` : "['starknet', 'solana', 'stellar']"},
    network: 'testnet',
    appSalt: 'my-app',
    socialRecovery: ${deviceApproval === 'enclave'},
    deviceApproval: '${deviceApproval}',${chainExtras}
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
</CavosProvider>`;
  }, [chain, appName, theme, accent, background, backgroundColor, radius, providers, deviceApproval]);

  const modalProps = {
    appName: appName || undefined,
    appLogo: appLogo || undefined,
    appLogoSize: 56,
    providers,
    emailMode: 'otp' as const,
    primaryColor: accent,
    theme,
    backgroundColor,
    radius,
    secureStep: 'off' as const,
  };

  return (
    <div className="min-h-[100dvh] bg-white">
      <a
        href="#workspace"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to demo
      </a>

      <div
        className={`relative mx-auto max-w-[1280px] border-x border-line ${
          isMobile && !isReady ? 'pb-24' : ''
        }`}
      >
        <header className="flex h-14 items-center justify-between gap-6 border-b border-line px-4 md:px-5">
          <a href="https://cavos.xyz" className="flex items-center gap-2.5 text-ink hover:opacity-70">
            <CavosMark size={20} />
            <span className="text-[15px] font-semibold tracking-tight">Cavos</span>
          </a>
          <div className="flex items-center gap-2.5">
            <a
              href="https://docs.cavos.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden px-3 py-2 text-sm font-medium text-ink/60 transition-colors duration-150 hover:text-ink sm:inline"
            >
              Docs
            </a>
            <a
              href="https://cavos.xyz/register"
              target="_blank"
              rel="noopener noreferrer"
              data-pressable
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-hover"
            >
              Get started
              <Arrow className="hidden sm:block" />
            </a>
          </div>
        </header>

        <div
          id="workspace"
          className="grid lg:h-[calc(100dvh-3.5rem)] lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:divide-x lg:divide-line"
        >
          <div className="flex min-h-0 flex-col border-b border-line lg:border-b-0">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <CustomizePanel
                chain={chain}
                setChain={setChain}
                background={background}
                setBackground={setBackground}
                customBg={customBg}
                setCustomBg={setCustomBg}
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
                deviceApproval={deviceApproval}
                setDeviceApproval={switchApproval}
              />
            </div>
            <div className="shrink-0 border-t border-line bg-white px-5 py-2.5">
              <CopyConfigButton code={configCode} variant="panel" />
            </div>
          </div>

          {isReady ? (
            <section className="relative min-h-0 bg-surface lg:h-full">
              <div className="dot-grid pointer-events-none absolute inset-0 opacity-[0.35]" />
              <div className="relative z-10 h-full min-h-[520px] overflow-y-auto lg:min-h-0">
                <DevTools chain={chain} />
              </div>
            </section>
          ) : isMobile ? (
            <CavosAuthModal
              open={authOpen || walletStatus.needsDeviceApproval}
              onClose={() => setAuthOpen(false)}
              {...modalProps}
            />
          ) : (
            <section className="relative flex min-h-[480px] bg-surface lg:h-full lg:min-h-0">
              <div className="dot-grid pointer-events-none absolute inset-0 opacity-[0.35]" />
              <div className="relative z-10 flex w-full flex-1 items-center justify-center p-5">
                <div className="w-full max-w-[380px] animate-fadeIn">
                  <CavosAuthModal inline open onClose={() => {}} {...modalProps} />
                </div>
              </div>
            </section>
          )}
        </div>

        <section className="border-t border-line bg-brand px-6 py-8 text-white md:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[42ch]">
              <h2 className="text-[1.25rem] font-medium leading-[1.2] tracking-[-0.03em]">
                Take this config with you.
              </h2>
              <p className="mt-1.5 text-[13px] leading-snug text-white/70">
                Drop it into CavosProvider and the modal will match what you just customized.
              </p>
            </div>
            <CopyConfigButton code={configCode} variant="onBrand" />
          </div>
          <pre className="mt-5 max-h-[160px] overflow-auto rounded-md bg-black/20 p-3.5 font-mono text-[11.5px] leading-relaxed text-white/80">
            {configCode}
          </pre>
          <p className="mt-3 text-[12px] text-white/50">Non-custodial. Keys never leave the device.</p>
        </section>
      </div>

      {isMobile && !isReady && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/90 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:hidden">
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            data-pressable
            className="inline-flex w-full items-center justify-center rounded-md bg-brand px-5 py-3.5 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-brand-hover"
          >
            Launch login
          </button>
        </div>
      )}
    </div>
  );
}

function CopyConfigButton({
  code,
  variant = 'onBrand',
}: {
  code: string;
  variant?: 'onBrand' | 'panel';
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      data-pressable
      className={
        variant === 'panel'
          ? 'inline-flex w-full items-center justify-center rounded-md border border-line-strong bg-white px-4 py-2 text-[13px] font-semibold text-ink transition-colors duration-150 hover:border-ink/40'
          : 'inline-flex shrink-0 items-center justify-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-brand transition-colors duration-150 hover:bg-white/90'
      }
    >
      {copied ? 'Copied' : 'Copy config'}
    </button>
  );
}
