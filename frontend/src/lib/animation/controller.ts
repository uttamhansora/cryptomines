import gsap from 'gsap';
import type { GameEvent } from '@crypto-mines/shared';
import { runParticleBurst, symbolPalette, type ParticlePalette } from './particles.js';

/** Cosmetic reveal animation handed off from the click-time pending tween. */
export type PendingReveal = gsap.core.Timeline;

export interface AnimContext {
  getCellEl: (index: number) => HTMLElement | null;
  getBoardEl: () => HTMLElement | null;
  getMultiplierEl: () => HTMLElement | null;
  getStageEl: () => HTMLElement | null;
  getChainEl: () => HTMLElement | null;
  onChainComplete?: () => void;
}

export class AnimationController {
  private active = gsap.timeline();

  /**
   * Per-cell pending-reveal timelines. When the player clicks a tile we start
   * the flip animation IMMEDIATELY (before the server confirms what is under
   * the lid). If the confirmed result is safe, this same timeline simply keeps
   * playing — zero restart, zero waiting. If it turns out to be a mine, we
   * `progress(0)` + kill the pending tween so mineHit can take the tile over
   * from its resting state.
   */
  private pendingReveals = new Map<number, gsap.core.Timeline>();

  /**
   * Fire the tactile press/pop + lid-flip for a picked cell synchronously at
   * click time. Transform/opacity only (GPU compositor properties) and driven
   * directly on the cached DOM node — no React/Svelte state round-trip, so the
   * visual response lands in the same frame as the pointer event.
   */
  startPendingReveal(index: number, el: HTMLElement | null): void {
    if (!el || this.pendingReveals.has(index)) return;
    const inner = (el.querySelector('.tile-inner') as HTMLElement | null) ?? el;
    const lid = el.querySelector('.tile-lid') as HTMLElement | null;
    const tl = gsap.timeline({ paused: true });
    tl.to(inner, { y: 3, scale: 0.94, duration: 0.06, ease: 'power2.in' })
      .to(inner, { y: -2, scale: 1.01, duration: 0.08, ease: 'power1.out' });
    if (lid) tl.to(lid, { rotateX: -72, opacity: 0, duration: 0.14, transformOrigin: '50% 0%' }, '-=0.02');
    this.pendingReveals.set(index, tl);
    tl.play();
    // Safety net: never leave an orphaned tween if the round ends abnormally.
    window.setTimeout(() => {
      if (this.pendingReveals.get(index) === tl) {
        this.pendingReveals.delete(index);
        tl.kill();
      }
    }, 2500);
  }

  /** Hand a pending reveal's timeline over to the confirmed reveal animation. */
  private claimPending(index: number): gsap.core.Timeline | null {
    return this.takePendingReveal(index);
  }

  /** Public claim: remove + return the pending tween for a cell (if any). */
  takePendingReveal(index: number): gsap.core.Timeline | null {
    const t = this.pendingReveals.get(index) ?? null;
    this.pendingReveals.delete(index);
    return t;
  }

  private resetToRest(el: HTMLElement): void {
    const inner = (el.querySelector('.tile-inner') as HTMLElement | null) ?? el;
    const lid = el.querySelector('.tile-lid') as HTMLElement | null;
    gsap.set(inner, { clearProps: 'transform' });
    if (lid) gsap.set(lid, { clearProps: 'transform,opacity' });
  }

  /** Drop all pending per-tile tweens (round reset / hydration / remount). */
  cancelPendingReveals(): void {
    for (const t of this.pendingReveals.values()) {
      const targets = t.targets() as HTMLElement[];
      if (targets[0]) this.resetToRest(targets[0].closest('.tile') as HTMLElement ?? targets[0]);
      t.kill();
    }
    this.pendingReveals.clear();
  }

  killAll(): void {
    this.cancelPendingReveals();
    this.active.kill();
    this.active = gsap.timeline();
  }

  async playEvent(ev: GameEvent, ctx: AnimContext, handedPending?: PendingReveal | null): Promise<void> {
    const type = String(ev.type).toLowerCase();
    if (type === 'reveal') {
      const rt = String(ev.revealType ?? '');
      if (rt === 'tileSafe' && typeof ev.cellIndex === 'number') {
        const kind = ev.symbol === 'VAULT' ? 'vault' : 'crypto';
        await this.tileReveal(
          ctx.getCellEl(ev.cellIndex),
          kind,
          ev.symbol as string | undefined,
          ev.index ?? ev.cellIndex,
          handedPending ?? this.claimPending(ev.cellIndex),
        );
        if (ev.chainCompletedId) await this.chainComplete(ctx, true);
        return;
      }
      if (rt === 'tileMine' && typeof ev.cellIndex === 'number') {
        // The pending lid-flip was a bluff: rewind the tile to rest before the
        // explosion so mineHit starts from clean values.
        const pending = handedPending ?? this.claimPending(ev.cellIndex);
        if (pending) {
          pending.progress(0);
          pending.kill();
        }
        await this.mineHit(ctx.getCellEl(ev.cellIndex), ctx.getBoardEl(), ev.index ?? ev.cellIndex);
        return;
      }
      if (rt === 'tileFinal' && typeof ev.cellIndex === 'number') {
        // Disclosed (non-picked) tiles may still carry pending-tween leftovers.
        const el = ctx.getCellEl(ev.cellIndex);
        const stale = handedPending ?? this.claimPending(ev.cellIndex);
        if (stale) {
          stale.progress(0);
          stale.kill();
        } else if (el) {
          this.resetToRest(el);
        }
        await this.tileFinalReveal(el);
        return;
      }
    }
    if (type === 'multiplierupdate') {
      if (ev.source === 'chainStreak' && ev.chainStreakComplete) await this.chainComplete(ctx, true);
      else if (ev.source === 'chain') await this.chainComplete(ctx, false);
      else await this.multiplierBump(ctx.getMultiplierEl(), ctx.getChainEl());
      return;
    }
    if (type === 'enterbonus') {
      await this.vaultEnter(ctx.getStageEl());
      return;
    }
  }

  private burstOnTile(el: HTMLElement | null, seed: number, palette: ParticlePalette): void {
    const canvas = el?.querySelector('.tile-fx') as HTMLCanvasElement | null;
    if (canvas) runParticleBurst(canvas, seed, palette, palette === 'mine' ? 18 : 12, 400);
  }

  private tileReveal(
    el: HTMLElement | null,
    kind: 'crypto' | 'vault',
    symbol: string | undefined,
    seed: number,
    pending: gsap.core.Timeline | null = null,
  ): Promise<void> {
    if (!el) {
      pending?.kill();
      return Promise.resolve();
    }
    const inner = el.querySelector('.tile-inner') as HTMLElement | null;
    const target = inner ?? el;
    const sym = el.querySelector('.sym') as HTMLElement | null;
    const glow = el.querySelector('.tile-glow');
    const innerLight = el.querySelector('.tile-inner-light');
    const lid = el.querySelector('.tile-lid') as HTMLElement | null;
    const palette = kind === 'vault' ? 'vault' : symbolPalette(symbol);
    // Keep the reveal snappy (~0.3s to full symbol): the tail of the timeline is
    // a non-blocking polish fade whose promise we intentionally do not await,
    // so the NEXT queued reveal (e.g. multi-tile loss disclosure) starts sooner.
    const tl = gsap.timeline();
    if (pending && !pending.totalProgress()) {
      // The click-time press/pop/lid-flip started synchronously at pointerdown
      // and is STILL in flight: let it finish untouched (no restart, no snap)
      // and begin the rest of the reveal right where the pending tween ends.
      const hold = Math.max(0, 0.26 - pending.time());
      if (hold > 0) tl.to({}, { duration: hold });
    } else if (pending) {
      // Pending already completed — the tile sits in its flipped-open pose;
      // skip the press/pop + lid re-tween entirely.
      pending.kill();
    } else {
      // No pending tween (reduced-motion path / restored round): play from rest.
      tl.to(target, { y: 3, scale: 0.94, duration: 0.06, ease: 'power2.in' })
        .to(target, { y: -2, scale: 1.01, duration: 0.08, ease: 'power1.out' });
      if (lid) tl.to(lid, { rotateX: -72, opacity: 0, duration: 0.14, transformOrigin: '50% 0%' }, '-=0.02');
    }
    if (innerLight) {
      tl.fromTo(innerLight, { opacity: 0 }, { opacity: kind === 'vault' ? 0.85 : 0.65, duration: 0.1 }, '-=0.06')
        .to(innerLight, { opacity: kind === 'vault' ? 0.35 : 0.18, duration: 0.28 }, '-=0.04');
    }
    tl.fromTo(sym, { scale: 0.5, opacity: 0, y: 10, rotate: -8 }, { scale: 1, opacity: 1, y: 0, rotate: 0, duration: 0.32, ease: 'back.out(1.7)' }, '-=0.05');
    if (glow) {
      tl.fromTo(glow, { opacity: 0, scale: 0.85 }, { opacity: kind === 'vault' ? 0.75 : 0.55, scale: 1.05, duration: 0.18 }, '-=0.28')
        .to(glow, { opacity: kind === 'vault' ? 0.3 : 0.16, scale: 1, duration: 0.32 });
    }
    const burst = el.querySelector('.tile-burst');
    if (burst) {
      tl.fromTo(burst, { opacity: 0.85, scale: 0.7 }, { opacity: 0, scale: 1.25, duration: 0.38, ease: 'power2.out' }, '-=0.32');
    }
    tl.to(target, { y: 0, scale: 1, duration: 0.12, ease: 'power2.out' }, '-=0.08');
    this.burstOnTile(el, seed, palette);
    return new Promise((resolve) => {
      window.setTimeout(resolve, 300);
    });
  }

  private mineHit(el: HTMLElement | null, board: HTMLElement | null, seed: number): Promise<void> {
    if (!el) return Promise.resolve();
    const flash = board?.querySelector('[data-mine-flash]') as HTMLElement | null;
    const shock = board?.querySelector('[data-shockwave]') as HTMLElement | null;
    const inner = el.querySelector('.tile-inner') as HTMLElement | null;
    const target = inner ?? el;
    const symWrap = el.querySelector('.mine-sym') as HTMLElement | null;
    const sym = (el.querySelector('.sym') as HTMLElement | null) ?? symWrap;
    const neighbors = board?.querySelectorAll('.tile:not(.mine)') ?? [];
    // The lid may be mid-flip from the click-time pending reveal (killed at
    // progress 0 by playEvent) — clear inline props so CSS visibility rules win.
    const lidEl = el.querySelector('.tile-lid') as HTMLElement | null;
    if (lidEl) gsap.set(lidEl, { clearProps: 'transform,opacity' });
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: () => {
        this.burstOnTile(el, seed, 'mine');
        resolve();
      }});
      tl.to(target, { y: 4, scale: 0.92, duration: 0.05, ease: 'power2.in' })
        .to({}, { duration: 0.08 })
        .to(target, { y: -3, scale: 1.06, duration: 0.1, ease: 'power1.out' });
      if (sym) {
        tl.fromTo(sym, { scale: 0.4, opacity: 0, rotate: -20 }, { scale: 1.12, opacity: 1, rotate: 0, duration: 0.26, ease: 'back.out(2.2)' }, '-=0.06');
      }
      if (flash) {
        tl.to(flash, { opacity: 0.55, duration: 0.04, ease: 'power1.in' }, '-=0.14')
          .to(flash, { opacity: 0, duration: 0.42, ease: 'power2.out' });
      }
      if (shock) {
        tl.fromTo(
          shock,
          { scale: 0.2, opacity: 0.7 },
          { scale: 1.5, opacity: 0, duration: 0.62, ease: 'power2.out', transformOrigin: '50% 50%' },
          '-=0.32',
        );
      }
      // Controlled board reaction: tiny scale pulse instead of a positional shake
      // (avoids fighting the CSS transform on .stage and reads calmer/premium).
      if (board) {
        tl.to(board, { scale: 0.985, duration: 0.05, ease: 'power2.in', yoyo: true, repeat: 1 }, '-=0.5');
      }
      if (neighbors.length) {
        // Animate only the nearest tiles (max 8): tweening all 24 board tiles
        // forced a full-board repaint for a barely-visible effect.
        tl.to(Array.prototype.slice.call(neighbors, 0, 8), { scale: 0.98, duration: 0.08, stagger: 0.012, yoyo: true, repeat: 1 }, '-=0.45');
      }
      tl.to(target, { scale: 1, y: 0, duration: 0.22, ease: 'power2.out' }, '-=0.35')
        .to({}, { duration: 0.1 });
    });
  }

  private tileFinalReveal(el: HTMLElement | null): Promise<void> {
    if (!el) return Promise.resolve();
    const inner = el.querySelector('.tile-inner') as HTMLElement | null;
    const target = inner ?? el;
    const sym = el.querySelector('.sym') as HTMLElement | null;
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.fromTo(target, { opacity: 0.45, scale: 0.92, y: 4 }, { opacity: 0.9, scale: 1, y: 0, duration: 0.16, ease: 'power2.out' });
      if (sym) tl.fromTo(sym, { opacity: 0, scale: 0.8 }, { opacity: 0.88, scale: 1, duration: 0.18, ease: 'power1.out' }, '-=0.1');
    });
  }

  private multiplierBump(multEl: HTMLElement | null, chainEl: HTMLElement | null): Promise<void> {
    // Lightweight bump: don't block the event pipeline on this purely cosmetic
    // pulse — resolve immediately and let GSAP finish in the background.
    if (!multEl) return Promise.resolve();
    const ring = multEl.closest('.mult-ring')?.querySelector('.ring-svg') as HTMLElement | null;
    const energy = multEl.closest('.mult-ring')?.querySelector('.ring-orbit') as HTMLElement | null;
    const tl = gsap.timeline();
    if (chainEl) {
      const pulse = chainEl.querySelector('[data-chain-energy]') as HTMLElement | null;
      if (pulse) {
        tl.fromTo(pulse, { opacity: 0, scaleX: 0.15 }, { opacity: 1, scaleX: 1, duration: 0.24, ease: 'power2.out' })
          .to(pulse, { opacity: 0, duration: 0.28, delay: 0.04 });
      }
    }
    if (energy) {
      tl.fromTo(energy, { rotate: 0, opacity: 0.3 }, { rotate: 180, opacity: 0.85, duration: 0.35, ease: 'power1.out' }, '-=0.2')
        .to(energy, { opacity: 0.25, duration: 0.25 });
    }
    // transform/opacity only (GPU-friendly). The previous `filter: brightness()`
    // tween forced per-frame repaints of the whole ring layer during gameplay.
    tl.fromTo(multEl, { scale: 1.08 }, { scale: 1, duration: 0.42, ease: 'power2.out' }, '-=0.25');
    if (ring) {
      tl.to(ring, { scale: 1.03, duration: 0.12, yoyo: true, repeat: 1, transformOrigin: '50% 50%' }, '-=0.38');
    }
    void tl;
    return Promise.resolve();
  }

  private chainComplete(ctx: AnimContext, major: boolean): Promise<void> {
    const chain = ctx.getChainEl();
    ctx.onChainComplete?.();
    if (!chain) return Promise.resolve();
    const banner = chain.querySelector('[data-chain-burst]') as HTMLElement | null;
    const track = chain.querySelector('.track') as HTMLElement | null;
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      if (track) {
        tl.fromTo(track, { scale: 1 }, { scale: major ? 1.04 : 1.02, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.inOut' });
      }
      if (banner) {
        tl.fromTo(banner, { opacity: 0, y: 8, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: major ? 0.32 : 0.22, ease: 'back.out(1.6)' }, 0)
          .to(banner, { opacity: 0, duration: 0.35, delay: major ? 0.45 : 0.28 });
      }
    });
  }

  private vaultEnter(stage: HTMLElement | null): Promise<void> {
    const dim = stage?.querySelector('[data-vault-dim]') as HTMLElement | null;
    const portal = stage?.querySelector('[data-vault-portal]') as HTMLElement | null;
    if (!dim) return Promise.resolve();
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.fromTo(dim, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.inOut' });
      if (portal) {
        tl.fromTo(portal, { scale: 0.4, opacity: 0, rotate: -8 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.55, ease: 'back.out(1.4)' }, '-=0.2');
      }
    });
  }

  playCashout(multEl: HTMLElement | null, btnEl: HTMLElement | null, payoutEl: HTMLElement | null): Promise<void> {
    const stage = document.querySelector('[data-game-stage]') as HTMLElement | null;
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      if (stage) tl.to(stage, { scale: 0.985, duration: 0.12, ease: 'power2.in' }, 0);
      if (btnEl) {
        tl.to(btnEl, { scale: 0.96, duration: 0.08, ease: 'power2.in' }, 0)
          .to(btnEl, { scale: 1, opacity: 0.9, duration: 0.22, ease: 'power1.out' });
      }
      if (multEl) {
        tl.fromTo(multEl, { scale: 1 }, { scale: 1.14, duration: 0.22, ease: 'back.out(1.5)' }, 0.04)
          .to(multEl, { scale: 1, duration: 0.28, ease: 'power2.out' });
      }
      if (payoutEl) {
        tl.fromTo(payoutEl, { scale: 0.88, opacity: 0.65 }, { scale: 1.08, opacity: 1, duration: 0.32, ease: 'back.out(1.7)' }, 0.1)
          .to(payoutEl, { scale: 1, duration: 0.22, ease: 'power2.out' });
      }
      if (stage) tl.to(stage, { scale: 1, duration: 0.2, ease: 'power2.out' }, '-=0.15');
    });
  }

  playBigWin(el: HTMLElement | null, amountEl: HTMLElement | null): Promise<void> {
    if (!el) return Promise.resolve();
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.22 })
        .fromTo(el, { scale: 0.78, y: 20 }, { scale: 1, y: 0, duration: 0.52, ease: 'back.out(1.5)' }, '-=0.1');
      if (amountEl) {
        tl.fromTo(amountEl, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'power3.out' }, '-=0.35');
      }
    });
  }
}
