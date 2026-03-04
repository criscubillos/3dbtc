'use client';

import { useState } from 'react';
import { useCryptoStore } from '@/stores/useCryptoStore';

export default function ViewControls() {
  const setCameraCommand = useCryptoStore((s) => s.setCameraCommand);
  const triggerToggleLock = useCryptoStore((s) => s.triggerToggleLock);
  const triggerToggleSparks = useCryptoStore((s) => s.triggerToggleSparks);

  const [isLocked, setIsLocked] = useState(false);
  const [sparksActive, setSparksActive] = useState(true);

  return (
    <div id="view-controls">
      <button onClick={() => setCameraCommand('center')} title="Center view">
        <svg viewBox="0 0 24 24">
          <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
        </svg>
        Center
      </button>
      <button
        className={isLocked ? 'active' : ''}
        onClick={() => {
          setIsLocked(!isLocked);
          triggerToggleLock();
        }}
        title="Lock view (disable rotation)"
      >
        <svg viewBox="0 0 24 24">
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" />
        </svg>
        Lock
      </button>
      <button onClick={() => setCameraCommand('focus')} title="Zoom to last candle">
        <svg viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z" />
        </svg>
        Focus
      </button>
      <button
        className={sparksActive ? 'active' : ''}
        onClick={() => {
          setSparksActive(!sparksActive);
          triggerToggleSparks();
        }}
        title="Toggle trade sparks"
      >
        <svg viewBox="0 0 24 24">
          <path d="M7 2v11h3v9l7-12h-4l4-8z" />
        </svg>
        Sparks
      </button>
    </div>
  );
}
