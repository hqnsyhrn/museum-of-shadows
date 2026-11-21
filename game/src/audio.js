// Museum of Shadows — tiny synthesised sounds, no audio files.
// Everything is a WebAudio oscillator, created only after the player's
// first key or click, so the game stays silent (and error-free) in a
// headless screenshot run where nobody ever presses a key.
const audio = {
  context: null,
  enabled: true,

  ensure() {
    if (!this.enabled || this.context) return;
    try {
      const Ctor =
        window.AudioContext ||
        window.webkitAudioContext;
      if (!Ctor) return;
      this.context = new Ctor();
    } catch {
      this.context = null;
    }
  },

  tone(freq, seconds, type, gainValue) {
    if (!this.enabled || !this.context) return;
    try {
      const t0 = this.context.currentTime;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(gainValue || 0.08, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
      osc.connect(gain);
      gain.connect(this.context.destination);
      osc.start(t0);
      osc.stop(t0 + seconds);
    } catch {
      // Sound is garnish; a failure must never break the game.
    }
  },

  coin() {
    this.tone(1567, 0.12, "triangle", 0.07);
    setTimeout(() => this.tone(2093, 0.16, "triangle", 0.05), 70);
  },

  pickup() {
    this.tone(523, 0.12, "sine", 0.09);
    setTimeout(() => this.tone(784, 0.2, "sine", 0.09), 90);
  },

  alarm() {
    this.tone(220, 0.25, "sawtooth", 0.06);
    setTimeout(() => this.tone(174, 0.3, "sawtooth", 0.06), 180);
  },

  win() {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.22, "sine", 0.09), i * 110),
    );
  },

  busted() {
    this.tone(110, 0.5, "sawtooth", 0.08);
  },
};

export { audio };
