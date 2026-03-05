'use client';

import { useCryptoStore } from '@/stores/useCryptoStore';
import { formatPrice } from '@/utils/formatters';

export default function PriceTicker() {
  const livePrice = useCryptoStore((s) => s.livePrice);
  const priceChange = useCryptoStore((s) => s.priceChange);

  const priceText = livePrice !== null
    ? formatPrice(livePrice)
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
