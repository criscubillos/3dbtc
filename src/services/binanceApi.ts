import type { CandleData } from '@/types';

export async function fetchKlines(
  symbol: string,
  interval: string,
  limit: number
): Promise<CandleData[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const raw = await resp.json();

  return raw.map((k: (string | number)[]) => ({
    time: k[0] as number,
    closeTime: k[6] as number,
    open: parseFloat(k[1] as string),
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
    volume: parseFloat(k[5] as string),
    quoteVolume: parseFloat(k[7] as string),
  }));
}
