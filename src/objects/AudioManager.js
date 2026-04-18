// src/objects/AudioManager.js
// Web Audio API — synthesised sound effects, no asset files needed.
// Singleton stored in Phaser game registry, shared across all scenes.

let _ctx = null;

function ctx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

// Schedule a tone, waiting for AudioContext to resume if needed.
// startAt = seconds from now (used for arpeggio sequencing).
function tone(freq, dur, vol = 0.3, shape = 'sine', freqEnd = null, startAt = 0) {
  const c = ctx();
  const schedule = () => {
    const t = c.currentTime + startAt;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = shape;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  };
  // Await resume if suspended (browser autoplay policy)
  if (c.state === 'suspended') {
    c.resume().then(schedule);
  } else {
    schedule();
  }
}

export default class AudioManager {
  constructor() {
    this._muted = false;
    // Unlock AudioContext on first user gesture
    const unlock = () => {
      ctx().resume();
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
  }

  get muted() { return this._muted; }

  toggleMute() {
    this._muted = !this._muted;
    return this._muted;
  }

  // Internal — skip if muted
  _play(fn) {
    if (!this._muted) fn();
  }

  rune()        { this._play(() => [523,659,784,1047].forEach((f,i) => tone(f, 0.22, 0.20, 'sine', null, i*0.13))); }
  boing()       { this._play(() => tone(380, 0.45, 0.32, 'sine', 70)); }
  mushroom()    { this._play(() => { tone(440, 0.30, 0.22, 'sine', 660); tone(660, 0.20, 0.12, 'sine', null, 0.18); }); }
  correctStep() { this._play(() => { tone(660, 0.16, 0.18, 'sine'); tone(880, 0.18, 0.14, 'sine', null, 0.14); }); }
  entWake()     { this._play(() => { tone(90, 0.55, 0.18, 'triangle', 140); tone(140, 0.30, 0.10, 'triangle', null, 0.30); }); }
  portal()      { this._play(() => [261,330,392,523,659,784,1047].forEach((f,i) => tone(f, 0.55, 0.16, 'sine', null, i*0.13))); }
}
