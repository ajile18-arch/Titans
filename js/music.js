// MechJocks Dynamic Soundtrack Engine — procedurally generated with the Web Audio API
// Features dual sound modes:
// 1. Ambient Mode: Warm, meditative D minor ambient pad with sub-bass and gentle plucked notes for HQ/Garage.
// 2. Battle Mode: Upbeat, high-octane 128 BPM cyberpunk combat soundtrack with driving 16th-note synth bass,
//    punchy kick, crisp snare, 16th hi-hat pulse, syncopated chord stabs, and cascading arpeggio synth leads.
// Zero external audio files required. All envelopes are click-free and mathematically scheduled on the audio clock.

window.MusicModule = {
  ctx: null,
  master: null,
  ambientBus: null,
  battleBus: null,
  padBus: null,
  pluckBus: null,
  noiseBuffer: null,
  started: false,
  muted: false,
  volume: 0.5,
  mode: 'ambient', // 'ambient' | 'battle'
  schedulerTimer: null,
  nextAmbientChordTime: 0,
  ambientStep: 0,
  nextBattleBarTime: 0,
  battleBarStep: 0,
  STORAGE_KEY: 'mechjocks_music',

  AMBIENT_CHORD_SECONDS: 12,
  BATTLE_BPM: 128,

  // Ambient D minor progression: Dm - Bb - F - C
  ambientChords: [
    { bass: 73.42,  pad: [146.83, 174.61, 220.00] }, // Dm
    { bass: 58.27,  pad: [116.54, 146.83, 174.61] }, // Bb
    { bass: 87.31,  pad: [174.61, 220.00, 261.63] }, // F
    { bass: 65.41,  pad: [130.81, 196.00, 261.63] }  // C
  ],
  ambientMelodyNotes: [293.66, 349.23, 392.00, 440.00, 523.25, 587.33],

  // Battle 4-bar driving progression in D minor
  battleProgression: [
    {
      root: 73.42, // D2
      rootOctave: 146.83, // D3
      fifth: 110.00, // A2
      seventh: 130.81, // C3
      stabs: [146.83, 174.61, 220.00, 293.66], // Dm (D3, F3, A3, D4)
      arp: [293.66, 349.23, 440.00, 523.25, 587.33, 523.25, 440.00, 349.23] // D4, F4, A4, C5, D5
    },
    {
      root: 58.27, // Bb1
      rootOctave: 116.54, // Bb2
      fifth: 87.31, // F2
      seventh: 103.83, // Ab2 / A2
      stabs: [116.54, 146.83, 174.61, 233.08], // Bb (Bb2, D3, F3, Bb3)
      arp: [233.08, 293.66, 349.23, 466.16, 587.33, 466.16, 349.23, 293.66] // Bb3, D4, F4, Bb4, D5
    },
    {
      root: 65.41, // C2
      rootOctave: 130.81, // C3
      fifth: 98.00, // G2
      seventh: 116.54, // Bb2
      stabs: [130.81, 164.81, 196.00, 261.63], // C (C3, E3, G3, C4)
      arp: [261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 392.00, 329.63] // C4, E4, G4, C5, E5
    },
    {
      root: 55.00, // A1
      rootOctave: 110.00, // A2
      fifth: 82.41, // E2
      seventh: 98.00, // G2
      stabs: [110.00, 130.81, 164.81, 220.00], // Am (A2, C3, E3, A3)
      arp: [220.00, 261.63, 329.63, 440.00, 523.25, 440.00, 329.63, 261.63] // A3, C4, E4, A4, C5
    }
  ],

  init() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
      if (typeof saved.muted === 'boolean') this.muted = saved.muted;
      if (typeof saved.volume === 'number') this.volume = saved.volume;
      if (saved.mode === 'battle' || saved.mode === 'ambient') this.mode = saved.mode;
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
    let wrap = document.getElementById('music-controls');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'music-controls';
      wrap.style.cssText = 'position:fixed; right:14px; bottom:14px; z-index:9999; display:flex; align-items:center; gap:8px; background:rgba(15,23,42,0.92); border:1px solid #3b537a; border-radius:999px; padding:6px 14px; box-shadow:0 6px 20px rgba(0,0,0,0.6); backdrop-filter:blur(8px); font-family:var(--font-main); user-select:none;';
      document.body.appendChild(wrap);
    }

    wrap.innerHTML = `
      <button id="music-mode-btn" title="Click to toggle between Hangar Ambient & Upbeat Battle Music" style="background:rgba(59,130,246,0.18); border:1px solid #3b82f6; border-radius:12px; color:#93c5fd; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.04em; padding:3px 8px; cursor:pointer; display:flex; align-items:center; gap:4px;"></button>
      <button id="music-toggle" title="Toggle music mute" style="background:none; border:none; color:#e2e8f0; font-size:15px; cursor:pointer; padding:0; line-height:1;"></button>
      <input id="music-volume" type="range" min="0" max="100" value="${Math.round(this.volume * 100)}" title="Music volume" style="width:70px; accent-color:#3b82f6;" />
    `;

    document.getElementById('music-mode-btn').onclick = () => this.toggleMode();
    document.getElementById('music-toggle').onclick = () => this.toggleMute();
    document.getElementById('music-volume').oninput = (e) => this.setVolume(Number(e.target.value) / 100);
    this.updateButton();
  },

  updateButton() {
    const t = document.getElementById('music-toggle');
    const m = document.getElementById('music-mode-btn');
    if (t) t.textContent = this.muted ? '\uD83D\uDD07' : '\uD83C\uDFB5';
    if (m) {
      if (this.mode === 'battle') {
        m.innerHTML = '⚡ <span>BATTLE (128 BPM)</span>';
        m.style.borderColor = '#ef4444';
        m.style.color = '#fca5a5';
        m.style.background = 'rgba(239, 68, 68, 0.22)';
      } else {
        m.innerHTML = '🌙 <span>HANGAR AMBIENT</span>';
        m.style.borderColor = '#3b82f6';
        m.style.color = '#93c5fd';
        m.style.background = 'rgba(59, 130, 246, 0.18)';
      }
    }
  },

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ muted: this.muted, volume: this.volume, mode: this.mode }));
    } catch (e) { /* ignore */ }
  },

  applyVolume() {
    if (!this.master) return;
    const target = this.muted ? 0 : this.volume * 0.55;
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.12);
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
    if (this.volume > 0 && this.muted) {
      this.muted = false;
    }
    this.applyVolume();
    this.updateButton();
    this.save();
  },

  toggleMode() {
    this.setMode(this.mode === 'battle' ? 'ambient' : 'battle');
  },

  setMode(newMode) {
    if (this.mode === newMode && this.started) return;
    this.mode = (newMode === 'battle') ? 'battle' : 'ambient';
    if (!this.started) this.start();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx ? this.ctx.currentTime : 0;
    if (this.ambientBus && this.battleBus) {
      if (this.mode === 'battle') {
        // Smooth cross-fade to upbeat battle theme
        this.battleBus.gain.setTargetAtTime(0.85, t, 0.35);
        this.ambientBus.gain.setTargetAtTime(0, t, 0.35);
        // Resync battle beat to start cleanly without waiting
        this.nextBattleBarTime = Math.max(this.nextBattleBarTime, t + 0.05);
      } else {
        // Smooth cross-fade to peaceful ambient hangar theme
        this.ambientBus.gain.setTargetAtTime(0.55, t, 0.35);
        this.battleBus.gain.setTargetAtTime(0, t, 0.35);
        this.nextAmbientChordTime = Math.max(this.nextAmbientChordTime, t + 0.05);
      }
    }
    this.updateButton();
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

    // Pre-generate 1s of high-quality white noise for drum synthesis (snare/hats)
    const bufSize = ctx.sampleRate;
    this.noiseBuffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const noiseData = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    // Master bus & Brickwall Limiter to guarantee pristine output with zero distortion
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -16;
    limiter.knee.value = 20;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.005;
    limiter.release.value = 0.3;
    this.master.connect(limiter);
    limiter.connect(ctx.destination);

    // ==========================================
    // 1. AMBIENT ENGINE SUB-BUSES
    // ==========================================
    this.ambientBus = ctx.createGain();
    this.ambientBus.gain.value = this.mode === 'ambient' ? 0.55 : 0;
    this.ambientBus.connect(this.master);

    // Pad Bus with gentle LFO-modulated lowpass filter
    this.padBus = ctx.createGain();
    this.padBus.gain.value = 0.5;
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 700;
    padFilter.Q.value = 0.4;
    this.padBus.connect(padFilter);
    padFilter.connect(this.ambientBus);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 220;
    lfo.connect(lfoDepth);
    lfoDepth.connect(padFilter.frequency);
    lfo.start();

    // Pluck Bus with damped analog-style tape echo
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
    this.pluckBus.connect(this.ambientBus);
    this.pluckBus.connect(echo);
    echo.connect(damp);
    damp.connect(feedback);
    feedback.connect(echo);
    damp.connect(echoOut);
    echoOut.connect(this.ambientBus);

    // ==========================================
    // 2. UPBEAT BATTLE ENGINE SUB-BUSES
    // ==========================================
    this.battleBus = ctx.createGain();
    this.battleBus.gain.value = this.mode === 'battle' ? 0.85 : 0;
    this.battleBus.connect(this.master);

    // Battle Drums Bus
    this.battleDrumsBus = ctx.createGain();
    this.battleDrumsBus.gain.value = 0.85;
    this.battleDrumsBus.connect(this.battleBus);

    // Battle Bass Bus with punchy low-end presence
    this.battleBassBus = ctx.createGain();
    this.battleBassBus.gain.value = 0.8;
    const bassEQ = ctx.createBiquadFilter();
    bassEQ.type = 'lowshelf';
    bassEQ.frequency.value = 180;
    bassEQ.gain.value = 3.5;
    this.battleBassBus.connect(bassEQ);
    bassEQ.connect(this.battleBus);

    // Battle Synth & Arp Bus with dynamic stereo-style dotted-8th ping-pong delay
    this.battleSynthBus = ctx.createGain();
    this.battleSynthBus.gain.value = 0.75;
    const battleEcho = ctx.createDelay(1.0);
    const beatSec = 60 / this.BATTLE_BPM;
    battleEcho.delayTime.value = (beatSec / 4) * 3; // dotted 16th / rhythmic echo
    const battleFeedback = ctx.createGain();
    battleFeedback.gain.value = 0.28;
    const battleDamp = ctx.createBiquadFilter();
    battleDamp.type = 'lowpass';
    battleDamp.frequency.value = 2400;
    const battleEchoOut = ctx.createGain();
    battleEchoOut.gain.value = 0.42;

    this.battleSynthBus.connect(this.battleBus);
    this.battleSynthBus.connect(battleEcho);
    battleEcho.connect(battleDamp);
    battleDamp.connect(battleFeedback);
    battleFeedback.connect(battleEcho);
    battleDamp.connect(battleEchoOut);
    battleEchoOut.connect(this.battleBus);

    this.applyVolume();

    // Start Audio-Clock Schedulers
    this.nextAmbientChordTime = ctx.currentTime + 0.1;
    this.nextBattleBarTime = ctx.currentTime + 0.1;
    this.schedule();
    this.schedulerTimer = setInterval(() => this.schedule(), 350);
  },

  schedule() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Schedule Ambient Pad & Plucks if in ambient mode (or during cross-fade)
    if (this.mode === 'ambient' || (this.ambientBus && this.ambientBus.gain.value > 0.02)) {
      while (this.nextAmbientChordTime < now + 4) {
        this.playAmbientChord(this.nextAmbientChordTime);
        this.nextAmbientChordTime += this.AMBIENT_CHORD_SECONDS;
      }
    }

    // Schedule Upbeat Battle Beats, Basslines & Leads if in battle mode
    if (this.mode === 'battle' || (this.battleBus && this.battleBus.gain.value > 0.02)) {
      const beatLen = 60 / this.BATTLE_BPM;
      const barLen = beatLen * 4; // 4 beats per bar (1.875s at 128 BPM)

      while (this.nextBattleBarTime < now + 2.5) {
        this.playBattleBar(this.nextBattleBarTime, beatLen);
        this.nextBattleBarTime += barLen;
      }
    }
  },

  // Click-free linear envelope helper
  envelope(gainNode, when, peak, attack, hold, release) {
    const g = gainNode.gain;
    g.setValueAtTime(0, when);
    g.linearRampToValueAtTime(peak, when + attack);
    g.setValueAtTime(peak, when + attack + hold);
    g.setTargetAtTime(0, when + attack + hold, release / 4);
    return when + attack + hold + release * 2;
  },

  // ==========================================
  // AMBIENT ENGINE PLAYERS
  // ==========================================
  playAmbientChord(when) {
    const ctx = this.ctx;
    const chord = this.ambientChords[this.ambientStep % this.ambientChords.length];
    this.ambientStep++;
    const len = this.AMBIENT_CHORD_SECONDS;

    // 3 pad notes, detuned sine/triangle voices
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

    // Sub-bass root
    const bass = ctx.createOscillator();
    bass.type = 'sine';
    bass.frequency.value = chord.bass;
    const bg = ctx.createGain();
    const bStop = this.envelope(bg, when, 0.16, 3, len - 5, 4);
    bass.connect(bg);
    bg.connect(this.padBus);
    bass.start(when);
    bass.stop(bStop + 0.5);

    // Plucked notes
    const pluckTimes = [2.5, 6.0, 9.0];
    pluckTimes.forEach((offset) => {
      const f = this.ambientMelodyNotes[Math.floor(Math.random() * this.ambientMelodyNotes.length)];
      this.playPluck(f, when + offset + Math.random() * 0.8);
    });
  },

  playPluck(freq, when) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.09, when + 0.04);
    g.gain.setTargetAtTime(0, when + 0.05, 0.7);
    osc.connect(g);
    g.connect(this.pluckBus);
    osc.start(when);
    osc.stop(when + 6);
  },

  // ==========================================
  // UPBEAT BATTLE ENGINE PLAYERS (128 BPM)
  // ==========================================
  playBattleBar(barTime, beatLen) {
    const ctx = this.ctx;
    const barData = this.battleProgression[this.battleBarStep % this.battleProgression.length];
    this.battleBarStep++;

    const sixteenth = beatLen / 4;

    // 1. PUNCHY FOUR-ON-THE-FLOOR KICK DRUM (Beats 0, 1, 2, 3)
    for (let b = 0; b < 4; b++) {
      this.playBattleKick(barTime + b * beatLen);
    }

    // 2. CRISP CYBER-SNARE / CLAP (Beats 1 & 3 - the backbeats)
    this.playBattleSnare(barTime + 1 * beatLen);
    this.playBattleSnare(barTime + 3 * beatLen);

    // 3. 16TH-NOTE DRIVING HI-HATS (16 ticks per bar)
    for (let s = 0; s < 16; s++) {
      const t = barTime + s * sixteenth;
      const isOffbeat = (s % 4 === 2); // 8th note upbeat
      const isQuarter = (s % 4 === 0);
      const isSemiOpen = (s === 14); // open sizzle near end of bar
      this.playBattleHat(t, isSemiOpen ? 0.14 : (isOffbeat ? 0.06 : 0.035), isOffbeat || isQuarter);
    }

    // 4. DRIVING 16TH-NOTE ROLLING SYNTH BASSLINE
    // Groove pattern locking into kick and syncopated upbeat accents
    const bassSteps = [
      barData.root, barData.root, barData.rootOctave, barData.root,
      barData.root, barData.fifth, barData.rootOctave, barData.root,
      barData.root, barData.seventh, barData.rootOctave, barData.root,
      barData.fifth, barData.rootOctave, barData.seventh, barData.root
    ];

    bassSteps.forEach((freq, idx) => {
      const t = barTime + idx * sixteenth;
      const isAccent = (idx === 0 || idx === 6 || idx === 10 || idx === 14);
      this.playBattleBass(freq, t, sixteenth * 0.88, isAccent);
    });

    // 5. CASCADING 16TH-NOTE ARPEGGIO SYNTH LEAD
    const arpSeq = barData.arp;
    for (let s = 0; s < 16; s++) {
      const noteFreq = arpSeq[s % arpSeq.length];
      const t = barTime + s * sixteenth;
      this.playBattleArp(noteFreq, t, sixteenth * 0.75);
    }

    // 6. HEROIC CHORD POWER STABS (On Beat 0 and Beat 2.5)
    this.playBattleStab(barData.stabs, barTime, 0.45);
    this.playBattleStab(barData.stabs, barTime + beatLen * 2.5, 0.38);
  },

  // Punchy Electronic Kick Drum
  playBattleKick(when) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';

    // Pitch sweep from 155 Hz down to 44 Hz
    osc.frequency.setValueAtTime(155, when);
    osc.frequency.exponentialRampToValueAtTime(44, when + 0.085);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.32, when + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.14);

    osc.connect(g);
    g.connect(this.battleDrumsBus);

    osc.start(when);
    osc.stop(when + 0.16);
  },

  // Metallic Cyber-Snare
  playBattleSnare(when) {
    const ctx = this.ctx;

    // Body tone
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, when);
    osc.frequency.exponentialRampToValueAtTime(90, when + 0.07);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.18, when);
    oscGain.gain.exponentialRampToValueAtTime(0.001, when + 0.09);

    osc.connect(oscGain);
    oscGain.connect(this.battleDrumsBus);
    osc.start(when);
    osc.stop(when + 0.1);

    // Noise burst
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400;
      filter.Q.value = 1.4;

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0, when);
      nGain.gain.linearRampToValueAtTime(0.22, when + 0.004);
      nGain.gain.exponentialRampToValueAtTime(0.001, when + 0.15);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.battleDrumsBus);

      noise.start(when);
      noise.stop(when + 0.16);
    }
  },

  // Hi-Hat Tick / Sizzle
  playBattleHat(when, duration, accented) {
    const ctx = this.ctx;
    if (!this.noiseBuffer) return;

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;

    const g = ctx.createGain();
    const peak = accented ? 0.08 : 0.045;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(peak, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0005, when + duration);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.battleDrumsBus);

    noise.start(when);
    noise.stop(when + duration + 0.01);
  },

  // Driving 16th-Note Analog Synth Bass
  playBattleBass(freq, when, duration, isAccent) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;

    // Resonant Moog-style lowpass filter envelope
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 2.8;

    const startCutoff = isAccent ? 1400 : 950;
    filter.frequency.setValueAtTime(startCutoff, when);
    filter.frequency.exponentialRampToValueAtTime(180, when + duration);

    const g = ctx.createGain();
    const peak = isAccent ? 0.18 : 0.13;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(peak, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, when + duration);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.battleBassBus);

    osc.start(when);
    osc.stop(when + duration + 0.02);
  },

  // Cascading Melodic Synth Lead Arpeggio
  playBattleArp(freq, when, duration) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1750;
    filter.Q.value = 1.8;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.055, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, when + duration);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.battleSynthBus);

    osc.start(when);
    osc.stop(when + duration + 0.02);
  },

  // Polyphonic Heroic Brass & Synth Chord Power Stabs
  playBattleStab(chordFreqs, when, duration) {
    const ctx = this.ctx;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 2.0;
    filter.frequency.setValueAtTime(2600, when);
    filter.frequency.exponentialRampToValueAtTime(650, when + duration);

    const masterStabGain = ctx.createGain();
    masterStabGain.gain.setValueAtTime(0, when);
    masterStabGain.gain.linearRampToValueAtTime(0.12, when + 0.015);
    masterStabGain.gain.exponentialRampToValueAtTime(0.001, when + duration);

    filter.connect(masterStabGain);
    masterStabGain.connect(this.battleSynthBus);

    chordFreqs.forEach((freq, idx) => {
      [-4, 4].forEach(detune => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.value = freq;
        osc.detune.value = detune;

        osc.connect(filter);
        osc.start(when);
        osc.stop(when + duration + 0.04);
      });
    });
  }
};

window.addEventListener('DOMContentLoaded', () => window.MusicModule.init());
