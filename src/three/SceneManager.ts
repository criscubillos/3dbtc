import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

import type { CandleData, CandleMeshSet, NormParams } from '@/types';
import { CANDLE_SPACING, EMA_PERIOD, FETCH_CANDLES, VISIBLE_CANDLES, PRICE_SCALE, VOLUME_SCALE } from '@/constants';
import { formatPrice } from '@/utils/formatters';
import { fetchKlines } from '@/services/binanceApi';
import { BinanceWebSocket, type WsCallbacks } from '@/services/binanceWebSocket';
import { useCryptoStore } from '@/stores/useCryptoStore';

import { initFloor } from './FloorBuilder';
import { initParticles, updateParticles } from './ParticleSystem';
import { TradeParticlesManager } from './TradeParticles';
import { LabelsManager } from './Labels';
import { Liquidations3DManager } from './Liquidations3D';
import { calcEMA, buildEMARope, updateLiveEMA } from './EMABuilder';
import { buildGrid } from './GridBuilder';
import { buildCandles, updateLastCandleGeometry } from './CandleBuilder';
import { RaycasterManager } from './Raycaster';
import { getCenterX, centerCamera, focusLastCandle, toggleLock } from './CameraAnimations';

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private controls: OrbitControls;
  private labelRenderer: CSS2DRenderer;

  private candleGroup: THREE.Group;
  private gridGroup: THREE.Group;
  private floorMesh: THREE.Mesh;
  private particleSystem: THREE.Points;
  private tradeParticles: TradeParticlesManager;
  private labels: LabelsManager;
  private liquidationFeed: Liquidations3DManager;
  private raycasterMgr: RaycasterManager;

  private candleData: CandleData[] = [];
  private candleMeshes: CandleMeshSet[] = [];
  private emaValues: (number | undefined)[] = [];
  private emaMesh: THREE.Mesh | null = null;
  private normParams: NormParams | null = null;

  private livePrice: number | null = null;
  private isLocked = false;
  private sparksEnabled = true;
  private hoveredIndex = -1;

  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private animationId: number | null = null;
  private ws: BinanceWebSocket | null = null;
  private lastLiquidationPruneAt = 0;
  private spaceDown = false;
  private disposed = false;

  private keydownHandler: (e: KeyboardEvent) => void;
  private keyupHandler: (e: KeyboardEvent) => void;
  private resizeHandler: () => void;
  private autoRotateFrontAzimuth = 0;
  private autoRotatePausedByBackView = false;
  private readonly autoRotateStopSweep = Math.PI * 0.48;
  private readonly autoRotateResumeSweep = Math.PI * 0.14;

  constructor(container: HTMLElement) {
    this.container = container;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0a0f, 0.008);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      50, container.clientWidth / container.clientHeight, 0.1, 500
    );
    this.camera.position.set(101.8, 28.8, 115.4);
    this.camera.lookAt(70.4, 13.4, 0.2);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    container.appendChild(this.renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0x1a1a3e, 0.42);
    this.scene.add(ambient);
    const pointLight1 = new THREE.PointLight(0x00ffff, 0.85, 150);
    pointLight1.position.set(50, 40, 20);
    this.scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(0xff0088, 0.55, 150);
    pointLight2.position.set(50, 30, -20);
    this.scene.add(pointLight2);

    // Groups
    this.candleGroup = new THREE.Group();
    this.scene.add(this.candleGroup);
    this.gridGroup = new THREE.Group();
    this.scene.add(this.gridGroup);

    // Post-processing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.36, 0.22, 0.48
    );
    this.composer.addPass(bloom);

    // Label renderer
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(container.clientWidth, container.clientHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(this.labelRenderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(70.4, 13.4, 0.2);
    this.controls.minDistance = 15;
    this.controls.maxDistance = 180;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.15;
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 0.8;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    this.controls.update();
    this.autoRotateFrontAzimuth = this.controls.getAzimuthalAngle();

    // Keyboard
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !this.spaceDown) {
        this.spaceDown = true;
        this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
        e.preventDefault();
      }
    };
    this.keyupHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        this.spaceDown = false;
        this.controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
      }
    };
    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);

    // Resize
    this.resizeHandler = () => this.onResize();
    window.addEventListener('resize', this.resizeHandler);

    // Builders
    this.floorMesh = initFloor(this.scene);
    this.particleSystem = initParticles(this.scene);
    this.tradeParticles = new TradeParticlesManager(this.scene);
    this.labels = new LabelsManager();
    this.liquidationFeed = new Liquidations3DManager(this.scene);
    this.raycasterMgr = new RaycasterManager(container);
  }

  async fetchAndRender(): Promise<void> {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);

    const store = useCryptoStore.getState();
    const { symbol, interval } = store;

    try {
      const allCandles = await fetchKlines(symbol.symbol, interval, FETCH_CANDLES);

      let emaAll = calcEMA(allCandles, EMA_PERIOD);
      const trimStart = Math.max(0, allCandles.length - VISIBLE_CANDLES);
      this.candleData = allCandles.slice(trimStart);
      this.emaValues = emaAll.slice(trimStart);

      this.updatePriceFromCandles();
      this.rebuildScene();

      store.setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      store.setLoading(false);
    }

    this.scheduleNextRefresh();
  }

  private updatePriceFromCandles(): void {
    if (!this.candleData.length) return;
    const last = this.candleData[this.candleData.length - 1];
    const first = this.candleData[0];
    const pctChange = ((last.close - first.open) / first.open * 100);

    const store = useCryptoStore.getState();
    store.setLivePrice(last.close);
    store.setPriceChange(pctChange);
  }

  private rebuildScene(): void {
    const store = useCryptoStore.getState();

    const { meshes, normParams } = buildCandles(this.candleGroup, this.candleData);
    this.candleMeshes = meshes;
    this.normParams = normParams;

    // Last price label
    if (this.candleMeshes.length > 0) {
      const lastIdx = this.candleMeshes.length - 1;
      this.labels.createLastPriceLabel(
        this.candleData[lastIdx],
        this.candleMeshes[lastIdx].body,
        store.symbol.base
      );
    }

    // Reset hover
    this.hoveredIndex = -1;
    this.labels.removeHoverLabel();

    // EMA
    this.emaMesh = buildEMARope(this.candleGroup, this.emaMesh, this.candleData, this.emaValues, this.normParams);
    this.updateEMAOverlay(-1);

    // Grid
    const xMax = (this.candleData.length - 1) * CANDLE_SPACING + 2;
    const yMax = PRICE_SCALE + 5;
    const zMax = (VOLUME_SCALE / 2 + 2) * 3;
    buildGrid(
      this.gridGroup, this.candleData, xMax, yMax, zMax,
      normParams.minPrice, normParams.priceRange,
      store.symbol.base, store.interval
    );
    this.liquidationFeed.setLayout(xMax, yMax, zMax);

    // Center camera
    const cx = getCenterX(this.candleData);
    this.controls.target.set(cx, PRICE_SCALE / 3, 0);
  }

  private scheduleNextRefresh(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    const store = useCryptoStore.getState();
    const intervalMs = {
      '1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000,
      '4h': 14400000, '1d': 86400000, '1w': 604800000, '1M': 2592000000,
    }[store.interval] || 60000;
    const now = Date.now();
    const msUntilNextClose = intervalMs - (now % intervalMs) + 1500;
    this.refreshTimer = setTimeout(() => this.fetchAndRender(), msUntilNextClose);
  }

  updateLivePrice(price: number): void {
    this.livePrice = price;
    if (!this.candleData.length || !this.normParams) return;

    const store = useCryptoStore.getState();
    const first = this.candleData[0];
    const pctChange = ((price - first.open) / first.open * 100);
    store.setLivePrice(price);
    store.setPriceChange(pctChange);

    // Update label text
    this.labels.updateLastPriceLabelText(price);

    // Update geometry
    const depthBefore = this.candleMeshes.length
      ? (this.candleMeshes[this.candleMeshes.length - 1].body.geometry as THREE.BoxGeometry).parameters.depth
      : 1;

    updateLastCandleGeometry(this.candleMeshes, this.candleData, this.normParams, price);

    const bodyH = this.candleMeshes.length
      ? (this.candleMeshes[this.candleMeshes.length - 1].body.geometry as THREE.BoxGeometry).parameters.height
      : 1;
    this.labels.updateLastPriceLabelPosition(bodyH);

    // Update EMA
    updateLiveEMA(this.emaValues, price);
    this.emaMesh = buildEMARope(this.candleGroup, this.emaMesh, this.candleData, this.emaValues, this.normParams);
    if (this.hoveredIndex < 0) this.updateEMAOverlay(-1);
  }

  private updateEMAOverlay(index: number): void {
    const store = useCryptoStore.getState();
    if (index >= 0 && index < this.emaValues.length && this.emaValues[index] !== undefined) {
      store.setEmaValue(formatPrice(this.emaValues[index]!));
    } else if (this.emaValues.length > 0) {
      const last = this.emaValues[this.emaValues.length - 1];
      store.setEmaValue(last !== undefined ? formatPrice(last) : '--');
    } else {
      store.setEmaValue('--');
    }
  }

  spawnTradeParticles(data: Record<string, string | boolean>): void {
    if (!this.sparksEnabled) return;
    this.tradeParticles.spawn(
      data as unknown as { p: string; q: string; m: boolean },
      this.normParams!,
      this.candleData
    );
  }

  centerCameraCmd(): void {
    centerCamera(this.camera, this.controls, this.candleData);
  }

  focusLastCandleCmd(): void {
    focusLastCandle(this.camera, this.controls, this.candleData, this.normParams);
  }

  toggleLockCmd(): boolean {
    this.isLocked = toggleLock(this.controls, this.isLocked, this.camera, this.candleData);
    return this.isLocked;
  }

  toggleSparksCmd(): boolean {
    this.sparksEnabled = !this.sparksEnabled;
    if (!this.sparksEnabled) this.tradeParticles.clear();
    return this.sparksEnabled;
  }

  connectWebSocket(symbol: string): void {
    this.ws?.dispose();
    const callbacks: WsCallbacks = {
      onTrade: (price) => this.updateLivePrice(price),
      onTicker: (data) => {
        const store = useCryptoStore.getState();
        store.setStats24h({
          high: parseFloat(data.h),
          low: parseFloat(data.l),
          changePct: parseFloat(data.P),
          volBase: parseFloat(data.v),
          volQuote: parseFloat(data.q),
          trades: parseInt(data.n),
          vwap: parseFloat(data.w),
        });
      },
      onBookTicker: (data) => {
        const bid = parseFloat(data.b);
        const ask = parseFloat(data.a);
        const spread = ask - bid;
        const spreadPct = (spread / ask) * 100;
        const store = useCryptoStore.getState();
        store.setSpread({ bid, ask, spread, spreadPct });
      },
      onAggTrade: (data) => {
        this.spawnTradeParticles(data);
      },
      onLiquidation: (data) => {
        const order = data.o as Record<string, string> | undefined;
        if (!order) return;

        const quantity = parseFloat(order.q ?? '0');
        const price = parseFloat(order.ap ?? order.p ?? '0');
        if (!Number.isFinite(quantity) || !Number.isFinite(price) || quantity <= 0 || price <= 0) return;

        useCryptoStore.getState().addLiquidation({
          symbol: order.s ?? symbol,
          side: order.S === 'SELL' ? 'LONG' : 'SHORT',
          price,
          quantity,
          valueUsd: quantity * price,
        });
      },
    };
    this.ws = new BinanceWebSocket(symbol, callbacks);
  }

  startAnimationLoop(): void {
    const animate = () => {
      if (this.disposed) return;
      this.animationId = requestAnimationFrame(animate);
      this.controls.update();
      this.syncAutoRotateFrontGuard();

      const store = useCryptoStore.getState();
      const now = performance.now();
      if (now - this.lastLiquidationPruneAt > 500) {
        store.pruneLiquidations();
        this.lastLiquidationPruneAt = now;
      }
      this.liquidationFeed.sync(store.liquidations, store.showLiquidations, this.camera);

      updateParticles(this.particleSystem);
      this.tradeParticles.update(1 / 60);

      // Hover
      this.raycasterMgr.update(
        this.camera,
        this.candleMeshes,
        this.candleData,
        this.labels,
        this.emaValues,
        store.symbol.base,
        store.interval,
        (index) => this.updateEMAOverlay(index)
      );

      this.composer.render();
      this.labelRenderer.render(this.scene, this.camera);
    };
    animate();
  }

  private syncAutoRotateFrontGuard(): void {
    if (this.isLocked) {
      this.autoRotatePausedByBackView = false;
      return;
    }

    const currentAzimuth = this.controls.getAzimuthalAngle();
    const delta = Math.atan2(
      Math.sin(currentAzimuth - this.autoRotateFrontAzimuth),
      Math.cos(currentAzimuth - this.autoRotateFrontAzimuth)
    );
    const absDelta = Math.abs(delta);

    if (this.controls.autoRotate) {
      if (absDelta >= this.autoRotateStopSweep) {
        this.controls.autoRotate = false;
        this.autoRotatePausedByBackView = true;
      }
      return;
    }

    if (this.autoRotatePausedByBackView && absDelta <= this.autoRotateResumeSweep) {
      this.controls.autoRotate = true;
      this.autoRotatePausedByBackView = false;
    }
  }

  private onResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
  }

  dispose(): void {
    this.disposed = true;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.ws?.dispose();

    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
    window.removeEventListener('resize', this.resizeHandler);

    this.raycasterMgr.dispose();
    this.controls.dispose();
    this.tradeParticles.dispose();
    this.liquidationFeed.dispose();
    this.composer.dispose();

    // Release WebGL context on hot reloads to avoid renderer creation failures.
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();

    this.renderer.domElement.remove();
    this.labelRenderer.domElement.remove();
  }
}
