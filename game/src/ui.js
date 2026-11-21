// Museum of Shadows — the HUD: relic pips, the suspicion meter, the status
// word and the overlays. The status word is the game's honesty: UNSEEN,
// SUSPICIOUS or ALERTED, always visible, never a surprise.

export class Hud {
  constructor() {
    this.relicsEl = document.getElementById('hud-relics');
    this.statusEl = document.getElementById('hud-status');
    this.timerEl = document.getElementById('hud-timer');
    this.alarmFill = document.getElementById('alarm-fill');
    this.toastEl = document.getElementById('toast');
    this.overlay = document.getElementById('overlay');
    this.overlayTitle = document.getElementById('overlay-title');
    this.overlayText = document.getElementById('overlay-text');
    this.overlayStats = document.getElementById('overlay-stats');
    this.overlayButton = document.getElementById('overlay-button');
    this.toastTimer = null;
  }

  update(state) {
    const total = 3;
    let pips = '';
    for (let i = 0; i < total; i++) pips += i < state.takenRelics.size ? '◆' : '◇';
    this.relicsEl.textContent = pips;

    const maxSuspicion = Math.max(0, ...state.guards.map((g) => g.suspicion));
    const anyAlerted = state.guards.some((g) => g.state === 'alerted');
    const anyWary = state.guards.some((g) => g.state === 'suspicious' || g.state === 'search');
    let status = 'UNSEEN';
    let cls = '';
    if (anyAlerted) {
      status = 'ALERTED — RUN';
      cls = 'alerted';
    } else if (anyWary || maxSuspicion > 25) {
      status = 'SUSPICIOUS';
      cls = 'suspicious';
    }
    this.statusEl.textContent = status;
    this.statusEl.className = cls;

    const seconds = Math.floor(state.elapsed);
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    this.timerEl.textContent = `${mm}:${ss}`;
    this.alarmFill.style.width = `${maxSuspicion.toFixed(0)}%`;
  }

  toast(message, ms = 2600) {
    this.toastEl.textContent = message;
    this.toastEl.style.opacity = '1';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.style.opacity = '0';
    }, ms);
  }

  showOverlay(title, text, stats, buttonLabel, onButton) {
    this.overlayTitle.textContent = title;
    this.overlayText.textContent = text;
    this.overlayStats.textContent = stats;
    this.overlayButton.textContent = buttonLabel;
    this.overlay.classList.remove('hidden');
    this.overlayButton.onclick = () => {
      this.hideOverlay();
      onButton();
    };
  }

  hideOverlay() {
    this.overlay.classList.add('hidden');
  }
}
