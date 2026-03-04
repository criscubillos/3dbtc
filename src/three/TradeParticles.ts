import * as THREE from 'three';
import type { TradeParticle, NormParams, CandleData } from '@/types';
import { MAX_TRADE_PARTICLES, CANDLE_SPACING } from '@/constants';

export class TradeParticlesManager {
  particles: TradeParticle[] = [];
  private geo: THREE.BufferGeometry;
  private points: THREE.Points;

  constructor(scene: THREE.Scene) {
    this.geo = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_TRADE_PARTICLES * 3);
    const colors = new Float32Array(MAX_TRADE_PARTICLES * 3);

    for (let i = 0; i < MAX_TRADE_PARTICLES; i++) {
      positions[i * 3 + 1] = -1000;
    }

    this.geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  spawn(
    data: { p: string; q: string; m: boolean },
    normParams: NormParams,
    candleData: CandleData[]
  ) {
    if (!normParams || !candleData.length) return;

    const price = parseFloat(data.p);
    const qty = parseFloat(data.q);
    const isSeller = data.m;

    const { minPrice, priceRange, PRICE_SCALE } = normParams;
    const lastX = (candleData.length - 1) * CANDLE_SPACING;
    const y = (price - minPrice) / priceRange * PRICE_SCALE;

    const quoteVol = price * qty;
    const count = Math.min(15, Math.max(1, Math.floor(Math.log10(quoteVol + 1) * 2)));

    const isWhale = quoteVol > 50000;
    const baseSize = isWhale ? 0.5 : 0.25;

    const r = isSeller ? 1.0 : 0.0;
    const g = isSeller ? 0.0 : 1.0;
    const b = isSeller ? 0.27 : 0.53;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_TRADE_PARTICLES) {
        this.particles.shift();
      }

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 0.8 + Math.random() * 1.2;
      const vx = Math.sin(phi) * Math.cos(theta) * speed;
      const vy = Math.sin(phi) * Math.sin(theta) * speed * 0.7 + 0.3;
      const vz = Math.cos(phi) * speed;

      const life = 1.5 + Math.random() * 1.5;
      this.particles.push({
        x: lastX + (Math.random() - 0.5) * 0.5,
        y: y + (Math.random() - 0.5) * 0.5,
        z: (Math.random() - 0.5) * 1.5,
        vx, vy, vz,
        r, g, b,
        life,
        maxLife: life,
        size: baseSize + Math.random() * 0.2,
      });
    }
  }

  update(dt: number) {
    const positions = this.geo.attributes.position.array as Float32Array;
    const colors = this.geo.attributes.color.array as Float32Array;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 0.3 * dt;

      p.vx *= 0.98;
      p.vy *= 0.98;
      p.vz *= 0.98;
    }

    for (let i = 0; i < MAX_TRADE_PARTICLES; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        const lifeRatio = p.life / p.maxLife;
        const alpha = lifeRatio < 0.3 ? lifeRatio / 0.3 : 1.0;

        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
        colors[i * 3] = p.r * alpha;
        colors[i * 3 + 1] = p.g * alpha;
        colors[i * 3 + 2] = p.b * alpha;
      } else {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -1000;
        positions[i * 3 + 2] = 0;
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0;
        colors[i * 3 + 2] = 0;
      }
    }

    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }

  clear() {
    this.particles = [];
  }

  dispose() {
    this.geo.dispose();
    (this.points.material as THREE.PointsMaterial).dispose();
  }
}
