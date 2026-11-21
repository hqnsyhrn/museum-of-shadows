// Museum of Shadows — sound, synthesized live with WebAudio. No audio files,
// no network: footsteps, a coin's clink, a relic's chime and the alarm sting
// are all oscillators and filtered noise built at run time.
// Footsteps are the tell: a guard's tread grows louder as he nears you.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
    this.ambient = null;
  }

  /** Browsers only let audio start after a gesture; call from the first one. */
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.startAmbient();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  /** A low room tone: the museum breathing at night. */
  startAmbient() {
    const ctx = this.ctx;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;
    const gain = ctx.createGain();
    gain.gain.value = 0.035;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start();
    this.ambient = source;
  }

  /** Short filtered noise burst — a footstep. Pan tells you which side. */
  footstep(pan, loud) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const dur = 0.07;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    const gain = ctx.createGain();
    gain.gain.value = loud;
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    source.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.master);
    source.start();
  }

  /** A bright metallic ping. */
  coinClink() {
    if (!this.ctx || this.muted) return;
    this.tone(2093, 0.09, 0.12, 'sine');
    this.tone(2637, 0.12, 0.08, 'sine');
  }

  /** A soft rising chime when a relic is lifted. */
  relicChime() {
    if (!this.ctx || this.muted) return;
    this.tone(523, 0.16, 0.14, 'sine');
    setTimeout(() => this.tone(784, 0.2, 0.14, 'sine'), 90);
    setTimeout(() => this.tone(1046, 0.3, 0.14, 'sine'), 190);
  }

  /** The alarm sting: two low brass-ish notes when a guard goes alert. */
  alarmSting() {
    if (!this.ctx || this.muted) return;
    this.tone(220, 0.22, 0.2, 'sawtooth');
    setTimeout(() => this.tone(174, 0.3, 0.2, 'sawtooth'), 140);
  }

  /** A warm major chord for the escape. */
  winChord() {
    if (!this.ctx || this.muted) return;
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.5, 0.12, 'triangle'), i * 110));
  }

  tone(freq, dur, vol, type) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }
}
