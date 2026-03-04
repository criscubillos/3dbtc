export function formatPrice(p: number): string {
  return '$' + p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatVolume(vol: number, unit = ''): string {
  const suffix = unit ? ' ' + unit : '';
  if (vol >= 1e9) return (vol / 1e9).toFixed(2) + 'B' + suffix;
  if (vol >= 1e6) return (vol / 1e6).toFixed(2) + 'M' + suffix;
  if (vol >= 1e3) return (vol / 1e3).toFixed(1) + 'K' + suffix;
  return vol.toFixed(0) + suffix;
}

export function formatTimeLabel(timestamp: number, interval: string): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());

  if (interval === '1M') return `${d.getFullYear()}/${month}`;
  if (interval === '1w' || interval === '1d') return `${month}/${day}`;
  if (interval === '4h') return `${month}/${day} ${hours}h`;
  return `${hours}:${mins}`;
}

export function formatDateTime(timestamp: number, interval: string): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  if (interval === '1M') return `${year}-${month}`;
  if (interval === '1w' || interval === '1d') return `${year}-${month}-${day}`;
  return `${year}-${month}-${day} ${hours}:${mins}`;
}
