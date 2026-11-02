// MechJocks Ambient Music — procedurally generated with the Web Audio API (no audio files needed)
// A slow, moody sci-fi pad loop with a sparse echoing melody. Starts on first click/keypress (browser autoplay rule).

window.MusicModule = {
  ctx: null,
  master: null,
  started: false,
  muted: false,
  volume: 0.5,
  timer: null,
  step: 0,
  STORAGE_KEY: 'mechjocks_music',

  // A minor progression: Am - F - C - G (each chord lasts 8 seconds)
  chords: [
    [110.00, 164.81, 220.00, 261.63], // Am
    [87.31, 130.81, 174.61, 220.00],  // F
    [130.81, 196.00, 261.63, 329.63], // C
    [98.00, 146.83, 196.00, 246.94]   // G
  ],
  melodyScale: [440.00, 523.25, 587.33, 659.25, 783.99, 880.00], // A minor pentatonic-ish

  init() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
      if (typeof saved.muted === 'boolean') this.muted = saved.muted;
      if (typeof saved.volume === 'number') this.volume = saved.volume;
    } catch (e) { /* ignore */ }

    this.buildButton();
    const kick = () => {
      this.start();
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('keydown', kick);
    };
    window.addEventListener('pointerdown', kick);
    window.addEventListener('keydown', kick);
  },

  buildButton() {
    const wrap = document.createElement('div');
    wrap.id = 'music-controls';
    wrap.style.cssText = 'position:fixed; right:14px; bottom:14px; z-index:9999; display:flex; align-items:center; gap:8px; background:rgba(15,23,42,0.88); border:1px solid #3b537a; border-radius:999px; padding:6px 12px; box-shadow:0 6px 18px rgba(0,0,0,0.5); backdrop-filter:blur(6px);';
    wrap.innerHTML = `
      <button id="music-toggle" title="Toggle music" style="background:none; border:none; color:#e2e8f0; font-size:16px; cursor:pointer; padding:0;"></button>
      <input id="music-volume" type="range" min="0" max="100" value="${Math.round(this.volume * 100)}" title="Music volume" style="width:80px; accent-color:#3b82f6;" />
    `;
    document.body.appendChild(wrap);
    document.getElementById('music-toggle').onclick = () => this.toggleMute();
    document.getElementById('music-volume').oninput = (e) => this.setVolume(Number(e.target.value) / 100);
    this.updateButton();
  },

  updateButton() {
    const b = document.getElementById('music-toggle');
    if (b) b.textContent = this.muted ? '\uD83D\uDD07' : '\uD83C\uDFB5';
  },

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ muted: this.muted, volume: this.volume }));
  },

  applyVolume() {
    if (!this.master) return;
    const target = this.muted ? 0 : this.volume * 0.25;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.4);
  },

  toggleMute() {
    this.muted = !this.muted;
    if (!this.started) this.start();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    this.applyVolume();
    this.updateButton();
    this.save();
  },

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.volume > 0 && this.muted) { this.muted = false; this.updateButton(); }
    this.applyVolume();
    this.save();
  },

  start() {
    if (this.started) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.started = true;
    this.ctx = new AC();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    // Master -> gentle echo -> output
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;

    const delay = this.ctx.createDelay(2.0);
    delay.delayTime.value = 0.55;
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.38;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.45;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);

    this.bus = this.ctx.createGain();
    this.bus.connect(this.master);
    this.bus.connect(delay);
    wet.connect(this.master);
    this.master.connect(this.ctx.destination);

    this.applyVolume();
    this.playChord();
    this.timer = setInterval(() => this.playChord(), 8000);
  },

  playChord() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const chord = this.chords[this.step % this.chords.length];
    this.step++;
    const dur = 9.5; // slight overlap for smooth transitions

    chord.forEach((freq, i) => {
      [-4, 4].forEach(detune => {
        const osc = this.ctx.createOscillator();
        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.value = freq;
        osc.detune.value = detune;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 900;

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(i === 0 ? 0.22 : 0.12, now + 2.5);
        g.gain.linearRampToValueAtTime(0, now + dur);

        osc.connect(filter);
        filter.connect(g);
        g.connect(this.bus);
        osc.start(now);
        osc.stop(now + dur + 0.1);
      });
    });

    // Sparse melody notes (3 to 4 per chord, random spacing)
    const notes = 3 + Math.floor(Math.random() * 2);
    for (let n = 0; n < notes; n++) {
      const t = now + 1 + n * 2 + Math.random() * 1.2;
      const f = this.melodyScale[Math.floor(Math.random() * this.melodyScale.length)];
      this.playBell(f, t);
    }
  },

  playBell(freq, when) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.16, when + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0008, when + 2.4);
    osc.connect(g);
    g.connect(this.bus);
    osc.start(when);
    osc.stop(when + 2.5);
  }
};

window.addEventListener('DOMContentLoaded', () => window.MusicModule.init());
