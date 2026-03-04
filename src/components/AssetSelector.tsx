'use client';

import { useState, useRef, useEffect } from 'react';
import { useCryptoStore } from '@/stores/useCryptoStore';
import { CRYPTO_PAIRS } from '@/constants';

export default function AssetSelector() {
  const symbol = useCryptoStore((s) => s.symbol);
  const setSymbol = useCryptoStore((s) => s.setSymbol);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', handler);
    document.addEventListener('keydown', escHandler);
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', escHandler);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setFilter('');
      searchRef.current?.focus();
    }
  }, [open]);

  const q = filter.toLowerCase();
  const filtered = CRYPTO_PAIRS.filter(
    (p) =>
      !q ||
      p.base.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.symbol.toLowerCase().includes(q)
  );

  const handleSelect = (pair: typeof CRYPTO_PAIRS[number]) => {
    if (pair.symbol === symbol.symbol) {
      setOpen(false);
      return;
    }
    setSymbol(pair);
    setOpen(false);
  };

  return (
    <div className={`asset-selector${open ? ' open' : ''}`} ref={ref}>
      <button
        className="asset-selector-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <span>{symbol.base}/USDT</span>
        <span className="arrow">&#9660;</span>
      </button>
      <div className="asset-dropdown" onClick={(e) => e.stopPropagation()}>
        <input
          ref={searchRef}
          type="text"
          placeholder="Search pair..."
          autoComplete="off"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="asset-list">
          {filtered.map((pair) => (
            <div
              key={pair.symbol}
              className={`asset-item${pair.symbol === symbol.symbol ? ' active' : ''}`}
              onClick={() => handleSelect(pair)}
            >
              <span className="pair-symbol">{pair.base}</span>
              <span className="pair-name">{pair.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
