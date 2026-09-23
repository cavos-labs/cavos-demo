'use client';

import { FcGoogle } from 'react-icons/fc';
import { FaApple, FaEnvelope } from 'react-icons/fa6';
import { CHAIN_LIST, type Chain } from '@/lib/chains';
import type { DeviceApproval } from '@/lib/deviceApproval';
import { toggleSelectedChain } from '@/lib/deviceApproval';
import { ChainLogo } from './ChainLogo';

export type Background = 'white' | 'dark' | 'soft' | 'custom';
export type ProviderKey = 'email' | 'google' | 'apple';

const ACCENTS = ['#402AFF', '#7C3AED', '#12B3A6', '#17B85A', '#FA5D3C'];

const PROVIDERS: { key: ProviderKey; label: string; icon: React.ReactNode }[] = [
  { key: 'email', label: 'Email', icon: <FaEnvelope className="text-white/70" /> },
  { key: 'google', label: 'Google', icon: <FcGoogle /> },
  { key: 'apple', label: 'Apple', icon: <FaApple className="text-white" /> },
];

interface Props {
  selectedChains: Chain[];
  setSelectedChains: (c: Chain[]) => void;
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
        active
          ? 'ring-2 ring-white ring-offset-2 ring-offset-brand'
          : 'ring-1 ring-white/30 hover:ring-white/60'
      }`}
      style={style}
    />
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] font-medium text-white">
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
  const enclaveLocked = p.selectedChains.length > 1;
  const enclaveOn = p.deviceApproval === 'enclave';

  return (
    <aside>
      <div className="border-b border-white/15 px-5 py-4">
        <h1 className="text-[1.1875rem] font-medium leading-[1.2] tracking-[-0.03em] text-white">
          This is the wallet your users will see.
        </h1>
        <p className="mt-1 text-[12.5px] leading-snug text-white/65">
          Changes land on the preview. Sign in when it looks like your product.
        </p>
      </div>

      <div className="divide-y divide-white/15">
        <div className="px-5 py-3">
          <p className="text-[12.5px] font-medium text-white">Chains</p>
          <div className="mt-2 divide-y divide-white/15 rounded-md border border-white/15">
            {CHAIN_LIST.map((c) => {
              const on = p.selectedChains.includes(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => p.setSelectedChains(toggleSelectedChain(p.selectedChains, c.key))}
                  aria-pressed={on}
                  data-pressable
                  className="flex w-full items-center gap-2.5 bg-white/5 px-3 py-2 text-left text-[13px] font-medium text-white first:rounded-t-md last:rounded-b-md hover:bg-white/10"
                >
                  <ChainLogo chain={c.key} size={16} />
                  <span className="flex-1">{c.label}</span>
                  <span
                    className={`grid h-[18px] w-[18px] place-items-center rounded-[4px] border transition-colors duration-150 ${
                      on ? 'border-white bg-white text-brand' : 'border-white/30 bg-transparent'
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
          <p className="mt-2 text-[12px] leading-snug text-white/55">
            Pick the chains this app configures. More than one uses the enclave.
          </p>
        </div>

        <div className="px-5 py-3">
          <FieldLabel>Recovery</FieldLabel>
          <button
            type="button"
            role="switch"
            aria-checked={enclaveOn}
            disabled={enclaveLocked}
            onClick={() => p.setDeviceApproval(enclaveOn ? 'passkey' : 'enclave')}
            {...(enclaveLocked ? {} : { 'data-pressable': true })}
            className={`flex w-full items-center justify-between rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-left ${
              enclaveLocked ? 'cursor-not-allowed opacity-55' : ''
            }`}
          >
            <span className="text-[13px] font-medium text-white">Use the enclave</span>
            <span
              className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200 ${
                enclaveOn ? 'bg-white' : 'bg-white/25'
              }`}
            >
              <span
                className={`absolute top-[2px] h-[18px] w-[18px] rounded-full shadow-sm transition-transform duration-200 ${
                  enclaveOn ? 'translate-x-[18px] bg-brand' : 'translate-x-[2px] bg-white'
                }`}
              />
            </span>
          </button>
          <p className="mt-2 text-[12px] leading-snug text-white/55">
            {enclaveLocked
              ? 'Required when more than one chain is selected.'
              : enclaveOn
                ? 'Recovery enrolls at sign-in. A new device restores with the same login.'
                : 'A synced passkey authorizes a new device. One chain per app.'}
          </p>
        </div>

        <div className="px-5 py-3">
          <p className="mb-2.5 text-[12.5px] font-medium text-white">Appearance</p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <p className="mb-1.5 text-[12px] font-medium text-white/55">Background</p>
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
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-brand'
                      : 'ring-1 ring-white/30 hover:ring-white/60'
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
              <p className="mb-1.5 text-[12px] font-medium text-white/55">Accent</p>
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
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-brand'
                      : 'ring-1 ring-white/30 hover:ring-white/60'
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
              <label htmlFor="corner-radius" className="text-[12px] font-medium text-white/55">
                Corner radius
              </label>
              <span className="font-mono text-[12px] tabular-nums text-white">{p.radius}px</span>
            </div>
            <input
              id="corner-radius"
              type="range"
              min={0}
              max={24}
              value={p.radius}
              onChange={(e) => p.setRadius(Number(e.target.value))}
              className="w-full accent-white"
            />
          </div>
        </div>

        <div className="px-5 py-3">
          <p className="text-[12.5px] font-medium text-white">Branding</p>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="app-name" className="mb-1 block text-[12px] font-medium text-white/55">
                App name
              </label>
              <input
                id="app-name"
                value={p.appName}
                onChange={(e) => p.setAppName(e.target.value)}
                placeholder="Your app"
                className="w-full rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-[13px] text-white outline-none transition-colors duration-150 placeholder:text-white/35 focus:border-white/55"
              />
            </div>
            <div>
              <label htmlFor="app-logo" className="mb-1 block text-[12px] font-medium text-white/55">
                Logo URL
              </label>
              <input
                id="app-logo"
                value={p.appLogo}
                onChange={(e) => p.setAppLogo(e.target.value)}
                placeholder="https://"
                className="w-full truncate rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 font-mono text-[12px] text-white outline-none transition-colors duration-150 placeholder:text-white/35 focus:border-white/55"
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-3">
          <p className="text-[12.5px] font-medium text-white">Sign-in methods</p>
          <div className="mt-2 divide-y divide-white/15 rounded-md border border-white/15">
            {PROVIDERS.map(({ key, label, icon }) => {
              const on = p.providers.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleProvider(key)}
                  data-pressable
                  className="flex w-full items-center gap-2.5 bg-white/5 px-3 py-2 text-left text-[13px] font-medium text-white first:rounded-t-md last:rounded-b-md hover:bg-white/10"
                >
                  <span className="grid h-5 w-5 place-items-center text-[16px]">{icon}</span>
                  <span className="flex-1">{label}</span>
                  <span
                    className={`grid h-[18px] w-[18px] place-items-center rounded-[4px] border transition-colors duration-150 ${
                      on ? 'border-white bg-white text-brand' : 'border-white/30 bg-transparent'
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
          <p className="mt-2 text-[12px] leading-snug text-white/55">
            SMS, X, Discord, GitHub and wallets are next.
          </p>
        </div>
      </div>
    </aside>
  );
}
