'use client';

import AssetSelector from './AssetSelector';
import PriceTicker from './PriceTicker';
import TimeframeSelector from './TimeframeSelector';

export default function Header() {
  return (
    <div id="header">
      <a href="https://aperture.cl" className="home-icon" title="Back to aperture.cl">
        <img src="/icon-aperture.png" alt="Aperture" width={36} height={36} />
      </a>
      <div className="logo">Crypto-3D</div>
      <AssetSelector />
      <PriceTicker />
      <TimeframeSelector />
    </div>
  );
}
