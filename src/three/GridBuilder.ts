import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { CandleData } from '@/types';
import { CYAN, CANDLE_SPACING } from '@/constants';
import { formatPrice, formatTimeLabel } from '@/utils/formatters';

function createWallPriceLabel(text: string): THREE.Mesh {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const fallbackGeo = new THREE.PlaneGeometry(1, 0.25);
    const fallbackMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    return new THREE.Mesh(fallbackGeo, fallbackMat);
  }

  // HiDPI-friendly canvas text to keep labels crisp on zoom.
  const fontSize = 54;
  const paddingX = 22;
  const paddingY = 14;
  ctx.font = `700 ${fontSize}px monospace`;
  const metrics = ctx.measureText(text);
  const textW = Math.ceil(metrics.width);
  const textH = Math.ceil(fontSize);

  canvas.width = textW + paddingX * 2;
  canvas.height = textH + paddingY * 2;

  ctx.font = `700 ${fontSize}px monospace`;
  ctx.textBaseline = 'top';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0, 255, 255, 0.86)';
  ctx.shadowColor = 'rgba(0, 255, 255, 0.30)';
  ctx.shadowBlur = 10;
  ctx.fillText(text, paddingX, paddingY);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const h = 1.92;
  const w = h * (canvas.width / canvas.height);
  const geo = new THREE.PlaneGeometry(w, h);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(geo, mat);
}

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
        if (Array.isArray(mat)) {
          mat.forEach((m) => {
            if ('map' in m && (m as THREE.MeshBasicMaterial).map) {
              (m as THREE.MeshBasicMaterial).map?.dispose();
            }
            m.dispose();
          });
        } else {
          if ('map' in mat && (mat as THREE.MeshBasicMaterial).map) {
            (mat as THREE.MeshBasicMaterial).map?.dispose();
          }
          (mat as THREE.Material).dispose();
        }
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
    // Paint labels on the left wall plane (YZ), facing candles (+X).
    const priceLabelX = xMin + 0.02;
    const priceLabelZ = zMin + (zMax - zMin) * 0.28;

    for (let i = 0; i <= ySteps; i++) {
      const y = yBottom + i * yStep;
      const normalizedY = y / PRICE_SCALE;
      const price = minPrice + normalizedY * priceRange;
      if (price <= 0) continue;

      const label = createWallPriceLabel(formatPrice(price));
      label.position.set(priceLabelX, y, priceLabelZ);
      label.rotation.y = Math.PI / 2;
      gridGroup.add(label);
    }
  }
}
