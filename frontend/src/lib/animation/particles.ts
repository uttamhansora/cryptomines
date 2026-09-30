/** Deterministic visual-only particles (no gameplay RNG). */

export type ParticlePalette = 'btc' | 'eth' | 'sol' | 'usdt' | 'diamond' | 'vault' | 'mine' | 'chain' | 'cashout' | 'good' | 'big' | 'mega';

const PALETTE: Record<ParticlePalette, string[]> = {
  btc: ['#f59e0b', '#fcd34d', '#fff7ed'],
  eth: ['#60a5fa', '#93c5fd', '#e0f2fe'],
  sol: ['#a855f7', '#22d3ee', '#e9d5ff'],
  usdt: ['#34d399', '#6ee7b7', '#ecfdf5'],
  diamond: ['#67e8f9', '#bae6fd', '#f0f9ff'],
  vault: ['#c9a227', '#2563eb', '#fde68a'],
  mine: ['#ef4444', '#fb923c', '#fca5a5'],
  chain: ['#2563eb', '#3b82f6', '#c9a227'],
  cashout: ['#2563eb', '#c9a227', '#3b82f6'],
  good: ['#4ade9a', '#2563eb', '#fff'],
  big: ['#c9a227', '#2563eb', '#fff'],
  mega: ['#67e8f9', '#c9a227', '#2563eb', '#fff'],
};

function hashSeed(seed: number, i: number): number {
  return ((seed * 1103515245 + 12345 + i * 7919) >>> 0) % 10000;
}

export interface CanvasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export function spawnParticles(
  seed: number,
  count: number,
  palette: ParticlePalette,
  cx: number,
  cy: number,
): CanvasParticle[] {
  const colors = PALETTE[palette];
  const out: CanvasParticle[] = [];
  for (let i = 0; i < count; i += 1) {
    const h = hashSeed(seed, i);
    const a = (h / 10000) * Math.PI * 2;
    const sp = 1.5 + (h % 400) / 100;
    out.push({
      x: cx,
      y: cy,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 0.8,
      life: 0.55 + (h % 300) / 1000,
      color: colors[h % colors.length]!,
      size: 1.5 + (h % 3),
    });
  }
  return out;
}

/** Respect the OS "reduce motion" setting for every canvas FX layer. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function runParticleBurst(
  canvas: HTMLCanvasElement,
  seed: number,
  palette: ParticlePalette,
  count: number,
  durationMs = 420,
): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;
  if (prefersReducedMotion()) return () => undefined;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const parts = spawnParticles(seed, count, palette, w / 2, h / 2);
  const start = performance.now();
  let raf = 0;
  const tick = (now: number) => {
    const t = (now - start) / durationMs;
    if (t >= 1) {
      ctx.clearRect(0, 0, w, h);
      return;
    }
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      const alpha = p.life * (1 - t);
      if (alpha <= 0) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export function symbolPalette(symbol: string | undefined): ParticlePalette {
  switch (String(symbol ?? '').toUpperCase()) {
    case 'BTC':
      return 'btc';
    case 'ETH':
      return 'eth';
    case 'SOL':
      return 'sol';
    case 'USDT':
      return 'usdt';
    case 'VAULT':
      return 'vault';
    case 'DIAMOND':
      return 'diamond';
    default:
      return 'usdt';
  }
}
