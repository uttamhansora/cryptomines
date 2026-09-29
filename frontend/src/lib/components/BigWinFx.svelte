<script lang="ts">
  interface Props {
    active: boolean;
  }
  let { active }: Props = $props();
  let canvas = $state<HTMLCanvasElement | null>(null);

  $effect(() => {
    if (!active || !canvas) return;
    const c = canvas;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth;
    const h = c.clientHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    ctx.scale(dpr, dpr);
    const parts = Array.from({ length: 14 }, () => ({
      x: w / 2,
      y: h / 2,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 1,
      life: 1,
    }));
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.life -= 0.02;
        if (p.life <= 0) continue;
        alive = true;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = '#2ee6d6';
        ctx.fillRect(p.x, p.y, 3, 3);
      }
      if (alive) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });
</script>

{#if active}
  <canvas class="fx" bind:this={canvas} aria-hidden="true"></canvas>
{/if}

<style>
  .fx {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 7;
  }
</style>
