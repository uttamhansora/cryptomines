<script lang="ts">
  import gsap from 'gsap';
  import Icon from './Icon.svelte';
  import { WIN_TIER_BIG, WIN_TIER_GOOD, WIN_TIER_MEGA } from '@crypto-mines/shared';

  interface Props {
    multiplier: number;
    payout: number;
    active: boolean;
    chainBonusBook?: number;
    onSettled?: () => void;
  }
  let { multiplier, payout, active, chainBonusBook = 0, onSettled }: Props = $props();

  let root = $state<HTMLElement | null>(null);
  let hero = $state<HTMLElement | null>(null);
  let titleEl = $state<HTMLElement | null>(null);
  let multEl = $state<HTMLElement | null>(null);
  let payEl = $state<HTMLElement | null>(null);
  let canvas = $state<HTMLCanvasElement | null>(null);
  let displayPay = $state(0);

  const tier = $derived(
    multiplier >= WIN_TIER_MEGA ? 'mega' : multiplier >= WIN_TIER_BIG ? 'big' : multiplier >= WIN_TIER_GOOD ? 'good' : 'none',
  );
  const tierLabel = $derived(
    tier === 'mega' ? 'MEGA WIN' : tier === 'big' ? 'BIG WIN' : tier === 'good' ? 'GOOD WIN' : '',
  );
  const chainMult = $derived(chainBonusBook / 100);

  function seedParticle(i: number, payoutVal: number) {
    const t = (i * 17 + Math.floor(payoutVal * 100)) % 1000;
    const a = (t / 1000) * Math.PI * 2;
    const sp = 2 + (t % 5);
    return { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5, life: 0.85 + (i % 4) * 0.05 };
  }

  $effect(() => {
    if (!active || tier === 'none' || !root) return;
    displayPay = 0;
    const ctx = canvas?.getContext('2d');
    let raf = 0;
    const parts: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    const count = tier === 'mega' ? 32 : tier === 'big' ? 18 : 10;
    if (canvas) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx?.scale(dpr, dpr);
      for (let i = 0; i < count; i += 1) {
        const s = seedParticle(i, payout);
        parts.push({ x: w / 2, y: h / 2, vx: s.vx, vy: s.vy, life: s.life });
      }
    }

    const tl = gsap.timeline({
      onComplete: () => {
        cancelAnimationFrame(raf);
        onSettled?.();
      },
    });
    tl.fromTo(root, { opacity: 0 }, { opacity: 1, duration: tier === 'mega' ? 0.28 : 0.18 })
      .fromTo(
        hero,
        { scale: 0.55, y: 24, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: tier === 'mega' ? 0.62 : 0.38, ease: 'back.out(1.5)' },
        0.08,
      )
      .fromTo(titleEl, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.26 }, 0.14)
      .fromTo(multEl, { scale: 0.75, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.34, ease: 'power3.out' }, 0.2);

    const payProxy = { v: 0 };
    tl.to(
      payProxy,
      {
        v: payout,
        duration: tier === 'mega' ? 1.05 : tier === 'big' ? 0.72 : 0.48,
        ease: 'power2.out',
        onUpdate: () => {
          displayPay = payProxy.v;
        },
      },
      0.24,
    );

    if (ctx && canvas && count > 0) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const tick = () => {
        ctx.clearRect(0, 0, w, h);
        let alive = false;
        for (const p of parts) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.04;
          p.life -= tier === 'mega' ? 0.016 : 0.022;
          if (p.life <= 0) continue;
          alive = true;
          ctx.globalAlpha = p.life * 0.75;
          ctx.fillStyle =
            tier === 'good'
              ? p.life > 0.5
                ? '#5CF5FF'
                : '#00F0FF'
              : p.life > 0.5
                ? '#5CF5FF'
                : '#00F0FF';
          ctx.beginPath();
          ctx.arc(p.x, p.y, tier === 'mega' ? 2.5 : 2, 0, Math.PI * 2);
          ctx.fill();
        }
        if (alive) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    const shock = root.querySelector('.win-shock') as HTMLElement | null;
    if (tier === 'mega' && shock) {
      tl.fromTo(
        shock,
        { scale: 0.25, opacity: 0.75 },
        { scale: 2.2, opacity: 0, duration: 0.75, ease: 'power2.out', transformOrigin: '50% 50%' },
        0.12,
      );
      tl.to(root, { x: 5, duration: 0.03, repeat: 5, yoyo: true, ease: 'power1.inOut' }, 0.18);
    }

    tl.to(root, { opacity: 0, duration: 0.3, delay: tier === 'mega' ? 0.55 : tier === 'big' ? 0.35 : 0.22 });

    return () => {
      tl.kill();
      cancelAnimationFrame(raf);
    };
  });
</script>

{#if active && tier !== 'none'}
  <div class="win {tier}" bind:this={root} data-big-win role="status">
    <span class="win-shock" aria-hidden="true"></span>
    <canvas class="burst" bind:this={canvas} aria-hidden="true"></canvas>
    <div class="content">
      <span class="hero-wrap" bind:this={hero}>
        <Icon name="diamond" size={96} class="hero" />
      </span>
      <p class="title" bind:this={titleEl}>{tierLabel}</p>
      {#if chainMult > 0}
        <p class="chain">Chain Bonus +{chainMult.toFixed(2)}×</p>
      {/if}
      <p class="mult" bind:this={multEl}>{multiplier.toFixed(2)}×</p>
      <p class="pay" bind:this={payEl}>{displayPay.toFixed(2)}</p>
    </div>
  </div>
{/if}

<style>
  .win {
    position: fixed;
    inset: 0;
    z-index: 110;
    display: grid;
    place-items: center;
    pointer-events: none;
  }
  .win.good {
    background: radial-gradient(ellipse 65% 50% at 50% 45%, rgba(10, 15, 24, 0.45), rgba(5, 10, 16, 0.72));
  }
  .win.big {
    background: radial-gradient(ellipse 75% 58% at 50% 45%, rgba(9, 14, 21, 0.62), rgba(4, 9, 15, 0.88));
  }
  .win.mega {
    background: radial-gradient(ellipse 80% 62% at 50% 42%, rgba(8, 51, 68, 0.35), rgba(4, 8, 14, 0.92));
  }
  .win-shock {
    position: absolute;
    left: 50%;
    top: 42%;
    width: min(280px, 70vw);
    height: min(280px, 70vw);
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 2px solid rgba(125, 211, 252, 0.55);
    opacity: 0;
    pointer-events: none;
    box-shadow: 0 0 40px rgba(0, 240, 255, 0.35);
  }
  .burst {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .content {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: var(--space-md);
    max-width: min(92vw, 420px);
  }
  .hero-wrap {
    display: block;
    width: clamp(72px, 20vw, 108px);
    margin: 0 auto 0.5rem;
  }
  .hero {
    width: 100%;
    height: auto;
    filter: drop-shadow(0 0 28px rgba(14, 116, 144, 0.45));
  }
  .win.mega .hero {
    filter: drop-shadow(0 0 40px rgba(0, 210, 211, 0.55));
  }
  .title {
    margin: 0;
    font-family: var(--font-display);
    letter-spacing: 0.22em;
    font-size: clamp(0.72rem, 3.2vw, 0.95rem);
    color: var(--highlight-soft);
  }
  .win.mega .title {
    font-size: clamp(0.9rem, 4vw, 1.15rem);
    color: var(--highlight);
  }
  .chain {
    margin: 0.35rem 0 0;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    color: var(--accent-primary);
  }
  .mult {
    margin: 0.35rem 0 0;
    font-family: var(--font-display);
    font-size: clamp(1.75rem, 7vw, 2.65rem);
    color: var(--accent-secondary);
    text-shadow: 0 0 24px rgba(0, 240, 255, 0.28);
  }
  .win.mega .mult {
    font-size: clamp(2rem, 8vw, 3.1rem);
  }
  .pay {
    margin: 0.35rem 0 0;
    font-family: var(--font-display);
    font-size: clamp(1.1rem, 5vw, 1.65rem);
    color: var(--highlight);
    font-variant-numeric: tabular-nums;
  }
</style>
