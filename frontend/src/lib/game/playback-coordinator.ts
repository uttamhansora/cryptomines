import type { GameEvent } from '@crypto-mines/shared';
import { AnimationController, type AnimContext, type PendingReveal } from '../animation/controller.js';
import { applyEventToSnapshot, emptySnapshot, snapshotFromEvents } from './apply-event.js';
import type { PlayerSnapshot } from './snapshot.js';

export type SnapshotListener = (snap: Readonly<PlayerSnapshot>) => void;

/**
 * Playback ordering for the decoupled animation pass. Lower runs first: the tile
 * the player actually clicked must animate before chain banners, multiplier bumps
 * or post-loss disclosure of untouched tiles. Stable sort preserves event order
 * within each priority class.
 */
function eventPriority(ev: GameEvent): number {
  const type = String(ev.type).toLowerCase();
  if (type === 'reveal') {
    const rt = String(ev.revealType ?? '');
    if (rt === 'tileSafe' || rt === 'tileMine') return 0;
    if (rt === 'enterbonus') return 1;
    if (rt === 'tileFinal') return 3;
    return 2;
  }
  if (type === 'multiplierupdate') return 2;
  return 4;
}

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
    this.anim.cancelPendingReveals();
    this.tiles = [];
    this.emit();
  }

  /**
   * Synchronous, zero-latency visual response for a tile pick: starts the
   * press/pop + lid-flip on the cached tile element in the SAME task as the
   * click event — before any network round-trip resolves. Purely cosmetic:
   * nothing about game state changes here; the authoritative flip happens
   * when server events are ingested (which claims/continues this tween).
   */
  beginTilePickFx(index: number): void {
    if (!document.querySelector('[data-game-board]')) return;
    this.anim.startPendingReveal(index, this.tileCache(index));
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

    // Claim every click-time pending lid-flip BEFORE the snapshot emit below.
    // The emit synchronously re-renders all Tile components, which toggles the
    // lid's inline `visibility`; GSAP writes transform/opacity only, so an
    // in-flight pending tween survives that toggle and the confirmed reveal can
    // simply continue where it left off — zero restart, zero waiting.
    const claimedPending: (PendingReveal | null)[] = [];
    for (const ev of delta) {
      if (String(ev.type).toLowerCase() === 'reveal' && typeof ev.cellIndex === 'number') {
        claimedPending.push(this.anim.takePendingReveal(ev.cellIndex));
      }
    }

    this.events = events;

    if (!opts.animate || opts.reducedMotion) {
      // No animations requested: fold the whole delta into ONE synchronous
      // snapshot update + emit instead of notifying subscribers per event.
      for (const t of claimedPending) {
        if (t) {
          t.progress(0);
          t.kill();
        }
      }
      for (const ev of delta) applyEventToSnapshot(this.snap, ev);
      this.emit();
      return;
    }

    // CRITICAL PATH: fold the ENTIRE delta into the snapshot and notify Svelte
    // exactly once, synchronously — the board state is authoritative the moment
    // the response lands, with zero waiting on animation frames. The old loop
    // emitted a full app-wide notification per event and awaited each reveal's
    // GSAP timeline before applying the next one, which serialized multi-tile
    // loss disclosures behind ~250ms of animation latency each.
    for (const ev of delta) applyEventToSnapshot(this.snap, ev);
    this.emit();

    // Decoupled playback: run the cosmetic timelines AFTER the DOM has been
    // updated, in priority order (player-picked tile first, then chain/vault,
    // then multiplier bumps). Awaiting here only gates the NEXT round-end step,
    // never the visual state itself.
    const ctx: AnimContext = {
      getCellEl: (idx) => this.tileCache(idx),
      getBoardEl: () => this.cached('board', '[data-game-board]'),
      getMultiplierEl: () => this.cached('mult', '[data-multiplier-display]'),
      getStageEl: () => this.cached('stage', '[data-game-stage]'),
      getChainEl: () => this.cached('chain', '[data-chain-meter]'),
      onChainComplete: opts.onChainComplete,
    };
    let claimCursor = 0;
    const ordered = [...delta].sort((a, b) => {
      const d = eventPriority(a) - eventPriority(b);
      if (d !== 0) return d;
      // Stable tie-break by original delta position so each reveal is paired
      // with the pending tween claimed for that exact event above.
      return delta.indexOf(a) - delta.indexOf(b);
    });
    for (const ev of ordered) {
      const isRevealedTile =
        String(ev.type).toLowerCase() === 'reveal' && typeof ev.cellIndex === 'number';
      const pending = isRevealedTile ? claimedPending[claimCursor++] : null;
      await this.anim.playEvent(ev, ctx, pending);
    }
  }

  /**
   * Tile element cache: `[data-tile-index]` was queried from the document on EVERY
   * animation step (~3 selector scans per click across 25+ nodes). Tiles persist for
   * the life of a round, so we hold direct references and re-query only when a cached
   * node leaves the DOM (round reset / remount).
   */
  private tiles: (HTMLElement | null)[] = [];

  private tileCache(index: number): HTMLElement | null {
    const hit = this.tiles[index];
    if (hit && hit.isConnected) return hit;
    const fresh = document.querySelector(`[data-tile-index="${index}"]`) as HTMLElement | null;
    this.tiles[index] = fresh;
    return fresh;
  }

  cancelAnimations(): void {
    // Kill cosmetic tweens only — do NOT touch the snapshot here. The previous
    // implementation called resetRound() (full snapshot wipe + app-wide emit),
    // which fought in-flight ingest sequences and forced an extra whole-board
    // re-render mid-animation.
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
    // Drop cached DOM refs ONLY when the board is actually gone (round reset /
    // remount). Previously this cleared the cache unconditionally at every loss
    // auto-reset, forcing ~25 fresh document-wide selector scans on the very
    // next round's animations even though the tile nodes never left the DOM.
    if (!document.querySelector('[data-game-board]')) {
      this.tiles = [];
      this.domCache = {};
    }
    this.emit();
  }
}
