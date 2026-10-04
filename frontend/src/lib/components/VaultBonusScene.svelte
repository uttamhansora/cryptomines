<script lang="ts">
  import Icon from './Icon.svelte';
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import { animateCurrencyCount, animateMultiplierCount } from '../vault/animate-payout';
  import { playSound } from '../sound/sound-manager';

  import type { VaultPickResult } from '../vault/types';

  interface VaultState {
    vaultLabels: string[];
    buyMode?: boolean;
  }

  interface Props {
    data: unknown;
    title?: string;
    variant?: 'organic' | 'buy';
    bet: number;
    onPick: (index: number) => Promise<VaultPickResult>;
    onComplete: () => void;
  }

  let {
    data,
    title = 'BONUS UNLOCKED',
    variant = 'organic',
    bet,
    onPick,
    onComplete,
  }: Props = $props();

  const vault = $derived(data as VaultState);
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  type Phase = 'intro' | 'select' | 'resolve' | 'complete' | 'exit';
  let phase = $state<Phase>('intro');
  let sceneEl: HTMLDivElement | undefined;
  let doorEl: HTMLDivElement | undefined;
  let pickedIndex = $state(-1);
  let result = $state<VaultPickResult | null>(null);
  let skipRequested = $state(false);

  async function runIntro() {
    if (reduced()) {
      phase = 'select';
      return;
    }
    playSound('bonus-enter');
    const tl = gsap.timeline();
    tl.fromTo(sceneEl, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    if (doorEl) {
      tl.fromTo(doorEl, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.5)' }, 0);
      tl.fromTo('.door-lock', { rotate: 0, opacity: 1 }, { rotate: 90, opacity: 0.35, duration: 0.35, stagger: 0.08, ease: 'power2.inOut' }, 0.25);
      tl.fromTo('.door-energy', { scale: 0.6, opacity: 0 }, { scale: 1.2, opacity: 0.85, duration: 0.5, ease: 'power2.out' }, 0.32);
      tl.fromTo('.door-light', { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1.35, duration: 0.55 }, 0.48);
      tl.to('.door-leaves-left', { x: '-38%', opacity: 0.15, duration: 0.65, ease: 'power3.inOut' }, 0.55);
      tl.to('.door-leaves-right', { x: '38%', opacity: 0.15, duration: 0.65, ease: 'power3.inOut' }, 0.55);
      tl.to('.door-img', { scale: 1.02, filter: 'brightness(1.15)', duration: 0.3, yoyo: true, repeat: 1 }, 0.5);
    }
    tl.from('.title-block', { y: 16, opacity: 0, duration: 0.35 }, 0.65);
    tl.from('.capsule', { y: 30, opacity: 0, stagger: 0.06, duration: 0.38, ease: 'power2.out' }, 0.75);
    await tl.then();
    phase = 'select';
  }

  onMount(() => {
    void runIntro();
  });

  async function select(i: number) {
    if (phase !== 'select' || pickedIndex >= 0) return;
    pickedIndex = i;
    phase = 'resolve';
    playSound('vault');
    if (!reduced()) {
      gsap.to('.capsule', { opacity: 0.25, scale: 0.94, duration: 0.25 });
      gsap.to(`.capsule[data-idx="${i}"]`, { y: -8, scale: 1.06, opacity: 1, duration: 0.35, ease: 'back.out(2)' });
    }
    result = await onPick(i);
    await playResolve(result);
    phase = 'complete';
    await playComplete(result);
    phase = 'exit';
    if (!reduced()) {
      await gsap.to(sceneEl, { opacity: 0, duration: 0.45, ease: 'power2.in' });
    }
    onComplete();
  }

  async function playResolve(r: VaultPickResult) {
    playSound('bonus-reveal');
    const multEl = sceneEl?.querySelector('[data-vault-mult]') as HTMLElement | null;
    const openEl = sceneEl?.querySelector('.capsule-open') as HTMLElement | null;
    if (!reduced() && openEl) {
      gsap.fromTo(openEl, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)' });
    }
    if (skipRequested || reduced()) {
      if (multEl) multEl.textContent = `${r.finalMult.toFixed(2)}×`;
      return;
    }
    await animateMultiplierCount(multEl, r.baseMult, r.finalMult, 0.9);
  }

  async function playComplete(r: VaultPickResult) {
    const payEl = sceneEl?.querySelector('[data-vault-payout]') as HTMLElement | null;
    playSound('round-end');
    if (skipRequested || reduced()) {
      if (payEl) payEl.textContent = r.payout.toFixed(2);
      return;
    }
    await animateCurrencyCount(payEl, 0, r.payout, 0.7);
    await gsap.to('.complete-banner', { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.8)' });
    await gsap.delayedCall(1.1, () => {});
  }

  function skip() {
    skipRequested = true;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="scene" bind:this={sceneEl} role="dialog" tabindex="-1" aria-label="Crypto Vault Bonus" onclick={skip}>
  <img class="bg" src="./assets/game/background/vault-hall.svg" alt="" />
  <div class="vignette" aria-hidden="true"></div>

  <div class="door-wrap" bind:this={doorEl} aria-hidden="true">
    <img class="door-img" src="./assets/game/vault/door.svg" alt="" width="240" height="240" />
    <span class="door-lock lock-a"></span>
    <span class="door-lock lock-b"></span>
    <span class="door-lock lock-c"></span>
    <div class="door-leaves-left"></div>
    <div class="door-leaves-right"></div>
    <div class="door-energy"></div>
    <div class="door-light"></div>
  </div>

  <div class="title-block">
    <p class="eyebrow">Crypto Vault</p>
    <h2>{title}</h2>
    {#if variant === 'buy'}
      <p class="badge">Purchased Bonus</p>
    {:else}
      <p class="badge organic">Vault Unlocked</p>
    {/if}
  </div>

  {#if phase === 'select' || phase === 'resolve'}
    <p class="hint">Choose one encrypted vault capsule.</p>
    <div class="capsules">
      {#each vault.vaultLabels as label, i}
        <button
          type="button"
          class="capsule"
          data-idx={i}
          disabled={pickedIndex >= 0}
          onclick={(e) => {
            e.stopPropagation();
            void select(i);
          }}
        >
          <img src="./assets/game/vault/capsule.svg" alt="" width="72" height="84" />
          <span class="lbl">Vault {label}</span>
        </button>
      {/each}
    </div>
  {/if}

  {#if phase === 'resolve' || phase === 'complete'}
    <div class="resolve">
      <div class="capsule-open">
        <Icon name="vault" size={64} />
      </div>
      <p class="mult-label">Multiplier</p>
      <p class="mult" data-vault-mult>{result ? `${result.baseMult.toFixed(2)}×` : '—'}</p>
    </div>
  {/if}

  {#if phase === 'complete' || phase === 'exit'}
    <div class="complete-banner">
      <p class="done">Crypto Vault Complete</p>
      <p class="payout">
        <span class="cur">+</span><span data-vault-payout>{result?.payout.toFixed(2) ?? '0.00'}</span>
      </p>
      {#if !result?.terminal}
        <p class="sub">Returning to the grid…</p>
      {/if}
    </div>
  {/if}

  <button type="button" class="skip" onclick={(e) => { e.stopPropagation(); skip(); }}>Skip</button>
</div>

<style>
  .scene {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    align-content: center;
    gap: var(--space-md);
    padding: var(--space-lg);
    background: #070b14;
    overflow: hidden;
  }
  .bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.55;
    pointer-events: none;
  }
  .vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 70% 60% at 50% 45%, transparent 30%, rgba(5, 8, 12, 0.85) 100%);
    pointer-events: none;
  }
  .door-wrap {
    position: relative;
    width: min(240px, 55vw);
    margin-bottom: -0.5rem;
    z-index: 1;
  }
  .door-img {
    width: 100%;
    height: auto;
    display: block;
    filter: drop-shadow(0 12px 32px rgba(103, 232, 249, 0.15));
  }
  .door-leaves-left,
  .door-leaves-right {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(90deg, rgba(11, 14, 20, 0.92), transparent 55%);
    border-radius: 50%;
  }
  .door-leaves-right {
    background: linear-gradient(-90deg, rgba(11, 14, 20, 0.92), transparent 55%);
  }
  .door-lock {
    position: absolute;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid rgba(14, 116, 144, 0.65);
    background: radial-gradient(circle at 35% 30%, #a5f3fc, #083344);
    box-shadow: 0 0 8px rgba(14, 116, 144, 0.35);
    pointer-events: none;
  }
  .lock-a {
    left: 18%;
    top: 42%;
  }
  .lock-b {
    right: 18%;
    top: 42%;
  }
  .lock-c {
    left: 50%;
    top: 22%;
    transform: translateX(-50%);
  }
  .door-energy {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 55%;
    height: 55%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 2px solid rgba(34, 211, 238, 0.35);
    opacity: 0;
    pointer-events: none;
    box-shadow: 0 0 24px rgba(34, 211, 238, 0.25);
  }
  .door-light {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 40%;
    height: 40%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(34, 211, 238, 0.45), rgba(14, 116, 144, 0.25) 45%, transparent 72%);
    opacity: 0;
  }
  .title-block {
    position: relative;
    text-align: center;
    z-index: 2;
  }
  .eyebrow {
    margin: 0;
    font-size: 0.65rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--highlight);
  }
  h2 {
    margin: 0.35rem 0;
    font-family: var(--font-display);
    font-size: clamp(1rem, 4.5vw, 1.5rem);
    letter-spacing: 0.08em;
  }
  .badge {
    display: inline-block;
    margin: 0;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    font-size: 0.62rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    background: rgba(103, 232, 249, 0.15);
    border: 1px solid rgba(103, 232, 249, 0.35);
    color: var(--highlight);
  }
  .badge.organic {
    border-color: rgba(103, 232, 249, 0.35);
    background: rgba(103, 232, 249, 0.08);
    color: var(--accent-primary);
  }
  .hint {
    margin: 0;
    font-size: 0.75rem;
    color: var(--text-secondary);
    z-index: 2;
  }
  .capsules {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
    gap: var(--space-sm);
    width: min(520px, 100%);
    z-index: 2;
  }
  .capsule {
    border: none;
    background: transparent;
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    min-height: 120px;
    cursor: pointer;
    padding: 0.25rem;
  }
  .capsule:disabled {
    cursor: default;
  }
  .capsule img {
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.45));
  }
  .lbl {
    font-family: var(--font-display);
    font-size: 0.68rem;
    letter-spacing: 0.06em;
  }
  .resolve {
    text-align: center;
    z-index: 2;
  }
  .mult-label {
    margin: 0.5rem 0 0;
    font-size: 0.62rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }
  .mult {
    margin: 0.15rem 0 0;
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 6vw, 2.4rem);
    color: var(--accent-primary);
  }
  .complete-banner {
    text-align: center;
    z-index: 2;
    transform: scale(0.92);
    opacity: 0;
  }
  .done {
    margin: 0;
    font-family: var(--font-display);
    letter-spacing: 0.14em;
    font-size: 0.85rem;
    color: var(--highlight);
  }
  .payout {
    margin: 0.35rem 0 0;
    font-family: var(--font-display);
    font-size: clamp(1.4rem, 5vw, 2rem);
    color: var(--accent-secondary);
  }
  .cur {
    opacity: 0.85;
  }
  .sub {
    margin: 0.35rem 0 0;
    font-size: 0.72rem;
    color: var(--text-secondary);
  }
  .skip {
    position: absolute;
    bottom: calc(var(--space-lg) + var(--safe-bottom));
    right: var(--space-lg);
    z-index: 3;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    border-radius: var(--radius-sm);
    padding: 0.35rem 0.65rem;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
</style>
