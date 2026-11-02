// MechJocks Ambient Music v2 — procedurally generated with the Web Audio API (no audio files needed)
// Warm, slow pad in D minor with a soft sub-bass and gentle plucked notes.
// Built to avoid crackle: few voices, smooth envelopes that always fade fully to silence, a damped echo,
// a master compressor/limiter, and chord scheduling on the audio clock (not setInterval).

window.MusicModule = {
  ctx: null,
  master: null,
  padBus: null,
  started: false,
  muted: false,
  volume: 0.5,
  schedulerTimer: null,
  nextChordTime: 0,
  step: 0,
  STORAGE_KEY: 'mechjocks_music',

  CHORD_SECONDS: 12,

  // D minor loop: Dm - Bb - F - C   (root for bass, then 3 pad notes)
  chords: [
    { bass: 73.42,  pad: [146.83, 174.61, 220.00] }, // Dm
    { bass: 58.27,  pad: [116.54, 146.83, 174.61] }, // Bb
    { bass: 87.31,  pad: [174.61, 220.00, 261.63] }, // F
    { bass: 65.41,  pad: [130.81, 196.00, 261.63] }  // C
  ],
  // D natural minor, calm mid register for the plucks
  melodyNotes: [293.66, 349.23, 392.00, 440.00, 523.25, 587.33],

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
    const target = this.muted ? 0 : this.volume * 0.5;
    // setTargetAtTime gives a click-free, smooth volume change
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.15);
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
    const ctx = this.ctx;

    // Final stage: master volume -> compressor/limiter -> speakers (prevents any clipping crackle)
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -18;
    limiter.knee.value = 24;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.01;
    limiter.release.value = 0.4;
    this.master.connect(limiter);
    limiter.connect(ctx.destination);

    // Pad bus: shared soft low-pass that slowly opens and closes for gentle movement
    this.padBus = ctx.createGain();
    this.padBus.gain.value = 0.5;
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 700;
    padFilter.Q.value = 0.4;
    this.padBus.connect(padFilter);
    padFilter.connect(this.master);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 220;
    lfo.connect(lfoDepth);
    lfoDepth.connect(padFilter.frequency);
    lfo.start();

    // Pluck bus with a damped echo (low-pass in the feedback loop so repeats get softer and darker)
    this.pluckBus = ctx.createGain();
    this.pluckBus.gain.value = 0.7;
    const echo = ctx.createDelay(2.0);
    echo.delayTime.value = 0.6;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 1500;
    const echoOut = ctx.createGain();
    echoOut.gain.value = 0.5;
    this.pluckBus.connect(this.master);
    this.pluckBus.connect(echo);
    echo.connect(damp);
    damp.connect(feedback);
    feedback.connect(echo);
    damp.connect(echoOut);
    echoOut.connect(this.master);

    this.applyVolume();

    // Audio-clock scheduler: looks ahead and schedules chords precisely, immune to timer jitter
    this.nextChordTime = ctx.currentTime + 0.2;
    this.schedule();
    this.schedulerTimer = setInterval(() => this.schedule(), 1000);
  },

  schedule() {
    if (!this.ctx) return;
    while (this.nextChordTime < this.ctx.currentTime + 6) {
      this.playChord(this.nextChordTime);
      this.nextChordTime += this.CHORD_SECONDS;
    }
  },

  // Smooth envelope that always starts at 0 and decays fully to 0 before the oscillator stops
  envelope(gainNode, when, peak, attack, hold, release) {
    const g = gainNode.gain;
    g.setValueAtTime(0, when);
    g.linearRampToValueAtTime(peak, when + attack);
    g.setValueAtTime(peak, when + attack + hold);
    g.setTargetAtTime(0, when + attack + hold, release / 4);
    return when + attack + hold + release * 2; // safe stop time (well past the fade tail)
  },

  playChord(when) {
    const ctx = this.ctx;
    const chord = this.chords[this.step % this.chords.length];
    this.step++;
    const len = this.CHORD_SECONDS;

    // Warm pad: 3 notes, each as 2 slightly detuned triangle/sine voices (6 voices total)
    chord.pad.forEach((freq) => {
      [-5, 5].forEach((detune, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        osc.detune.value = detune;
        const g = ctx.createGain();
        const stopAt = this.envelope(g, when, 0.11, 3.5, len - 6, 5);
        osc.connect(g);
        g.connect(this.padBus);
        osc.start(when);
        osc.stop(stopAt + 0.5);
      });
    });

    // Soft sub-bass root note
    const bass = ctx.createOscillator();
    bass.type = 'sine';
    bass.frequency.value = chord.bass;
    const bg = ctx.createGain();
    const bStop = this.envelope(bg, when, 0.16, 3, len - 5, 4);
    bass.connect(bg);
    bg.connect(this.padBus);
    bass.start(when);
    bass.stop(bStop + 0.5);

    // 3 gentle plucked notes per chord at relaxed intervals
    const pluckTimes = [2.5, 6.0, 9.0];
    pluckTimes.forEach((offset) => {
      const f = this.melodyNotes[Math.floor(Math.random() * this.melodyNotes.length)];
      this.playPluck(f, when + offset + Math.random() * 0.8);
    });
  },

  playPluck(freq, when) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    // 40 ms attack avoids a click; decay uses a time constant so it tails off to true silence
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.09, when + 0.04);
    g.gain.setTargetAtTime(0, when + 0.05, 0.7);
    osc.connect(g);
    g.connect(this.pluckBus);
    osc.start(when);
    osc.stop(when + 6);
  }
};

window.addEventListener('DOMContentLoaded', () => window.MusicModule.init());
