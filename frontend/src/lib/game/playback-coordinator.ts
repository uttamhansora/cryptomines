import type { GameEvent } from '@crypto-mines/shared';
import { AnimationController } from '../animation/controller.js';
import { applyEventToSnapshot, emptySnapshot, snapshotFromEvents } from './apply-event.js';
import type { PlayerSnapshot } from './snapshot.js';

export type SnapshotListener = (snap: Readonly<PlayerSnapshot>) => void;

export class PlaybackCoordinator {
  private snap: PlayerSnapshot = emptySnapshot();
  private events: GameEvent[] = [];
  private listeners = new Set<SnapshotListener>();
  private anim = new AnimationController();

  subscribe(fn: SnapshotListener): () => void {
    this.listeners.add(fn);
    fn(this.snap);
    return () => this.listeners.delete(fn);
  }

  getSnapshot(): Readonly<PlayerSnapshot> {
    return this.snap;
  }

  getEventCount(): number {
    return this.events.length;
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this.snap);
  }

  /** Replace snapshot without animation (replay scrub / reduced motion). */
  hydrate(events: GameEvent[]): void {
    this.events = events;
    this.snap = snapshotFromEvents(events);
    this.emit();
  }

  /**
   * Authoritative server stream update: apply full state immediately, animate only new tail.
   */
  async ingest(
    events: GameEvent[],
    opts: { animate: boolean; reducedMotion: boolean; onChainComplete?: () => void },
  ): Promise<void> {
    const prefixOk =
      this.events.length <= events.length &&
      this.events.every((e, i) => events[i]?.index === e.index && events[i]?.type === e.type);

    if (!prefixOk) {
      this.snap = snapshotFromEvents(events);
      this.events = events;
      this.emit();
      return;
    }

    const delta = events.slice(this.events.length);
    if (delta.length === 0) return;

    for (const ev of delta) {
      applyEventToSnapshot(this.snap, ev);
      this.events = events;
      this.emitPatch(ev);
      if (opts.animate && !opts.reducedMotion) {
        await this.anim.playEvent(ev, {
          getCellEl: (idx) => document.querySelector(`[data-tile-index="${idx}"]`) as HTMLElement | null,
          getBoardEl: () => document.querySelector('[data-game-board]') as HTMLElement | null,
          getMultiplierEl: () => document.querySelector('[data-multiplier-display]') as HTMLElement | null,
          getStageEl: () => document.querySelector('[data-game-stage]') as HTMLElement | null,
          getChainEl: () => document.querySelector('[data-chain-meter]') as HTMLElement | null,
          onChainComplete: opts.onChainComplete,
        });
      }
    }
  }

  /** Emit once per delta event — stores can optimize; board uses keyed tiles. */
  private emitPatch(_ev: GameEvent): void {
    this.emit();
  }

  cancelAnimations(): void {
    this.anim.killAll();
  }

  playCashout(multEl: HTMLElement | null, btnEl: HTMLElement | null, payoutEl?: HTMLElement | null): Promise<void> {
    return this.anim.playCashout(multEl, btnEl, payoutEl ?? null);
  }

  playBigWin(overlayEl: HTMLElement | null, amountEl: HTMLElement | null): Promise<void> {
    return this.anim.playBigWin(overlayEl, amountEl);
  }

  resetRound(): void {
    this.cancelAnimations();
    this.events = [];
    this.snap = emptySnapshot();
    this.events = [];
    this.emit();
  }
}
