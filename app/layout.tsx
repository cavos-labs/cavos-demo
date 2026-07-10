import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#402AFF',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Cavos Demo — Customize your embedded wallet login',
  description:
    'Try Cavos live. Customize the login modal — background, accent, providers — and sign in to create a real device-signer wallet on Solana. No install.',
  metadataBase: new URL('https://cavos.xyz'),
  openGraph: {
    title: 'Cavos Demo — Customize your embedded wallet login',
    description:
      'Customize the login modal and sign in to create a real device-signer wallet on Solana.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
