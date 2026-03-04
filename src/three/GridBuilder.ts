import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { CandleData } from '@/types';
import { CYAN, CANDLE_SPACING } from '@/constants';
import { formatTimeLabel } from '@/utils/formatters';

export function buildGrid(
  gridGroup: THREE.Group,
  candleData: CandleData[],
  xMax: number,
  yMax: number,
  zMax: number,
  minPrice: number,
  priceRange: number,
  base: string,
  interval: string
): void {
  while (gridGroup.children.length) {
    const child = gridGroup.children[0];
    child.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      if ((obj as THREE.Mesh).material) {
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else (mat as THREE.Material).dispose();
      }
    });
    gridGroup.remove(child);
  }

  const gridMat = new THREE.LineBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });

  const accentMat = new THREE.LineBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });

  const yBottom = -6;
  const zMin = -2;
  const xMin = -2;

  const ySteps = 8;
  const yStep = (yMax - yBottom) / ySteps;
  for (let i = 0; i <= ySteps; i++) {
    const y = yBottom + i * yStep;
    const mat = (i === 0 || i === ySteps) ? accentMat : gridMat;

    const pts1 = [new THREE.Vector3(xMin, y, zMin), new THREE.Vector3(xMax, y, zMin)];
    gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts1), mat));

    const pts2 = [new THREE.Vector3(xMin, y, zMin), new THREE.Vector3(xMin, y, zMax)];
    gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), mat));
  }

  const xSteps = 10;
  const xStep = (xMax - xMin) / xSteps;
  for (let i = 0; i <= xSteps; i++) {
    const x = xMin + i * xStep;
    const mat = (i === 0 || i === xSteps) ? accentMat : gridMat;

    const pts1 = [new THREE.Vector3(x, yBottom, zMin), new THREE.Vector3(x, yMax, zMin)];
    gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts1), mat));

    const pts2 = [new THREE.Vector3(x, yBottom, zMin), new THREE.Vector3(x, yBottom, zMax)];
    gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), mat));
  }

  const zSteps = 6;
  const zStep = (zMax - zMin) / zSteps;
  for (let i = 0; i <= zSteps; i++) {
    const z = zMin + i * zStep;
    const mat = (i === 0 || i === zSteps) ? accentMat : gridMat;

    const pts1 = [new THREE.Vector3(xMin, yBottom, z), new THREE.Vector3(xMax, yBottom, z)];
    gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts1), mat));

    const pts2 = [new THREE.Vector3(xMin, yBottom, z), new THREE.Vector3(xMin, yMax, z)];
    gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), mat));
  }

  // Time labels
  if (candleData.length > 0) {
    const labelCount = Math.min(10, candleData.length);
    const step = Math.floor(candleData.length / labelCount);

    for (let i = 0; i < candleData.length; i += step) {
      const c = candleData[i];
      const x = i * CANDLE_SPACING;
      const div = document.createElement('div');
      div.className = 'time-label-3d';
      div.textContent = formatTimeLabel(c.time, interval);
      const label = new CSS2DObject(div);
      label.position.set(x, yBottom - 1.2, zMax + 1);
      gridGroup.add(label);
    }

    const lastI = candleData.length - 1;
    if (lastI % step !== 0) {
      const div = document.createElement('div');
      div.className = 'time-label-3d';
      div.textContent = formatTimeLabel(candleData[lastI].time, interval);
      const label = new CSS2DObject(div);
      label.position.set(lastI * CANDLE_SPACING, yBottom - 1.2, zMax + 1);
      gridGroup.add(label);
    }
  }

  // Asset name label
  const assetDiv = document.createElement('div');
  assetDiv.className = 'asset-label-3d';
  assetDiv.textContent = `${base} / USDT`;
  const assetLabel = new CSS2DObject(assetDiv);
  assetLabel.position.set((xMin + xMax) / 2, yMax + 1.5, zMin);
  gridGroup.add(assetLabel);

  // Price axis labels
  if (minPrice !== undefined && priceRange) {
    const PRICE_SCALE = yMax - 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = yBottom + i * yStep;
      const normalizedY = y / PRICE_SCALE;
      const price = minPrice + normalizedY * priceRange;
      if (price <= 0) continue;

      const div = document.createElement('div');
      div.className = 'price-axis-label';
      div.textContent = '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 });
      const label = new CSS2DObject(div);
      label.position.set(xMin, y, zMax + 1.5);
      gridGroup.add(label);
    }
  }
}
