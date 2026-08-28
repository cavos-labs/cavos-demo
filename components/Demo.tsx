'use client';

import { useEffect, useMemo, useState } from 'react';
import { CavosAuthModal, useCavos } from '@cavos/kit/react';
import { ArrowRight, Copy, Check, Compass, Wallet } from 'lucide-react';
import { CavosMark } from './CavosMark';
import { CvSpark, CvCode, CvShield } from './CavosIcons';
import { CustomizePanel, type Background, type ProviderKey } from './CustomizePanel';
import { DevTools } from './DevTools';
import type { Chain } from '@/lib/chains';
import type { DeviceApproval } from '@/lib/deviceApproval';

// Mirrors the kit's internal mobile breakpoint (max-width: 640px) so the
// launch-button UX switches at exactly the same width the modal becomes a
// bottom sheet.
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

// Relative luminance of a hex color → 'light' or 'dark' theme, so the modal
// picks readable text/surfaces for any custom background the user picks.
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
  // Chain comes from the session, not from a remount: one login holds a wallet
  // on every configured chain and `setChain` just picks the active one. On
  // passkeys the session holds a single chain, so there the choice is the
  // session itself and the provider is keyed on it.
  //
  // Before there is a session it is still a live setting — it drives the config
  // snippet and the modal preview — so it is held here and handed to the session
  // only once one exists. `setChain` rightly refuses to switch a session that
  // has not connected yet.
  const { walletStatus, chain: sessionChain, setChain: setSessionChain, isAuthenticated, address, authError } =
    useCavos();
  const [previewChain, setPreviewChain] = useState<Chain>('starknet');
  // On passkeys the session holds exactly one chain, so picking a chain picks
  // the session -- there is no switching within it.
  const chain = deviceApproval === 'passkey' ? passkeyChain : isAuthenticated ? sessionChain : previewChain;
  const setChain = (next: Chain) => {
    if (deviceApproval === 'passkey') {
      setPasskeyChain(next);
      return;
    }
    setPreviewChain(next);
    if (isAuthenticated) setSessionChain(next);
  };
  const isMobile = useIsMobile();
  const [authOpen, setAuthOpen] = useState(false);

  // ── Customize state ──
  // appName / appLogo start empty: the kit falls back to the Cavos star + a
  // "Sign in or sign up" heading, so the default state is Cavos-branded.
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
  // A lazily-deployed wallet is usable before it exists on-chain: it has an
  // address, this device owns it, and it can sign. Gating the panel on
  // `isReady` alone left the demo on the sign-in preview after a successful
  // sign-up, because the account only turns ready on its first execute.
  // Being signed in is enough to show the wallet. Reads — address, balance,
  // history — never need this device to be a signer, and authorization is
  // resolved when an action actually needs it rather than at the door.
  const isReady = isAuthenticated && !!address;

  const configCode = useMemo(() => {
    // Configuring every chain means every chain's requirement applies: Starknet
    // needs the paymaster key, Solana a real RPC (the public devnet endpoint
    // rejects browser traffic). Stellar needs neither.
    const chainExtras =
      `\n    paymasterApiKey: 'YOUR_PAYMASTER_KEY',` +
      `\n    rpcUrl: 'YOUR_SOLANA_RPC',`;
    return `import { CavosProvider } from '@cavos/kit/react';

<CavosProvider
  config={{
    appId: 'YOUR_APP_ID',
    chains: ${deviceApproval === 'passkey' ? `['${chain}']` : "['starknet', 'solana', 'stellar']"},
    network: 'testnet',
    appSalt: 'my-app',
    socialRecovery: true,
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
  }, [
    chain,
    appName,
    theme,
    accent,
    background,
    backgroundColor,
    customBg,
    radius,
    providers,
    deviceApproval,
  ]);

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-2.5">
            <span className="text-ink">
              <CavosMark size={22} />
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[13px] text-muted sm:block">Cavos takes ~5 minutes to set up</span>
            <a
              href="https://cavos.xyz/login"
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
      <main className="mx-auto grid max-w-[1180px] grid-cols-1 gap-6 px-5 py-10 pb-32 md:px-8 md:pb-10 lg:grid-cols-[340px_1fr_284px]">
        {/* Left — Customize */}
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
          setDeviceApproval={setDeviceApproval}
        />

        {/* A stuck spinner tells nobody anything, least of all on a phone with
            no devtools. This says which state the session is actually in, so a
            failure can be read off the screen and reported. */}
        {isAuthenticated && (
          <div className="col-span-full -mt-2 rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[11px] leading-relaxed text-muted">
            <span className="text-ink">{chain}</span>
            {' · '}
            {walletStatus.isReady
              ? 'ready'
              : walletStatus.isUndeployed
                ? 'undeployed'
                : walletStatus.needsDeviceApproval
                  ? 'needs-device-approval'
                  : walletStatus.isDeploying
                    ? 'deploying'
                    : 'connecting'}
            {walletStatus.isSocialRecovering && ' · recovering'}
            {address && ` · ${address.slice(0, 6)}…${address.slice(-4)}`}
            {authError && <span className="text-red-600"> · {authError}</span>}
          </div>
        )}

        {/* Center — live preview / dev tools */}
        <section className="flex items-start justify-center">
          <div className="w-full max-w-[400px]">
            {isReady ? (
              <DevTools configCode={configCode} chain={chain} />
            ) : isMobile ? (
              // A device that needs approving is not a signed-out device: the
              // session is intact, this browser just is not a signer yet. Left
              // behind the launch button it reads as being logged out, so the
              // modal — which has the approval flow — opens on its own.
              <CavosAuthModal
                open={authOpen || walletStatus.needsDeviceApproval}
                onClose={() => setAuthOpen(false)}
                appName={appName || undefined}
                appLogo={appLogo || undefined}
                appLogoSize={56}
                providers={providers}
                emailMode="otp"
                primaryColor={accent}
                theme={theme}
                backgroundColor={backgroundColor}
                radius={radius}
                secureStep="off"
              />
            ) : (
              <CavosAuthModal
                inline
                open
                onClose={() => {}}
                appName={appName || undefined}
                appLogo={appLogo || undefined}
                appLogoSize={56}
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
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_3px_rgba(10,10,15,0.04)]">
            <div className="flex items-center gap-2.5">
              <CvSpark size={30} />
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
            <div className="flex items-center gap-2.5">
              <CvCode size={30} />
              <h3 className="text-[15px] font-semibold text-ink">Export this configuration</h3>
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
              Cavos is fully client-configurable — reuse this exact theme in your app.
            </p>
            <CopyConfigButton code={configCode} />
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-white px-5 py-3.5 text-[12.5px] text-muted">
            <CvShield size={26} />
            Non-custodial · keys never leave the device
          </div>
        </aside>
      </main>

      {/* ── Mobile sticky launch CTA (hidden once authenticated / on desktop) ── */}
      {isMobile && !isReady && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/90 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:hidden">
          <button
            onClick={() => setAuthOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(64,42,255,0.28)] transition-all hover:bg-brand-hover active:scale-[0.99]"
          >
            <Wallet size={17} />
            Launch Cavos
          </button>
        </div>
      )}
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
