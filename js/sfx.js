// MechJocks Tactical Battle Arena Sound Effects Engine (Procedural Web Audio API)
// Provides distinct synthesized firing, impact (hit), and near-miss / deflection sound effects
// for all weapon archetypes: Energy (Lasers), Heavy Energy (PPC / Plasma / Meson),
// Ballistic (Autocannons / Gauss), Rapid-fire (Machine Guns), Guided Missiles (LRM / SRM),
// and Melee (Power Axe / Vibro-Blade). Zero external audio assets required.

window.SoundFX = {
  ctx: null,
  master: null,
  noiseBuffer: null,
  volume: 0.7,
  muted: false,

  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();

      // Master gain node and brickwall limiter to ensure crisp sound with zero distortion or crackle
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;

      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -12;
      limiter.knee.value = 18;
      limiter.ratio.value = 8;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.25;

      this.master.connect(limiter);
      limiter.connect(this.ctx.destination);

      // Pre-generate 1 second of calibrated white noise
      const bufferSize = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } catch (e) {
      console.warn('Web Audio SoundFX initialization deferred:', e);
    }
  },

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    // Synchronize mute state with MusicModule if available
    if (window.MusicModule && typeof window.MusicModule.muted === 'boolean') {
      if (this.master) {
        this.master.gain.setTargetAtTime(window.MusicModule.muted ? 0 : this.volume, this.ctx.currentTime, 0.05);
      }
    }
  },

  // Helper to create a noise source node
  createNoiseNode(ctx) {
    if (!this.noiseBuffer) return null;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    return src;
  },

  // Classify any weapon definition into one of the sound archetypes
  classifyWeapon(weapon) {
    if (!weapon) return 'ballistic';
    const name = (weapon.name || '').toLowerCase();
    const cat = (weapon.cat || '').toLowerCase();

    if (name.includes('plasma') || name.includes('meson') || name.includes('ppc') || name.includes('heavy laser')) {
      return 'ppc';
    }
    if (cat.includes('energy') || name.includes('laser')) {
      return 'laser';
    }
    if (name.includes('machine gun') || name.includes('mg')) {
      return 'machinegun';
    }
    if (cat.includes('missile') || name.includes('lrm') || name.includes('srm') || name.includes('rocket')) {
      return 'missile';
    }
    if (cat.includes('close combat') || name.includes('axe') || name.includes('blade') || name.includes('melee')) {
      return 'melee';
    }
    return 'ballistic'; // Autocannon, Gauss, Cannons
  },

  // Primary entry point for Jockey firing weapons in combat
  playWeaponShot(weapon, isHit) {
    this.ensureContext();
    if (!this.ctx || (window.MusicModule && window.MusicModule.muted)) return;

    const type = this.classifyWeapon(weapon);
    const t = this.ctx.currentTime;

    switch (type) {
      case 'laser':
        if (isHit) this.playLaserHit(t);
        else this.playLaserMiss(t);
        break;
      case 'ppc':
        if (isHit) this.playPpcHit(t);
        else this.playPpcMiss(t);
        break;
      case 'ballistic':
        if (isHit) this.playBallisticHit(t);
        else this.playBallisticMiss(t);
        break;
      case 'machinegun':
        if (isHit) this.playMachineGunHit(t);
        else this.playMachineGunMiss(t);
        break;
      case 'missile':
        if (isHit) this.playMissileHit(t);
        else this.playMissileMiss(t);
        break;
      case 'melee':
        if (isHit) this.playMeleeHit(t);
        else this.playMeleeMiss(t);
        break;
      default:
        if (isHit) this.playBallisticHit(t);
        else this.playBallisticMiss(t);
        break;
    }
  },

  // Incoming enemy fire against player
  playIncomingShot(isHit) {
    this.ensureContext();
    if (!this.ctx || (window.MusicModule && window.MusicModule.muted)) return;
    const t = this.ctx.currentTime;

    if (isHit) {
      // Concussive cockpit shudder + armor impact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.3);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.35);

      // Low rumble
      const noise = this.createNoiseNode(this.ctx);
      if (noise) {
        const filter = this.ctx.createBiquadFilter();
        const ngain = this.ctx.createGain();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, t);
        filter.frequency.exponentialRampToValueAtTime(60, t + 0.3);
        ngain.gain.setValueAtTime(0.6, t);
        ngain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        noise.connect(filter);
        filter.connect(ngain);
        ngain.connect(this.master);
        noise.start(t);
        noise.stop(t + 0.36);
      }
    } else {
      // Near miss flyby / close evasion whiz
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, t);
      osc.frequency.exponentialRampToValueAtTime(280, t + 0.22);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.25);
    }
  },

  // ==========================================
  // 1. LASER SFX
  // ==========================================
  playLaserHit(t) {
    const ctx = this.ctx;
    // Firing beam pulse
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.12);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.15);

    // Sizzling thermal armor burn (highpass noise burst)
    const noise = this.createNoiseNode(ctx);
    if (noise) {
      const filter = ctx.createBiquadFilter();
      const ngain = ctx.createGain();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2400, t + 0.04);
      filter.frequency.linearRampToValueAtTime(1400, t + 0.22);

      ngain.gain.setValueAtTime(0.001, t);
      ngain.gain.linearRampToValueAtTime(0.45, t + 0.05);
      ngain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

      noise.connect(filter);
      filter.connect(ngain);
      ngain.connect(this.master);
      noise.start(t + 0.04);
      noise.stop(t + 0.26);
    }
  },

  playLaserMiss(t) {
    const ctx = this.ctx;
    // Discharge pulse
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(740, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.09);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.11);

    // Deflection / flyby whistle passing wide
    const fly = ctx.createOscillator();
    const flyGain = ctx.createGain();
    fly.type = 'sine';
    fly.frequency.setValueAtTime(560, t + 0.06);
    fly.frequency.exponentialRampToValueAtTime(1250, t + 0.18);
    fly.frequency.exponentialRampToValueAtTime(600, t + 0.28);

    flyGain.gain.setValueAtTime(0.001, t);
    flyGain.gain.linearRampToValueAtTime(0.25, t + 0.12);
    flyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    fly.connect(flyGain);
    flyGain.connect(this.master);
    fly.start(t + 0.06);
    fly.stop(t + 0.3);
  },

  // ==========================================
  // 2. PPC / HEAVY ENERGY / PLASMA SFX
  // ==========================================
  playPpcHit(t) {
    const ctx = this.ctx;
    // Heavy dual-frequency ionic charge zap
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'triangle';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(320, t);
    osc1.frequency.exponentialRampToValueAtTime(90, t + 0.16);
    osc2.frequency.setValueAtTime(480, t);
    osc2.frequency.exponentialRampToValueAtTime(110, t + 0.16);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.master);
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.2);
    osc2.stop(t + 0.2);

    // Concussive EMP thunderclap + electrical arc explosion
    const noise = this.createNoiseNode(ctx);
    if (noise) {
      const filter = ctx.createBiquadFilter();
      const ngain = ctx.createGain();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, t + 0.05);
      filter.frequency.exponentialRampToValueAtTime(300, t + 0.32);
      filter.Q.value = 3.0;

      ngain.gain.setValueAtTime(0.001, t);
      ngain.gain.linearRampToValueAtTime(0.65, t + 0.06);
      ngain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);

      noise.connect(filter);
      filter.connect(ngain);
      ngain.connect(this.master);
      noise.start(t + 0.04);
      noise.stop(t + 0.36);
    }
  },

  playPpcMiss(t) {
    const ctx = this.ctx;
    // Ion zap
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.14);

    // Ozone arc hiss dissipating into empty air
    const noise = this.createNoiseNode(ctx);
    if (noise) {
      const filter = ctx.createBiquadFilter();
      const ngain = ctx.createGain();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(3200, t + 0.05);
      filter.frequency.exponentialRampToValueAtTime(800, t + 0.26);

      ngain.gain.setValueAtTime(0.001, t);
      ngain.gain.linearRampToValueAtTime(0.28, t + 0.08);
      ngain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      noise.connect(filter);
      filter.connect(ngain);
      ngain.connect(this.master);
      noise.start(t + 0.05);
      noise.stop(t + 0.3);
    }
  },

  // ==========================================
  // 3. BALLISTIC / AUTOCANNON / GAUSS SFX
  // ==========================================
  playBallisticHit(t) {
    const ctx = this.ctx;
    // Heavy cannon muzzle thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.1);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.14);

    // Explosive metal crunch impact
    const noise = this.createNoiseNode(ctx);
    if (noise) {
      const filter = ctx.createBiquadFilter();
      const ngain = ctx.createGain();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(360, t + 0.03);
      filter.frequency.exponentialRampToValueAtTime(80, t + 0.28);

      ngain.gain.setValueAtTime(0.001, t);
      ngain.gain.linearRampToValueAtTime(0.65, t + 0.04);
      ngain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      noise.connect(filter);
      filter.connect(ngain);
      ngain.connect(this.master);
      noise.start(t + 0.02);
      noise.stop(t + 0.32);
    }

    // Resonant armor ping (metallic clank)
    const ping = ctx.createOscillator();
    const pingGain = ctx.createGain();
    ping.type = 'sine';
    ping.frequency.setValueAtTime(420, t + 0.04);
    ping.frequency.exponentialRampToValueAtTime(220, t + 0.2);

    pingGain.gain.setValueAtTime(0.001, t);
    pingGain.gain.linearRampToValueAtTime(0.3, t + 0.05);
    pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    ping.connect(pingGain);
    pingGain.connect(this.master);
    ping.start(t + 0.04);
    ping.stop(t + 0.22);
  },

  playBallisticMiss(t) {
    const ctx = this.ctx;
    // Firing gunshot
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.08);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.1);

    // Ricochet ping whizzing wide
    const rico = ctx.createOscillator();
    const ricoGain = ctx.createGain();
    rico.type = 'triangle';
    rico.frequency.setValueAtTime(780, t + 0.05);
    rico.frequency.exponentialRampToValueAtTime(2100, t + 0.16);
    rico.frequency.exponentialRampToValueAtTime(950, t + 0.28);

    ricoGain.gain.setValueAtTime(0.001, t);
    ricoGain.gain.linearRampToValueAtTime(0.35, t + 0.09);
    ricoGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    rico.connect(ricoGain);
    ricoGain.connect(this.master);
    rico.start(t + 0.05);
    rico.stop(t + 0.3);
  },

  // ==========================================
  // 4. MACHINE GUN SFX (RAPID BURST)
  // ==========================================
  playMachineGunHit(t) {
    const ctx = this.ctx;
    // 3 rapid mechanical impacts
    for (let i = 0; i < 3; i++) {
      const burstTime = t + i * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(260 - i * 20, burstTime);
      osc.frequency.exponentialRampToValueAtTime(80, burstTime + 0.04);

      gain.gain.setValueAtTime(0.28, burstTime);
      gain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.045);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(burstTime);
      osc.stop(burstTime + 0.05);

      const noise = this.createNoiseNode(ctx);
      if (noise) {
        const filter = ctx.createBiquadFilter();
        const ngain = ctx.createGain();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(750, burstTime);
        ngain.gain.setValueAtTime(0.32, burstTime);
        ngain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.045);
        noise.connect(filter);
        filter.connect(ngain);
        ngain.connect(this.master);
        noise.start(burstTime);
        noise.stop(burstTime + 0.05);
      }
    }
  },

  playMachineGunMiss(t) {
    const ctx = this.ctx;
    // 3 rapid deflected zips
    for (let i = 0; i < 3; i++) {
      const burstTime = t + i * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600 + i * 150, burstTime);
      osc.frequency.exponentialRampToValueAtTime(1200, burstTime + 0.045);

      gain.gain.setValueAtTime(0.2, burstTime);
      gain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.05);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(burstTime);
      osc.stop(burstTime + 0.055);
    }
  },

  // ==========================================
  // 5. GUIDED MISSILES (LRM / SRM) SFX
  // ==========================================
  playMissileHit(t) {
    const ctx = this.ctx;
    // Rocket motor launch whoosh
    const launchNoise = this.createNoiseNode(ctx);
    if (launchNoise) {
      const lFilter = ctx.createBiquadFilter();
      const lGain = ctx.createGain();
      lFilter.type = 'bandpass';
      lFilter.frequency.setValueAtTime(320, t);
      lFilter.frequency.exponentialRampToValueAtTime(850, t + 0.12);

      lGain.gain.setValueAtTime(0.35, t);
      lGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      launchNoise.connect(lFilter);
      lFilter.connect(lGain);
      lGain.connect(this.master);
      launchNoise.start(t);
      launchNoise.stop(t + 0.15);
    }

    // Heavy concussive explosion detonation
    const impactTime = t + 0.1;
    const boomNoise = this.createNoiseNode(ctx);
    if (boomNoise) {
      const bFilter = ctx.createBiquadFilter();
      const bGain = ctx.createGain();
      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(320, impactTime);
      bFilter.frequency.exponentialRampToValueAtTime(50, impactTime + 0.38);

      bGain.gain.setValueAtTime(0.001, impactTime);
      bGain.gain.linearRampToValueAtTime(0.7, impactTime + 0.02);
      bGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.38);

      boomNoise.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(this.master);
      boomNoise.start(impactTime);
      boomNoise.stop(impactTime + 0.4);
    }

    // Sub-bass detonation thump
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(95, impactTime);
    sub.frequency.exponentialRampToValueAtTime(28, impactTime + 0.35);

    subGain.gain.setValueAtTime(0.5, impactTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.36);

    sub.connect(subGain);
    subGain.connect(this.master);
    sub.start(impactTime);
    sub.stop(impactTime + 0.38);
  },

  playMissileMiss(t) {
    const ctx = this.ctx;
    // Rocket launch whoosh
    const launchNoise = this.createNoiseNode(ctx);
    if (launchNoise) {
      const lFilter = ctx.createBiquadFilter();
      const lGain = ctx.createGain();
      lFilter.type = 'bandpass';
      lFilter.frequency.setValueAtTime(350, t);
      lFilter.frequency.exponentialRampToValueAtTime(900, t + 0.12);

      lGain.gain.setValueAtTime(0.35, t);
      lGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      launchNoise.connect(lFilter);
      lFilter.connect(lGain);
      lGain.connect(this.master);
      launchNoise.start(t);
      launchNoise.stop(t + 0.15);
    }

    // Fizzle / distant ground puff / dud flyby
    const flyNoise = this.createNoiseNode(ctx);
    if (flyNoise) {
      const fFilter = ctx.createBiquadFilter();
      const fGain = ctx.createGain();
      fFilter.type = 'lowpass';
      fFilter.frequency.setValueAtTime(450, t + 0.1);
      fFilter.frequency.exponentialRampToValueAtTime(120, t + 0.28);

      fGain.gain.setValueAtTime(0.001, t + 0.1);
      fGain.gain.linearRampToValueAtTime(0.25, t + 0.14);
      fGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      flyNoise.connect(fFilter);
      fFilter.connect(fGain);
      fGain.connect(this.master);
      flyNoise.start(t + 0.1);
      flyNoise.stop(t + 0.3);
    }
  },

  // ==========================================
  // 6. MELEE (POWER AXE / VIBRO-BLADE) SFX
  // ==========================================
  playMeleeHit(t) {
    const ctx = this.ctx;
    // Hydraulic swing whoosh + brutal metallic cleave
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.22);

    // Resonant metal clang
    const ping = ctx.createOscillator();
    const pGain = ctx.createGain();
    ping.type = 'triangle';
    ping.frequency.setValueAtTime(380, t + 0.02);
    ping.frequency.exponentialRampToValueAtTime(140, t + 0.25);

    pGain.gain.setValueAtTime(0.4, t + 0.02);
    pGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    ping.connect(pGain);
    pGain.connect(this.master);
    ping.start(t + 0.02);
    ping.stop(t + 0.26);
  },

  playMeleeMiss(t) {
    const ctx = this.ctx;
    // Airy blade slice whooshing empty air
    const noise = this.createNoiseNode(ctx);
    if (noise) {
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(350, t);
      filter.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
      filter.frequency.exponentialRampToValueAtTime(250, t + 0.22);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      noise.start(t);
      noise.stop(t + 0.24);
    }
  },

  // ==========================================
  // 7. TITAN STABILITY: CRASH / FALL & STAND UP
  // ==========================================
  playMechFall(t) {
    this.ensureContext();
    if (!this.ctx || (window.MusicModule && window.MusicModule.muted)) return;
    const ctx = this.ctx;
    const now = typeof t === 'number' && t > 0 ? t : ctx.currentTime;

    // Heavy ground impact seismic thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(85, now);
    osc.frequency.exponentialRampToValueAtTime(24, now + 0.4);

    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.5);

    // Concussive ground crunch & metal crash
    const noise = this.createNoiseNode(ctx);
    if (noise) {
      const filter = ctx.createBiquadFilter();
      const ngain = ctx.createGain();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, now);
      filter.frequency.exponentialRampToValueAtTime(50, now + 0.42);

      ngain.gain.setValueAtTime(0.001, now);
      ngain.gain.linearRampToValueAtTime(0.7, now + 0.03);
      ngain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(filter);
      filter.connect(ngain);
      ngain.connect(this.master);
      noise.start(now);
      noise.stop(now + 0.48);
    }
  },

  playMechStand(t) {
    this.ensureContext();
    if (!this.ctx || (window.MusicModule && window.MusicModule.muted)) return;
    const ctx = this.ctx;
    const now = typeof t === 'number' && t > 0 ? t : ctx.currentTime;

    // Hydraulic servo whine rising as actuators push Titan upright
    const servo = ctx.createOscillator();
    const sGain = ctx.createGain();
    servo.type = 'triangle';
    servo.frequency.setValueAtTime(140, now);
    servo.frequency.exponentialRampToValueAtTime(420, now + 0.28);

    sGain.gain.setValueAtTime(0.001, now);
    sGain.gain.linearRampToValueAtTime(0.4, now + 0.08);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    servo.connect(sGain);
    sGain.connect(this.master);
    servo.start(now);
    servo.stop(now + 0.34);

    // Mechanical gyro lock / pneumatic clamp snap
    const lock = ctx.createOscillator();
    const lGain = ctx.createGain();
    lock.type = 'square';
    lock.frequency.setValueAtTime(320, now + 0.26);
    lock.frequency.exponentialRampToValueAtTime(120, now + 0.38);

    lGain.gain.setValueAtTime(0.35, now + 0.26);
    lGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    lock.connect(lGain);
    lGain.connect(this.master);
    lock.start(now + 0.26);
    lock.stop(now + 0.42);
  }
};

// Initialize on first user interaction so audio context is ready
window.addEventListener('pointerdown', () => window.SoundFX.ensureContext(), { once: true });
window.addEventListener('keydown', () => window.SoundFX.ensureContext(), { once: true });
