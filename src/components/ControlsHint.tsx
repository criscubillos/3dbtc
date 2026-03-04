'use client';

export default function ControlsHint() {
  return (
    <div className="controls-hint">
      LMB: Rotate &middot; Space+Mouse: Pan &middot; Scroll: Zoom<br />
      <a
        href="https://aperture.cl"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'rgba(0,255,255,0.55)', fontSize: '11px', textDecoration: 'none', pointerEvents: 'auto' }}
      >
        Created by aperture.cl
      </a>
    </div>
  );
}
