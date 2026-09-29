/** Lightweight Web Audio synth — consistent vault identity, no external assets */

let ctx: AudioContext | null = null;

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  gain: number,
  when = 0,
): void {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, c.currentTime + when);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + when + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(c.currentTime + when);
  o.stop(c.currentTime + when + dur + 0.02);
}

export function synthUiClick(vol: number): void {
  tone(880, 0.06, 'square', 0.08 * vol);
}

export function synthTilePress(vol: number): void {
  tone(420, 0.05, 'triangle', 0.07 * vol);
}

export function synthSafeReveal(vol: number): void {
  tone(520, 0.12, 'sine', 0.1 * vol);
  tone(780, 0.14, 'sine', 0.06 * vol, 0.04);
}

export function synthCryptoReveal(vol: number): void {
  tone(640, 0.1, 'triangle', 0.09 * vol);
  tone(960, 0.16, 'sine', 0.05 * vol, 0.05);
}

export function synthMine(vol: number): void {
  tone(110, 0.35, 'sawtooth', 0.14 * vol);
  tone(70, 0.4, 'square', 0.1 * vol, 0.05);
}

export function synthMultiplierUp(vol: number): void {
  tone(600, 0.08, 'sine', 0.08 * vol);
  tone(900, 0.12, 'sine', 0.07 * vol, 0.06);
}

export function synthChainStep(vol: number): void {
  tone(500 + Math.random() * 40, 0.07, 'triangle', 0.06 * vol);
}

export function synthChainComplete(vol: number): void {
  [520, 780, 1040].forEach((f, i) => tone(f, 0.18, 'sine', 0.09 * vol, i * 0.07));
}

export function synthVault(vol: number): void {
  tone(330, 0.2, 'triangle', 0.1 * vol);
  tone(440, 0.25, 'sine', 0.08 * vol, 0.1);
}

export function synthBonusEnter(vol: number): void {
  tone(220, 0.3, 'sine', 0.1 * vol);
  tone(330, 0.35, 'triangle', 0.08 * vol, 0.12);
}

export function synthBonusReveal(vol: number): void {
  tone(880, 0.15, 'sine', 0.1 * vol);
}

export function synthCashout(vol: number): void {
  [660, 880, 1100].forEach((f, i) => tone(f, 0.12, 'sine', 0.08 * vol, i * 0.05));
}

export function synthBigWin(vol: number): void {
  [440, 660, 880, 1320].forEach((f, i) => tone(f, 0.2, 'triangle', 0.09 * vol, i * 0.08));
}

export function synthRoundEnd(vol: number): void {
  tone(380, 0.2, 'sine', 0.07 * vol);
}
