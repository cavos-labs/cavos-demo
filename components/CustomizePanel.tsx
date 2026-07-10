'use client';

import { Sliders, Lock } from 'lucide-react';

export type Background = 'white' | 'dark' | 'soft';
export type ProviderKey = 'email' | 'google' | 'apple';

const ACCENTS = ['#402AFF', '#7C3AED', '#12B3A6', '#17B85A', '#FA5D3C'];

const COMING_SOON = [
  'SMS',
  'Twitter',
  'Discord',
  'GitHub',
  'LinkedIn',
  'TikTok',
  'Telegram',
  'Farcaster',
  'LINE',
  'Wallets',
];

interface Props {
  background: Background;
  setBackground: (b: Background) => void;
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
}

function Swatch({
  active,
  onClick,
  children,
  style,
  label,
}: {
  active: boolean;
  onClick: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`grid h-8 w-8 place-items-center rounded-full transition-all ${
        active ? 'ring-2 ring-brand ring-offset-2' : 'ring-1 ring-line-strong hover:ring-ink/30'
      }`}
      style={style}
    >
      {children}
    </button>
  );
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-ink">
      {icon}
      <h3 className="text-[13px] font-semibold tracking-tight">{children}</h3>
    </div>
  );
}

export function CustomizePanel(p: Props) {
  const toggleProvider = (key: ProviderKey) => {
    p.setProviders(
      p.providers.includes(key) ? p.providers.filter((x) => x !== key) : [...p.providers, key],
    );
  };

  return (
    <aside className="space-y-7 rounded-2xl border border-line bg-white p-5">
      <SectionLabel icon={<Sliders size={15} className="text-brand" />}>Customize</SectionLabel>

      {/* Background + Accent */}
      <div className="grid grid-cols-2 gap-5">
        <div>
          <p className="mb-2.5 text-[12px] font-medium text-muted">Background</p>
          <div className="flex gap-2">
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
              style={{ background: '#ECEAFF' }}
            />
          </div>
        </div>
        <div>
          <p className="mb-2.5 text-[12px] font-medium text-muted">Accent</p>
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((c) => (
              <Swatch
                key={c}
                label={`Accent ${c}`}
                active={p.accent === c}
                onClick={() => p.setAccent(c)}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* App name + Logo */}
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-muted">App name</label>
          <input
            value={p.appName}
            onChange={(e) => p.setAppName(e.target.value)}
            placeholder="Your app"
            className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-brand"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-muted">Logo URL</label>
          <input
            value={p.appLogo}
            onChange={(e) => p.setAppLogo(e.target.value)}
            placeholder="https://…/logo.png"
            className="w-full truncate rounded-lg border border-line-strong bg-white px-3 py-2 font-mono text-[12px] text-ink outline-none transition-colors focus:border-brand"
          />
        </div>
      </div>

      {/* Radius */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[12px] font-medium text-muted">Corner radius</label>
          <span className="font-mono text-[12px] text-ink">{p.radius}px</span>
        </div>
        <input
          type="range"
          min={0}
          max={24}
          value={p.radius}
          onChange={(e) => p.setRadius(Number(e.target.value))}
          className="w-full accent-brand"
        />
      </div>

      {/* Authentication */}
      <div>
        <SectionLabel icon={<Lock size={14} className="text-brand" />}>Authentication</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(['email', 'google', 'apple'] as ProviderKey[]).map((key) => {
            const on = p.providers.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleProvider(key)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-[13px] font-medium capitalize transition-colors ${
                  on
                    ? 'border-brand/40 bg-brand-soft text-ink'
                    : 'border-line bg-white text-muted hover:border-line-strong'
                }`}
              >
                {key}
                <span
                  className={`grid h-4 w-4 place-items-center rounded ${
                    on ? 'bg-brand text-white' : 'border border-line-strong'
                  }`}
                >
                  {on && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12.5 9.5 18 20 6.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Coming soon */}
        <p className="mb-2 mt-4 text-[11px] font-medium uppercase tracking-wide text-muted/70">
          Coming soon
        </p>
        <div className="flex flex-wrap gap-1.5">
          {COMING_SOON.map((name) => (
            <span
              key={name}
              className="cursor-not-allowed rounded-md border border-dashed border-line-strong bg-surface px-2 py-1 text-[11.5px] text-muted/60"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
