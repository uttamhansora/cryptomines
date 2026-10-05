import type { GameEvent } from '@crypto-mines/shared';
import { AnimationController, type AnimContext, type PendingReveal } from '../animation/controller.js';
import { applyEventsToSnapshot, emptySnapshot, snapshotFromEvents } from './apply-event.js';
import type { PlayerSnapshot, BoardViewCell } from './snapshot.js';

export type SnapshotListener = (snap: Readonly<PlayerSnapshot>) => void;

export class PlaybackCoordinator {
  private snap: PlayerSnapshot = emptySnapshot();
  private events: GameEvent[] = [];
  private listeners = new Set<SnapshotListener>();
  private anim = new AnimationController();

  /**
   * Cached DOM lookups for the animation context. The board/header/panel markup is
   * stable during a round, so we query at most once per element and re-verify only
   * when the cached node has left the document (remounts / round resets). This keeps
   * per-reveal work off the critical path instead of running document-wide selector
   * scans inside the awaited animation sequence after every click.
   */
  private domCache: Partial<Record<'board' | 'mult' | 'stage' | 'chain', HTMLElement>> = {};

  /**
   * Click-time pending lid-flip timelines claimed by the most recent animated
   * `ingest`, handed off to `playDelta` in delta order. MUST be initialized to
   * an empty array at construction: `playDelta` reads it on every animated
   * ingest, and an uninitialized (undefined) field made the very first reveal
   * of a round crash with "Cannot read properties of undefined (reading '0')"
   * when the hand-off cursor evaluated `claimed[0]`.
   */
  private claimedPending: (PendingReveal | null)[] = [];

  /**
   * Defensive cell accessor for the snapshot board. Server payloads can in
   * rare cases arrive with a short/absent `cells` array; reading `cells[i].x`
   * directly then crashes with "Cannot read properties of undefined (reading
   * '…')". Exposed publicly so App-level consumers use it too.
   */
  cellAt(index: number): BoardViewCell | undefined {
    const cells = Array.isArray(this.snap.cells) ? this.snap.cells : [];
    if (index < 0 || index >= cells.length) return undefined;
    return cells[index];
  }

  /** Current state of one board cell — safe even when the payload is malformed. */
  getCellState(index: number): BoardViewCell['state'] | null {
    return this.cellAt(index)?.state ?? null;
  }

  private cached<T extends HTMLElement>(key: 'board' | 'mult' | 'stage' | 'chain', sel: string): T | null {
    const hit = this.domCache[key] as T | undefined;
    if (hit && hit.isConnected) return hit;
    const fresh = document.querySelector(sel) as T | null;
    if (fresh) this.domCache[key] = fresh;
    return fresh;
  }

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
    this.events = Array.isArray(events) ? events : [];
    this.snap = snapshotFromEvents(this.events);
    this.anim.cancelPendingReveals();
    // Drop the claimed-pending hand-off with the old round's timelines and
    // tile element cache so a later animated ingest can never read stale
    // entries off these arrays.
    this.claimedPending = [];
    this.tiles = [];
    this.emit();
  }

  /**
   * Synchronous, zero-latency visual response for a tile pick: starts the
   * press/pop AND the lid-flip on the cached tile element in the SAME task as
   * the click event — before any network round-trip resolves. The square
   * visibly opens immediately; purely cosmetic (nothing about game state
   * changes here). The authoritative snapshot commit renders the CORRECT icon
   * the instant the server result arrives and continues/claims this same tween
   * so the flip never restarts or double-plays.
   */
  beginTilePickFx(index: number): void {
    if (!document.querySelector('[data-game-board]')) return;
    this.anim.startPendingReveal(index, this.tileCache(index));
  }

  /** Same-task press feedback for the Cash Out button (cosmetic only). */
  beginCashoutPressFx(el: HTMLElement | null): void {
    this.anim.cashoutPress(el);
  }

  /**
   * Authoritative server stream update: apply full state immediately, animate only new tail.
   */
  ingest(
    events: GameEvent[],
    opts: { animate: boolean; reducedMotion: boolean; onChainComplete?: () => void },
  ): Promise<void> {
    // Defensive: a malformed/absent payload must never crash the game loop or
    // index into an undefined array ("Cannot read properties of undefined
    // (reading '0')"). Treat anything non-array as "no new events".
    if (!Array.isArray(events)) {
      return Promise.resolve();
    }
    // Fast-path for the normal case: the server always returns the previous
    // event log with new events appended. Compare lengths + last index first
    // so we never re-scan the whole history on every pick.
    const prevEvents = Array.isArray(this.events) ? this.events : [];
    let prefixOk =
      prevEvents.length <= events.length &&
      (prevEvents.length === 0 ||
        events[prevEvents.length - 1]?.index === prevEvents[prevEvents.length - 1]?.index);
    if (prefixOk && prevEvents.length > 0) {
      // Defensive verification only when the cheap check could not prove it
      // (e.g. streams without monotonic `index` fields).
      if (events[prevEvents.length - 1]?.index === undefined) {
        prefixOk = prevEvents.every((e, i) => events[i]?.type === e.type);
      }
    }

    if (!prefixOk) {
      this.snap = snapshotFromEvents(events);
      this.events = events;
      this.emit();
      return Promise.resolve();
    }

    const delta = events.slice(prevEvents.length);
    if (delta.length === 0) return Promise.resolve();

    // Claim every click-time pending lid-flip BEFORE the snapshot emit below.
    // The emit synchronously re-renders all Tile components, which toggles the
    // lid's inline `visibility`; GSAP writes transform/opacity only, so an
    // in-flight pending tween survives that toggle and the confirmed reveal can
    // simply continue where it left off — zero restart, zero waiting.
    // The list is stored on the instance (`claimedPending`) because the async
    // playback pass below runs after this task returns: rapid successive picks
    // interleave ingest calls, and a per-call local array would leave
    // `playDelta` with nothing to hand off (the regression that made revealed
    // tiles wait for their animation instead of continuing the click tween).
    this.claimedPending = [];
    for (const ev of delta) {
      if (String(ev.type).toLowerCase() === 'reveal' && typeof ev.cellIndex === 'number') {
        this.claimedPending.push(this.anim.takePendingReveal(ev.cellIndex));
      }
    }

    this.events = events;

    if (!opts.animate || opts.reducedMotion) {
      // No animations requested: fold the whole delta into ONE synchronous
      // snapshot update + emit instead of notifying subscribers per event.
      for (const t of this.claimedPending) {
        if (t) {
          t.progress(0);
          t.kill();
        }
      }
      this.claimedPending = [];
      applyEventsToSnapshot(this.snap, delta);
      this.emit();
      return Promise.resolve();
    }

    // CRITICAL PATH: fold the ENTIRE delta into the snapshot and notify Svelte
    // exactly once, SYNCHRONOUSLY inside the response-handling task — the
    // board/multiplier/potential-win DOM commits before a single frame is
    // painted, with zero waiting on animation frames or microtask chains. The
    // old implementation awaited each reveal's GSAP timeline before applying
    // the next one, which serialized multi-tile loss disclosures behind
    // ~250ms of animation latency each.
    applyEventsToSnapshot(this.snap, delta);
    this.emit();

    // Decoupled playback: run the cosmetic timelines AFTER the authoritative
    // state has committed, in priority order (player-picked tile first, then
    // chain/vault, then multiplier bumps). Each reveal event pairs with the
    // pending tween claimed for it above (same traversal order), and awaiting
    // here gates ONLY the round-end follow-up steps — never any visual.
    const ctx: AnimContext = {
      getCellEl: (idx) => this.tileCache(idx),
      getBoardEl: () => this.cached('board', '[data-game-board]'),
      getMultiplierEl: () => this.cached('mult', '[data-multiplier-display]'),
      getStageEl: () => this.cached('stage', '[data-game-stage]'),
      getChainEl: () => this.cached('chain', '[data-chain-meter]'),
      onChainComplete: opts.onChainComplete,
    };
    return this.playDelta(delta, ctx);
  }

  private async playDelta(delta: GameEvent[], ctx: AnimContext): Promise<void> {
    // Snapshot the hand-off list for THIS delta (ingest populated it
    // synchronously before calling us). Reading it through a local const also
    // keeps the cursor/claim pairing correct even if a newer ingest replaces
    // `this.claimedPending` while this async pass is awaiting tweens.
    const claimed = this.claimedPending;
    let claimCursor = 0;
    const pendingFor = (): PendingReveal | null => claimed[claimCursor++] ?? null;
    for (const ev of delta) {
      const type = String(ev.type).toLowerCase();
      if (type !== 'reveal') continue;
      const rt = String(ev.revealType ?? '');
      if ((rt === 'tileSafe' || rt === 'tileMine') && typeof ev.cellIndex === 'number') {
        await this.anim.playEvent(ev, ctx, pendingFor());
      }
    }
    for (const ev of delta) {
      const type = String(ev.type).toLowerCase();
      if (type !== 'reveal') continue;
      const rt = String(ev.revealType ?? '');
      if (rt === 'enterbonus') await this.anim.playEvent(ev, ctx, null);
    }
    for (const ev of delta) {
      if (String(ev.type).toLowerCase() === 'multiplierupdate') {
        await this.anim.playEvent(ev, ctx, null);
      }
    }
    for (const ev of delta) {
      const type = String(ev.type).toLowerCase();
      if (type === 'reveal' && String(ev.revealType ?? '') === 'tileFinal' && typeof ev.cellIndex === 'number') {
        await this.anim.playEvent(ev, ctx, pendingFor());
      }
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
    // The previous round's claimed hand-off list is dead now that its tweens
    // are killed — clear it so no in-flight/late playDelta pass can read stale
    // timelines off it.
    this.claimedPending = [];
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
