'use client';

import { useCryptoStore } from '@/stores/useCryptoStore';

export default function LoadingScreen() {
  const isLoading = useCryptoStore((s) => s.isLoading);
  const symbol = useCryptoStore((s) => s.symbol);

  return (
    <div id="loading" className={isLoading ? '' : 'hidden'}>
      <div className="loader-text">LOADING {symbol.base} DATA...</div>
    </div>
  );
}
