import type { CryptoPair } from '@/types';

export const CRYPTO_PAIRS: CryptoPair[] = [
  { symbol: 'BTCUSDT', base: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETHUSDT', base: 'ETH', name: 'Ethereum' },
  { symbol: 'SOLUSDT', base: 'SOL', name: 'Solana' },
  { symbol: 'BNBUSDT', base: 'BNB', name: 'BNB' },
  { symbol: 'XRPUSDT', base: 'XRP', name: 'XRP' },
  { symbol: 'DOGEUSDT', base: 'DOGE', name: 'Dogecoin' },
  { symbol: 'ADAUSDT', base: 'ADA', name: 'Cardano' },
  { symbol: 'AVAXUSDT', base: 'AVAX', name: 'Avalanche' },
  { symbol: 'DOTUSDT', base: 'DOT', name: 'Polkadot' },
  { symbol: 'LINKUSDT', base: 'LINK', name: 'Chainlink' },
  { symbol: 'MATICUSDT', base: 'MATIC', name: 'Polygon' },
  { symbol: 'LTCUSDT', base: 'LTC', name: 'Litecoin' },
];

export const INTERVAL_MS: Record<string, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1M': 30 * 24 * 60 * 60 * 1000,
};

export const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'];
export const DEFAULT_INTERVAL = '1h';

export const CANDLE_SPACING = 1.2;
export const EMA_PERIOD = 55;
export const EMA_COLOR = 0xff8800;
export const VISIBLE_CANDLES = 100;
export const FETCH_CANDLES = VISIBLE_CANDLES + EMA_PERIOD;

export const GREEN = 0x00ff88;
export const RED = 0xff0044;
export const CYAN = 0x00ffff;

export const MAX_TRADE_PARTICLES = 300;
export const PRICE_SCALE = 40;
export const VOLUME_SCALE = 15;
