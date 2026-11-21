// Museum of Shadows — tiny WebAudio blips. No audio files, no network.
(function () {
  "use strict";
  var ac = null;

  function ctx() {
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      return ac;
    } catch (e) {
      return null;
    }
  }

  function blip(freq, dur, type, gain) {
    var c = ctx();
    if (!c) return;
    try {
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = type || "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(gain || 0.06, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      o.connect(g);
      g.connect(c.destination);
      o.start();
      o.stop(c.currentTime + dur);
    } catch (e) { /* silence is fine */ }
  }

  window.MOS_AUDIO = {
    coin: function () { blip(1900, 0.09, "triangle", 0.05); setTimeout(function () { blip(2400, 0.12, "triangle", 0.05); }, 70); },
    clink: function () { blip(2600, 0.05, "square", 0.03); },
    alert: function () { blip(220, 0.28, "sawtooth", 0.07); setTimeout(function () { blip(330, 0.28, "sawtooth", 0.07); }, 140); },
    steal: function () { blip(880, 0.12, "sine", 0.06); setTimeout(function () { blip(1318, 0.18, "sine", 0.06); }, 110); },
    win: function () {
      var notes = [523, 659, 784, 1046];
      notes.forEach(function (f, i) { setTimeout(function () { blip(f, 0.25, "sine", 0.07); }, i * 130); });
    },
    caught: function () { blip(160, 0.4, "sawtooth", 0.08); setTimeout(function () { blip(110, 0.5, "sawtooth", 0.08); }, 200); },
  };
})();
