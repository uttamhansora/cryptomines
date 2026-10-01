<script lang="ts">
  import { onMount } from 'svelte';

  let canvas = $state<HTMLCanvasElement | null>(null);

  onMount(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = canvas;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const dots = Array.from({ length: 14 }, (_, i) => ({
      x: ((i * 137) % 100) / 100,
      y: ((i * 89) % 100) / 100,
      s: 0.4 + (i % 5) * 0.15,
      v: 0.015 + (i % 3) * 0.008,
    }));
    const resize = () => {
      c.width = window.innerWidth * dpr;
      c.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    let raf = 0;
    const tick = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.y -= d.v / h;
        if (d.y < 0) d.y = 1;
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#ff7a1a';
        const px = d.x * w;
        const py = d.y * h;
        ctx.fillRect(px, py, d.s, d.s * 2.5);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  });
</script>

<div class="stage-bg" aria-hidden="true">
  <img class="hall" src="./assets/game/background/vault-hall.svg" alt="" />
  <div class="cavern-glow"></div>
  <canvas class="dust" bind:this={canvas}></canvas>
  <div class="vignette"></div>
</div>

<style>
  .stage-bg {
    position: fixed;
    inset: 0;
    z-index: -1;
    background: var(--bg-primary);
    overflow: hidden;
  }
  .hall {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.28;
    filter: saturate(0.85) hue-rotate(-8deg);
  }
  .cavern-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 55% 45% at 50% 38%, rgba(72, 107, 26, 0.18), transparent 70%);
    pointer-events: none;
  }
  .dust {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    opacity: 0.55;
  }
  .vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 88% 72% at 50% 42%, transparent 32%, rgba(8, 7, 5, 0.82) 100%);
  }
</style>
