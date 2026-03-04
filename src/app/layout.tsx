import type { Metadata } from 'next';
import { Orbitron, Share_Tech_Mono } from 'next/font/google';
import './globals.css';

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-orbitron',
  display: 'swap',
});

const shareTechMono = Share_Tech_Mono({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-share-tech-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Crypto-3d / Aperture',
  description:
    '3D-Crypto: Real-time 3D cryptocurrency candlestick visualizer with WebGL. Track BTC, ETH, SOL and 12+ crypto pairs with live trades, EMA indicators, bid/ask spread, and 24h stats.',
  keywords:
    'crypto, cryptocurrency, 3D, visualizer, bitcoin, ethereum, solana, candlestick, chart, real-time, trading, WebGL, three.js, BTC, ETH, live price',
  authors: [{ name: 'aperture.cl' }],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    title: 'Crypto-3d / Aperture',
    description:
      'Explore crypto markets in 3D. Live candlesticks, volume particles, EMA indicators, bid/ask spread for BTC, ETH, SOL and more.',
    url: 'https://crypto3d.aperture.cl',
    siteName: '3D-Crypto',
  },
  twitter: {
    card: 'summary',
    title: 'Crypto-3d / Aperture',
    description:
      'Explore crypto markets in 3D. Live candlesticks, volume particles, EMA indicators, bid/ask spread for BTC, ETH, SOL and more.',
  },
  other: {
    'theme-color': '#0a0a0f',
    'color-scheme': 'dark',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${shareTechMono.variable}`}>
      <head>
        <link rel="canonical" href="https://crypto3d.aperture.cl" />
      </head>
      <body>{children}</body>
    </html>
  );
}
