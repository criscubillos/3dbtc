import { create } from 'zustand';
import type { CryptoPair, TickerStats, SpreadData } from '@/types';
import { CRYPTO_PAIRS, DEFAULT_INTERVAL } from '@/constants';

interface CryptoStore {
  symbol: CryptoPair;
  interval: string;

  livePrice: number | null;
  priceChange: number | null;
  stats24h: TickerStats | null;
  spread: SpreadData | null;

  isLoading: boolean;
  emaValue: string;

  cameraCommand: 'center' | 'focus' | null;
  toggleLockCmd: number;
  toggleSparksCmd: number;

  setSymbol: (pair: CryptoPair) => void;
  setInterval: (interval: string) => void;
  setLivePrice: (price: number) => void;
  setPriceChange: (change: number) => void;
  setStats24h: (stats: TickerStats) => void;
  setSpread: (spread: SpreadData) => void;
  setLoading: (loading: boolean) => void;
  setEmaValue: (val: string) => void;
  setCameraCommand: (cmd: 'center' | 'focus' | null) => void;
  triggerToggleLock: () => void;
  triggerToggleSparks: () => void;
  resetForSymbolChange: () => void;
}

export const useCryptoStore = create<CryptoStore>((set) => ({
  symbol: CRYPTO_PAIRS[0],
  interval: DEFAULT_INTERVAL,

  livePrice: null,
  priceChange: null,
  stats24h: null,
  spread: null,

  isLoading: true,
  emaValue: '--',

  cameraCommand: null,
  toggleLockCmd: 0,
  toggleSparksCmd: 0,

  setSymbol: (pair) => set({ symbol: pair }),
  setInterval: (interval) => set({ interval }),
  setLivePrice: (price) => set({ livePrice: price }),
  setPriceChange: (change) => set({ priceChange: change }),
  setStats24h: (stats) => set({ stats24h: stats }),
  setSpread: (spread) => set({ spread: spread }),
  setLoading: (loading) => set({ isLoading: loading }),
  setEmaValue: (val) => set({ emaValue: val }),
  setCameraCommand: (cmd) => set({ cameraCommand: cmd }),
  triggerToggleLock: () => set((s) => ({ toggleLockCmd: s.toggleLockCmd + 1 })),
  triggerToggleSparks: () => set((s) => ({ toggleSparksCmd: s.toggleSparksCmd + 1 })),
  resetForSymbolChange: () => set({
    livePrice: null,
    priceChange: null,
    stats24h: null,
    spread: null,
    isLoading: true,
    emaValue: '--',
  }),
}));
