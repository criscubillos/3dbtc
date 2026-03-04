import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { CandleData, NormParams } from '@/types';
import { formatPrice, formatVolume, formatDateTime } from '@/utils/formatters';

export class LabelsManager {
  lastPriceLabel: CSS2DObject | null = null;
  hoverLabel: CSS2DObject | null = null;

  createLastPriceLabel(
    candle: CandleData,
    mesh: THREE.Mesh,
    base: string
  ): void {
    this.removeLastPriceLabel();

    const div = document.createElement('div');
    div.className = 'price-label-3d last';
    div.innerHTML = `
      <div class="label-price">${formatPrice(candle.close)}</div>
      <div class="label-vol">${formatVolume(candle.volume, base)} · $${formatVolume(candle.quoteVolume, 'USDT')}</div>
    `;

    const label = new CSS2DObject(div);
    const params = (mesh.geometry as THREE.BoxGeometry).parameters;
    label.position.set(7, params.height / 2 + 0.5, 0);
    mesh.add(label);
    this.lastPriceLabel = label;
  }

  removeLastPriceLabel(): void {
    if (this.lastPriceLabel) {
      this.lastPriceLabel.parent?.remove(this.lastPriceLabel);
      this.lastPriceLabel = null;
    }
  }

  updateLastPriceLabelText(price: number): void {
    if (this.lastPriceLabel?.element) {
      const priceDiv = this.lastPriceLabel.element.querySelector('.label-price');
      if (priceDiv) priceDiv.textContent = formatPrice(price);
    }
  }

  updateLastPriceLabelPosition(bodyH: number): void {
    if (this.lastPriceLabel) {
      this.lastPriceLabel.position.set(7, bodyH / 2 + 0.5, 0);
    }
  }

  createHoverLabel(
    candle: CandleData,
    mesh: THREE.Mesh,
    base: string,
    interval: string
  ): void {
    this.removeHoverLabel();

    const isGreen = candle.close >= candle.open;
    const colorClass = isGreen ? 'green' : 'red';

    const div = document.createElement('div');
    div.className = 'price-label-3d hover';
    div.innerHTML = `
      <div class="label-row" style="margin-bottom:4px">
        <span class="label-key" style="color:rgba(255,255,255,0.55)">${formatDateTime(candle.time, interval)}</span>
      </div>
      <div class="label-row">
        <span class="label-key">O</span><span class="label-val ${colorClass}">${formatPrice(candle.open)}</span>
        <span class="label-key">H</span><span class="label-val ${colorClass}">${formatPrice(candle.high)}</span>
      </div>
      <div class="label-row">
        <span class="label-key">L</span><span class="label-val ${colorClass}">${formatPrice(candle.low)}</span>
        <span class="label-key">C</span><span class="label-val ${colorClass}">${formatPrice(candle.close)}</span>
      </div>
      <div class="label-row">
        <span class="label-key">VOL</span><span class="label-vol">${formatVolume(candle.volume, base)}</span>
      </div>
      <div class="label-row">
        <span class="label-key">VOL$</span><span class="label-vol">$${formatVolume(candle.quoteVolume, 'USDT')}</span>
      </div>
    `;

    this.hoverLabel = new CSS2DObject(div);
    const params = (mesh.geometry as THREE.BoxGeometry).parameters;
    this.hoverLabel.position.set(0, params.height / 2 + 1.5, 0);
    mesh.add(this.hoverLabel);
  }

  removeHoverLabel(): void {
    if (this.hoverLabel) {
      this.hoverLabel.parent?.remove(this.hoverLabel);
      this.hoverLabel = null;
    }
  }
}

import type * as THREE from 'three';
