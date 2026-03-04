'use client';

import { useEffect, useRef } from 'react';
import { useCryptoStore } from '@/stores/useCryptoStore';
import { SceneManager } from '@/three/SceneManager';

function ThreeCanvasInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneManager | null>(null);
  const skipFirstSymbolEffect = useRef(true);
  const skipFirstIntervalEffect = useRef(true);

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
