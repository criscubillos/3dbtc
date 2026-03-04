'use client';

import { useCryptoStore } from '@/stores/useCryptoStore';

export default function PriceTicker() {
  const livePrice = useCryptoStore((s) => s.livePrice);
  const priceChange = useCryptoStore((s) => s.priceChange);

  const priceText = livePrice !== null
    ? '$' + livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '--';

  const isUp = (priceChange ?? 0) >= 0;
  const changeText = priceChange !== null
    ? (isUp ? '+' : '') + priceChange.toFixed(2) + '%'
    : '--';

  return (
    <div className="price-ticker">
      <span className={`price${isUp ? '' : ' down'}`}>{priceText}</span>
      <span className={`change ${isUp ? 'up' : 'down'}`}>{changeText}</span>
    </div>
  );
}
