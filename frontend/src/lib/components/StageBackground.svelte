<script lang="ts">
  /**
   * StageBackground — animated ambient backdrop (v2).
   * Design decision: the previous canvas "space dust" rAF loop is replaced by
   * a pure-CSS gradient mesh + two slow-moving glow orbs + a static faint
   * grid. Only transform/opacity animate (compositor-only), and everything is
   * skipped entirely under prefers-reduced-motion — zero JS, zero paint cost.
   */
  let reducedMotion = $state(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
</script>

<div class="stage-bg" aria-hidden="true" class:reduced={reducedMotion}>
  <!-- vault hall artwork kept as a very low-opacity depth layer -->
  <img class="hall" src="./assets/game/background/vault-hall.svg" alt="" />
  <div class="mesh"></div>
  <div class="grid-mesh"></div>
  {#if !reducedMotion}
    <div class="orb orb-a"></div>
    <div class="orb orb-b"></div>
    <div class="orb orb-c"></div>
  {/if}
  <div class="vignette"></div>
</div>

<style>
  .stage-bg {
    position: fixed;
    inset: 0;
    z-index: -1;
    /* base: deep navy with a subtle top light-fall */
    background: linear-gradient(180deg, #050d14 0%, #050d14 55%, #02080d 100%);
    overflow: hidden;
  }
  .hall {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.16;
    filter: saturate(0.8) hue-rotate(-8deg);
  }
  /* soft gradient mesh — cyan above the board, violet bottom-right */
  .mesh {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 42% at 42% 8%, rgba(21, 94, 117, 0.30), transparent 70%),
      radial-gradient(ellipse 48% 40% at 96% 96%, rgba(76, 29, 149, 0.20), transparent 68%),
      radial-gradient(ellipse 40% 34% at 4% 88%, rgba(8, 51, 68, 0.26), transparent 66%);
    pointer-events: none;
  }
  /* faint futuristic grid, masked so it fades toward the edges */
  .grid-mesh {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.5;
    background-image:
      linear-gradient(rgba(25, 227, 227, 0.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(25, 227, 227, 0.045) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: radial-gradient(ellipse 90% 80% at 50% 40%, #000 10%, transparent 75%);
    -webkit-mask-image: radial-gradient(ellipse 90% 80% at 50% 40%, #000 10%, transparent 75%);
  }
  /* ── Slow-moving glow orbs (transform/opacity only) ─────────────── */
  .orb {
    position: absolute;
    width: 44vmax;
    height: 44vmax;
    border-radius: 50%;
    filter: blur(70px);
    will-change: transform;
    pointer-events: none;
  }
  .orb-a {
    left: -12vmax;
    top: -14vmax;
    background: radial-gradient(circle, rgba(25, 227, 227, 0.14), transparent 62%);
    animation: drift-a 26s ease-in-out infinite alternate;
  }
  .orb-b {
    right: -14vmax;
    bottom: -16vmax;
    background: radial-gradient(circle, rgba(79, 159, 192, 0.15), transparent 62%);
    animation: drift-b 32s ease-in-out infinite alternate;
  }
  .orb-c {
    left: 42%;
    top: 58%;
    width: 30vmax;
    height: 30vmax;
    background: radial-gradient(circle, rgba(35, 144, 155, 0.10), transparent 60%);
    animation: drift-c 38s ease-in-out infinite alternate;
  }
  @keyframes drift-a {
    from { transform: translate3d(0, 0, 0) scale(1); }
    to   { transform: translate3d(7vw, 5vh, 0) scale(1.12); }
  }
  @keyframes drift-b {
    from { transform: translate3d(0, 0, 0) scale(1.05); }
    to   { transform: translate3d(-6vw, -6vh, 0) scale(0.94); }
  }
  @keyframes drift-c {
    from { transform: translate3d(0, 0, 0); }
    to   { transform: translate3d(-5vw, 4vh, 0); }
  }
  .vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 88% 72% at 50% 42%, transparent 32%, rgba(4, 7, 13, 0.86) 100%);
  }
  /* Reduced motion: orbs are not rendered at all (see template); freeze any
     residual transitions on the layers that remain. */
  .reduced .mesh,
  .reduced .grid-mesh {
    animation: none;
  }
</style>
