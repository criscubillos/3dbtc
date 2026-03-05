'use client';

import { useEffect, useState } from 'react';
import { useCryptoStore } from '@/stores/useCryptoStore';
import { formatPrice, formatVolume } from '@/utils/formatters';

export default function Sidebar() {
  const stats = useCryptoStore((s) => s.stats24h);
  const spread = useCryptoStore((s) => s.spread);
  const [mobileOpen, setMobileOpen] = useState(false);

  const fillPct = spread
    ? Math.max(0, Math.min(100, (1 - spread.spreadPct / 0.1) * 100))
    : 50;

  useEffect(() => {
    const media = window.matchMedia('(min-width: 901px)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return (
    <>
      <button
        id="sidebar-toggle"
        className={mobileOpen ? 'active' : ''}
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={mobileOpen ? 'Hide stats panel' : 'Show stats panel'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? 'Close' : 'Stats'}
      </button>

      <button
        id="sidebar-backdrop"
        className={mobileOpen ? 'open' : ''}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
        tabIndex={mobileOpen ? 0 : -1}
      />

      <div id="sidebar" className={mobileOpen ? 'open' : ''}>
        <div className="stats-panel">
          <div className="stats-title">24H STATS</div>
          <div className="stat-row">
            <span className="stat-label">HIGH</span>
            <span className="stat-val green">{stats ? formatPrice(stats.high) : '--'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">LOW</span>
            <span className="stat-val red">{stats ? formatPrice(stats.low) : '--'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">CHANGE</span>
            <span className={`stat-val ${stats ? (stats.changePct >= 0 ? 'green' : 'red') : ''}`}>
              {stats ? (stats.changePct >= 0 ? '+' : '') + stats.changePct.toFixed(2) + '%' : '--'}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">VOL BASE</span>
            <span className="stat-val cyan">{stats ? formatVolume(stats.volBase) : '--'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">VOL USDT</span>
            <span className="stat-val cyan">{stats ? '$' + formatVolume(stats.volQuote) : '--'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">TRADES</span>
            <span className="stat-val">{stats ? stats.trades.toLocaleString() : '--'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">VWAP</span>
            <span className="stat-val">{stats ? formatPrice(stats.vwap) : '--'}</span>
          </div>
        </div>
        <div className="spread-panel">
          <div className="stats-title">SPREAD</div>
          <div className="stat-row">
            <span className="stat-label">BID</span>
            <span className="stat-val green">{spread ? formatPrice(spread.bid) : '--'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">ASK</span>
            <span className="stat-val red">{spread ? formatPrice(spread.ask) : '--'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">SPREAD</span>
            <span className="stat-val cyan">
              {spread ? spread.spread.toFixed(2) + ' (' + spread.spreadPct.toFixed(4) + '%)' : '--'}
            </span>
          </div>
          <div className="spread-bar">
            <div className="spread-fill" style={{ width: fillPct + '%' }} />
          </div>
        </div>

        <div className="sidebar-donate">
          <a href="https://www.buymeacoffee.com/aperture" target="_blank" rel="noopener noreferrer">
            <img
              src="https://cdn.buymeacoffee.com/buttons/v2/default-green.png"
              alt="Buy Me A Coffee"
              style={{ height: '34px', width: '123px', borderRadius: '6px' }}
            />
          </a>
        </div>
      </div>
    </>
  );
}
