import { create } from 'zustand';
import type { CryptoPair, TickerStats, SpreadData, LiquidationEntry } from '@/types';
import { CRYPTO_PAIRS, DEFAULT_INTERVAL } from '@/constants';

const LIQUIDATION_COLORS = [
  '#00ffff',
  '#ff5c8a',
  '#8bff6a',
  '#ffd166',
  '#7aa2ff',
  '#ff8c42',
  '#7cf7c9',
  '#ff66ff',
];

const MAX_LIQUIDATIONS = 5;
const LIQUIDATION_TTL_MS = 12000;

interface CryptoStore {
  symbol: CryptoPair;
  interval: string;

  livePrice: number | null;
  priceChange: number | null;
  stats24h: TickerStats | null;
  spread: SpreadData | null;
  liquidations: LiquidationEntry[];
  showLiquidations: boolean;

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
  addLiquidation: (entry: Omit<LiquidationEntry, 'id' | 'color' | 'createdAt' | 'expiresAt'>) => void;
  pruneLiquidations: () => void;
  toggleLiquidations: () => void;
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
  liquidations: [],
  showLiquidations: true,

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
  addLiquidation: (entry) => set((state) => {
    const createdAt = Date.now();
    const liquidation: LiquidationEntry = {
      ...entry,
      id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
      color: LIQUIDATION_COLORS[Math.floor(Math.random() * LIQUIDATION_COLORS.length)],
      createdAt,
      expiresAt: createdAt + LIQUIDATION_TTL_MS,
    };

    const next = [...state.liquidations, liquidation]
      .filter((item) => item.expiresAt > createdAt)
      .slice(-MAX_LIQUIDATIONS);

    return { liquidations: next };
  }),
  pruneLiquidations: () => set((state) => {
    const now = Date.now();
    return { liquidations: state.liquidations.filter((item) => item.expiresAt > now) };
  }),
  toggleLiquidations: () => set((state) => ({ showLiquidations: !state.showLiquidations })),
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
    liquidations: [],
    isLoading: true,
    emaValue: '--',
  }),
}));
