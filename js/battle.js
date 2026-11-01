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
  battleStats: { shotsFired: 0, shotsHit: 0, damageDealt: 0, damageTaken: 0 },

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
    this.battleStats = { shotsFired: 0, shotsHit: 0, damageDealt: 0, damageTaken: 0 };

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
      this.battleStats.damageTaken += this.enemy.dmg;
      this.log(`ALERT: ${this.enemy.name} hits your ${hitLoc} for ${this.enemy.dmg} dmg!`);

      // Damage installed weapons/components in the struck body location
      window.GameState.ensureMechPartConditions(playerMech);
      const locComps = playerMech.locations?.[hitLoc] || [];
      if (locComps.length > 0) {
        const cIdx = Math.floor(Math.random() * locComps.length);
        const curCond = playerMech.partConditions[hitLoc][cIdx] ?? 100;
        const condLoss = playerMech.armor[hitLoc] <= 0 ? 30 : 18;
        const nextCond = Math.max(15, curCond - condLoss);
        playerMech.partConditions[hitLoc][cIdx] = nextCond;
        const compObj = window.GameState.getComponent(locComps[cIdx]);
        if (compObj) {
          this.log(`COMPONENT HIT: ${compObj.name} in ${hitLoc} damaged (${nextCond}% condition)!`);
        }
      }

      if (playerMech.armor.CT <= 0 || playerMech.armor.HD <= 0) {
        this.contractLost = true;
        if (jock) {
          jock.health = Math.max(25, jock.health - 30);
          jock.missions = (jock.missions || 0) + 1;
          jock.xp = (jock.xp || 0) + 75;
          this.recordBattleHistory(jock, playerMech, 'EJECTED', 'Core Breach — Emergency Ejection', 75, 'EJECT');
        }
        this.log(`CRITICAL: Your Titan suffered core failure! Emergency ejection triggered (+75 Survival XP).`);
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
    this.battleStats.shotsFired += 1;

    if (roll <= hitChance) {
      const randomLocs = ['CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
      const hitLoc = this.aimTarget === 'General'
        ? randomLocs[Math.floor(Math.random() * randomLocs.length)]
        : this.aimTarget;

      this.enemy.armor[hitLoc] = Math.max(0, this.enemy.armor[hitLoc] - weapon.dmg);
      this.battleStats.shotsHit += 1;
      this.battleStats.damageDealt += weapon.dmg;
      this.log(`HIT! ${weapon.name} strikes Enemy ${hitLoc} for ${weapon.dmg} dmg (Roll ${roll}<=${hitChance}%).`);

      // Check Victory (Head, CT, or both Legs destroyed)
      const legsGone = this.enemy.armor.LL <= 0 && this.enemy.armor.RL <= 0;
      if (this.enemy.armor.HD <= 0 || this.enemy.armor.CT <= 0 || legsGone) {
        this.contractWon = true;
        st.credits += 35000;
        st.missionsCompleted += 1;
        const killCode = this.enemy.armor.HD <= 0 ? 'HD' : (this.enemy.armor.CT <= 0 ? 'CT' : 'LEGS');
        const killMethod = killCode === 'HD'
          ? `Headshot Decapitation (HD) via ${weapon.name}`
          : killCode === 'CT'
            ? `Center Torso Reactor Breach (CT) via ${weapon.name}`
            : `Dual Leg Sweep (LL + RL) via ${weapon.name}`;

        if (jock) {
          jock.xp += 250;
          jock.kills += 1;
          jock.missions += 1;
          this.recordBattleHistory(jock, mech, 'VICTORY', killMethod, 250, killCode);
          if (jock.contract) {
            if (jock.contract.type === 'mercenary') {
              jock.contract.fightsRemaining = Math.max(0, (jock.contract.fightsRemaining ?? jock.contract.totalFights) - 1);
              jock.contract.monthsRemaining = Math.max(0, (jock.contract.monthsRemaining ?? jock.contract.totalMonths) - 1);
              if (jock.contract.fightsRemaining <= 0 || jock.contract.monthsRemaining <= 0) {
                this.log(`NOTICE: Mercenary ${jock.callsign}'s short-term flat-fee contract has concluded and they have departed the company.`);
                st.jocks = st.jocks.filter(x => x.id !== jock.id);
                if (st.selectedJockId === jock.id) st.selectedJockId = st.jocks[0]?.id || '';
              }
            } else if (jock.contract.type === 'fights') {
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

  recordBattleHistory(jock, mech, outcome, killMethod, xpEarned, killCode) {
    if (!jock) return;
    if (!Array.isArray(jock.fightHistory)) jock.fightHistory = [];
    if (!Array.isArray(jock.awards)) jock.awards = [];

    const fightNumber = jock.fightHistory.length + 1;
    const newAwards = [];
    const grantAward = (id, citation) => {
      if (jock.awards.some(a => a.id === id)) return;
      const def = (window.TOS_DATA.commendations || []).find(c => c.id === id);
      if (!def) return;
      jock.awards.push({
        id: def.id,
        title: def.title,
        citation: citation || def.desc,
        fightNum: fightNumber
      });
      newAwards.push(def.title);
      this.log(`COMMENDATION AWARDED: ${jock.callsign} received the [${def.title}]!`);
    };

    if (outcome === 'VICTORY') {
      grantAward('first-blood', `Neutralized ${this.enemy.name} in Fight #${fightNumber}.`);
      if (killCode === 'HD') {
        grantAward('headhunter', `Decapitated ${this.enemy.name} with a Cockpit Headshot (HD) in Fight #${fightNumber}.`);
      } else if (killCode === 'CT') {
        grantAward('core-breaker', `Cored ${this.enemy.name}'s Center Torso (CT) reactor in Fight #${fightNumber}.`);
      } else if (killCode === 'LEGS') {
        grantAward('leg-sweeper', `Swept both legs (LL & RL) of ${this.enemy.name} in Fight #${fightNumber}.`);
      }

      const acc = this.battleStats.shotsFired > 0
        ? Math.round((this.battleStats.shotsHit / this.battleStats.shotsFired) * 100)
        : 0;
      if (this.battleStats.shotsFired >= 3 && acc >= 75) {
        grantAward('sharpshooter', `Finished Fight #${fightNumber} with ${acc}% gunnery accuracy (${this.battleStats.shotsHit}/${this.battleStats.shotsFired}).`);
      }
      if (this.battleStats.damageTaken >= 36) {
        grantAward('ironclad-survivor', `Endured ${this.battleStats.damageTaken} armor damage against ${this.enemy.name} and emerged victorious.`);
      }
      if (jock.kills >= 3) {
        grantAward('titan-ace', `Achieved ${jock.kills} confirmed Titan kills in service of the company.`);
      }
    }

    jock.fightHistory.unshift({
      fightNumber,
      enemyName: this.enemy.name,
      enemyWeight: this.enemy.weight,
      mechName: mech ? mech.customName : 'Titan-AT',
      outcome,
      durationSec: this.clockSec,
      shotsFired: this.battleStats.shotsFired,
      shotsHit: this.battleStats.shotsHit,
      damageDealt: this.battleStats.damageDealt,
      damageTaken: this.battleStats.damageTaken,
      killMethod,
      xpEarned,
      awardsEarned: newAwards
    });
  },

  hexPoints(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(' ');
  },

  getPartDamageColor(cur, max) {
    const m = max || 1;
    const pct = (cur / m) * 100;
    if (cur <= 0) return '#1e293b'; // Breached / Destroyed (Dark Slate)
    if (pct < 35) return '#ef4444'; // Critical (<35% Crimson Red)
    if (pct < 70) return '#f59e0b'; // Damaged (35-69% Amber)
    return '#10b981';               // Nominal (70-100% Emerald Green)
  },

  renderHexMechSprite(cx, cy, armor, maxArmor, label, borderColor) {
    const c = loc => this.getPartDamageColor(armor[loc] ?? 0, maxArmor[loc] ?? 1);
    const s = loc => (armor[loc] <= 0 ? '#ef4444' : '#0f172a');

    return `
      <g>
        <!-- Team Indicator Base Ring -->
        <ellipse cx="${cx}" cy="${cy + 12}" rx="17" ry="5" fill="none" stroke="${borderColor}" stroke-width="1.6" stroke-dasharray="3,2" />
        <!-- HD (Head) -->
        <rect x="${cx - 4.5}" y="${cy - 20}" width="9" height="6.5" rx="1.5" fill="${c('HD')}" stroke="${s('HD')}" stroke-width="1" />
        <!-- CT (Center Torso) -->
        <rect x="${cx - 5.5}" y="${cy - 12.5}" width="11" height="12.5" rx="1" fill="${c('CT')}" stroke="${s('CT')}" stroke-width="1" />
        <!-- LT & RT (Side Torsos) -->
        <rect x="${cx - 11}" y="${cy - 12}" width="5" height="11.5" rx="1" fill="${c('LT')}" stroke="${s('LT')}" stroke-width="1" />
        <rect x="${cx + 6}" y="${cy - 12}" width="5" height="11.5" rx="1" fill="${c('RT')}" stroke="${s('RT')}" stroke-width="1" />
        <!-- LA & RA (Arms) -->
        <rect x="${cx - 16.5}" y="${cy - 11}" width="4.8" height="12.5" rx="1.2" fill="${c('LA')}" stroke="${s('LA')}" stroke-width="1" />
        <rect x="${cx + 11.7}" y="${cy - 11}" width="4.8" height="12.5" rx="1.2" fill="${c('RA')}" stroke="${s('RA')}" stroke-width="1" />
        <!-- LL & RL (Legs) -->
        <rect x="${cx - 8.5}" y="${cy + 1}" width="6.5" height="12.5" rx="1" fill="${c('LL')}" stroke="${s('LL')}" stroke-width="1" />
        <rect x="${cx + 2}" y="${cy + 1}" width="6.5" height="12.5" rx="1" fill="${c('RL')}" stroke="${s('RL')}" stroke-width="1" />
        <!-- Callsign / Unit Tag -->
        <text x="${cx}" y="${cy + 23}" text-anchor="middle" fill="#f8fafc" font-size="8.5" font-weight="bold">${label}</text>
      </g>
    `;
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

    // Build SVG Hex Grid with 8-Part Damage-Colored Mini-Mech Sprites
    const R = 36;
    const dx = R * 1.55;
    const dy = R * 1.75;
    const svgGrid = this.hexes.map(h => {
      const cx = 54 + h.c * dx;
      const cy = 48 + h.r * dy + (h.c % 2 === 1 ? dy / 2 : 0);
      const isP = h.r === this.playerPos.r && h.c === this.playerPos.c;
      const isE = h.r === this.enemy.r && h.c === this.enemy.c;
      const fill = isP ? 'rgba(59, 130, 246, 0.22)'
                 : isE ? 'rgba(239, 68, 68, 0.22)'
                 : h.terrain === 'woods' ? 'rgba(34, 197, 94, 0.14)'
                 : h.terrain === 'water' ? 'rgba(59, 130, 246, 0.18)'
                 : h.terrain === 'hill' ? 'rgba(245, 158, 11, 0.16)'
                 : 'rgba(148, 163, 184, 0.08)';
      const stroke = isP ? '#38bdf8' : isE ? '#f43f5e' : '#475569';
      const terrainLabel = h.terrain === 'woods' ? 'WOODS'
                         : h.terrain === 'water' ? 'WATER'
                         : h.terrain === 'hill' ? 'HILL'
                         : `${h.c},${h.r}`;

      let innerContent = `<text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#94a3b8" font-size="10">${terrainLabel}</text>`;
      if (isP) {
        const pLabel = jock ? jock.callsign.slice(0, 7).toUpperCase() : 'PLAYER';
        innerContent = this.renderHexMechSprite(cx, cy - 2, mech.armor, mech.maxArmorCurrent, pLabel, '#38bdf8');
      } else if (isE) {
        innerContent = this.renderHexMechSprite(cx, cy - 2, this.enemy.armor, this.enemy.maxArmor, 'HOSTILE', '#f43f5e');
      }

      return `
        <g onclick="BattleModule.moveHex(${h.r},${h.c})" style="cursor:pointer;">
          <polygon points="${this.hexPoints(cx, cy, R)}" fill="${fill}" stroke="${stroke}" stroke-width="${isP || isE ? 2.4 : 1}" />
          ${innerContent}
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
                <div class="section-title">Tactical Hex Arena (Action-Time Clock)</div>
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

            <!-- Interactive SVG Hex Map with 8-Part Damage-Colored Mech Sprites -->
            <div class="panel" style="display:flex; flex-direction:column; align-items:center; gap:8px; padding:12px;">
              <svg viewBox="0 0 440 375" style="width:100%; max-width:540px; height:auto; user-select:none;">
                ${svgGrid}
              </svg>
              <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center; font-size:12px;" class="mono subtext">
                <span><strong style="color:#10b981;">&#9632;</strong> 70–100% Armor</span>
                <span><strong style="color:#f59e0b;">&#9632;</strong> 35–69% Damaged</span>
                <span><strong style="color:#ef4444;">&#9632;</strong> 1–34% Critical</span>
                <span><strong style="color:#475569;">&#9632;</strong> 0% Breached</span>
              </div>
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
              ${this.contractWon ? `
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="badge green">CONTRACT WON (+35,000 Cr / +250 XP)</span>
                  ${jock ? `<button class="btn btn-primary" onclick="App.switchTab('hq'); HQModule.openJockeyPage('${jock.id}', 'history');">View ${jock.callsign}'s History &amp; Awards &rarr;</button>` : ''}
                </div>
              ` : ''}
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
