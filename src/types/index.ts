export interface CryptoPair {
  symbol: string;
  base: string;
  name: string;
}

export interface CandleData {
  time: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
}

export interface NormParams {
  minPrice: number;
  priceRange: number;
  maxVol: number;
  PRICE_SCALE: number;
  VOLUME_SCALE: number;
}

export interface TickerStats {
  high: number;
  low: number;
  changePct: number;
  volBase: number;
  volQuote: number;
  trades: number;
  vwap: number;
}

export interface SpreadData {
  bid: number;
  ask: number;
  spread: number;
  spreadPct: number;
}

export interface LiquidationEntry {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  price: number;
  quantity: number;
  valueUsd: number;
  color: string;
  createdAt: number;
  expiresAt: number;
}

export interface CandleMeshSet {
  body: THREE.Mesh;
  wick: THREE.Mesh;
  vol: THREE.Mesh;
}

export interface TradeParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  r: number;
  g: number;
  b: number;
  life: number;
  maxLife: number;
  size: number;
}

import type * as THREE from 'three';
