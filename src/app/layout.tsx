import type { Metadata } from 'next';
import { GoogleTagManager } from '@next/third-parties/google';
import { Orbitron, Share_Tech_Mono } from 'next/font/google';
import './globals.css';

const siteUrl = 'https://crypto3d.aperture.cl';

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
  metadataBase: new URL(siteUrl),
  title: 'Crypto-3D / Aperture',
  description:
    '3D-Crypto: Real-time 3D cryptocurrency candlestick visualizer with WebGL. Track BTC, ETH, SOL and 12+ crypto pairs with live trades, EMA indicators, bid/ask spread, and 24h stats.',
  keywords:
    'crypto, cryptocurrency, 3D, visualizer, bitcoin, ethereum, solana, candlestick, chart, real-time, trading, WebGL, three.js, BTC, ETH, live price',
  authors: [{ name: 'aperture.cl' }],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    title: 'Crypto-3D / Aperture',
    description:
      'Explore crypto markets in 3D. Live candlesticks, volume particles, EMA indicators, bid/ask spread for BTC, ETH, SOL and more.',
    url: siteUrl,
    siteName: '3D-Crypto',
    images: [
      {
        url: '/icon-aperture.png',
        width: 512,
        height: 512,
        alt: 'Crypto-3D by aperture.cl',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crypto-3D / Aperture',
    description:
      'Explore crypto markets in 3D. Live candlesticks, volume particles, EMA indicators, bid/ask spread for BTC, ETH, SOL and more.',
    images: ['/icon-aperture.png'],
  },
  other: {
    'theme-color': '#0a0a0f',
    'color-scheme': 'dark',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${shareTechMono.variable}`}>
      <GoogleTagManager gtmId="GTM-TD8TWQ6F" />
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5723735470440666"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
