'use client';

import { useCryptoStore } from '@/stores/useCryptoStore';

export default function LoadingScreen() {
  const isLoading = useCryptoStore((s) => s.isLoading);

  return (
    <div id="loading" className={isLoading ? '' : 'hidden'}>
      <div className="loader-text">Loading data...</div>
    </div>
  );
}
