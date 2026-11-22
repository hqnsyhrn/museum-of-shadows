// Sound, synthesized live with WebAudio — no audio files, no network.
// Footsteps tell you where a warden is: near ones step louder, and a
// spotted thief hears the alarm sting.

let ctx = null;
let muted = false;

function ensureCtx() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip(freq, dur, type, gain, when = 0) {
  const c = ensureCtx();
  if (!c || muted) return;
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function unlockAudio() {
  ensureCtx();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

// Soft marble tap as the thief walks; sneaking is near-silent.
export function footstep(sneaking) {
  blip(sneaking ? 150 : 210, 0.07, 'triangle', sneaking ? 0.03 : 0.07);
}

// A warden's boot, louder the closer the nearest warden is.
export function guardStep(distance) {
  const g = Math.max(0.02, 0.16 - distance * 0.018);
  blip(120, 0.09, 'sine', g);
}

export function coinClink() {
  blip(1560, 0.12, 'sine', 0.12);
  blip(2093, 0.16, 'sine', 0.09, 0.07);
}

export function stealChime() {
  blip(523, 0.14, 'sine', 0.12);
  blip(659, 0.14, 'sine', 0.12, 0.09);
  blip(784, 0.22, 'sine', 0.14, 0.18);
}

export function alarmSting() {
  blip(220, 0.22, 'sawtooth', 0.1);
  blip(311, 0.3, 'sawtooth', 0.1, 0.16);
}

export function winChime() {
  [523, 659, 784, 1046].forEach((f, i) => blip(f, 0.2, 'sine', 0.12, i * 0.11));
}
