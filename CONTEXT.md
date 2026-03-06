# 3D-Crypto — Project Context Document

> This document describes the complete architecture, design decisions, and implementation details of the 3D-Crypto real-time cryptocurrency visualizer. It is intended to be read by an AI to generate or modify code.

## Overview

3D-Crypto is a single-page WebGL application (`index.html`) that renders real-time cryptocurrency candlestick charts in 3D using Three.js. It connects to Binance's public API for historical data and WebSocket streams for live updates.

**Author**: aperture.cl
**Stack**: Vanilla HTML/CSS/JS + Three.js 0.163.0 (CDN)
**Single file**: Everything lives in `index.html` (~2000 lines)

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│                      index.html                         │
│                                                         │
│  ┌──────────┐  ┌────────────┐  ┌─────────────────────┐ │
│  │   HTML    │  │    CSS     │  │     JavaScript      │ │
│  │  Layout   │  │  Styling   │  │  (ES Module)        │ │
│  │  ~90 ln   │  │  ~530 ln   │  │  ~1350 ln           │ │
│  └──────────┘  └────────────┘  └─────────────────────┘ │
│                                                         │
│  External Dependencies:                                 │
│  • Three.js 0.163.0 (CDN importmap)                     │
│  • Google Fonts (Orbitron, Share Tech Mono)              │
│  • Binance REST API + WebSocket                         │
└─────────────────────────────────────────────────────────┘
```

---

## HTML Layout Structure

```
<body>
  <div id="loading">               Full-screen loading overlay with pulsing text
  <div id="header">                Fixed top bar (60px height)
    .logo                          "3D-Crypto" gradient text
    .asset-selector                Crypto pair dropdown (12 pairs)
    .price-ticker                  Live price + % change badge
    .timeframe-selector            Buttons: 1m, 5m, 15m, 1h, 4h, 1d, 1w, 1M
  <div id="sidebar">               Fixed right panel (200px width)
    .stats-panel                   24h stats: HIGH, LOW, CHANGE, VOL, TRADES, VWAP
    .spread-panel                  Bid/Ask spread + liquidity bar
    Buy Me A Coffee button         Bottom of sidebar (margin-top: auto)
  <div id="canvas-container">       Three.js canvas (fills remaining space)
  <div id="indicator-overlay">      Top-left: EMA 55 label + value
  <div class="controls-hint">      Bottom-left: controls help + aperture.cl credit
  <div id="view-controls">         Bottom-center: Center, Lock, Focus, Sparks buttons
  <div id="countdown">             Bottom-right: next candle countdown timer
</body>
```

---

## CSS Design System

### Fonts
- **Orbitron** (400, 700, 900): Sci-fi headings, prices, labels
- **Share Tech Mono**: Monospace body text, data values

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#0a0a0f` | Body, loading screen |
| Green (bullish) | `#00ff88` | Buy candles, positive changes |
| Red (bearish) | `#ff0044` | Sell candles, negative changes |
| Cyan | `#00ffff` | UI accent, grid, labels |
| Orange | `#ff8800` | EMA indicator |
| Magenta | `#ff0088` | Secondary light, logo gradient |
| Bitcoin orange | `#f7931a` | Symbol text |

### Visual Effects
- `backdrop-filter: blur(10px)` on header and sidebar
- `text-shadow` glow on active elements
- `label-pulse` animation on last candle label (2s cycle)
- `dropIn` animation on dropdown (0.15s ease-out)

---

## JavaScript Architecture

### Imports (ES Module via importmap)
```javascript
import * as THREE from 'three'                    // Core
import { OrbitControls }                          // Camera controls
import { EffectComposer, RenderPass, UnrealBloomPass }  // Post-processing
import { CSS2DRenderer, CSS2DObject }             // DOM labels in 3D
```

### Global State

#### Session State
```javascript
currentSymbol = CRYPTO_PAIRS[0]    // { symbol: 'BTCUSDT', base: 'BTC', name: 'Bitcoin' }
currentInterval = '1h'             // Active timeframe
candleData = []                    // Array of candle objects
candleMeshes = []                  // Array of { body, wick, vol } meshes
ws = null                          // WebSocket connection
livePrice = null                   // Real-time price from @trade stream
normParams = null                  // { minPrice, priceRange, maxVol, PRICE_SCALE, VOLUME_SCALE }
emaValues = []                     // EMA values per candle
tradeParticles = []                // Active trade spark particles
sparksEnabled = true               // Sparks toggle state
isLocked = false                   // Camera lock state
hoveredIndex = -1                  // Currently hovered candle
```

#### Constants
```javascript
CANDLE_SPACING = 1.2       // X distance between candles
EMA_PERIOD = 55            // EMA smoothing period
VISIBLE_CANDLES = 100      // Displayed candle count
FETCH_CANDLES = 155        // 100 visible + 55 for EMA warmup
PRICE_SCALE = 40           // Price → Y multiplier
VOLUME_SCALE = 15          // Volume → Z (depth) multiplier
MAX_TRADE_PARTICLES = 300  // Particle buffer size
GREEN = 0x00ff88
RED = 0xff0044
CYAN = 0x00ffff
EMA_COLOR = 0xff8800
```

### Initialization Sequence
```
initScene()           → WebGLRenderer, PerspectiveCamera, lights, groups
initLabelRenderer()   → CSS2DRenderer for HTML labels in 3D
initPostProcessing()  → EffectComposer with UnrealBloomPass
initFloor()           → Procedural grid texture on PlaneGeometry
initParticles()       → 500 floating cyan background particles
initTradeParticles()  → Trade spark BufferGeometry (300 slots)
initControls()        → OrbitControls + keyboard bindings
initRaycaster()       → Raycaster for hover detection
bindUI()              → Button/dropdown event listeners
initWebSocket()       → Binance combined WebSocket streams
fetchAndRender()      → Fetch klines, calculate EMA, build 3D scene
animate()             → Start render loop
```

---

## Three.js Scene Graph

```
Scene
├── FogExp2(0x0a0a0f, 0.008)
├── AmbientLight(0x1a1a3e, 0.6)
├── PointLight(cyan, 1.5, range=150) @ (50, 40, 20)
├── PointLight(magenta, 1.0, range=150) @ (50, 30, -20)
├── floorMesh (PlaneGeometry 300×300, procedural grid texture)
├── candleGroup (Group)
│   ├── Per candle (×100):
│   │   ├── body (BoxGeometry 0.7×H×depth, emissive material)
│   │   ├── wick (BoxGeometry 0.08×H×0.08, emissive material)
│   │   └── vol  (BoxGeometry 0.9×H×depth, translucent, below y=0)
│   ├── emaMesh (TubeGeometry along CatmullRomCurve3, orange)
│   ├── lastPriceLabel (CSS2DObject, pulsing cyan border)
│   └── hoverLabel (CSS2DObject, white tooltip)
├── gridGroup (Group)
│   ├── Line objects (back wall, side wall, floor grid)
│   ├── CSS2DObject time labels (floor)
│   ├── CSS2DObject price labels (left wall)
│   └── CSS2DObject asset name (top of back wall)
├── particleSystem (Points, 500 background particles)
└── tradeParticleSystem (Points, 300 trade sparks, frustumCulled=false)
```

### Post-Processing Pipeline
```
EffectComposer
├── RenderPass(scene, camera)
└── UnrealBloomPass(strength=1.2, radius=0.4, threshold=0.2)
```

### Camera Setup
```javascript
PerspectiveCamera(fov=50, near=0.1, far=500)
Initial position: (101.8, 28.8, 115.4)
Initial target: (70.4, 13.4, 0.2)

OrbitControls:
  dampingFactor: 0.08
  autoRotate: true (speed: 0.15)
  minDistance: 15, maxDistance: 180
  maxPolarAngle: π/2 - 0.05 (prevents going below floor)

Input: LMB=rotate, Space+LMB=pan, Scroll=zoom, C=debug log
```

---

## Data Flow

### Historical Data (REST API)
```
Binance /api/v3/klines → candleData[] → buildCandles() → 3D meshes
                        → calcEMA()    → buildEMARope() → tube mesh
                        → buildGrid()  → grid lines + labels
```

### Real-Time Data (WebSocket Combined Streams)
```
wss://stream.binance.com:9443/stream?streams=${sym}@trade/${sym}@ticker/${sym}@bookTicker/${sym}@aggTrade

Message format: { stream: "btcusdt@trade", data: {...} }

Routing:
  @trade      → livePrice, updateLivePrice(), updateLastCandleGeometry()
  @ticker     → updateTickerStats() → sidebar 24h stats panel
  @bookTicker → updateSpread() → sidebar bid/ask spread panel
  @aggTrade   → spawnTradeParticles() → visual trade sparks
```

### Candle Auto-Refresh
```
fetchAndRender() → scheduleNextRefresh()
  → calculates ms until next candle close + 1.5s buffer
  → setTimeout(fetchAndRender, msUntilClose)
```

---

## Normalization Math (Price → 3D Coordinates)

### Coordinate System
```
Y ↑ (price, 0 to PRICE_SCALE=40)
  │
  └──→ X (time, candles spaced 1.2 units apart)
  Z → (volume/depth, toward viewer)
```

### Price Mapping
```javascript
minPrice = Math.min(...all highs and lows)
maxPrice = Math.max(...all highs and lows)
priceRange = maxPrice - minPrice

// Any price P maps to Y:
y = (P - minPrice) / priceRange * PRICE_SCALE

// Volume maps to Z depth:
depth = (volume / maxVol) * VOLUME_SCALE
```

### Candle Geometry
```javascript
// Body (open/close box)
bodyH = max(|close - open| / priceRange * 40, 0.15)  // min height for dojis
bodyY = (min(open,close) - minPrice) / priceRange * 40 + bodyH/2

// Wick (high/low thin box)
wickH = (high - low) / priceRange * 40
wickY = (low - minPrice) / priceRange * 40 + wickH/2

// Volume bar (below ground)

---

## Tracking Decision

- Google Tag Manager in this project must use the classic manual snippet in `src/app/layout.tsx`.
- Required placement:
  - inline GTM script in `<head>`
  - GTM `noscript` iframe immediately after opening `<body>`
- Reason:
  - the `@next/third-parties/google` `GoogleTagManager` integration was tested and did not expose the classic GTM snippet in the initial HTML source the way Google expected for detection.
  - the classic manual snippet was verified locally and was the version that Google detected correctly.
- Operational rule:
  - do not replace the manual GTM snippet with `@next/third-parties/google` unless detection is revalidated against the live deployed site.
volBarH = (volume / maxVol) * 5
volY = -volBarH/2 - 0.5
```

---

## EMA 55 Indicator

### Calculation
```javascript
k = 2 / (55 + 1) ≈ 0.0357
// First value: SMA of first 55 closes
// Then: ema[i] = close[i] * k + ema[i-1] * (1-k)
```

### Rendering
- CatmullRomCurve3 through EMA points (smooth interpolation)
- TubeGeometry (radius 0.18, 8 radial segments)
- Orange emissive material (0xff8800, emissiveIntensity 0.8)
- Rebuilt each frame when live price updates

---

## Trade Particle System

### Spawn Logic (from @aggTrade)
- Position: last candle X, price-normalized Y
- Color: green (0, 1, 0.53) for buyers, red (1, 0, 0.27) for sellers
- Count: `min(15, max(1, floor(log10(quoteVol) * 2)))` particles per trade
- Whale detection: quoteVol > $50K → larger particles (0.5 vs 0.25 base size)
- Velocity: random spherical distribution, slight upward bias

### Physics (per frame at 1/60 dt)
- Gravity: vy -= 0.3 * dt
- Damping: v *= 0.98
- Life: 1.5–3.0 seconds
- Fade: last 30% of life → alpha ramp to 0
- Buffer: circular, max 300 particles

### Material
- PointsMaterial, size 0.3, opacity 0.35
- AdditiveBlending, vertexColors, no depthWrite
- frustumCulled = false (required because initial positions at y=-1000)

---

## UI Interactions

### Asset Selector
- 12 pairs: BTC, ETH, SOL, BNB, XRP, DOGE, ADA, AVAX, DOT, LINK, MATIC, LTC
- Search filter by base/name/symbol
- On switch: reset all state, reconnect WebSocket, fetch new data

### View Controls
| Button | Function | Behavior |
|--------|----------|----------|
| Center | `centerCamera()` | 600ms easeOutCubic to overview position |
| Lock | `toggleLock()` | Disable rotation/pan/autoRotate |
| Focus | `focusLastCandle()` | 800ms easeOutCubic zoom to last candle |
| Sparks | `toggleSparks()` | Enable/disable trade particles |

### Hover Tooltips
- Raycaster checks candle body + wick meshes each frame
- Shows OHLCV + datetime as CSS2DObject label
- Updates EMA overlay value for hovered candle

### Countdown Timer
- Calculates `intervalMs - (Date.now() % intervalMs)` each frame
- Displays as MM:SS or HH:MM:SS

---

## Supported Crypto Pairs
```javascript
BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT, XRPUSDT, DOGEUSDT,
ADAUSDT, AVAXUSDT, DOTUSDT, LINKUSDT, MATICUSDT, LTCUSDT
```

## Supported Timeframes
```javascript
1m, 5m, 15m, 1h (default), 4h, 1d, 1w, 1M
```

---

## Performance Considerations
- Particle buffers are pre-allocated and reused (no GC pressure)
- maxDistance=180 limits visible geometry
- FogExp2 provides natural depth culling
- Bloom threshold=0.2 limits post-processing work
- CSS2DRenderer is separate from WebGL pipeline
- Trade particles capped at 300 with circular buffer
- DevicePixelRatio capped at 2

---

## External APIs

### Binance REST
```
GET https://api.binance.com/api/v3/klines
  ?symbol=BTCUSDT
  &interval=1h
  &limit=155
Response: Array of [openTime, open, high, low, close, volume, closeTime, quoteVolume, ...]
```

### Binance WebSocket (Combined Streams)
```
wss://stream.binance.com:9443/stream?streams=btcusdt@trade/btcusdt@ticker/btcusdt@bookTicker/btcusdt@aggTrade

@trade:      { p: price, q: quantity }
@ticker:     { h: high24h, l: low24h, P: changePct, v: baseVol, q: quoteVol, n: trades, w: vwap }
@bookTicker: { b: bidPrice, a: askPrice, B: bidQty, A: askQty }
@aggTrade:   { p: price, q: quantity, m: isBuyerMaker }
```

---

## File Structure
```
3dbtc/
├── index.html          ← Everything (HTML + CSS + JS, ~2000 lines)
├── CONTEXT.md          ← This document
└── .claude/            ← Claude Code workspace
```
