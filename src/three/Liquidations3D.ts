import * as THREE from 'three';
import type { LiquidationEntry } from '@/types';
import { formatPrice, formatVolume } from '@/utils/formatters';

type LiquidationMeshRecord = {
  entryId: string;
  texture: THREE.CanvasTexture;
  material: THREE.MeshBasicMaterial;
  mesh: THREE.Mesh;
};

const CARD_HEIGHT = 5.1;
const CARD_GAP = CARD_HEIGHT;
const VISIBLE_CARD_SLOTS = 5;
const TITLE_HEIGHT = 1.7;

function createTitleMesh(): {
  texture: THREE.CanvasTexture;
  material: THREE.MeshBasicMaterial;
  mesh: THREE.Mesh;
} {
  const canvas = document.createElement('canvas');
  const width = 640;
  const height = 120;
  canvas.width = width;
  canvas.height = height;

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const aspect = width / height;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(TITLE_HEIGHT * aspect, TITLE_HEIGHT), material);
  updateTitleMesh(texture, material, 1);

  return { texture, material, mesh };
}

function updateTitleMesh(
  texture: THREE.CanvasTexture,
  material: THREE.MeshBasicMaterial,
  opacity: number
): void {
  const canvas = texture.image as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(12, 18, 24, 0.72)';
  ctx.strokeStyle = 'rgba(74, 229, 255, 0.42)';
  ctx.lineWidth = 2;
  roundRect(ctx, 8, 8, width - 16, height - 16, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(216, 244, 252, 0.96)';
  ctx.font = '700 42px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Liquidations', width / 2, height / 2 + 1);

  texture.needsUpdate = true;
  material.opacity = opacity;
  material.color.setHex(0xffffff);
}

function createLiquidationMesh(entry: LiquidationEntry): LiquidationMeshRecord {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(8.2, CARD_HEIGHT),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    return {
      entryId: entry.id,
      texture: new THREE.CanvasTexture(canvas),
      material: mesh.material as THREE.MeshBasicMaterial,
      mesh,
    };
  }

  const width = 520;
  const height = 156;
  canvas.width = width;
  canvas.height = height;

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const aspect = width / height;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(CARD_HEIGHT * aspect, CARD_HEIGHT), material);

  const record = { entryId: entry.id, texture, material, mesh };
  updateLiquidationMesh(record, entry, 1);
  return record;
}

function updateLiquidationMesh(record: LiquidationMeshRecord, entry: LiquidationEntry, opacity: number): void {
  const canvas = record.texture.image as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const bg = entry.side === 'LONG' ? 'rgba(5, 13, 10, 0.95)' : 'rgba(17, 8, 11, 0.95)';
  const accent = entry.color;
  const bodyText = 'rgba(229, 238, 245, 0.94)';
  const subText = 'rgba(198, 211, 221, 0.86)';

  ctx.fillStyle = bg;
  ctx.strokeStyle = `${accent}cc`;
  ctx.lineWidth = 2;
  roundRect(ctx, 6, 6, width - 12, height - 12, 16);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = accent;
  ctx.font = '700 34px Orbitron, sans-serif';
  ctx.fillText(`${entry.symbol.replace('USDT', '')}  ${entry.side}`, 24, 42);

  ctx.fillStyle = bodyText;
  ctx.font = '600 23px "Share Tech Mono", monospace';
  ctx.fillText(`${formatVolume(entry.quantity)} @ ${formatPrice(entry.price)}`, 24, 86);

  ctx.fillStyle = subText;
  ctx.font = '600 22px "Share Tech Mono", monospace';
  ctx.fillText(`$${formatVolume(entry.valueUsd, 'USDT')}`, 24, 122);

  record.texture.needsUpdate = true;
  record.material.opacity = opacity;
  record.material.color.setHex(0xffffff);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export class Liquidations3DManager {
  private readonly group = new THREE.Group();
  private readonly cards = new Map<string, LiquidationMeshRecord>();
  private readonly title = createTitleMesh();
  private x = 0;
  private z = 0;
  private yBottom = -6;
  private yTop = 24;

  constructor(scene: THREE.Scene) {
    scene.add(this.group);
    this.group.add(this.title.mesh);
    this.title.mesh.visible = false;
  }

  setLayout(xMax: number, yMax: number, zMax: number): void {
    this.x = xMax + 11;
    this.z = zMax * 0.22;
    this.yBottom = -4;
    this.yTop = Math.min(
      yMax - 3,
      this.yBottom + (VISIBLE_CARD_SLOTS - 1) * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT
    );
  }

  sync(entries: LiquidationEntry[], visible: boolean, camera: THREE.PerspectiveCamera): void {
    this.group.visible = visible;

    const visibleEntries = entries.slice(-VISIBLE_CARD_SLOTS);
    this.title.mesh.visible = visible && visibleEntries.length > 0;
    const wantedIds = new Set(visibleEntries.map((entry) => entry.id));
    for (const [id, card] of this.cards) {
      if (wantedIds.has(id)) continue;
      card.mesh.geometry.dispose();
      card.material.map?.dispose();
      card.material.dispose();
      this.group.remove(card.mesh);
      this.cards.delete(id);
    }

    const now = Date.now();
    const slotStep = CARD_HEIGHT + CARD_GAP;
    const topSlotY = this.yBottom + (VISIBLE_CARD_SLOTS - 1) * slotStep;

    if (this.title.mesh.visible) {
      const titleY = topSlotY + CARD_HEIGHT * 0.8;
      this.title.mesh.position.set(this.x, titleY, this.z);
      this.title.mesh.lookAt(camera.position.x, titleY, camera.position.z);
      updateTitleMesh(this.title.texture, this.title.material, 0.92);
    }

    visibleEntries.forEach((entry, index) => {
      let card = this.cards.get(entry.id);
      if (!card) {
        card = createLiquidationMesh(entry);
        this.group.add(card.mesh);
        this.cards.set(entry.id, card);
      }

      const life = THREE.MathUtils.clamp((now - entry.createdAt) / Math.max(1, entry.expiresAt - entry.createdAt), 0, 1);
      const slotIndexFromBottom = visibleEntries.length - 1 - index;
      const y = this.yBottom + slotIndexFromBottom * slotStep;
      const opacity = life < 0.08 ? life / 0.08 : life > 0.86 ? (1 - life) / 0.14 : 1;

      updateLiquidationMesh(card, entry, THREE.MathUtils.clamp(opacity, 0, 1));
      card.mesh.position.set(this.x, y, this.z);
      card.mesh.lookAt(camera.position.x, y, camera.position.z);
    });
  }

  dispose(): void {
    for (const [, card] of this.cards) {
      card.mesh.geometry.dispose();
      card.material.map?.dispose();
      card.material.dispose();
      this.group.remove(card.mesh);
    }
    this.title.mesh.geometry.dispose();
    this.title.material.map?.dispose();
    this.title.material.dispose();
    this.cards.clear();
    this.group.removeFromParent();
  }
}
