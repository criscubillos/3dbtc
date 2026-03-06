'use client';

import { useCryptoStore } from '@/stores/useCryptoStore';

export default function LiquidationsFeed() {
  const showLiquidations = useCryptoStore((s) => s.showLiquidations);
  const toggleLiquidations = useCryptoStore((s) => s.toggleLiquidations);

  return (
    <div id="liquidations-panel" className={showLiquidations ? '' : 'collapsed'}>
      <button
        id="liquidations-toggle"
        className={showLiquidations ? 'active' : ''}
        onClick={toggleLiquidations}
        type="button"
      >
        {showLiquidations ? 'Hide liq' : 'Show liq'}
      </button>
    </div>
  );
}
