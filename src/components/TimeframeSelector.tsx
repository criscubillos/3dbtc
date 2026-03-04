'use client';

import { useCryptoStore } from '@/stores/useCryptoStore';
import { TIMEFRAMES } from '@/constants';

export default function TimeframeSelector() {
  const interval = useCryptoStore((s) => s.interval);
  const setInterval = useCryptoStore((s) => s.setInterval);

  return (
    <div className="timeframe-selector">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          className={tf === interval ? 'active' : ''}
          onClick={() => setInterval(tf)}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
