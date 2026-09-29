<script lang="ts">
  import { spawnParticles, prefersReducedMotion, type ParticlePalette } from '../animation/particles';

  interface Props {
    trigger: number;
    /** Palette key from the shared particle system — keeps every FX layer on-set. */
    palette?: ParticlePalette;
    count?: number;
    durationMs?: number;
  }
  let { trigger, palette = 'mine', count = 14, durationMs = 520 }: Props = $props();

  let canvas = $state<HTMLCanvasElement | null>(null);

  $effect(() => {
    if (!trigger || !canvas) return;
    if (prefersReducedMotion()) return;
    const c = canvas;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth;
    const h = c.clientHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Deterministic seeds only: identical bursts on replay, no visual RNG drift.
    const parts = spawnParticles(trigger * 977 + 13, count, palette, w / 2, h / 2);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = (now - start) / durationMs;
      ctx.clearRect(0, 0, w, h);
      if (t >= 1) {
        ctx.globalAlpha = 1;
        return;
      }
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        const alpha = p.life * (1 - t);
        if (alpha <= 0) continue;
        ctx.globalAlpha = Math.min(alpha, 1);
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
  });
</script>

<canvas class="spark" bind:this={canvas} aria-hidden="true"></canvas>

<style>
  .spark {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 4;
  }
</style>
