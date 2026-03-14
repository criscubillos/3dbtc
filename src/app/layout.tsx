import type { Metadata } from 'next';
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TD8TWQ6F');`,
          }}
        />
        <script
          async
          data-cfasync="false"
          src="https://pl28913435.effectivegatecpm.com/7b024735bdce821b1e2e9287ecbd7919/invoke.js"
        ></script>
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TD8TWQ6F"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <div id="container-7b024735bdce821b1e2e9287ecbd7919"></div>
        {children}
      </body>
    </html>
  );
}
