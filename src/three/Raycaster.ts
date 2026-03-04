import * as THREE from 'three';
import type { CandleMeshSet, CandleData } from '@/types';
import { LabelsManager } from './Labels';
import { formatPrice } from '@/utils/formatters';

export class RaycasterManager {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private container: HTMLElement;
  private readonly mouseMoveHandler: (e: MouseEvent) => void;
  hoveredIndex = -1;

  constructor(container: HTMLElement) {
    this.container = container;
    this.mouseMoveHandler = this.onMouseMove.bind(this);
    container.addEventListener('mousemove', this.mouseMoveHandler);
  }

  private onMouseMove(e: MouseEvent) {
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  update(
    camera: THREE.Camera,
    candleMeshes: CandleMeshSet[],
    candleData: CandleData[],
    labels: LabelsManager,
    emaValues: (number | undefined)[],
    base: string,
    interval: string,
    onEmaUpdate: (index: number) => void
  ): void {
    if (!candleMeshes.length) return;

    this.raycaster.setFromCamera(this.mouse, camera);

    const bodyMeshes = candleMeshes.map(m => m.body);
    const wickMeshes = candleMeshes.map(m => m.wick);
    const allTargets = [...bodyMeshes, ...wickMeshes];
    const intersects = this.raycaster.intersectObjects(allTargets);

    let newIndex = -1;

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      for (let i = 0; i < candleMeshes.length; i++) {
        if (hit === candleMeshes[i].body || hit === candleMeshes[i].wick) {
          newIndex = i;
          break;
        }
      }
    }

    if (newIndex === this.hoveredIndex) return;
    this.hoveredIndex = newIndex;

    labels.removeHoverLabel();

    if (newIndex < 0) {
      onEmaUpdate(-1);
      return;
    }

    onEmaUpdate(newIndex);

    // Don't show hover on last candle (has permanent label)
    if (newIndex === candleData.length - 1) return;

    labels.createHoverLabel(candleData[newIndex], candleMeshes[newIndex].body, base, interval);
  }

  dispose(): void {
    this.container.removeEventListener('mousemove', this.mouseMoveHandler);
  }
}
