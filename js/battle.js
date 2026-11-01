// Tactical Battle & Hex Arena Module (Mode A: Classic Action-Time Seconds)

window.BattleModule = {
  active: false,
  clockSec: 0,
  aimTarget: 'General',
  playerPos: { r: 3, c: 1, facing: 'NE', heat: 0 },
  weaponCooldowns: {},
  enemy: null,
  enemyCooldown: 6,
  hexes: [],
  logs: [],
  contractWon: false,
  contractLost: false,

  initEncounter() {
    const st = window.GameState.data;
    const jock = this.getActiveCombatJock();
    const mech = jock ? st.mechs.find(m => m.id === jock.assignedMechId) : st.mechs[0];

    this.active = true;
    this.clockSec = 0;
    this.aimTarget = 'General';
    this.playerPos = { r: 3, c: 1, facing: 'NE', heat: 0 };
    this.weaponCooldowns = {};
    this.contractWon = false;
    this.contractLost = false;

    // Build 5x6 Hex Grid
    this.hexes = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 6; c++) {
        let terrain = 'clear';
        if ((r === 1 && c === 2) || (r === 2 && c === 3) || (r === 3 && c === 2)) terrain = 'woods';
        else if ((r === 2 && c === 1) || (r === 1 && c === 4)) terrain = 'water';
        else if (r === 0 && c === 3) terrain = 'hill';
        this.hexes.push({ r, c, terrain });
      }
    }

    // Spawn Enemy Titan
    const enemyTemplates = [
      { name: 'Enemy TAT-110M "Enforcer"', weight: '110t Medium', dmg: 12, hit: 64 },
      { name: 'Enemy TAT-155H "Warhammer"', weight: '155t Heavy', dmg: 16, hit: 68 },
      { name: 'Enemy TAT-190A "Colossus"', weight: '190t Assault', dmg: 20, hit: 72 }
    ];
    const pick = enemyTemplates[st.missionsCompleted % enemyTemplates.length];
    this.enemy = {
      name: pick.name,
      weight: pick.weight,
      r: 1,
      c: 4,
      dmg: pick.dmg,
      hit: pick.hit,
      armor: { HD: 20, CT: 56, LT: 40, RT: 40, LA: 34, RA: 34, LL: 38, RL: 38 },
      maxArmor: { HD: 20, CT: 56, LT: 40, RT: 40, LA: 34, RA: 34, LL: 38, RL: 38 }
    };
    this.enemyCooldown = 6;

    this.logs = [
      `[00:00s] Contract Initiated: ${jock ? jock.callsign : 'Pilot'} deployed in ${mech ? mech.customName : 'Titan'}.`,
      `[00:00s] Hostile contact locked: ${this.enemy.name} at Hex (4,1).`
    ];
  },

  getActiveCombatJock() {
    const st = window.GameState.data;
    const sel = st.jocks.find(j => j.id === st.selectedJockId && j.assignedMechId);
    if (sel) return sel;
    return st.jocks.find(j => j.assignedMechId) || st.jocks[0];
  },

  log(msg) {
    const mins = String(Math.floor(this.clockSec / 60)).padStart(2, '0');
    const secs = String(this.clockSec % 60).padStart(2, '0');
    this.logs.unshift(`[${mins}:${secs}s] ${msg}`);
    if (this.logs.length > 12) this.logs.pop();
  },

  advanceTime(seconds, mech, metrics) {
    this.clockSec += seconds;

    // Tick player weapon recycle timers
    Object.keys(this.weaponCooldowns).forEach(k => {
      this.weaponCooldowns[k] = Math.max(0, this.weaponCooldowns[k] - seconds);
    });

    // Passive heat dissipation over time
    const coolPerSec = Math.max(1, Math.round(metrics.coolingCap / 12));
    const inWater = this.hexes.find(h => h.r === this.playerPos.r && h.c === this.playerPos.c)?.terrain === 'water';
    const dissipated = Math.round((coolPerSec + (inWater ? 2 : 0)) * (seconds / 3));
    this.playerPos.heat = Math.max(0, this.playerPos.heat - dissipated);

    // Enemy AI action-time clock
    if (!this.contractWon && !this.contractLost) {
      this.enemyCooldown -= seconds;
      if (this.enemyCooldown <= 0) {
        this.runEnemyAI(mech);
        this.enemyCooldown = 6;
      }
    }
  },

  runEnemyAI(playerMech) {
    const st = window.GameState.data;
    const jock = this.getActiveCombatJock();
    const dist = Math.abs(this.playerPos.r - this.enemy.r) + Math.abs(this.playerPos.c - this.enemy.c);

    // Move closer if far
    if (dist > 3) {
      const dr = Math.sign(this.playerPos.r - this.enemy.r);
      const dc = Math.sign(this.playerPos.c - this.enemy.c);
      const nr = this.enemy.r + dr;
      const nc = this.enemy.c + (dr === 0 ? dc : 0);
      if (!(nr === this.playerPos.r && nc === this.playerPos.c)) {
        this.enemy.r = nr;
        this.enemy.c = nc;
        this.log(`${this.enemy.name} advances to Hex (${this.enemy.c},${this.enemy.r}).`);
      }
    }

    // Fire at player
    const playerHex = this.hexes.find(h => h.r === this.playerPos.r && h.c === this.playerPos.c);
    const coverMod = playerHex?.terrain === 'woods' ? -15 : 0;
    const pilotEvade = jock ? Math.round((jock.stats.Piloting - 20) * 0.25) : 0;
    const toHit = Math.max(20, Math.min(85, this.enemy.hit + coverMod - pilotEvade));
    const roll = Math.floor(Math.random() * 100) + 1;

    if (roll <= toHit && playerMech) {
      const locs = ['CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL', 'HD'];
      const hitLoc = locs[Math.floor(Math.random() * 7)];
      playerMech.armor[hitLoc] = Math.max(0, playerMech.armor[hitLoc] - this.enemy.dmg);
      this.log(`ALERT: ${this.enemy.name} hits your ${hitLoc} for ${this.enemy.dmg} dmg!`);

      if (playerMech.armor.CT <= 0 || playerMech.armor.HD <= 0) {
        this.contractLost = true;
        if (jock) jock.health = Math.max(25, jock.health - 30);
        this.log(`CRITICAL: Your Titan suffered core failure! Emergency ejection triggered.`);
      }
    } else {
      this.log(`${this.enemy.name} fires salvos — evaded! (Roll ${roll} > ${toHit}%)`);
    }
    window.GameState.save();
  },

  moveHex(r, c) {
    if (this.contractWon || this.contractLost) return;
    if (r === this.enemy.r && c === this.enemy.c) return;
    const dist = Math.abs(this.playerPos.r - r) + Math.abs(this.playerPos.c - c);
    if (dist === 0 || dist > 2) return;

    const st = window.GameState.data;
    const jock = this.getActiveCombatJock();
    const mech = st.mechs.find(m => m.id === jock?.assignedMechId) || st.mechs[0];
    const metrics = window.GameState.computeMechMetrics(mech);

    this.playerPos.r = r;
    this.playerPos.c = c;
    this.playerPos.heat += 2 * dist;
    const moveSec = Math.max(3, (8 - metrics.tpl.baseSpeedHex) * dist);
    this.log(`Moved to Hex (${c},${r}) [${moveSec}s elapsed].`);
    this.advanceTime(moveSec, mech, metrics);
    this.render();
  },

  twistTorso() {
    if (this.contractWon || this.contractLost) return;
    const dirs = ['N', 'NE', 'SE', 'S', 'SW', 'NW'];
    this.playerPos.facing = dirs[(dirs.indexOf(this.playerPos.facing) + 1) % dirs.length];
    const st = window.GameState.data;
    const jock = this.getActiveCombatJock();
    const mech = st.mechs.find(m => m.id === jock?.assignedMechId) || st.mechs[0];
    const metrics = window.GameState.computeMechMetrics(mech);
    this.log(`Torso twisted to firing arc ${this.playerPos.facing} [2s].`);
    this.advanceTime(2, mech, metrics);
    this.render();
  },

  ventCoolant() {
    if (this.contractWon || this.contractLost) return;
    const st = window.GameState.data;
    const jock = this.getActiveCombatJock();
    const mech = st.mechs.find(m => m.id === jock?.assignedMechId) || st.mechs[0];
    const metrics = window.GameState.computeMechMetrics(mech);
    this.playerPos.heat = Math.max(0, this.playerPos.heat - 10);
    this.log(`Flushed reactor coolant (-10C Heat) [5s].`);
    this.advanceTime(5, mech, metrics);
    this.render();
  },

  setAim(loc) {
    this.aimTarget = loc;
    this.render();
  },

  getAimModifier(loc) {
    if (loc === 'HD') return -28;
    if (loc === 'LL' || loc === 'RL') return -12;
    if (loc === 'LA' || loc === 'RA') return -10;
    if (loc === 'CT' || loc === 'LT' || loc === 'RT') return -6;
    return 0;
  },

  calcWeaponHitChance(jock, metrics, weapon) {
    const skillVal = jock ? (jock.skills[weapon.cat] || 55) : 55;
    const refBonus = jock ? Math.round((jock.stats.Reflexes - 20) * 0.25) : 0;
    const dist = Math.abs(this.playerPos.r - this.enemy.r) + Math.abs(this.playerPos.c - this.enemy.c);
    const rangePenalty = dist > weapon.range ? -35 : -(dist - 1) * 3;
    const heatPenalty = this.playerPos.heat > metrics.coolingCap ? -15 : 0;
    const aimMod = this.getAimModifier(this.aimTarget);

    return Math.max(10, Math.min(95, skillVal + refBonus + metrics.hitBonus + rangePenalty + heatPenalty + aimMod));
  },

  fireWeapon(instanceKey) {
    if (this.contractWon || this.contractLost) return;
    if ((this.weaponCooldowns[instanceKey] || 0) > 0) return;

    const st = window.GameState.data;
    const jock = this.getActiveCombatJock();
    const mech = st.mechs.find(m => m.id === jock?.assignedMechId) || st.mechs[0];
    const metrics = window.GameState.computeMechMetrics(mech);
    const weapon = metrics.weapons.find(w => w.instanceKey === instanceKey);
    if (!weapon) return;

    const hitChance = this.calcWeaponHitChance(jock, metrics, weapon);
    const roll = Math.floor(Math.random() * 100) + 1;

    this.playerPos.heat += weapon.heat;
    this.weaponCooldowns[instanceKey] = weapon.sec;

    if (roll <= hitChance) {
      const randomLocs = ['CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
      const hitLoc = this.aimTarget === 'General'
        ? randomLocs[Math.floor(Math.random() * randomLocs.length)]
        : this.aimTarget;

      this.enemy.armor[hitLoc] = Math.max(0, this.enemy.armor[hitLoc] - weapon.dmg);
      this.log(`HIT! ${weapon.name} strikes Enemy ${hitLoc} for ${weapon.dmg} dmg (Roll ${roll}<=${hitChance}%).`);

      // Check Victory (Head, CT, or both Legs destroyed)
      const legsGone = this.enemy.armor.LL <= 0 && this.enemy.armor.RL <= 0;
      if (this.enemy.armor.HD <= 0 || this.enemy.armor.CT <= 0 || legsGone) {
        this.contractWon = true;
        st.credits += 35000;
        st.missionsCompleted += 1;
        if (jock) {
          jock.xp += 250;
          jock.kills += 1;
          jock.missions += 1;
          if (jock.contract) {
            if (jock.contract.type === 'fights') {
              jock.contract.fightsRemaining = Math.max(0, (jock.contract.fightsRemaining ?? jock.contract.totalFights) - 1);
            } else {
              jock.contract.monthsRemaining = Math.max(0, (jock.contract.monthsRemaining ?? (jock.contract.totalYears * 12)) - 1);
            }
          }
        }
        this.log(`VICTORY! ${this.enemy.name} neutralized! Earned +35,000 Cr and +250 XP for ${jock ? jock.callsign : 'Pilot'}!`);
        window.GameState.save();
        App.updateHUD();
      }
    } else {
      this.log(`MISS! ${weapon.name} wide of Enemy ${this.aimTarget} (Roll ${roll}>${hitChance}%).`);
    }

    this.advanceTime(3, mech, metrics);
    this.render();
  },

  hexPoints(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(' ');
  },

  render() {
    const container = document.getElementById('view-battle');
    if (!container) return;

    const st = window.GameState.data;
    const jock = this.getActiveCombatJock();
    const mech = st.mechs.find(m => m.id === jock?.assignedMechId) || st.mechs[0];

    if (!jock || !mech) {
      container.innerHTML = `
        <div class="card" style="padding:36px 28px; text-align:center; align-items:center; gap:16px;">
          <span class="badge amber">PRE-FLIGHT CHECKLIST INCOMPLETE</span>
          <h2 style="font-size:22px; font-weight:800;">Squad Not Ready for Combat Deployment</h2>
          <p class="subtext" style="max-width:520px; font-size:14px;">
            Before deploying to the Hex Arena, you need at least <strong>1 Jock</strong> and <strong>1 Titan Mech</strong> built and assigned:
          </p>
          <div class="panel" style="display:flex; flex-direction:column; gap:10px; text-align:left; min-width:340px;">
            <div>${jock ? '&#9989;' : '&#10060;'} <strong>Step 1:</strong> Create or Hire a Jock in HQ (${st.jocks.length} in Roster)</div>
            <div>${mech ? '&#9989;' : '&#10060;'} <strong>Step 2:</strong> Commission &amp; Equip a Titan in the Garage (${st.mechs.length} in Hangar)</div>
          </div>
          <div style="display:flex; gap:12px; margin-top:6px;">
            <button class="btn btn-primary" onclick="App.switchTab('hq')">Go to 1. HQ &amp; Jockey Roster</button>
            <button class="btn btn-primary" onclick="App.switchTab('garage')">Go to 2. Garage &amp; Mech Factory</button>
          </div>
        </div>
      `;
      return;
    }

    if (!this.active) this.initEncounter();
    const metrics = window.GameState.computeMechMetrics(mech);

    const mins = String(Math.floor(this.clockSec / 60)).padStart(2, '0');
    const secs = String(this.clockSec % 60).padStart(2, '0');
    const dist = Math.abs(this.playerPos.r - this.enemy.r) + Math.abs(this.playerPos.c - this.enemy.c);

    // Build SVG Hex Grid
    const R = 28;
    const dx = R * 1.55;
    const dy = R * 1.75;
    const svgGrid = this.hexes.map(h => {
      const cx = 44 + h.c * dx;
      const cy = 36 + h.r * dy + (h.c % 2 === 1 ? dy / 2 : 0);
      const isP = h.r === this.playerPos.r && h.c === this.playerPos.c;
      const isE = h.r === this.enemy.r && h.c === this.enemy.c;
      const fill = isP ? 'rgba(16, 185, 129, 0.32)'
                 : isE ? 'rgba(239, 68, 68, 0.32)'
                 : h.terrain === 'woods' ? 'rgba(34, 197, 94, 0.14)'
                 : h.terrain === 'water' ? 'rgba(59, 130, 246, 0.18)'
                 : h.terrain === 'hill' ? 'rgba(245, 158, 11, 0.16)'
                 : 'rgba(148, 163, 184, 0.08)';
      const stroke = isP ? '#10b981' : isE ? '#ef4444' : '#475569';
      const label = isP ? (jock ? jock.callsign.slice(0, 5).toUpperCase() : 'YOU')
                  : isE ? 'HOSTILE'
                  : h.terrain === 'woods' ? 'WOODS'
                  : h.terrain === 'water' ? 'WATER'
                  : h.terrain === 'hill' ? 'HILL'
                  : `${h.c},${h.r}`;
      return `
        <g onclick="BattleModule.moveHex(${h.r},${h.c})" style="cursor:pointer;">
          <polygon points="${this.hexPoints(cx, cy, R)}" fill="${fill}" stroke="${stroke}" stroke-width="${isP || isE ? 2.2 : 1}" />
          <text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#e2e8f0" font-size="10" font-weight="${isP || isE ? 'bold' : 'normal'}">${label}</text>
        </g>
      `;
    }).join('');

    const aimLocations = ['General', 'HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];

    container.innerHTML = `
      <div class="grid-12">
        <!-- Left 6 Cols: Hex Arena Map, Action-Time Clock & Pilot Telemetry -->
        <div class="col-6" style="display:flex; flex-direction:column; gap:16px;">
          
          <div class="card">
            <div class="section-header">
              <div>
                <div class="section-title">Tactical Hex Arena — Mode A (Action-Time Clock)</div>
                <div class="subtext">Click adjacent hexes (up to 2 hexes away) to move. Woods grant cover; Water cools heat.</div>
              </div>
              <button class="btn btn-primary" onclick="BattleModule.initEncounter(); BattleModule.render();">New Contract</button>
            </div>

            <!-- Battle Status Banner -->
            <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:space-between;">
              <div class="hud-pill">
                <div class="label">Action-Time Clock</div>
                <div class="val" style="color:var(--accent-green);">${mins}:${secs}s</div>
              </div>
              <div class="hud-pill">
                <div class="label">Reactor Heat / Safe Cap</div>
                <div class="val" style="color:${this.playerPos.heat > metrics.coolingCap ? 'var(--accent-red)' : 'var(--accent-amber)'};">
                  ${this.playerPos.heat} / ${metrics.coolingCap} C
                </div>
              </div>
              <div class="hud-pill">
                <div class="label">Target Distance</div>
                <div class="val">${dist} Hexes</div>
              </div>
              <div class="hud-pill">
                <div class="label">Torso Arc</div>
                <div class="val">${this.playerPos.facing}</div>
              </div>
            </div>

            <!-- Interactive SVG Hex Map -->
            <div class="panel" style="display:flex; justify-content:center; padding:12px;">
              <svg viewBox="0 0 340 290" style="width:100%; max-width:480px; height:auto; user-select:none;">
                ${svgGrid}
              </svg>
            </div>

            <!-- Action-Time Maneuver Controls -->
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn" style="flex:1; padding:10px;" onclick="BattleModule.twistTorso()">
                Twist Torso Arc (2s)
              </button>
              <button class="btn" style="flex:1; padding:10px;" onclick="BattleModule.ventCoolant()">
                Wait &amp; Vent Coolant (-10C / 5s)
              </button>
            </div>
          </div>

          <!-- Your Titan Live Armor Status -->
          <div class="card">
            <div class="section-header">
              <div class="section-title">Your Titan Telemetry: ${mech.customName} (${jock ? jock.callsign : 'Pilot'})</div>
            </div>
            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">
              ${Object.entries(mech.armor).map(([loc, val]) => {
                const maxV = mech.maxArmorCurrent[loc] || 1;
                const pct = Math.round((val / maxV) * 100);
                return `
                  <div class="panel" style="text-align:center;">
                    <div style="font-weight:700; font-size:12px;">${loc}</div>
                    <div class="mono subtext">${val}/${maxV}</div>
                    <div class="bar-bg" style="margin-top:4px;"><div class="bar-fill green" style="width:${pct}%"></div></div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

        </div>

        <!-- Right 6 Cols: Called Shot Selector, Mounted Weapons Rack, Enemy Armor & Combat Log -->
        <div class="col-6" style="display:flex; flex-direction:column; gap:16px;">
          
          <!-- Called Shot Aim Selector + Mounted Weapons -->
          <div class="card">
            <div class="section-header">
              <div>
                <div class="section-title">Target Lock: ${this.enemy.name} (${this.enemy.weight})</div>
                <div class="subtext">Select a Called Shot body part or fire at General mass</div>
              </div>
              ${this.contractWon ? `<span class="badge green">CONTRACT WON (+35,000 Cr / +250 XP)</span>` : ''}
            </div>

            <div>
              <div class="subtext" style="margin-bottom:6px; font-weight:600;">Called Shot Aim Location:</div>
              <div style="display:flex; flex-wrap:wrap; gap:6px;">
                ${aimLocations.map(loc => {
                  const mod = this.getAimModifier(loc);
                  return `
                    <button class="btn ${this.aimTarget === loc ? 'btn-primary' : ''}" onclick="BattleModule.setAim('${loc}')">
                      ${loc} (${mod >= 0 ? '+0%' : mod + '%'})
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Mounted Weapons from Garage -->
            <div style="display:flex; flex-direction:column; gap:8px; margin-top:4px;">
              <div class="subtext" style="font-weight:600; text-transform:uppercase;">Mounted Weapons (Synced from Garage Loadout)</div>
              ${metrics.weapons.length === 0 ? `<div class="panel subtext">No weapons mounted on this Titan! Equip weapons in the Garage.</div>` : metrics.weapons.map(w => {
                const cd = this.weaponCooldowns[w.instanceKey] || 0;
                const hit = this.calcWeaponHitChance(jock, metrics, w);
                return `
                  <div class="panel" style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                    <div>
                      <strong>${w.name}</strong>
                      <span class="badge" style="margin-left:6px;">${w.locCode}</span>
                      <div class="subtext" style="margin-top:2px;">
                        Dmg: ${w.dmg} • Heat: +${w.heat}C • Recycle: ${w.sec}s • Opt Range: ${w.range} Hex
                      </div>
                    </div>
                    <button class="btn ${cd > 0 ? '' : 'btn-primary'}" ${cd > 0 || this.contractWon || this.contractLost ? 'disabled' : ''} onclick="BattleModule.fireWeapon('${w.instanceKey}')">
                      ${cd > 0 ? `Recycling (${cd}s)` : `Fire (${hit}% Hit)`}
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Enemy 8-Part Armor Telemetry -->
          <div class="card">
            <div class="section-header">
              <div class="section-title">Hostile 8-Location Armor Telemetry</div>
              <span class="subtext">Destroy HD, CT, or Both Legs to win</span>
            </div>
            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">
              ${Object.entries(this.enemy.armor).map(([loc, val]) => {
                const maxV = this.enemy.maxArmor[loc] || 1;
                const pct = Math.round((val / maxV) * 100);
                return `
                  <div class="panel" style="text-align:center;">
                    <div style="font-weight:700; font-size:12px;">${loc}</div>
                    <div class="mono subtext">${val}/${maxV}</div>
                    <div class="bar-bg" style="margin-top:4px;"><div class="bar-fill ${pct < 35 ? 'red' : 'amber'}" style="width:${pct}%"></div></div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Combat Telemetry Log -->
          <div class="card">
            <div class="section-header">
              <div class="section-title">Combat Telemetry Log</div>
            </div>
            <div class="panel mono" style="font-size:12px; display:flex; flex-direction:column; gap:5px; max-height:170px; overflow-y:auto;">
              ${this.logs.map(l => `<div>${l}</div>`).join('')}
            </div>
          </div>

        </div>
      </div>
    `;
  }
};
