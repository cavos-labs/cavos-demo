'use client';

import { Sliders, Lock, Wallet } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import {
  FaApple,
  FaDiscord,
  FaGithub,
  FaLinkedin,
  FaTiktok,
  FaTelegram,
  FaLine,
  FaXTwitter,
  FaEnvelope,
  FaCommentSms,
} from 'react-icons/fa6';
import { SiFarcaster } from 'react-icons/si';

export type Background = 'white' | 'dark' | 'soft';
export type ProviderKey = 'email' | 'google' | 'apple';

const ACCENTS = ['#402AFF', '#7C3AED', '#12B3A6', '#17B85A', '#FA5D3C'];

const REAL: { key: ProviderKey; label: string; icon: React.ReactNode }[] = [
  { key: 'email', label: 'Email', icon: <FaEnvelope className="text-ink/70" /> },
  { key: 'google', label: 'Google', icon: <FcGoogle /> },
  { key: 'apple', label: 'Apple', icon: <FaApple className="text-ink" /> },
];

const COMING_SOON: { label: string; icon: React.ReactNode }[] = [
  { label: 'SMS', icon: <FaCommentSms /> },
  { label: 'Twitter', icon: <FaXTwitter /> },
  { label: 'Discord', icon: <FaDiscord style={{ color: '#5865F2' }} /> },
  { label: 'GitHub', icon: <FaGithub /> },
  { label: 'LinkedIn', icon: <FaLinkedin style={{ color: '#0A66C2' }} /> },
  { label: 'TikTok', icon: <FaTiktok /> },
  { label: 'Telegram', icon: <FaTelegram style={{ color: '#26A5E4' }} /> },
  { label: 'Farcaster', icon: <SiFarcaster style={{ color: '#855DCD' }} /> },
  { label: 'LINE', icon: <FaLine style={{ color: '#00C300' }} /> },
  { label: 'Wallets', icon: <Wallet size={13} /> },
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
      onClick={onClick}
      aria-label={label}
      className={`h-7 w-7 rounded-full transition-all ${
        active ? 'ring-2 ring-ink ring-offset-2' : 'ring-1 ring-line-strong hover:ring-ink/40'
      }`}
      style={style}
    />
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
    <aside className="space-y-6 rounded-2xl border border-line bg-white p-5">
      <SectionLabel icon={<Sliders size={15} className="text-ink" />}>Customize</SectionLabel>

      {/* Background + Accent */}
      <div className="flex items-start gap-8">
        <div>
          <p className="mb-2.5 text-[12px] font-medium text-muted">Background</p>
          <div className="flex gap-2">
            <Swatch label="White" active={p.background === 'white'} onClick={() => p.setBackground('white')} style={{ background: '#ffffff', border: '1px solid #E0E0E6' }} />
            <Swatch label="Dark" active={p.background === 'dark'} onClick={() => p.setBackground('dark')} style={{ background: '#0A0A0F' }} />
            <Swatch label="Soft" active={p.background === 'soft'} onClick={() => p.setBackground('soft')} style={{ background: '#EEEDF2' }} />
          </div>
        </div>
        <div>
          <p className="mb-2.5 text-[12px] font-medium text-muted">Accent</p>
          <div className="flex gap-2">
            {ACCENTS.map((c) => (
              <Swatch key={c} label={`Accent ${c}`} active={p.accent === c} onClick={() => p.setAccent(c)} style={{ background: c }} />
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
            className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-ink"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-muted">Logo</label>
          <input
            value={p.appLogo}
            onChange={(e) => p.setAppLogo(e.target.value)}
            placeholder="Add image URL"
            className="w-full truncate rounded-lg border border-line-strong bg-white px-3 py-2 font-mono text-[12px] text-ink outline-none transition-colors focus:border-ink"
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
          className="w-full accent-ink"
        />
      </div>

      {/* Authentication */}
      <div className="border-t border-line pt-5">
        <SectionLabel icon={<Lock size={14} className="text-ink" />}>Authentication</SectionLabel>
        <div className="mt-3 space-y-2">
          {REAL.map(({ key, label, icon }) => {
            const on = p.providers.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleProvider(key)}
                className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-white px-3 py-2.5 text-left text-[13px] font-medium text-ink transition-colors hover:border-line-strong"
              >
                <span className="grid h-5 w-5 place-items-center text-[16px]">{icon}</span>
                <span className="flex-1">{label}</span>
                <span
                  className={`grid h-[18px] w-[18px] place-items-center rounded-[5px] border transition-colors ${
                    on ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white'
                  }`}
                >
                  {on && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12.5 9.5 18 20 6.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Coming soon */}
        <p className="mb-2.5 mt-4 text-[11px] font-medium uppercase tracking-wide text-muted/70">
          Coming soon
        </p>
        <div className="grid grid-cols-2 gap-2">
          {COMING_SOON.map(({ label, icon }) => (
            <span
              key={label}
              className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-2 text-[12.5px] text-muted"
            >
              <span className="grid h-4 w-4 place-items-center text-[14px] opacity-60">{icon}</span>
              {label}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
