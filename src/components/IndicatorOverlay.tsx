'use client';

import { useCryptoStore } from '@/stores/useCryptoStore';

export default function IndicatorOverlay() {
  const emaValue = useCryptoStore((s) => s.emaValue);

  return (
    <div id="indicator-overlay">
      <span className="ind-ema">EMA 55</span>{' '}
      <span className="ind-value">{emaValue}</span>
    </div>
  );
}
