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
  title: 'Cavos Demo: customize your embedded wallet login',
  description:
    'Try Cavos live. Customize the login modal (background, accent, providers) and sign in to create a real device-signer wallet on Solana. No install.',
  metadataBase: new URL('https://demo.cavos.xyz'),
  openGraph: {
    title: 'Cavos Demo: customize your embedded wallet login',
    description:
      'Customize the login modal and sign in to create a real device-signer wallet on Solana.',
    url: 'https://demo.cavos.xyz',
    siteName: 'Cavos',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cavos: MPC-free embedded wallets with on-chain RSA verification',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cavos Demo: customize your embedded wallet login',
    description:
      'Customize the login modal and sign in to create a real device-signer wallet on Solana.',
    creator: '@cavosxyz',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
