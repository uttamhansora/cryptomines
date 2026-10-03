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
   * Cached DOM lookups for the animation context. The board/header/panel markup is
   * stable during a round, so we query at most once per element and re-verify only
   * when the cached node has left the document (remounts / round resets). This keeps
   * per-reveal work off the critical path instead of running document-wide selector
   * scans inside the awaited animation sequence after every click.
   */
  private domCache: Partial<Record<'board' | 'mult' | 'stage' | 'chain', HTMLElement>> = {};

  private cached<T extends HTMLElement>(key: 'board' | 'mult' | 'stage' | 'chain', sel: string): T | null {
    const hit = this.domCache[key] as T | undefined;
    if (hit && hit.isConnected) return hit;
    const fresh = document.querySelector(sel) as T | null;
    if (fresh) this.domCache[key] = fresh;
    return fresh;
  }

  /**
   * Authoritative server stream update: apply full state immediately, animate only new tail.
   */
  async ingest(
    events: GameEvent[],
    opts: { animate: boolean; reducedMotion: boolean; onChainComplete?: () => void },
  ): Promise<void> {
    // Fast-path for the normal case: the server always returns the previous
    // event log with new events appended. Compare lengths + last index first
    // so we never re-scan the whole history on every pick.
    let prefixOk =
      this.events.length <= events.length &&
      (this.events.length === 0 || events[this.events.length - 1]?.index === this.events[this.events.length - 1]?.index);
    if (prefixOk && this.events.length > 0) {
      // Defensive verification only when the cheap check could not prove it
      // (e.g. streams without monotonic `index` fields).
      if (events[this.events.length - 1]?.index === undefined) {
        prefixOk = this.events.every((e, i) => events[i]?.type === e.type);
      }
    }

    if (!prefixOk) {
      this.snap = snapshotFromEvents(events);
      this.events = events;
      this.emit();
      return;
    }

    const delta = events.slice(this.events.length);
    if (delta.length === 0) return;

    this.events = events;

    if (!opts.animate || opts.reducedMotion) {
      // No animations requested: fold the whole delta into ONE synchronous
      // snapshot update + emit instead of notifying subscribers per event.
      for (const ev of delta) applyEventToSnapshot(this.snap, ev);
      this.emit();
      return;
    }

    for (const ev of delta) {
      applyEventToSnapshot(this.snap, ev);
      // One notification per revealed tile — keyed tiles update locally.
      this.emit();
      await this.anim.playEvent(ev, {
        getCellEl: (idx) => document.querySelector(`[data-tile-index="${idx}"]`) as HTMLElement | null,
        getBoardEl: () => this.cached('board', '[data-game-board]'),
        getMultiplierEl: () => this.cached('mult', '[data-multiplier-display]'),
        getStageEl: () => this.cached('stage', '[data-game-stage]'),
        getChainEl: () => this.cached('chain', '[data-chain-meter]'),
        onChainComplete: opts.onChainComplete,
      });
    }
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
