'use client';

import { useEffect, useRef } from 'react';
import { useCryptoStore } from '@/stores/useCryptoStore';
import { SceneManager } from '@/three/SceneManager';

declare global {
  interface Window {
    simulateLiquidations?: (count: number, intervalMs: number) => { scheduled: number; intervalMs: number };
  }
}

function ThreeCanvasInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneManager | null>(null);
  const skipFirstSymbolEffect = useRef(true);
  const skipFirstIntervalEffect = useRef(true);
  const liquidationTimersRef = useRef<number[]>([]);

  const symbol = useCryptoStore((s) => s.symbol);
  const interval = useCryptoStore((s) => s.interval);

  // Init scene once
  useEffect(() => {
    if (!containerRef.current) return;
    const mgr = new SceneManager(containerRef.current);
    sceneRef.current = mgr;
    mgr.startAnimationLoop();
    mgr.connectWebSocket(symbol.symbol);
    mgr.fetchAndRender();

    return () => {
      mgr.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const clearSimulationTimers = () => {
      liquidationTimersRef.current.forEach((id) => window.clearTimeout(id));
      liquidationTimersRef.current = [];
    };

    window.simulateLiquidations = (count: number, intervalMs: number) => {
      const total = Math.max(0, Math.floor(Number(count) || 0));
      const delay = Math.max(0, Math.floor(Number(intervalMs) || 0));
      clearSimulationTimers();

      for (let i = 0; i < total; i++) {
        const timerId = window.setTimeout(() => {
          const state = useCryptoStore.getState();
          const livePrice = state.livePrice ?? 70000;
          const swing = livePrice * (Math.random() * 0.012 - 0.006);
          const price = Math.max(0.00000001, livePrice + swing);
          const valueUsd = 5000 + Math.random() * 250000;
          const quantity = valueUsd / price;

          state.addLiquidation({
            symbol: state.symbol.symbol,
            side: Math.random() > 0.5 ? 'LONG' : 'SHORT',
            price,
            quantity,
            valueUsd,
          });
        }, i * delay);

        liquidationTimersRef.current.push(timerId);
      }

      return { scheduled: total, intervalMs: delay };
    };

    return () => {
      clearSimulationTimers();
      delete window.simulateLiquidations;
    };
  }, []);

  // React to symbol change
  useEffect(() => {
    if (skipFirstSymbolEffect.current) {
      skipFirstSymbolEffect.current = false;
      return;
    }

    const mgr = sceneRef.current;
    if (!mgr) return;
    const store = useCryptoStore.getState();
    store.resetForSymbolChange();
    mgr.connectWebSocket(symbol.symbol);
    mgr.fetchAndRender();
  }, [symbol]);

  // React to interval change
  useEffect(() => {
    if (skipFirstIntervalEffect.current) {
      skipFirstIntervalEffect.current = false;
      return;
    }

    const mgr = sceneRef.current;
    if (!mgr) return;
    mgr.fetchAndRender();
  }, [interval]);

  // Camera commands
  useEffect(() => {
    return useCryptoStore.subscribe((state, prev) => {
      const mgr = sceneRef.current;
      if (!mgr) return;

      if (state.cameraCommand && state.cameraCommand !== prev.cameraCommand) {
        if (state.cameraCommand === 'center') mgr.centerCameraCmd();
        if (state.cameraCommand === 'focus') mgr.focusLastCandleCmd();
        useCryptoStore.getState().setCameraCommand(null);
      }

      if (state.toggleLockCmd !== prev.toggleLockCmd) {
        mgr.toggleLockCmd();
      }

      if (state.toggleSparksCmd !== prev.toggleSparksCmd) {
        mgr.toggleSparksCmd();
      }
    });
  }, []);

  return <div id="canvas-container" ref={containerRef} />;
}

export default ThreeCanvasInner;
