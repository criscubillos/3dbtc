import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { CandleData, NormParams } from '@/types';
import { CANDLE_SPACING, PRICE_SCALE } from '@/constants';

export function getCenterX(candleData: CandleData[]): number {
  if (!candleData.length) return 50;
  const lastX = (candleData.length - 1) * CANDLE_SPACING;
  // On mobile we bias the target to the right so the latest price/candles
  // are visible on first render.
  const centerFactor = typeof window !== 'undefined' && window.innerWidth <= 900
    ? 0.86
    : 0.65;
  return lastX * centerFactor;
}

export function centerCamera(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  candleData: CandleData[]
): void {
  if (!candleData.length) return;
  const cx = getCenterX(candleData);
  const target = new THREE.Vector3(cx, PRICE_SCALE / 4, 0);
  const camPos = new THREE.Vector3(cx + 50, 50, 120);

  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const duration = 600;
  const startTime = Date.now();

  function animateCenter() {
    const elapsed = Date.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);

    camera.position.lerpVectors(startPos, camPos, ease);
    controls.target.lerpVectors(startTarget, target, ease);

    if (t < 1) requestAnimationFrame(animateCenter);
  }
  animateCenter();
}

export function focusLastCandle(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  candleData: CandleData[],
  normParams: NormParams | null
): void {
  if (!candleData.length || !normParams) return;

  const lastX = (candleData.length - 1) * CANDLE_SPACING;
  const lastCandle = candleData[candleData.length - 1];
  const { minPrice, priceRange, PRICE_SCALE } = normParams;
  const priceY = (lastCandle.close - minPrice) / priceRange * PRICE_SCALE;

  const target = new THREE.Vector3(lastX, priceY, 0);
  const camPos = new THREE.Vector3(lastX + 3, priceY + 2, 22);

  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const duration = 800;
  const startTime = Date.now();

  function animateFocus() {
    const elapsed = Date.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);

    camera.position.lerpVectors(startPos, camPos, ease);
    controls.target.lerpVectors(startTarget, target, ease);

    if (t < 1) requestAnimationFrame(animateFocus);
  }
  animateFocus();
}

export function toggleLock(
  controls: OrbitControls,
  isLocked: boolean,
  camera: THREE.PerspectiveCamera,
  candleData: CandleData[]
): boolean {
  const newLocked = !isLocked;
  controls.enableRotate = !newLocked;
  controls.enablePan = !newLocked;
  controls.autoRotate = !newLocked;

  if (newLocked) centerCamera(camera, controls, candleData);
  return newLocked;
}
