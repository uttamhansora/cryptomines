/**
 * Tiny Web Audio synth for UI feedback — no assets, no dependencies.
 * A single lazily-created AudioContext; every cue is a short oscillator blip.
 */
let ctx = null;

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone({ freq = 440, dur = 0.12, type = 'sine', gain = 0.15, slideTo = null, delay = 0 }) {
  const ac = audioCtx();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  /** Safe gem reveal — bright rising blip. */
  reveal() {
    tone({ freq: 620, slideTo: 980, dur: 0.14, type: 'triangle', gain: 0.14 });
  },
  /** Mine hit — low distorted fall. */
  mine() {
    tone({ freq: 220, slideTo: 55, dur: 0.4, type: 'sawtooth', gain: 0.18 });
    tone({ freq: 110, dur: 0.3, type: 'square', gain: 0.08, delay: 0.03 });
  },
  /** Cash out — ascending arpeggio. */
  cashout() {
    [523, 659, 784, 1046].forEach((f, i) =>
      tone({ freq: f, dur: 0.16, type: 'triangle', gain: 0.13, delay: i * 0.08 })
    );
  },
  /** Chain step completed. */
  chain() {
    tone({ freq: 880, dur: 0.1, type: 'sine', gain: 0.12 });
    tone({ freq: 1320, dur: 0.12, type: 'sine', gain: 0.1, delay: 0.06 });
  },
  /** Vault symbol collected / bonus unlocked. */
  vault() {
    [784, 988, 1175].forEach((f, i) =>
      tone({ freq: f, dur: 0.18, type: 'sine', gain: 0.12, delay: i * 0.09 })
    );
  },
  /** Generic click for controls. */
  click() {
    tone({ freq: 340, dur: 0.05, type: 'square', gain: 0.06 });
  },
};
