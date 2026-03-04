import * as THREE from 'three';
import type { CandleData, NormParams } from '@/types';
import { CANDLE_SPACING, EMA_COLOR, EMA_PERIOD } from '@/constants';

export function calcEMA(data: CandleData[], period: number): (number | undefined)[] {
  const closes = data.map(c => c.close);
  const k = 2 / (period + 1);
  const ema: (number | undefined)[] = [];

  if (closes.length < period) return ema;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += closes[i];
  ema[period - 1] = sum / period;

  for (let i = period; i < closes.length; i++) {
    ema[i] = closes[i] * k + (ema[i - 1] as number) * (1 - k);
  }

  return ema;
}

export function buildEMARope(
  candleGroup: THREE.Group,
  emaMesh: THREE.Mesh | null,
  candleData: CandleData[],
  emaValues: (number | undefined)[],
  normParams: NormParams | null
): THREE.Mesh | null {
  if (emaMesh) {
    emaMesh.traverse(obj => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      if ((obj as THREE.Mesh).material) {
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else (mat as THREE.Material).dispose();
      }
    });
    candleGroup.remove(emaMesh);
  }

  if (!normParams || !candleData.length || !emaValues.length) return null;

  const { minPrice, priceRange, PRICE_SCALE } = normParams;

  const points: THREE.Vector3[] = [];
  for (let i = 0; i < candleData.length; i++) {
    if (emaValues[i] === undefined) continue;
    const x = i * CANDLE_SPACING;
    const y = (emaValues[i]! - minPrice) / priceRange * PRICE_SCALE;
    points.push(new THREE.Vector3(x, y, 0));
  }

  if (points.length < 2) return null;

  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const tubeGeo = new THREE.TubeGeometry(curve, points.length * 4, 0.18, 8, false);
  const tubeMat = new THREE.MeshStandardMaterial({
    color: EMA_COLOR,
    emissive: EMA_COLOR,
    emissiveIntensity: 0.8,
    metalness: 0.4,
    roughness: 0.3,
    transparent: true,
    opacity: 0.9,
  });

  const mesh = new THREE.Mesh(tubeGeo, tubeMat);
  candleGroup.add(mesh);
  return mesh;
}

export function updateLiveEMA(
  emaValues: (number | undefined)[],
  livePrice: number
): void {
  if (emaValues.length >= 2) {
    const k = 2 / (EMA_PERIOD + 1);
    const prevEma = emaValues[emaValues.length - 2];
    if (prevEma !== undefined) {
      emaValues[emaValues.length - 1] = livePrice * k + prevEma * (1 - k);
    }
  }
}
