// src/objects/AudioManager.js
// Web Audio API synthesised SFX. Never throws — audio errors must not crash the game.

let _ctx = null;

function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state !== 'running') _ctx.resume();
  return _ctx;
}

function beep(freq, dur, vol = 0.22, type = 'sine', freqEnd = null) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    const now = c.currentTime;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd && freqEnd > 0) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, now + dur);
    }
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  } catch (_) { /* audio errors never crash the game */ }
}

export default class AudioManager {
  constructor() {
    this._muted = false;
  }

  get muted() { return this._muted; }

  toggleMute() {
    this._muted = !this._muted;
    return this._muted;
  }

  rune() {
    if (this._muted) return;
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => beep(f, 0.22, 0.18), i * 130)
    );
  }

  boing() {
    if (this._muted) return;
    beep(360, 0.45, 0.28, 'sine', 70);
  }

  mushroom() {
    if (this._muted) return;
    beep(440, 0.30, 0.20, 'sine', 660);
  }

  correctStep() {
    if (this._muted) return;
    beep(660, 0.15, 0.15);
    setTimeout(() => beep(880, 0.18, 0.12), 150);
  }

  entWake() {
    if (this._muted) return;
    beep(90, 0.50, 0.15, 'triangle', 130);
  }

  portal() {
    if (this._muted) return;
    [261, 330, 392, 523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => beep(f, 0.50, 0.14), i * 130)
    );
  }
}
