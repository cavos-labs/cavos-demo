'use client';

import { FcGoogle } from 'react-icons/fc';
import { FaApple, FaEnvelope } from 'react-icons/fa6';
import { CHAIN_LIST, type Chain } from '@/lib/chains';
import type { DeviceApproval } from '@/lib/deviceApproval';
import { ChainLogo } from './ChainLogo';

export type Background = 'white' | 'dark' | 'soft' | 'custom';
export type ProviderKey = 'email' | 'google' | 'apple';

const ACCENTS = ['#402AFF', '#7C3AED', '#12B3A6', '#17B85A', '#FA5D3C'];

const PROVIDERS: { key: ProviderKey; label: string; icon: React.ReactNode }[] = [
  { key: 'email', label: 'Email', icon: <FaEnvelope className="text-ink/70" /> },
  { key: 'google', label: 'Google', icon: <FcGoogle /> },
  { key: 'apple', label: 'Apple', icon: <FaApple className="text-ink" /> },
];

interface Props {
  chain: Chain;
  setChain: (c: Chain) => void;
  background: Background;
  setBackground: (b: Background) => void;
  customBg: string;
  setCustomBg: (c: string) => void;
  accent: string;
  setAccent: (c: string) => void;
  appName: string;
  setAppName: (s: string) => void;
  appLogo: string;
  setAppLogo: (s: string) => void;
  radius: number;
  setRadius: (n: number) => void;
  providers: ProviderKey[];
  setProviders: (p: ProviderKey[]) => void;
  deviceApproval: DeviceApproval;
  setDeviceApproval: (v: DeviceApproval) => void;
}

function Swatch({
  active,
  onClick,
  style,
  label,
}: {
  active: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      data-pressable
      className={`h-7 w-7 rounded-full transition-[box-shadow] duration-150 ${
        active ? 'ring-2 ring-ink ring-offset-2' : 'ring-1 ring-line-strong hover:ring-ink/40'
      }`}
      style={style}
    />
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] font-medium text-ink">
      {children}
    </label>
  );
}

export function CustomizePanel(p: Props) {
  const toggleProvider = (key: ProviderKey) => {
    p.setProviders(
      p.providers.includes(key) ? p.providers.filter((x) => x !== key) : [...p.providers, key],
    );
  };

  const isCustomAccent = !ACCENTS.some((c) => c.toLowerCase() === p.accent.toLowerCase());

  return (
    <aside className="bg-white">
      <div className="border-b border-line px-5 py-4">
        <h1 className="text-[1.1875rem] font-medium leading-[1.2] tracking-[-0.03em] text-ink">
          This is the wallet your users will see.
        </h1>
        <p className="mt-1 text-[12.5px] leading-snug text-muted">
          Changes land on the preview. Sign in when it looks like your product.
        </p>
      </div>

      <div className="divide-y divide-line">
        <div className="px-5 py-3">
          <FieldLabel>Chain</FieldLabel>
          <div
            role="radiogroup"
            aria-label="Chain"
            className="grid grid-cols-3 rounded-md bg-surface p-0.5 ring-1 ring-line-strong"
          >
            {CHAIN_LIST.map((c) => {
              const active = c.key === p.chain;
              return (
                <button
                  key={c.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => p.setChain(c.key)}
                  data-pressable
                  className={`flex items-center justify-center gap-1.5 rounded-[5px] px-2 py-2 text-[12.5px] font-medium transition-colors duration-150 ${
                    active
                      ? 'bg-white text-ink shadow-[0_1px_2px_rgba(10,10,15,0.08)]'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <ChainLogo chain={c.key} size={14} />
                  <span className="hidden sm:inline">{c.label}</span>
                  <span className="sm:hidden">{c.symbol}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[12px] leading-snug text-muted">
            {p.deviceApproval === 'passkey'
              ? 'Passkeys are per chain, so this pick is the whole session.'
              : 'One login, a wallet on every chain. Switch without signing out.'}
          </p>
        </div>

        <div className="px-5 py-3">
          <FieldLabel>Recovery</FieldLabel>
          <button
            type="button"
            role="switch"
            aria-checked={p.deviceApproval === 'enclave'}
            onClick={() => p.setDeviceApproval(p.deviceApproval === 'enclave' ? 'passkey' : 'enclave')}
            data-pressable
            className="flex w-full items-center justify-between rounded-md border border-line-strong bg-white px-3 py-2.5 text-left"
          >
            <span className="text-[13px] font-medium text-ink">Use the enclave</span>
            <span
              className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200 ${
                p.deviceApproval === 'enclave' ? 'bg-brand' : 'bg-line-strong'
              }`}
            >
              <span
                className={`absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  p.deviceApproval === 'enclave' ? 'translate-x-[18px]' : 'translate-x-[2px]'
                }`}
              />
            </span>
          </button>
          <p className="mt-2 text-[12px] leading-snug text-muted">
            {p.deviceApproval === 'enclave'
              ? 'Recovery enrolls at sign-in. A new device restores on first transaction.'
              : 'A synced passkey authorizes a new device. One chain per app.'}
          </p>
        </div>

        <div className="px-5 py-3">
          <p className="mb-2.5 text-[12.5px] font-medium text-ink">Appearance</p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <p className="mb-1.5 text-[12px] font-medium text-muted">Background</p>
              <div className="flex flex-wrap gap-2">
                <Swatch
                  label="White"
                  active={p.background === 'white'}
                  onClick={() => p.setBackground('white')}
                  style={{ background: '#ffffff', border: '1px solid #E0E0E6' }}
                />
                <Swatch
                  label="Dark"
                  active={p.background === 'dark'}
                  onClick={() => p.setBackground('dark')}
                  style={{ background: '#0A0A0F' }}
                />
                <Swatch
                  label="Soft"
                  active={p.background === 'soft'}
                  onClick={() => p.setBackground('soft')}
                  style={{ background: '#EEEDF2' }}
                />
                <label
                  aria-label="Custom background color"
                  className={`relative h-7 w-7 cursor-pointer overflow-hidden rounded-full transition-[box-shadow] duration-150 ${
                    p.background === 'custom'
                      ? 'ring-2 ring-ink ring-offset-2'
                      : 'ring-1 ring-line-strong hover:ring-ink/40'
                  }`}
                  style={{
                    background:
                      p.background === 'custom'
                        ? p.customBg
                        : 'conic-gradient(from 0deg, #ff4d4d, #ffd24d, #4dff88, #4dd2ff, #4d4dff, #d24dff, #ff4d4d)',
                  }}
                >
                  <input
                    type="color"
                    value={p.customBg}
                    onChange={(e) => {
                      p.setCustomBg(e.target.value);
                      p.setBackground('custom');
                    }}
                    className="absolute -inset-2 cursor-pointer opacity-0"
                  />
                </label>
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[12px] font-medium text-muted">Accent</p>
              <div className="flex flex-wrap items-center gap-2">
                {ACCENTS.map((c) => (
                  <Swatch
                    key={c}
                    label={`Accent ${c}`}
                    active={p.accent.toLowerCase() === c.toLowerCase()}
                    onClick={() => p.setAccent(c)}
                    style={{ background: c }}
                  />
                ))}
                <label
                  aria-label="Custom accent color"
                  className={`relative h-7 w-7 cursor-pointer overflow-hidden rounded-full transition-[box-shadow] duration-150 ${
                    isCustomAccent
                      ? 'ring-2 ring-ink ring-offset-2'
                      : 'ring-1 ring-line-strong hover:ring-ink/40'
                  }`}
                  style={{
                    background: isCustomAccent
                      ? p.accent
                      : 'conic-gradient(from 0deg, #ff4d4d, #ffd24d, #4dff88, #4dd2ff, #4d4dff, #d24dff, #ff4d4d)',
                  }}
                >
                  <input
                    type="color"
                    value={p.accent}
                    onChange={(e) => p.setAccent(e.target.value)}
                    className="absolute -inset-2 cursor-pointer opacity-0"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="corner-radius" className="text-[12px] font-medium text-muted">
                Corner radius
              </label>
              <span className="font-mono text-[12px] tabular-nums text-ink">{p.radius}px</span>
            </div>
            <input
              id="corner-radius"
              type="range"
              min={0}
              max={24}
              value={p.radius}
              onChange={(e) => p.setRadius(Number(e.target.value))}
              className="w-full accent-ink"
            />
          </div>
        </div>

        <div className="px-5 py-3">
          <p className="text-[12.5px] font-medium text-ink">Branding</p>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="app-name" className="mb-1 block text-[12px] font-medium text-muted">
                App name
              </label>
              <input
                id="app-name"
                value={p.appName}
                onChange={(e) => p.setAppName(e.target.value)}
                placeholder="Your app"
                className="w-full rounded-md border border-line-strong bg-white px-2.5 py-1.5 text-[13px] text-ink outline-none transition-colors duration-150 focus:border-ink"
              />
            </div>
            <div>
              <label htmlFor="app-logo" className="mb-1 block text-[12px] font-medium text-muted">
                Logo URL
              </label>
              <input
                id="app-logo"
                value={p.appLogo}
                onChange={(e) => p.setAppLogo(e.target.value)}
                placeholder="https://"
                className="w-full truncate rounded-md border border-line-strong bg-white px-2.5 py-1.5 font-mono text-[12px] text-ink outline-none transition-colors duration-150 focus:border-ink"
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-3">
          <p className="text-[12.5px] font-medium text-ink">Sign-in methods</p>
          <div className="mt-2 divide-y divide-line rounded-md border border-line">
            {PROVIDERS.map(({ key, label, icon }) => {
              const on = p.providers.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleProvider(key)}
                  data-pressable
                  className="flex w-full items-center gap-2.5 bg-white px-3 py-2 text-left text-[13px] font-medium text-ink first:rounded-t-md last:rounded-b-md hover:bg-surface"
                >
                  <span className="grid h-5 w-5 place-items-center text-[16px]">{icon}</span>
                  <span className="flex-1">{label}</span>
                  <span
                    className={`grid h-[18px] w-[18px] place-items-center rounded-[4px] border transition-colors duration-150 ${
                      on ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white'
                    }`}
                    aria-hidden
                  >
                    {on && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 12.5 9.5 18 20 6.5"
                          stroke="currentColor"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[12px] leading-snug text-muted">
            SMS, X, Discord, GitHub and wallets are next.
          </p>
        </div>
      </div>
    </aside>
  );
}
