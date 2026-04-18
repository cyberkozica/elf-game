// src/objects/AudioManager.js
// Web Audio API — synthesised sound effects, no asset files needed.
// Singleton: store in Phaser game registry so one instance lives across scenes.

let _ctx = null;

function ctx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

// Schedule a single tone. startAt = seconds from now (0 = immediate).
function tone(freq, dur, vol = 0.3, shape = 'sine', freqEnd = null, startAt = 0) {
  const c = ctx();
  if (c.state === 'suspended') c.resume();
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
}

export default class AudioManager {
  // Resume suspended AudioContext (browser requires user gesture first)
  resume() {
    if (_ctx && _ctx.state === 'suspended') _ctx.resume();
  }

  // Runa pokupljena — rastuća 4-notna arpeggio sekvenca
  rune() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 0.20, 'sine', null, i * 0.13));
  }

  // BOING! — padajući spring zvuk
  boing() {
    tone(380, 0.45, 0.32, 'sine', 70);
  }

  // Gljiva pokupljena — topli glide gore
  mushroom() {
    tone(440, 0.30, 0.22, 'sine', 660);
    tone(660, 0.20, 0.12, 'sine', null, 0.18);
  }

  // Korak naprijed (kristal/stup točan redoslijed)
  correctStep() {
    tone(660, 0.16, 0.18, 'sine');
    tone(880, 0.18, 0.14, 'sine', null, 0.14);
  }

  // Ent se budi — niski rumenj
  entWake() {
    tone(90, 0.55, 0.18, 'triangle', 140);
    tone(140, 0.30, 0.10, 'triangle', null, 0.30);
  }

  // Portal aktiviran — rastuće arpeggio
  portal() {
    [261, 330, 392, 523, 659, 784, 1047].forEach((f, i) =>
      tone(f, 0.55, 0.16, 'sine', null, i * 0.13)
    );
  }
}
