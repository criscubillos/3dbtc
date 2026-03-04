'use client';

import { useEffect, useState } from 'react';
import { useCryptoStore } from '@/stores/useCryptoStore';
import { INTERVAL_MS } from '@/constants';

export default function Countdown() {
  const interval = useCryptoStore((s) => s.interval);
  const [time, setTime] = useState('--:--');

  useEffect(() => {
    const update = () => {
      const intervalMs = INTERVAL_MS[interval] || 60000;
      const now = Date.now();
      const remaining = intervalMs - (now % intervalMs);

      const totalSec = Math.floor(remaining / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;

      const pad = (n: number) => String(n).padStart(2, '0');

      if (h > 0) {
        setTime(`${pad(h)}:${pad(m)}:${pad(s)}`);
      } else {
        setTime(`${pad(m)}:${pad(s)}`);
      }
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [interval]);

  return (
    <div id="countdown">
      <div className="cd-label">next candle</div>
      <div className="cd-time">{time}</div>
    </div>
  );
}
