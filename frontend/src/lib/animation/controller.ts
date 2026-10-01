import gsap from 'gsap';
import type { GameEvent } from '@crypto-mines/shared';
import { runParticleBurst, symbolPalette, type ParticlePalette } from './particles.js';

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

  killAll(): void {
    this.active.kill();
    this.active = gsap.timeline();
  }

  async playEvent(ev: GameEvent, ctx: AnimContext): Promise<void> {
    const type = String(ev.type).toLowerCase();
    if (type === 'reveal') {
      const rt = String(ev.revealType ?? '');
      if (rt === 'tileSafe' && typeof ev.cellIndex === 'number') {
        const kind = ev.symbol === 'VAULT' ? 'vault' : 'crypto';
        await this.tileReveal(ctx.getCellEl(ev.cellIndex), kind, ev.symbol as string | undefined, ev.index ?? ev.cellIndex);
        if (ev.chainCompletedId) await this.chainComplete(ctx, true);
        return;
      }
      if (rt === 'tileMine' && typeof ev.cellIndex === 'number') {
        await this.mineHit(ctx.getCellEl(ev.cellIndex), ctx.getBoardEl(), ev.index ?? ev.cellIndex);
        return;
      }
      if (rt === 'tileFinal' && typeof ev.cellIndex === 'number') {
        await this.tileFinalReveal(ctx.getCellEl(ev.cellIndex));
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
  ): Promise<void> {
    if (!el) return Promise.resolve();
    const inner = el.querySelector('.tile-inner') as HTMLElement | null;
    const target = inner ?? el;
    const sym = el.querySelector('.sym') as HTMLElement | null;
    const glow = el.querySelector('.tile-glow');
    const innerLight = el.querySelector('.tile-inner-light');
    const lid = el.querySelector('.tile-lid') as HTMLElement | null;
    const palette = kind === 'vault' ? 'vault' : symbolPalette(symbol);
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: () => {
        this.burstOnTile(el, seed, palette);
        resolve();
      }});
      tl.to(target, { y: 3, scale: 0.94, duration: 0.06, ease: 'power2.in' })
        .to(target, { y: -2, scale: 1.01, duration: 0.08, ease: 'power1.out' });
      if (lid) tl.to(lid, { rotateX: -72, opacity: 0, duration: 0.14, transformOrigin: '50% 0%' }, '-=0.02');
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
        tl.to(neighbors, { scale: 0.98, duration: 0.08, stagger: 0.012, yoyo: true, repeat: 1 }, '-=0.45');
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
    if (!multEl) return Promise.resolve();
    const ring = multEl.closest('.mult-ring')?.querySelector('.ring') as HTMLElement | null;
    const energy = multEl.closest('.mult-ring')?.querySelector('.ring-energy') as HTMLElement | null;
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
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
      tl.fromTo(multEl, { scale: 1.08, filter: 'brightness(1.15)' }, { scale: 1, filter: 'brightness(1)', duration: 0.42, ease: 'power2.out' }, '-=0.25');
      if (ring) {
        tl.to(ring, { boxShadow: '0 0 32px rgba(245, 197, 66, 0.45)', duration: 0.12, yoyo: true, repeat: 1 }, '-=0.38');
      }
    });
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
