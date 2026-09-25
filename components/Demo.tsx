'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  viewChain,
  selectedChains,
  setSelectedChains,
}: {
  deviceApproval: DeviceApproval;
  setDeviceApproval: (v: DeviceApproval) => void;
  viewChain: Chain;
  selectedChains: Chain[];
  setSelectedChains: (c: Chain[]) => void;
}) {
  const { walletStatus, chain: sessionChain, isAuthenticated, address, logout, authError } =
    useCavos();

  const switchApproval = (next: DeviceApproval) => {
    if (next === deviceApproval) return;
    logout();
    setDeviceApproval(next);
  };
  const switchSelectedChains = (next: Chain[]) => {
    const same =
      next.length === selectedChains.length && next.every((c) => selectedChains.includes(c));
    if (same) return;
    logout();
    setSelectedChains(next);
  };
  const chain =
    isAuthenticated && selectedChains.includes(sessionChain)
      ? sessionChain
      : selectedChains.includes(viewChain)
        ? viewChain
        : selectedChains[0];
  const isMobile = useIsMobile();
  const [authOpen, setAuthOpen] = useState(false);
  // Kit's modal owns the post-OAuth screens ("Connecting…", "You're all set").
  // The demo used to swap it for DevTools the instant `address` landed, so the
  // return from Google/Apple looked like the modal had just closed.
  const [authDismissed, setAuthDismissed] = useState(false);
  // Latch auth failures: the kit clears authError after one render (copies it into
  // modal-local state), so !!authError alone would close the overlay again.
  const [authFailed, setAuthFailed] = useState(false);
  const authedRef = useRef(isAuthenticated);
  authedRef.current = isAuthenticated;
  useEffect(() => {
    if (!isAuthenticated) setAuthDismissed(false);
  }, [isAuthenticated]);
  useEffect(() => {
    if (authError) setAuthFailed(true);
  }, [authError]);
  const handleAuthClose = useCallback(() => {
    setAuthOpen(false);
    setAuthFailed(false);
    if (authedRef.current) setAuthDismissed(true);
  }, []);

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
  const showWorkspace = isReady && authDismissed;
  // Keep the connecting / success / error sheet as a full-screen overlay for the
  // whole post-OAuth stretch. On the first client paint `useIsMobile()` is still
  // false, so the old branch rendered the modal `inline` under the customize
  // panel — the loader looked "hidden" behind Launch login until isMobile flipped.
  const authInProgress =
    walletStatus.isDeploying ||
    authFailed ||
    walletStatus.needsDeviceApproval ||
    (isAuthenticated && !authDismissed);
  const showAuthOverlay = isMobile || authInProgress;
  const mobileAuthOpen = authOpen || authInProgress;

  const configCode = useMemo(() => {
    const extras = [
      selectedChains.includes('starknet') ? `\n    paymasterApiKey: 'YOUR_PAYMASTER_KEY',` : '',
      selectedChains.includes('solana') ? `\n    rpcUrls: { solana: 'YOUR_SOLANA_RPC' },` : '',
    ].join('');
    const listed = selectedChains.map((c) => `'${c}'`).join(', ');
    return `import { CavosProvider } from '@cavos/kit/react';

<CavosProvider
  config={{
    appId: 'YOUR_APP_ID',
    chains: [${listed}],
    network: 'testnet',
    appSalt: 'my-app',
    socialRecovery: ${deviceApproval === 'enclave'},
    deviceApproval: '${deviceApproval}',${extras}
  }}
  modal={{
    appName: '${appName}',
    theme: '${theme}',
    primaryColor: '${accent}',${
      background !== 'white' ? `\n    backgroundColor: '${backgroundColor}',` : ''
    }
    radius: ${radius},
    providers: [${providers.map((p) => `'${p}'`).join(', ')}],
  }}
>
  <App />
</CavosProvider>`;
  }, [selectedChains, appName, theme, accent, background, backgroundColor, radius, providers, deviceApproval]);

  const modalProps = {
    appName: appName || undefined,
    appLogo: appLogo || undefined,
    appLogoSize: 56,
    providers,
    primaryColor: accent,
    theme,
    backgroundColor,
    radius,
    secureStep: 'off' as const,
  };

  return (
    <div className="page-brand min-h-[100dvh]">
      <a
        href="#workspace"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand"
      >
        Skip to demo
      </a>

      <div
        className={`relative mx-auto max-w-[1280px] border-x border-white/15 ${
          isMobile && !showWorkspace ? 'pb-24' : ''
        }`}
      >
        <header className="flex h-14 items-center justify-between gap-6 border-b border-white/15 px-4 md:px-5">
          <a href="https://cavos.xyz" className="flex items-center gap-2.5 text-white hover:opacity-80">
            <CavosMark size={20} />
            <span className="text-[15px] font-semibold tracking-tight">Cavos</span>
          </a>
          <div className="flex items-center gap-2.5">
            <a
              href="https://docs.cavos.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden px-3 py-2 text-sm font-medium text-white/65 transition-colors duration-150 hover:text-white sm:inline"
            >
              Docs
            </a>
            <a
              href="https://cavos.xyz/register"
              target="_blank"
              rel="noopener noreferrer"
              data-pressable
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-sm font-semibold text-brand transition-colors duration-150 hover:bg-white/90"
            >
              Get started
              <Arrow className="hidden sm:block" />
            </a>
          </div>
        </header>

        <div
          id="workspace"
          className="grid lg:h-[calc(100dvh-3.5rem)] lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:divide-x lg:divide-white/15"
        >
          <div className="flex min-h-0 flex-col border-b border-white/15 lg:border-b-0">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <CustomizePanel
                selectedChains={selectedChains}
                setSelectedChains={switchSelectedChains}
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
            <div className="shrink-0 border-t border-white/15 px-5 py-2.5">
              <CopyConfigButton code={configCode} variant="panel" />
            </div>
          </div>

          {showWorkspace ? (
            <section className="relative min-h-0 lg:h-full">
              <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
              <div className="relative z-10 h-full min-h-[520px] p-4 lg:min-h-0 lg:p-5">
                <div className="sheet-light h-full overflow-hidden rounded-lg bg-white text-ink shadow-[0_24px_60px_rgba(16,8,64,0.28)]">
                  <div className="h-full overflow-y-auto">
                    <DevTools chain={chain} deviceApproval={deviceApproval} />
                  </div>
                </div>
              </div>
            </section>
          ) : !showAuthOverlay ? (
            <section className="relative flex min-h-[480px] lg:h-full lg:min-h-0">
              <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
              <div className="relative z-10 flex w-full flex-1 items-center justify-center p-5">
                <div className="w-full max-w-[380px] animate-fadeIn">
                  <CavosAuthModal inline open onClose={handleAuthClose} {...modalProps} />
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <section className="border-t border-white/15 px-6 py-8 md:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[42ch]">
              <h2 className="text-[1.25rem] font-medium leading-[1.2] tracking-[-0.03em] text-white">
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

      {isMobile && !showWorkspace && !mobileAuthOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/15 bg-brand/90 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:hidden">
          <button
            type="button"
            onClick={() => {
              setAuthFailed(false);
              setAuthOpen(true);
            }}
            data-pressable
            className="inline-flex w-full items-center justify-center rounded-md bg-white px-5 py-3.5 text-[15px] font-semibold text-brand transition-colors duration-150 hover:bg-white/90"
          >
            Launch login
          </button>
        </div>
      )}

      {/* Overlay sits last so the connecting loader always stacks above the
          customize panel and the Launch login bar until the kit dismisses it. */}
      {!showWorkspace && showAuthOverlay && (
        <CavosAuthModal open={mobileAuthOpen} onClose={handleAuthClose} {...modalProps} />
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
          ? 'inline-flex w-full items-center justify-center rounded-md border border-white/25 bg-white/10 px-4 py-2 text-[13px] font-semibold text-white transition-colors duration-150 hover:bg-white/15'
          : 'inline-flex shrink-0 items-center justify-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-brand transition-colors duration-150 hover:bg-white/90'
      }
    >
      {copied ? 'Copied' : 'Copy config'}
    </button>
  );
}
