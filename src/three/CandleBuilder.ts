import * as THREE from 'three';
import type { CandleData, CandleMeshSet, NormParams } from '@/types';
import { GREEN, RED, CANDLE_SPACING, PRICE_SCALE, VOLUME_SCALE } from '@/constants';

export function buildCandles(
  candleGroup: THREE.Group,
  candleData: CandleData[]
): { meshes: CandleMeshSet[]; normParams: NormParams } {
  // Clear old
  while (candleGroup.children.length) {
    const child = candleGroup.children[0];
    child.traverse(obj => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      if ((obj as THREE.Mesh).material) {
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else (mat as THREE.Material).dispose();
      }
    });
    candleGroup.remove(child);
  }

  const meshes: CandleMeshSet[] = [];

  if (!candleData.length) {
    return { meshes, normParams: { minPrice: 0, priceRange: 1, maxVol: 1, PRICE_SCALE, VOLUME_SCALE } };
  }

  const prices = candleData.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const volumes = candleData.map(c => c.volume);
  const maxVol = Math.max(...volumes) || 1;

  const normParams: NormParams = { minPrice, priceRange, maxVol, PRICE_SCALE, VOLUME_SCALE };

  candleData.forEach((c, i) => {
    const isGreen = c.close >= c.open;
    const color = isGreen ? GREEN : RED;
    const x = i * CANDLE_SPACING;

    const bodyH = Math.max(Math.abs(c.close - c.open) / priceRange * PRICE_SCALE, 0.15);
    const bodyBottom = (Math.min(c.open, c.close) - minPrice) / priceRange * PRICE_SCALE;
    const depth = Math.max((c.volume / maxVol) * VOLUME_SCALE, 0.3);

    const bodyGeo = new THREE.BoxGeometry(0.7, bodyH, depth);
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
      metalness: 0.3,
      roughness: 0.4,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(x, bodyBottom + bodyH / 2, 0);
    candleGroup.add(bodyMesh);

    const wickH = (c.high - c.low) / priceRange * PRICE_SCALE;
    const wickBottom = (c.low - minPrice) / priceRange * PRICE_SCALE;
    const wickGeo = new THREE.BoxGeometry(0.08, Math.max(wickH, 0.1), 0.08);
    const wickMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.7,
    });
    const wickMesh = new THREE.Mesh(wickGeo, wickMat);
    wickMesh.position.set(x, wickBottom + wickH / 2, 0);
    candleGroup.add(wickMesh);

    const volBarH = (c.volume / maxVol) * 5;
    const volGeo = new THREE.BoxGeometry(0.9, Math.max(volBarH, 0.05), depth * 0.6);
    const volMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3 + (c.volume / maxVol) * 0.5,
      transparent: true,
      opacity: 0.25,
      metalness: 0.1,
      roughness: 0.8,
    });
    const volMesh = new THREE.Mesh(volGeo, volMat);
    volMesh.position.set(x, -volBarH / 2 - 0.5, 0);
    candleGroup.add(volMesh);

    meshes.push({ body: bodyMesh, wick: wickMesh, vol: volMesh });
  });

  return { meshes, normParams };
}

export function updateLastCandleGeometry(
  candleMeshes: CandleMeshSet[],
  candleData: CandleData[],
  normParams: NormParams,
  livePrice: number
): void {
  if (!candleMeshes.length || !candleData.length) return;

  const lastIdx = candleMeshes.length - 1;
  const { body, wick } = candleMeshes[lastIdx];
  const c = candleData[lastIdx];
  const { minPrice, priceRange, PRICE_SCALE } = normParams;

  c.close = livePrice;
  if (livePrice > c.high) c.high = livePrice;
  if (livePrice < c.low) c.low = livePrice;

  const isGreen = c.close >= c.open;
  const color = isGreen ? GREEN : RED;

  const bodyH = Math.max(Math.abs(c.close - c.open) / priceRange * PRICE_SCALE, 0.15);
  const bodyBottom = (Math.min(c.open, c.close) - minPrice) / priceRange * PRICE_SCALE;

  body.geometry.dispose();
  body.geometry = new THREE.BoxGeometry(0.7, bodyH, (body.geometry as THREE.BoxGeometry).parameters.depth);
  body.position.y = bodyBottom + bodyH / 2;
  (body.material as THREE.MeshStandardMaterial).color.setHex(color);
  (body.material as THREE.MeshStandardMaterial).emissive.setHex(color);

  const wickH = (c.high - c.low) / priceRange * PRICE_SCALE;
  const wickBottom = (c.low - minPrice) / priceRange * PRICE_SCALE;

  wick.geometry.dispose();
  wick.geometry = new THREE.BoxGeometry(0.08, Math.max(wickH, 0.1), 0.08);
  wick.position.y = wickBottom + wickH / 2;
  (wick.material as THREE.MeshStandardMaterial).color.setHex(color);
  (wick.material as THREE.MeshStandardMaterial).emissive.setHex(color);
}
