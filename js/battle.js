// Tactical Battle & Hex Arena Module (Featuring Battle Offers, Contract Negotiations & Scheduled Future Dates)

window.BattleModule = {
  active: false,
  arenaTab: 'offers', // 'offers' | 'negotiate' | 'combat' | 'summary'
  clockSec: 0,
  aimTarget: 'General',
  playerPos: { r: 6, c: 1, facing: 'NE', heat: 0 },
  weaponCooldowns: {},
  enemy: null,
  enemyCooldown: 6,
  hexes: [],
  logs: [],
  contractWon: false,
  contractLost: false,
  playerFallen: false,
  enemyFallen: false,
  battleStats: { shotsFired: 0, shotsHit: 0, damageDealt: 0, damageTaken: 0 },

  // Battle Offer Negotiation State
  currentContract: null,
  negotiatingOffer: null,
  proposedBounty: 35000,
  proposedSalvage: 20,
  proposedPrepWeeks: 2,
  patience: 3,
  negotiationMessage: '',

  // End of Battle Summary State
  battleSummary: null,

  initEncounter(contract = null) {
    const st = window.GameState.data;
    const jock = this.getActiveCombatJock();
    const mech = jock ? st.mechs.find(m => m.id === jock.assignedMechId) : st.mechs[0];

    this.active = true;
    this.arenaTab = 'combat';
    this.currentContract = contract;
    this.clockSec = 0;
    this.aimTarget = 'General';
    this.playerPos = { r: 6, c: 1, facing: 'NE', heat: 0 };
    this.weaponCooldowns = {};
    this.contractWon = false;
    this.contractLost = false;
    this.playerFallen = false;
    this.enemyFallen = false;
    this.battleStats = { shotsFired: 0, shotsHit: 0, damageDealt: 0, damageTaken: 0 };

    // Build 8x10 Tactical Hex Grid (80 Hexes) matching contract terrain profile
    const terrainType = contract?.terrain?.id || 'woods';
    this.hexes = this.generateHexGrid(terrainType, 8, 10);

    // Spawn Enemy Titan at Northeast Forward Sector (r:1, c:8)
    if (contract && contract.enemy) {
      this.enemy = {
        name: contract.enemy.name,
        weight: contract.enemy.weight,
        r: 1,
        c: 8,
        dmg: contract.enemy.dmg,
        hit: contract.enemy.hit,
        armor: { ...contract.enemy.armor },
        maxArmor: { ...contract.enemy.maxArmor },
        pilot: contract.enemy.pilot || 'Hostile Pilot'
      };
    } else {
      const enemyTemplates = [
        { name: 'Enemy TAT-110M "Enforcer"', weight: '110t Medium', dmg: 12, hit: 64 },
        { name: 'Enemy TAT-155H "Warhammer"', weight: '155t Heavy', dmg: 16, hit: 68 },
        { name: 'Enemy TAT-190A "Colossus"', weight: '190t Assault', dmg: 20, hit: 72 }
      ];
      const pick = enemyTemplates[(st.missionsCompleted || 0) % enemyTemplates.length];
      this.enemy = {
        name: pick.name,
        weight: pick.weight,
        r: 1,
        c: 8,
        dmg: pick.dmg,
        hit: pick.hit,
        armor: { HD: 20, CT: 56, LT: 40, RT: 40, LA: 34, RA: 34, LL: 38, RL: 38 },
        maxArmor: { HD: 20, CT: 56, LT: 40, RT: 40, LA: 34, RA: 34, LL: 38, RL: 38 },
        pilot: 'Arena Opponent'
      };
    }
    this.enemyCooldown = 6;

    this.logs = [
      { time: '[00:00s]', text: `Combat Deployment: ${contract ? contract.title : 'Tactical Drop'} (${contract?.client?.name || 'Sector Operations'}).`, type: 'system' },
      { time: '[00:00s]', text: `Pilot: ${jock ? jock.callsign : 'Pilot'} deployed in ${mech ? mech.customName : 'Titan'} at Hex (1,6).`, type: 'player' },
      { time: '[00:00s]', text: `Hostile contact locked: ${this.enemy.name} at Northeast Hex (8,1) [80-Tile Theater].`, type: 'hostile' }
    ];
  },

  getActiveCombatJock() {
    const st = window.GameState.data;
    const sel = st.jocks.find(j => j.id === st.selectedJockId && j.assignedMechId);
    if (sel) return sel;
    return st.jocks.find(j => j.assignedMechId) || st.jocks[0];
  },

  log(msg, type = 'system') {
    const mins = String(Math.floor(this.clockSec / 60)).padStart(2, '0');
    const secs = String(this.clockSec % 60).padStart(2, '0');
    const time = `[${mins}:${secs}s]`;
    this.logs.unshift({ time, text: msg, type });
    if (this.logs.length > 20) this.logs.pop();
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
    const dissipated = Math.round((coolPerSec + (inWater ? 3 : 0)) * (seconds / 3));
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
    const curDist = this.getHexDistance(this.playerPos.r, this.playerPos.c, this.enemy.r, this.enemy.c);

    // Enemy Prone Recovery Check
    if (this.enemyFallen) {
      const standRoll = Math.floor(Math.random() * 100) + 1;
      const legBreached = (this.enemy.armor.LL <= 0 || this.enemy.armor.RL <= 0);
      const enemyStandChance = legBreached ? 45 : 68;
      if (standRoll <= enemyStandChance) {
        this.enemyFallen = false;
        this.log(`${this.enemy.name} engages recovery gyros and STANDS BACK UPRIGHT! (Stand Roll ${standRoll} <= ${enemyStandChance}%)`, 'hostile');
        if (window.SoundFX && window.SoundFX.playMechStand) {
          window.SoundFX.playMechStand();
        }
      } else {
        this.log(`${this.enemy.name} struggles to find footing on the terrain and REMAINS PRONE! (Stand Roll ${standRoll} > ${enemyStandChance}%)`, 'hostile');
      }
    }

    // Tactical AI Maneuvering: Advance towards player if far, seeking cover in woods/ridges (Only if upright)
    if (!this.enemyFallen && curDist > 3) {
      const neighbors = this.getAdjacentHexes(this.enemy.r, this.enemy.c);
      let bestHex = null;
      let bestScore = -9999;

      neighbors.forEach(nh => {
        if (nh.r === this.playerPos.r && nh.c === this.playerPos.c) return;
        const d = this.getHexDistance(this.playerPos.r, this.playerPos.c, nh.r, nh.c);
        let score = (curDist - d) * 12;
        if (nh.terrain === 'woods') score += 4;
        if (nh.terrain === 'hill') score += 3;
        if (nh.terrain === 'water') score += 1;

        if (score > bestScore) {
          bestScore = score;
          bestHex = nh;
        }
      });

      if (bestHex && (bestHex.r !== this.enemy.r || bestHex.c !== this.enemy.c)) {
        this.enemy.r = bestHex.r;
        this.enemy.c = bestHex.c;
        this.log(`${this.enemy.name} advances to ${bestHex.terrain.toUpperCase()} Hex (${bestHex.c},${bestHex.r}).`, 'hostile');
      }
    }

    // Fire at player
    const playerHex = this.hexes.find(h => h.r === this.playerPos.r && h.c === this.playerPos.c);
    const enemyHex = this.hexes.find(h => h.r === this.enemy.r && h.c === this.enemy.c);
    const coverMod = playerHex?.terrain === 'woods' ? -15 : (playerHex?.terrain === 'rubble' ? -8 : 0);
    const elevMod = (enemyHex?.terrain === 'hill' && playerHex?.terrain !== 'hill') ? 10 : 0;
    const pilotEvade = jock ? Math.round((jock.stats.Piloting - 20) * 0.25) : 0;
    const enemyPronePenalty = this.enemyFallen ? -20 : 0;
    const playerProneBonus = this.playerFallen ? 15 : 0;
    const toHit = Math.max(15, Math.min(85, this.enemy.hit + coverMod + elevMod - pilotEvade + enemyPronePenalty + playerProneBonus));
    const roll = Math.floor(Math.random() * 100) + 1;

    if (roll <= toHit && playerMech) {
      const locs = ['CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL', 'HD'];
      const hitLoc = locs[Math.floor(Math.random() * locs.length)];
      playerMech.armor[hitLoc] = Math.max(0, playerMech.armor[hitLoc] - this.enemy.dmg);
      this.battleStats.damageTaken += this.enemy.dmg;
      this.log(`ALERT: ${this.enemy.name} hits your ${hitLoc} for ${this.enemy.dmg} dmg!`, 'hostile');

      if (window.SoundFX) {
        window.SoundFX.playIncomingShot(true);
      }

      // Leg Damage Stability Check: varying chance of falling down based on damage percentage vs pilot skill
      if ((hitLoc === 'LL' || hitLoc === 'RL') && !this.playerFallen) {
        const maxLeg = playerMech.maxArmorCurrent?.[hitLoc] || 24;
        const dmgPct = (this.enemy.dmg / maxLeg) * 100;

        if (dmgPct >= 15 || playerMech.armor[hitLoc] <= 0) {
          let fallChance = Math.min(85, Math.round(dmgPct * 1.6));
          if (playerMech.armor[hitLoc] <= 0) fallChance += 25;

          const pilotSkill = jock ? (jock.stats.Piloting || 30) : 30;
          const pilotResist = Math.round((pilotSkill - 15) * 0.45);
          const finalFallChance = Math.max(10, Math.min(90, fallChance - pilotResist));

          const fallRoll = Math.floor(Math.random() * 100) + 1;
          if (fallRoll <= finalFallChance) {
            this.playerFallen = true;
            this.log(`CRITICAL INSTABILITY: Heavy strike to ${hitLoc} (${Math.round(dmgPct)}% leg dmg)! Your Titan LOSES BALANCE AND CRASHES TO THE GROUND (PRONE)! (Fall Roll ${fallRoll} <= ${finalFallChance}%)`, 'hostile');
            if (window.SoundFX && window.SoundFX.playMechFall) {
              window.SoundFX.playMechFall();
            }
          } else {
            this.log(`GYRO STABILIZED: ${jock ? jock.callsign : 'Pilot'} skillfully countered leg recoil and stayed upright! (Fall Roll ${fallRoll} > ${finalFallChance}%)`, 'player');
          }
        }
      }

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
          this.log(`COMPONENT HIT: ${compObj.name} in ${hitLoc} damaged (${nextCond}% condition)!`, 'hostile');
        }
      }

      if (playerMech.armor.CT <= 0 || playerMech.armor.HD <= 0) {
        this.contractLost = true;
        this.log(`CRITICAL: Your Titan suffered core failure! Emergency ejection triggered.`, 'hostile');
        this.buildBattleSummary('DEFEAT', 'Titan Core Breach — Emergency Ejection', 'EJECT', null);
        return;
      }
    } else {
      this.log(`${this.enemy.name} fires salvos — evaded! (Roll ${roll} > ${toHit}%)`, 'hostile');
      if (window.SoundFX) {
        window.SoundFX.playIncomingShot(false);
      }
    }
    window.GameState.save();
  },

  moveHex(r, c) {
    if (this.contractWon || this.contractLost) return;
    if (r === this.enemy.r && c === this.enemy.c) return;

    if (this.playerFallen) {
      this.log(`MANEUVER BLOCKED: Your Titan is PRONE on the ground! Click the [STAND UP] button first.`, 'player');
      this.render();
      return;
    }

    const jock = this.getActiveCombatJock();
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === jock?.assignedMechId) || st.mechs[0];
    const metrics = window.GameState.computeMechMetrics(mech);
    const maxMove = Math.max(2, Math.min(3, metrics.tpl.baseSpeedHex || 2));

    const dist = this.getHexDistance(this.playerPos.r, this.playerPos.c, r, c);
    if (dist === 0 || dist > maxMove) return;

    const targetHex = this.hexes.find(h => h.r === r && h.c === c);
    const terrainName = targetHex?.terrain?.toUpperCase() || 'CLEAR';

    this.playerPos.r = r;
    this.playerPos.c = c;
    this.playerPos.heat += dist * (targetHex?.terrain === 'hill' ? 3 : 2);

    const moveSec = Math.max(3, (7 - (metrics.tpl.baseSpeedHex || 2)) * dist);
    this.log(`Maneuvered ${dist} hex${dist > 1 ? 'es' : ''} to ${terrainName} Hex (${c},${r}) [${moveSec}s elapsed].`, 'player');
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
    this.log(`Torso twisted to firing arc ${this.playerPos.facing} [2s].`, 'player');
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
    this.log(`Flushed reactor coolant (-10C Heat) [5s].`, 'player');
    this.advanceTime(5, mech, metrics);
    this.render();
  },

  calcStandUpChance(jock, mech) {
    if (!jock) return 50;
    const piloting = jock.stats?.Piloting || 30;
    const reflexes = jock.stats?.Reflexes || 25;
    const refBonus = Math.round((reflexes - 20) * 0.25);

    let legMod = 5;
    const ll = mech?.armor?.LL ?? 10;
    const rl = mech?.armor?.RL ?? 10;
    if (ll <= 0 && rl <= 0) legMod = -35;
    else if (ll <= 0 || rl <= 0) legMod = -18;

    const hex = this.hexes.find(h => h.r === this.playerPos.r && h.c === this.playerPos.c);
    let terrainMod = 0;
    if (hex?.terrain === 'rubble') terrainMod = -10;
    else if (hex?.terrain === 'water') terrainMod = -8;
    else if (hex?.terrain === 'hill') terrainMod = -5;

    const baseChance = Math.round(piloting * 1.5 + 20);
    return Math.max(15, Math.min(95, baseChance + refBonus + legMod + terrainMod));
  },

  standUp() {
    if (this.contractWon || this.contractLost) return;
    if (!this.playerFallen) return;

    const st = window.GameState.data;
    const jock = this.getActiveCombatJock();
    const mech = st.mechs.find(m => m.id === jock?.assignedMechId) || st.mechs[0];
    const metrics = window.GameState.computeMechMetrics(mech);

    const chance = this.calcStandUpChance(jock, mech);
    const roll = Math.floor(Math.random() * 100) + 1;

    this.playerPos.heat += 4;
    const elapsedSec = 3;

    if (roll <= chance) {
      this.playerFallen = false;
      this.log(`STAND UP SUCCESS: ${jock ? jock.callsign : 'Pilot'} engages recovery thrusters and rights the Titan upright! (Piloting Roll ${roll} <= ${chance}%) [${elapsedSec}s elapsed].`, 'player');
      if (window.SoundFX && window.SoundFX.playMechStand) {
        window.SoundFX.playMechStand();
      }
    } else {
      this.log(`STAND UP FAILED: Gyro compensator slipped on terrain! Titan remains PRONE. (Piloting Roll ${roll} > ${chance}%) [${elapsedSec}s elapsed].`, 'hostile');
    }

    this.advanceTime(elapsedSec, mech, metrics);
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
    const dist = this.getHexDistance(this.playerPos.r, this.playerPos.c, this.enemy.r, this.enemy.c);
    const rangePenalty = dist > weapon.range ? -35 : -(dist - 1) * 3;
    const heatPenalty = this.playerPos.heat > metrics.coolingCap ? -15 : 0;
    const aimMod = this.getAimModifier(this.aimTarget);

    const playerHex = this.hexes.find(h => h.r === this.playerPos.r && h.c === this.playerPos.c);
    const enemyHex = this.hexes.find(h => h.r === this.enemy.r && h.c === this.enemy.c);

    // Ridge Elevation Advantage
    const elevationBonus = (playerHex?.terrain === 'hill' && enemyHex?.terrain !== 'hill') ? 10 : 0;
    // Enemy Cover Penalty (Woods / Ruins)
    const coverPenalty = enemyHex?.terrain === 'woods' ? -15 : (enemyHex?.terrain === 'rubble' ? -8 : 0);

    // Prone Posture Modifiers (Shooting while prone gives -20% aim penalty; firing at a prone target gives +15% hit bonus)
    const playerPronePenalty = this.playerFallen ? -20 : 0;
    const enemyProneBonus = this.enemyFallen ? 15 : 0;

    return Math.max(10, Math.min(95, skillVal + refBonus + metrics.hitBonus + rangePenalty + heatPenalty + aimMod + elevationBonus + coverPenalty + playerPronePenalty + enemyProneBonus));
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
      this.log(`HIT! ${weapon.name} strikes Enemy ${hitLoc} for ${weapon.dmg} dmg (Roll ${roll}<=${hitChance}%).`, 'player');

      if (window.SoundFX) {
        window.SoundFX.playWeaponShot(weapon, true);
      }

      // Check Enemy Leg Damage Stability / Falling Down
      if ((hitLoc === 'LL' || hitLoc === 'RL') && !this.enemyFallen && !this.contractWon) {
        const maxLeg = this.enemy.maxArmor?.[hitLoc] || 38;
        const dmgPct = (weapon.dmg / maxLeg) * 100;

        if (dmgPct >= 15 || this.enemy.armor[hitLoc] <= 0) {
          let fallChance = Math.min(85, Math.round(dmgPct * 1.6));
          if (this.enemy.armor[hitLoc] <= 0) fallChance += 25;
          const enemyPilotResist = 12;
          const finalFallChance = Math.max(10, Math.min(85, fallChance - enemyPilotResist));

          const fallRoll = Math.floor(Math.random() * 100) + 1;
          if (fallRoll <= finalFallChance) {
            this.enemyFallen = true;
            this.log(`KINETIC IMPACT: Heavy strike to ${this.enemy.name}'s ${hitLoc} (${Math.round(dmgPct)}% leg dmg)! Hostile Titan LOSES BALANCE AND CRASHES PRONE!`, 'player');
            if (window.SoundFX && window.SoundFX.playMechFall) {
              window.SoundFX.playMechFall();
            }
          } else {
            this.log(`STABILITY HELD: ${this.enemy.name} stumbles from the leg impact but maintains upright footing.`, 'hostile');
          }
        }
      }

      // Check Victory (Head, CT, or both Legs destroyed)
      const legsGone = this.enemy.armor.LL <= 0 && this.enemy.armor.RL <= 0;
      if (this.enemy.armor.HD <= 0 || this.enemy.armor.CT <= 0 || legsGone) {
        this.contractWon = true;
        const killCode = this.enemy.armor.HD <= 0 ? 'HD' : (this.enemy.armor.CT <= 0 ? 'CT' : 'LEGS');
        const killMethod = killCode === 'HD'
          ? `Headshot Decapitation (HD) via ${weapon.name}`
          : killCode === 'CT'
            ? `Center Torso Reactor Breach (CT) via ${weapon.name}`
            : `Dual Leg Sweep (LL + RL) via ${weapon.name}`;

        this.log(`VICTORY! ${this.enemy.name} neutralized!`, 'player');
        this.buildBattleSummary('VICTORY', killMethod, killCode, weapon);
        return;
      }
    } else {
      this.log(`MISS! ${weapon.name} wide of Enemy ${this.aimTarget} (Roll ${roll}>${hitChance}%).`, 'player');

      if (window.SoundFX) {
        window.SoundFX.playWeaponShot(weapon, false);
      }
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
      this.log(`COMMENDATION AWARDED: ${jock.callsign} received the [${def.title}]!`, 'player');
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
      campaignDate: window.GameState.getCalendarText(),
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

  renderHexMechSprite(cx, cy, armor, maxArmor, label, borderColor, isProne = false) {
    const c = loc => this.getPartDamageColor(armor[loc] ?? 0, maxArmor[loc] ?? 1);
    const s = loc => (armor[loc] <= 0 ? '#ef4444' : '#0f172a');
    const transformAttr = isProne ? `transform="rotate(65 ${cx} ${cy}) translate(0, 3)"` : '';

    return `
      <g ${transformAttr}>
        <!-- Team Indicator Base Ring -->
        <ellipse cx="${cx}" cy="${cy + 12}" rx="17" ry="5" fill="none" stroke="${borderColor}" stroke-width="${isProne ? 2.2 : 1.6}" stroke-dasharray="${isProne ? '4,2' : '3,2'}" />
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
        <text x="${cx}" y="${cy + 23}" text-anchor="middle" fill="${isProne ? '#f87171' : '#f8fafc'}" font-size="8.5" font-weight="bold">${label}</text>
      </g>
    `;
  },

  getHexDistance(r1, c1, r2, c2) {
    const x1 = c1;
    const z1 = r1 - Math.floor((c1 - (c1 & 1)) / 2);
    const y1 = -x1 - z1;

    const x2 = c2;
    const z2 = r2 - Math.floor((c2 - (c2 & 1)) / 2);
    const y2 = -x2 - z2;

    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2), Math.abs(z1 - z2));
  },

  getAdjacentHexes(r, c) {
    const isOdd = (c % 2 !== 0);
    const deltas = isOdd ? [
      [-1, 0], [1, 0],
      [0, -1], [1, -1],
      [0, 1], [1, 1]
    ] : [
      [-1, 0], [1, 0],
      [-1, -1], [0, -1],
      [-1, 1], [0, 1]
    ];
    const adj = [];
    deltas.forEach(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 10) {
        const found = this.hexes.find(h => h.r === nr && h.c === nc);
        if (found) adj.push(found);
      }
    });
    return adj;
  },

  generateHexGrid(terrainType = 'woods', rows = 8, cols = 10) {
    const hexes = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let t = 'clear';

        if (terrainType === 'woods') {
          // Dense forest basin with groves, stream, and hills
          const isWoods = (
            (r >= 2 && r <= 5 && c >= 1 && c <= 3) ||
            (r >= 1 && r <= 4 && c >= 6 && c <= 8) ||
            (r === 0 && (c === 2 || c === 3 || c === 7)) ||
            (r === 7 && (c === 4 || c === 5))
          );
          const isWater = (
            (c === 4 && r >= 1 && r <= 4) ||
            (c === 5 && r >= 3 && r <= 6)
          );
          const isHill = (
            (r === 0 && (c === 4 || c === 5)) ||
            (r === 1 && c === 5) ||
            (r === 6 && c === 8) ||
            (r === 7 && c === 7)
          );

          if (isWater) t = 'water';
          else if (isHill) t = 'hill';
          else if (isWoods) t = 'woods';

        } else if (terrainType === 'water') {
          // Flooded River Valley: central river cutting across, flanked by marshwoods
          const isWater = (
            (c === 3 && r >= 0 && r <= 3) ||
            (c === 4 && r >= 2 && r <= 5) ||
            (c === 5 && r >= 4 && r <= 7) ||
            (r === 3 && c === 2) ||
            (r === 4 && c === 6)
          );
          const isWoods = (
            (c === 2 && (r === 1 || r === 2 || r === 5)) ||
            (c === 6 && (r === 2 || r === 3 || r === 6)) ||
            (r === 0 && c === 7) ||
            (r === 7 && c === 2)
          );
          const isHill = (
            (r === 0 && (c === 0 || c === 1)) ||
            (r === 7 && (c === 8 || c === 9)) ||
            (r === 1 && c === 0)
          );

          if (isWater) t = 'water';
          else if (isHill) t = 'hill';
          else if (isWoods) t = 'woods';

        } else if (terrainType === 'hill') {
          // Granite High Ridge: diagonal mountain spine with valleys
          const isHill = (
            ((r === c - 1 || r === c || r === c + 1) && (c >= 2 && c <= 7)) ||
            (r === 0 && c >= 3 && c <= 6) ||
            (r === 7 && (c === 3 || c === 4))
          );
          const isWoods = (
            (r >= 4 && c <= 2) ||
            (r <= 3 && c >= 7) ||
            (r === 6 && c === 6)
          );
          const isWater = (
            (r === 2 && c === 1) ||
            (r === 5 && c === 8) ||
            (r === 1 && c === 2)
          );

          if (isHill) t = 'hill';
          else if (isWater) t = 'water';
          else if (isWoods) t = 'woods';

        } else if (terrainType === 'rubble') {
          // Industrial Ruins: blast craters, shattered blocks, cooling pools
          const isRubble = (
            (r >= 2 && r <= 5 && c >= 3 && c <= 6) ||
            (r === 1 && (c === 2 || c === 7)) ||
            (r === 6 && (c === 2 || c === 7))
          );
          const isWater = (
            (r === 3 && c === 2) ||
            (r === 4 && c === 7)
          );
          const isHill = (
            (r === 0 && (c === 3 || c === 6)) ||
            (r === 7 && (c === 3 || c === 6))
          );

          if (isWater) t = 'water';
          else if (isHill) t = 'hill';
          else if (isRubble) t = 'rubble';

        } else {
          // Clear / Open Sand Flats: mostly clear, scattered desert terrain features
          const isHill = (
            (r === 0 && (c === 1 || c === 8)) ||
            (r === 7 && (c === 0 || c === 9)) ||
            (r === 3 && c === 5)
          );
          const isWoods = (
            (r === 2 && (c === 2 || c === 7)) ||
            (r === 5 && (c === 3 || c === 6))
          );
          const isWater = (
            (r === 4 && c === 2) ||
            (r === 2 && c === 4)
          );

          if (isWater) t = 'water';
          else if (isHill) t = 'hill';
          else if (isWoods) t = 'woods';
        }

        // Guarantee spawn tiles are clear of water/hazards
        if (r === 6 && c === 1) t = (t === 'water' ? 'clear' : t);
        if (r === 1 && c === 8) t = (t === 'water' ? 'clear' : t);

        hexes.push({ r, c, terrain: t });
      }
    }
    return hexes;
  },

  renderHexTileArtwork(h, cx, cy, R, hasUnit) {
    const opacity = hasUnit ? '0.35' : '1.0';

    if (h.terrain === 'woods') {
      return `
        <g opacity="${opacity}">
          <!-- Forest Canopy & Pines -->
          <!-- Left Pine -->
          <polygon points="${cx - 9},${cy - 2} ${cx - 15},${cy + 7} ${cx - 3},${cy + 7}" fill="#14532d" stroke="#22c55e" stroke-width="0.5" />
          <polygon points="${cx - 9},${cy - 6} ${cx - 13},${cy + 1} ${cx - 5},${cy + 1}" fill="#166534" stroke="#4ade80" stroke-width="0.4" />
          <!-- Right Pine -->
          <polygon points="${cx + 9},${cy} ${cx + 3},${cy + 8} ${cx + 15},${cy + 8}" fill="#14532d" stroke="#22c55e" stroke-width="0.5" />
          <polygon points="${cx + 9},${cy - 4} ${cx + 5},${cy + 2} ${cx + 13},${cy + 2}" fill="#166534" stroke="#4ade80" stroke-width="0.4" />
          <!-- Center Pine -->
          <rect x="${cx - 1}" y="${cy + 5.5}" width="2.2" height="4.5" fill="#78350f" rx="0.5" />
          <polygon points="${cx},${cy - 3} ${cx - 10},${cy + 7} ${cx + 10},${cy + 7}" fill="#0f3d24" stroke="#15803d" stroke-width="0.6" />
          <polygon points="${cx},${cy - 9} ${cx - 8},${cy} ${cx + 8},${cy}" fill="#166534" stroke="#22c55e" stroke-width="0.6" />
          <polygon points="${cx},${cy - 14} ${cx - 5},${cy - 6} ${cx + 5},${cy - 6}" fill="#15803d" stroke="#4ade80" stroke-width="0.5" />
          <!-- Leaf Highlights -->
          <circle cx="${cx - 4}" cy="${cy + 5}" r="1" fill="#86efac" opacity="0.7"/>
          <circle cx="${cx + 5}" cy="${cy + 5}" r="1" fill="#86efac" opacity="0.7"/>
          <!-- Cover Badge / Label -->
          ${!hasUnit ? `
            <text x="${cx}" y="${cy - 15}" text-anchor="middle" fill="#4ade80" font-size="6.2" font-weight="700" opacity="0.85">+15% COV</text>
            <text x="${cx}" y="${cy + 17}" text-anchor="middle" fill="#86efac" font-size="6.8" font-weight="800" letter-spacing="0.4">WOODS</text>
          ` : ''}
        </g>
      `;
    }

    if (h.terrain === 'water') {
      return `
        <g opacity="${opacity}">
          <!-- Flowing Water Currents & Ripples -->
          <ellipse cx="${cx}" cy="${cy - 1}" rx="13" ry="4" fill="none" stroke="rgba(56, 189, 248, 0.3)" stroke-width="1" stroke-dasharray="4,2"/>
          <path d="M ${cx - 12} ${cy - 5} Q ${cx - 6} ${cy - 8} ${cx} ${cy - 5} T ${cx + 12} ${cy - 5}" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round" opacity="0.85"/>
          <path d="M ${cx - 9} ${cy + 2} Q ${cx - 4.5} ${cy - 1} ${cx} ${cy + 2} T ${cx + 9} ${cy + 2}" fill="none" stroke="#0ea5e9" stroke-width="1.3" stroke-linecap="round" opacity="0.8"/>
          <path d="M ${cx - 6} ${cy + 7} Q ${cx - 3} ${cy + 5} ${cx} ${cy + 7} T ${cx + 6} ${cy + 7}" fill="none" stroke="#7dd3fc" stroke-width="1.1" stroke-linecap="round" opacity="0.75"/>
          <circle cx="${cx + 5}" cy="${cy - 6}" r="0.8" fill="#e0f2fe" opacity="0.9"/>
          <!-- Cooling Badge / Label -->
          ${!hasUnit ? `
            <text x="${cx}" y="${cy - 15}" text-anchor="middle" fill="#38bdf8" font-size="6.2" font-weight="700" opacity="0.9">COOL +3C</text>
            <text x="${cx}" y="${cy + 17}" text-anchor="middle" fill="#7dd3fc" font-size="6.8" font-weight="800" letter-spacing="0.4">WATER</text>
          ` : ''}
        </g>
      `;
    }

    if (h.terrain === 'hill') {
      return `
        <g opacity="${opacity}">
          <!-- Topographic Elevation Contour Line -->
          <path d="M ${cx - 14} ${cy + 10} Q ${cx} ${cy + 14} ${cx + 14} ${cy + 10}" fill="none" stroke="#f59e0b" stroke-width="0.8" stroke-dasharray="2,2" opacity="0.5"/>
          <!-- Secondary Crag -->
          <polygon points="${cx - 7},${cy - 2} ${cx - 13},${cy + 7} ${cx - 2},${cy + 8}" fill="#78350f" stroke="#92400e" stroke-width="0.5" opacity="0.85"/>
          <!-- Primary Granite Peak: Lit Face -->
          <polygon points="${cx},${cy - 13} ${cx - 11},${cy + 6} ${cx},${cy + 9}" fill="#b45309" stroke="#d97706" stroke-width="0.6"/>
          <!-- Shaded Face -->
          <polygon points="${cx},${cy - 13} ${cx},${cy + 9} ${cx + 11},${cy + 5}" fill="#542308" stroke="#78350f" stroke-width="0.6"/>
          <!-- Crest Snow / Quartz Highlight -->
          <polygon points="${cx},${cy - 13} ${cx - 3.5},${cy - 7} ${cx},${cy - 6} ${cx + 3.5},${cy - 8}" fill="#fef3c7" opacity="0.85"/>
          <!-- LoS Badge / Label -->
          ${!hasUnit ? `
            <text x="${cx}" y="${cy - 15}" text-anchor="middle" fill="#f59e0b" font-size="6.2" font-weight="700" opacity="0.9">ELEV +1</text>
            <text x="${cx}" y="${cy + 17}" text-anchor="middle" fill="#fcd34d" font-size="6.8" font-weight="800" letter-spacing="0.4">RIDGE</text>
          ` : ''}
        </g>
      `;
    }

    if (h.terrain === 'rubble') {
      return `
        <g opacity="${opacity}">
          <!-- Blast Crater & Shattered Concrete -->
          <ellipse cx="${cx}" cy="${cy + 2}" rx="12" ry="5" fill="none" stroke="#ef4444" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.5"/>
          <rect x="${cx - 9}" y="${cy - 6}" width="7.5" height="4" transform="rotate(-18 ${cx - 5} ${cy - 4})" fill="#52525b" stroke="#71717a" stroke-width="0.6"/>
          <rect x="${cx + 1}" y="${cy - 3}" width="9" height="3" transform="rotate(22 ${cx + 5} ${cy - 1})" fill="#3f3f46" stroke="#71717a" stroke-width="0.6"/>
          <polygon points="${cx - 2.5},${cy + 4} ${cx + 2.5},${cy + 5} ${cx},${cy + 8}" fill="#dc2626" opacity="0.75"/>
          ${!hasUnit ? `
            <text x="${cx}" y="${cy - 15}" text-anchor="middle" fill="#f87171" font-size="6.2" font-weight="700" opacity="0.9">+8% COV</text>
            <text x="${cx}" y="${cy + 17}" text-anchor="middle" fill="#fca5a5" font-size="6.8" font-weight="800" letter-spacing="0.4">RUINS</text>
          ` : ''}
        </g>
      `;
    }

    // Default 'clear' (Tactical Sand Flats / Battle Arena Plain)
    return `
      <g opacity="${opacity}">
        <circle cx="${cx}" cy="${cy}" r="6.5" fill="none" stroke="#334155" stroke-width="0.6" stroke-dasharray="2,2"/>
        <line x1="${cx - 4}" y1="${cy}" x2="${cx + 4}" y2="${cy}" stroke="#475569" stroke-width="0.7" opacity="0.7"/>
        <line x1="${cx}" y1="${cy - 4}" x2="${cx}" y2="${cy + 4}" stroke="#475569" stroke-width="0.7" opacity="0.7"/>
        ${!hasUnit ? `
          <text x="${cx}" y="${cy + 16}" text-anchor="middle" fill="#64748b" font-size="6.8" font-family="monospace">${h.c},${h.r}</text>
        ` : ''}
      </g>
    `;
  },

  openNegotiation(offerId) {
    const st = window.GameState.data;
    window.GameState.ensureBattleOffers();
    const offer = st.battleOffers.find(o => o.id === offerId);
    if (!offer) return;
    this.negotiatingOffer = JSON.parse(JSON.stringify(offer));
    this.proposedBounty = offer.baseBounty;
    this.proposedSalvage = offer.baseSalvagePct || 20;
    this.proposedPrepWeeks = offer.suggestedPrepWeeks || 2;
    this.patience = offer.patience || 3;
    this.negotiationMessage = `Liaison: "${offer.client.introQuote || 'We need an experienced mercenary lance for this assignment.'}"`;
    this.arenaTab = 'negotiate';
    this.render();
  },

  closeNegotiation() {
    this.negotiatingOffer = null;
    this.arenaTab = 'offers';
    this.render();
  },

  walkAwayFromNegotiation(declineOffer = false) {
    if (declineOffer && this.negotiatingOffer) {
      const st = window.GameState.data;
      const offId = this.negotiatingOffer.id;
      st.battleOffers = (st.battleOffers || []).filter(o => o.id !== offId);
      window.GameState.ensureBattleOffers();
      window.GameState.save();
    }
    this.closeNegotiation();
  },

  updateNegotiationInputs() {
    const bountyEl = document.getElementById('neg-inp-bounty');
    const salvageEl = document.getElementById('neg-inp-salvage');
    if (bountyEl) this.proposedBounty = parseInt(bountyEl.value) || this.proposedBounty;
    if (salvageEl) this.proposedSalvage = parseInt(salvageEl.value) || this.proposedSalvage;
    this.render();
  },

  setQuickBountyPct(pctMultiplier) {
    if (!this.negotiatingOffer) return;
    this.proposedBounty = Math.round((this.negotiatingOffer.baseBounty * (pctMultiplier / 100)) / 500) * 500;
    this.render();
  },

  setQuickSalvage(pct) {
    this.proposedSalvage = pct;
    this.render();
  },

  setPrepWeeks(wks) {
    this.proposedPrepWeeks = wks;
    this.render();
  },

  testContractOffer() {
    if (!this.negotiatingOffer) return;
    const baseB = this.negotiatingOffer.baseBounty;
    const baseS = this.negotiatingOffer.baseSalvagePct || 20;
    const ratioB = this.proposedBounty / baseB;
    const ratioS = this.proposedSalvage / baseS;
    const pressure = (ratioB - 1.0) * 1.5 + (ratioS - 1.0) * 0.9;

    if (pressure <= 0.05) {
      this.negotiationMessage = `Liaison: "These terms are fully acceptable to our directors. Sign the charter and prep your lance."`;
      this.patience = Math.min(3, this.patience + 1);
    } else if (pressure <= 0.35) {
      this.negotiationMessage = `Liaison: "Your counter-offer is slightly above standard guild rates, but given the operational threat, we will authorize this budget."`;
    } else if (pressure <= 0.70) {
      this.patience = Math.max(0, this.patience - 1);
      if (this.patience <= 0) {
        this.rejectOfferRevoked();
        return;
      }
      this.negotiationMessage = `Liaison: "That exceeds our regional allowance. Lower your demands before our directors pull out." (Client Patience: ${this.patience}/3)`;
    } else {
      this.patience = Math.max(0, this.patience - 2);
      if (this.patience <= 0) {
        this.rejectOfferRevoked();
        return;
      }
      this.negotiationMessage = `Liaison: "Gross mercenary extortion! We will not be shaken down. One more absurd term and this contract is voided." (Client Patience: ${this.patience}/3)`;
    }
    this.render();
  },

  rejectOfferRevoked() {
    const st = window.GameState.data;
    if (this.negotiatingOffer) {
      const offId = this.negotiatingOffer.id;
      st.battleOffers = st.battleOffers.filter(o => o.id !== offId);
      window.GameState.ensureBattleOffers();
    }
    this.negotiationMessage = `Liaison: "CONTRACT REVOKED: Your excessive demands have severed our negotiations. Good day."`;
    this.render();
    setTimeout(() => {
      this.closeNegotiation();
    }, 1800);
  },

  signBattleContract() {
    if (!this.negotiatingOffer) return;
    const st = window.GameState.data;
    window.GameState.ensureCalendar();
    const curWeeks = st.calendar.totalWeeks || 0;
    const targetTotalWeeks = curWeeks + this.proposedPrepWeeks;

    const scheduled = {
      id: 'scheduled-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      title: this.negotiatingOffer.title,
      client: this.negotiatingOffer.client,
      enemy: this.negotiatingOffer.enemy,
      terrain: this.negotiatingOffer.terrain,
      negotiatedBounty: this.proposedBounty,
      negotiatedSalvagePct: this.proposedSalvage,
      prepWeeks: this.proposedPrepWeeks,
      targetTotalWeeks: targetTotalWeeks,
      targetDateText: window.GameState.getCalendarTextForWeeks(targetTotalWeeks),
      dateSigned: window.GameState.getCalendarText(),
      isReady: (curWeeks >= targetTotalWeeks),
      weeksRemaining: Math.max(0, targetTotalWeeks - curWeeks)
    };

    st.scheduledBattles.unshift(scheduled);
    st.battleOffers = st.battleOffers.filter(o => o.id !== this.negotiatingOffer.id);
    window.GameState.ensureBattleOffers();
    window.GameState.save();

    this.negotiatingOffer = null;
    this.arenaTab = 'offers';
    this.render();
  },

  cancelScheduledBattle(battleId) {
    const st = window.GameState.data;
    st.scheduledBattles = (st.scheduledBattles || []).filter(b => b.id !== battleId);
    window.GameState.save();
    this.render();
  },

  advanceToScheduledBattle(battleId) {
    const st = window.GameState.data;
    const battle = (st.scheduledBattles || []).find(b => b.id === battleId);
    if (!battle) return;
    const curWeeks = st.calendar.totalWeeks || 0;
    const diff = battle.targetTotalWeeks - curWeeks;
    if (diff > 0) {
      window.GameState.advanceTimeWeeks(diff, `Transit & Tactical Prep for ${battle.title}`);
    }
    window.GameState.ensureBattleOffers();
    window.GameState.save();
    window.App.updateHUD();
    this.render();
  },

  deployScheduledBattle(battleId) {
    const st = window.GameState.data;
    const battle = (st.scheduledBattles || []).find(b => b.id === battleId);
    if (!battle) return;
    this.initEncounter(battle);
    this.render();
  },

  refreshBattleOffers() {
    const st = window.GameState.data;
    if (st.credits < 500) {
      alert("Insufficient funds (500 Cr required) to scan mercenary comms network.");
      return;
    }
    st.credits -= 500;
    st.battleOffers = [];
    window.GameState.ensureBattleOffers();
    window.GameState.save();
    window.App.updateHUD();
    this.render();
  },

  abortCombatToOperations() {
    if (this.contractWon || this.contractLost) {
      if (this.battleSummary) {
        this.active = false;
        this.arenaTab = 'summary';
        this.render();
      } else {
        this.active = false;
        this.arenaTab = 'offers';
        this.render();
      }
      return;
    }
    if (confirm("Tactical Retreat: Forfeit this combat drop and withdraw to the Sector Operations Board?")) {
      this.buildBattleSummary('RETREAT', 'Tactical Field Withdrawal', 'RETREAT', null);
    }
  },

  returnFromVictoryOrDefeat() {
    if (this.battleSummary) {
      this.active = false;
      this.arenaTab = 'summary';
      this.render();
    } else {
      this.active = false;
      this.arenaTab = 'offers';
      this.render();
    }
  },

  closeSummary() {
    this.battleSummary = null;
    this.arenaTab = 'offers';
    this.render();
  },

  buildBattleSummary(outcome, killMethod, killCode, weapon) {
    const st = window.GameState.data;
    const jock = this.getActiveCombatJock();
    const mech = jock ? st.mechs.find(m => m.id === jock.assignedMechId) : (st.mechs[0] || null);

    const bounty = this.currentContract?.negotiatedBounty || 35000;
    const salvagePct = this.currentContract?.negotiatedSalvagePct || 20;
    const salvageBonus = outcome === 'VICTORY' ? Math.round(bounty * (salvagePct / 100)) : 0;
    const totalPayout = outcome === 'VICTORY' ? (bounty + salvageBonus) : 0;
    const prevCredits = st.credits;
    if (totalPayout > 0) st.credits += totalPayout;

    if (outcome === 'VICTORY') {
      st.missionsCompleted = (st.missionsCompleted || 0) + 1;
    }

    // Company XP Calculation
    if (typeof st.company.xp !== 'number') st.company.xp = 0;
    const companyXpEarned = outcome === 'VICTORY'
      ? (350 + Math.round(bounty / 250))
      : (outcome === 'DEFEAT' ? 75 : 50);
    st.company.xp += companyXpEarned;

    // Jockey XP Calculation & Contract deduction
    let jockXpEarned = 0;
    const prevJockXp = jock ? jock.xp : 0;
    let newlyAwarded = [];
    if (jock) {
      if (outcome === 'VICTORY') {
        jockXpEarned = 250 + (killCode === 'HD' ? 75 : 0);
        jock.kills = (jock.kills || 0) + 1;
        jock.missions = (jock.missions || 0) + 1;
      } else if (outcome === 'DEFEAT') {
        jockXpEarned = 75; // Survival XP
        jock.health = Math.max(25, jock.health - 30);
        jock.missions = (jock.missions || 0) + 1;
      } else {
        jockXpEarned = 50; // Tactical retreat
      }
      jock.xp += jockXpEarned;
      window.GameState.ensureJockContract(jock);
      jock.contract.fightsRemaining = Math.max(0, (jock.contract.fightsRemaining ?? jock.contract.totalFights) - 1);

      const beforeAwardsCount = (jock.awards || []).length;
      this.recordBattleHistory(jock, mech, outcome === 'VICTORY' ? 'VICTORY' : 'DEFEAT', killMethod, jockXpEarned, killCode);
      newlyAwarded = (jock.awards || []).slice(beforeAwardsCount).map(a => a.title);
    }

    // Salvage Component Recovery
    const recoveredParts = [];
    if (outcome === 'VICTORY' && salvagePct >= 20 && Array.isArray(st.partStorage)) {
      const comps = window.TOS_DATA.components || [];
      const rolls = salvagePct >= 50 ? 3 : (salvagePct >= 35 ? 2 : 1);
      for (let r = 0; r < rolls; r++) {
        if (Math.random() <= 0.75) {
          const dropped = comps[Math.floor(Math.random() * comps.length)];
          if (dropped) {
            const cond = Math.floor(Math.random() * 26) + 70; // 70-95% condition
            const uid = 'part-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
            st.partStorage.push({ uid, compId: dropped.id, condition: cond });
            recoveredParts.push({ ...dropped, condition: cond, uid });
          }
        }
      }
    }

    // Archive into completed battles history
    if (!Array.isArray(st.completedBattles)) st.completedBattles = [];
    st.completedBattles.unshift({
      id: 'comp-' + Date.now(),
      title: this.currentContract?.title || `Encounter vs. ${this.enemy?.name || 'Hostile'}`,
      client: this.currentContract?.client?.name || 'Sector Operations',
      enemy: this.enemy?.name || 'Hostile Titan',
      outcome: outcome,
      payout: totalPayout,
      dateText: window.GameState.getCalendarText(),
      jockCallsign: jock ? jock.callsign : 'Pilot'
    });

    if (this.currentContract) {
      st.scheduledBattles = (st.scheduledBattles || []).filter(b => b.id !== this.currentContract.id);
    }

    // Advance calendar weeks
    const elapsedWeeks = outcome === 'DEFEAT' ? 2 : 1;
    window.GameState.advanceTimeWeeks(elapsedWeeks, `${outcome}: vs. ${this.enemy?.name || 'Hostile'}`);

    // Compute mech remaining armor percent
    let curArmor = 0;
    let maxArmor = 0;
    if (mech && mech.armor && mech.maxArmorCurrent) {
      Object.keys(mech.armor).forEach(loc => {
        curArmor += (mech.armor[loc] || 0);
        maxArmor += (mech.maxArmorCurrent[loc] || 1);
      });
    }
    const armorPct = maxArmor > 0 ? Math.round((curArmor / maxArmor) * 100) : 100;

    // Detect internal parts that sustained damage
    const damagedComponents = [];
    if (mech && mech.partConditions) {
      Object.entries(mech.partConditions).forEach(([loc, conds]) => {
        const locComps = mech.locations?.[loc] || [];
        (conds || []).forEach((cVal, idx) => {
          if (cVal < 90) {
            const compObj = window.GameState.getComponent(locComps[idx]);
            if (compObj) {
              damagedComponents.push({ name: compObj.name, loc, condition: cVal });
            }
          }
        });
      });
    }

    this.battleSummary = {
      outcome,
      title: this.currentContract?.title || (outcome === 'VICTORY' ? 'Sector Victory' : 'Sector Engagement'),
      client: this.currentContract?.client || { name: 'Sector Operations', badge: 'MERCENARY GUILD' },
      enemy: {
        name: this.enemy?.name || 'Hostile Unit',
        weight: this.enemy?.weight || 'Heavy',
        pilot: this.enemy?.pilot || 'Hostile Pilot'
      },
      killCode: killCode || 'NEUTRALIZED',
      killMethod: killMethod || 'Target Neutralized',
      financials: {
        baseBounty: bounty,
        salvagePct,
        salvageBonus,
        totalPayout,
        prevCredits,
        newCredits: st.credits
      },
      recoveredParts,
      jockProgression: {
        callsign: jock ? jock.callsign : 'Pilot',
        prevXp: prevJockXp,
        xpEarned: jockXpEarned,
        newTotalXp: jock ? jock.xp : 0,
        fightsRemaining: jock?.contract?.fightsRemaining ?? 0,
        newlyAwarded
      },
      companyProgression: {
        name: st.company?.name || 'Mercenary Company',
        emblemId: st.company?.emblemId || 'emblem-wolf',
        xpEarned: companyXpEarned,
        totalXp: st.company?.xp || 0,
        reputationLevel: window.GameState.getCompanyReputationLevel(),
        missionsCompleted: st.missionsCompleted
      },
      stats: {
        durationSec: this.clockSec,
        shotsFired: this.battleStats.shotsFired,
        shotsHit: this.battleStats.shotsHit,
        accuracy: this.battleStats.shotsFired > 0 ? Math.round((this.battleStats.shotsHit / this.battleStats.shotsFired) * 100) : 0,
        damageDealt: this.battleStats.damageDealt,
        damageTaken: this.battleStats.damageTaken,
        mechName: mech ? mech.customName : 'Titan',
        remainingArmorPct: armorPct,
        damagedComponents
      },
      date: window.GameState.getCalendarText()
    };

    window.GameState.save();
    window.App.updateHUD();
    this.active = false;
    this.arenaTab = 'summary';
    this.render();
  },

  renderSummaryPage() {
    const s = this.battleSummary;
    if (!s) {
      this.closeSummary();
      return '';
    }

    const isVictory = s.outcome === 'VICTORY';
    const isDefeat = s.outcome === 'DEFEAT' || s.outcome.includes('DEFEAT');

    const heroBannerHtml = isVictory ? `
      <div class="card" style="padding:22px 26px; border:2px solid var(--accent-green); background:linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(6, 78, 59, 0.35) 50%, rgba(2, 44, 34, 0.45) 100%); box-shadow:0 0 32px rgba(16,185,129,0.32);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div style="display:flex; align-items:center; gap:18px;">
            <div style="font-size:46px; line-height:1; filter:drop-shadow(0 0 16px rgba(16,185,129,0.6));">
              &#9876;
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="badge green" style="font-weight:900; font-size:11px; letter-spacing:0.06em; padding:3px 10px;">TACTICAL ENGAGEMENT RESOLVED</span>
                <span class="badge primary">${s.client.badge || 'CONTRACT'}</span>
              </div>
              <h1 style="font-size:32px; font-weight:900; color:#10b981; margin:4px 0 2px 0; text-transform:uppercase; letter-spacing:0.03em; text-shadow:0 0 20px rgba(16,185,129,0.5);">
                VICTORY &bull; YOU WON THE BATTLE!
              </h1>
              <div style="font-size:15px; color:#ecfdf5; font-weight:600;">
                Operation: <strong>${s.title}</strong> &bull; Hostile Neutralized: <strong style="color:#fca5a5;">${s.enemy.name}</strong> (${s.enemy.weight}) via ${s.killMethod}
              </div>
              <div class="subtext" style="font-size:12px; margin-top:3px;">
                Employer: <strong>${s.client.name}</strong> &bull; Campaign Date: <strong>${s.date}</strong> &bull; Pilot: <strong>${s.jockProgression.callsign}</strong>
              </div>
            </div>
          </div>
          <div style="text-align:right;">
            <button class="btn btn-primary" style="background:#10b981; color:#000; font-weight:900; padding:12px 24px; font-size:15px; box-shadow:0 0 20px rgba(16,185,129,0.4);" onclick="BattleModule.closeSummary()">
              &#10003; Complete Debriefing &rarr;
            </button>
          </div>
        </div>
      </div>
    ` : isDefeat ? `
      <div class="card" style="padding:22px 26px; border:2px solid var(--accent-red); background:linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(127, 29, 29, 0.35) 50%, rgba(69, 10, 10, 0.45) 100%); box-shadow:0 0 32px rgba(239,68,68,0.32);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div style="display:flex; align-items:center; gap:18px;">
            <div style="font-size:46px; line-height:1; filter:drop-shadow(0 0 16px rgba(239,68,68,0.6));">
              &#9888;
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="badge red" style="font-weight:900; font-size:11px; letter-spacing:0.06em; padding:3px 10px;">TACTICAL CASUALTY</span>
                <span class="badge primary">${s.client.badge || 'CONTRACT'}</span>
              </div>
              <h1 style="font-size:32px; font-weight:900; color:#ef4444; margin:4px 0 2px 0; text-transform:uppercase; letter-spacing:0.03em; text-shadow:0 0 20px rgba(239,68,68,0.5);">
                DEFEAT &bull; YOU LOST THE BATTLE
              </h1>
              <div style="font-size:15px; color:#fef2f2; font-weight:600;">
                Operation: <strong>${s.title}</strong> &bull; Critical Core Breach sustained against <strong style="color:#fca5a5;">${s.enemy.name}</strong> (${s.enemy.weight})
              </div>
              <div class="subtext" style="font-size:12px; margin-top:3px;">
                Employer: <strong>${s.client.name}</strong> &bull; Campaign Date: <strong>${s.date}</strong> &bull; Pilot ${s.jockProgression.callsign} ejected safely (+75 Survival XP)
              </div>
            </div>
          </div>
          <div style="text-align:right;">
            <button class="btn btn-secondary" style="color:var(--accent-red); border-color:var(--accent-red); font-weight:800; padding:12px 24px; font-size:15px;" onclick="BattleModule.closeSummary()">
              Complete Debriefing &rarr;
            </button>
          </div>
        </div>
      </div>
    ` : `
      <div class="card" style="padding:22px 26px; border:2px solid var(--accent-amber); background:linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(120, 53, 15, 0.35) 50%, rgba(69, 26, 3, 0.45) 100%); box-shadow:0 0 32px rgba(245,158,11,0.28);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div style="display:flex; align-items:center; gap:18px;">
            <div style="font-size:46px; line-height:1; filter:drop-shadow(0 0 16px rgba(245,158,11,0.6));">
              &#128737;
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="badge amber" style="font-weight:900; font-size:11px; letter-spacing:0.06em; padding:3px 10px;">COMBAT WITHDRAWAL</span>
                <span class="badge primary">${s.client.badge || 'CONTRACT'}</span>
              </div>
              <h1 style="font-size:32px; font-weight:900; color:#f59e0b; margin:4px 0 2px 0; text-transform:uppercase; letter-spacing:0.03em; text-shadow:0 0 20px rgba(245,158,11,0.5);">
                TACTICAL RETREAT &bull; BATTLE ABORTED
              </h1>
              <div style="font-size:15px; color:#fffbeb; font-weight:600;">
                Operation: <strong>${s.title}</strong> &bull; Lance withdrew to preserve combat assets against <strong style="color:#fca5a5;">${s.enemy.name}</strong>
              </div>
              <div class="subtext" style="font-size:12px; margin-top:3px;">
                Employer: <strong>${s.client.name}</strong> &bull; Campaign Date: <strong>${s.date}</strong> &bull; Pilot ${s.jockProgression.callsign} evacuated safely
              </div>
            </div>
          </div>
          <div style="text-align:right;">
            <button class="btn btn-secondary" style="color:var(--accent-amber); border-color:var(--accent-amber); font-weight:800; padding:12px 24px; font-size:15px;" onclick="BattleModule.closeSummary()">
              Complete Debriefing &rarr;
            </button>
          </div>
        </div>
      </div>
    `;

    const partsHtml = s.recoveredParts.length === 0 ? `
      <div class="panel" style="padding:16px; background:rgba(0,0,0,0.25); text-align:center; color:var(--text-muted); font-size:13px;">
        <div style="font-weight:700; color:var(--text-bright); margin-bottom:4px;">No Salvageable Components Recovered</div>
        <div>No intact chassis components survived the wreckage. Contract salvage share was ${s.financials.salvagePct}%.</div>
        <div class="subtext" style="margin-top:4px; font-size:11px;">Tip: Negotiate higher Salvage Rights % on incoming contracts to recover weapons, engines, and heat sink arrays.</div>
      </div>
    ` : `
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${s.recoveredParts.map(p => `
          <div class="panel" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; border-left:4px solid var(--accent-green); padding:10px 14px; background:rgba(0,0,0,0.3);">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <strong style="color:var(--text-bright); font-size:14px;">${p.name}</strong>
                <span class="badge primary" style="font-size:11px;">${p.cat || p.category || 'Component'}</span>
                <span class="badge green" style="font-size:11px;">${p.condition}% Condition</span>
              </div>
              <div class="subtext" style="margin-top:2px; font-size:12px;">
                Weight: ${p.tons}t • ${p.desc || 'Salvaged component'} • Est. Market Value: ~${(p.cost || 12000).toLocaleString()} Cr
              </div>
            </div>
            <div style="text-align:right;">
              <span class="badge green" style="font-size:10px; padding:3px 8px;">&#10003; STORED IN DEPOT</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    const awardsHtml = (s.jockProgression.newlyAwarded && s.jockProgression.newlyAwarded.length > 0) ? `
      <div style="margin-top:10px; background:rgba(245,158,11,0.1); border:1px solid var(--accent-amber); padding:10px; border-radius:6px;">
        <div class="subtext" style="font-size:11px; text-transform:uppercase; font-weight:800; color:var(--accent-amber);">
          &#127878; Commendations Conferred This Battle
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
          ${s.jockProgression.newlyAwarded.map(aw => `
            <span class="badge amber" style="font-size:11px; padding:3px 8px;">&#9733; ${aw}</span>
          `).join('')}
        </div>
      </div>
    ` : '';

    const damagedCompsHtml = (s.stats.damagedComponents && s.stats.damagedComponents.length > 0) ? `
      <div style="margin-top:10px; background:rgba(239,68,68,0.1); border:1px solid var(--accent-red); padding:10px; border-radius:6px;">
        <div class="subtext" style="font-size:11px; text-transform:uppercase; font-weight:800; color:var(--accent-red);">
          &#9888; Internal Systems Sustaining Battle Damage
        </div>
        <div style="display:flex; flex-direction:column; gap:4px; margin-top:6px; font-size:12px;">
          ${s.stats.damagedComponents.map(dc => `
            <div style="display:flex; justify-content:space-between;">
              <span>${dc.name} (${dc.loc})</span>
              <strong style="color:var(--accent-amber);">${dc.condition}% Cond</strong>
            </div>
          `).join('')}
        </div>
      </div>
    ` : `
      <div class="panel subtext" style="margin-top:10px; font-size:12px; padding:8px 12px;">
        &#10003; All mounted internal weapons, heatsinks, and actuators nominal.
      </div>
    `;

    return `
      <div style="display:flex; flex-direction:column; gap:18px; max-width:1120px; margin:0 auto;">
        
        <!-- Big Prominent Won / Lost Hero Banner -->
        ${heroBannerHtml}

        <!-- 4 Primary Metric HUD Cards -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:12px;">
          
          <!-- Metric 1: Financial Settlement -->
          <div class="card" style="padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div class="subtext" style="font-size:11px; text-transform:uppercase; font-weight:800; color:var(--text-muted);">
                Total Financial Settlement
              </div>
              <span class="badge ${isVictory ? 'green' : 'red'}" style="font-size:10px;">
                ${isVictory ? 'WON' : 'LOST'}
              </span>
            </div>
            <div class="mono" style="font-size:24px; font-weight:900; color:${s.financials.totalPayout > 0 ? 'var(--accent-green)' : 'var(--accent-red)'}; margin:4px 0;">
              ${s.financials.totalPayout > 0 ? '+' : ''}${s.financials.totalPayout.toLocaleString()} Cr
            </div>
            <div class="subtext" style="font-size:12px;">
              ${isVictory ? `Bounty: ${s.financials.baseBounty.toLocaleString()} Cr + Salvage: ${s.financials.salvageBonus.toLocaleString()} Cr (${s.financials.salvagePct}%)` : `No combat bounty awarded (Mission failed)`}
            </div>
            <div style="margin-top:6px; font-size:11px; color:var(--accent-amber);" class="mono">
              War Chest: ${s.financials.newCredits.toLocaleString()} Cr
            </div>
          </div>

          <!-- Metric 2: Jockey Experience -->
          <div class="card" style="padding:16px;">
            <div class="subtext" style="font-size:11px; text-transform:uppercase; font-weight:800; color:var(--text-muted);">
              Jockey XP Earned
            </div>
            <div class="mono" style="font-size:24px; font-weight:900; color:var(--accent-cyan); margin:4px 0;">
              +${s.jockProgression.xpEarned} XP
            </div>
            <div class="subtext" style="font-size:12px;">
              Pilot: <strong>${s.jockProgression.callsign}</strong> • Available XP: <strong>${s.jockProgression.newTotalXp} XP</strong>
            </div>
            <div style="margin-top:6px; font-size:11px; color:var(--accent-cyan);" class="mono">
              ${s.jockProgression.fightsRemaining} Fights Remaining on Contract
            </div>
          </div>

          <!-- Metric 3: Company Mercenary XP -->
          <div class="card" style="padding:16px;">
            <div class="subtext" style="font-size:11px; text-transform:uppercase; font-weight:800; color:var(--text-muted);">
              Mercenary Company XP
            </div>
            <div class="mono" style="font-size:24px; font-weight:900; color:var(--accent-amber); margin:4px 0;">
              +${s.companyProgression.xpEarned} XP
            </div>
            <div class="subtext" style="font-size:12px;">
              Unit: <strong>${s.companyProgression.name}</strong> • Guild Rep: <strong>Level ${s.companyProgression.reputationLevel}</strong>
            </div>
            <div style="margin-top:6px; font-size:11px; color:var(--text-bright);" class="mono">
              ${s.companyProgression.missionsCompleted} Total Operations Logged
            </div>
          </div>

          <!-- Metric 4: Gunnery & Combat Accuracy -->
          <div class="card" style="padding:16px;">
            <div class="subtext" style="font-size:11px; text-transform:uppercase; font-weight:800; color:var(--text-muted);">
              Gunnery Efficiency
            </div>
            <div class="mono" style="font-size:24px; font-weight:900; color:#a855f7; margin:4px 0;">
              ${s.stats.accuracy}% Accuracy
            </div>
            <div class="subtext" style="font-size:12px;">
              ${s.stats.shotsHit} Hits on ${s.stats.shotsFired} Salvos (${s.stats.damageDealt} Dmg Dealt)
            </div>
            <div style="margin-top:6px; font-size:11px; color:var(--accent-green);" class="mono">
              Titan Hull: ${s.stats.remainingArmorPct}% Armor Integrity
            </div>
          </div>

        </div>

        <!-- 2-Column Detailed Breakdown -->
        <div class="grid-12" style="gap:16px;">
          
          <!-- Left Column: Salvage Recovery & Hostile Demolition Intel -->
          <div class="col-6" style="display:flex; flex-direction:column; gap:16px;">
            
            <!-- Salvage Recovery Card -->
            <div class="card">
              <div class="section-header">
                <div>
                  <div class="section-title">Battlefield Salvage Recovery</div>
                  <div class="subtext">Recovered chassis components transported directly to Company Depot storage.</div>
                </div>
                <span class="badge ${s.recoveredParts.length > 0 ? 'green' : 'secondary'}">
                  ${s.recoveredParts.length} Item${s.recoveredParts.length === 1 ? '' : 's'} Recovered
                </span>
              </div>
              ${partsHtml}
              <div style="margin-top:12px; display:flex; justify-content:flex-end;">
                <button class="btn btn-secondary" style="font-size:12px;" onclick="App.switchTab('garage')">
                  Open Garage Factory Depot &rarr;
                </button>
              </div>
            </div>

            <!-- Hostile Demolition Assessment -->
            <div class="card">
              <div class="section-header">
                <div class="section-title">Hostile Titan Demolition Assessment</div>
                <span class="badge red">${s.killCode}</span>
              </div>
              <div class="panel" style="display:flex; flex-direction:column; gap:8px; font-size:13px;">
                <div style="display:flex; justify-content:space-between;">
                  <span class="subtext">Hostile Chassis:</span>
                  <strong>${s.enemy.name} (${s.enemy.weight})</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span class="subtext">Designated Pilot:</span>
                  <span>${s.enemy.pilot}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span class="subtext">Neutralization Method:</span>
                  <strong style="color:var(--accent-green);">${s.killMethod}</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span class="subtext">Action-Time Duration:</span>
                  <span class="mono">${Math.floor(s.stats.durationSec / 60)}m ${String(s.stats.durationSec % 60).padStart(2, '0')}s</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Right Column: Jockey Debriefing & Mech Diagnostics -->
          <div class="col-6" style="display:flex; flex-direction:column; gap:16px;">
            
            <!-- Jockey Accolades & XP -->
            <div class="card">
              <div class="section-header">
                <div>
                  <div class="section-title">Jockey Mission Debriefing: Pilot ${s.jockProgression.callsign}</div>
                  <div class="subtext">Assigned Titan: ${s.stats.mechName}</div>
                </div>
                <button class="btn btn-primary" style="font-size:12px;" onclick="App.switchTab('hq')">
                  Train Skills in HQ &rarr;
                </button>
              </div>
              <div class="panel" style="display:flex; flex-direction:column; gap:8px; font-size:13px;">
                <div style="display:flex; justify-content:space-between;">
                  <span class="subtext">Combat XP Conferred:</span>
                  <strong style="color:var(--accent-cyan);">+${s.jockProgression.xpEarned} XP</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span class="subtext">Total Available Pilot XP:</span>
                  <strong class="mono" style="color:var(--text-bright);">${s.jockProgression.newTotalXp} XP</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span class="subtext">Contract Status:</span>
                  <span>${s.jockProgression.fightsRemaining} Fights Remaining</span>
                </div>
              </div>
              ${awardsHtml}
            </div>

            <!-- Titan Hull & Armor Diagnostics -->
            <div class="card">
              <div class="section-header">
                <div>
                  <div class="section-title">Titan Diagnostics: ${s.stats.mechName}</div>
                  <div class="subtext">Post-mission maintenance and battle damage evaluation.</div>
                </div>
                <button class="btn btn-secondary" style="font-size:12px;" onclick="App.switchTab('garage')">
                  Repair in Garage &rarr;
                </button>
              </div>
              <div class="panel" style="display:flex; flex-direction:column; gap:6px;">
                <div style="display:flex; justify-content:space-between; font-size:13px;">
                  <span class="subtext">Remaining Armor Integrity:</span>
                  <strong style="color:${s.stats.remainingArmorPct > 65 ? 'var(--accent-green)' : (s.stats.remainingArmorPct > 30 ? 'var(--accent-amber)' : 'var(--accent-red)')};">${s.stats.remainingArmorPct}%</strong>
                </div>
                <div class="bar-bg" style="height:10px;"><div class="bar-fill ${s.stats.remainingArmorPct > 65 ? 'green' : (s.stats.remainingArmorPct > 30 ? 'amber' : 'red')}" style="width:${s.stats.remainingArmorPct}%;"></div></div>
                <div style="display:flex; justify-content:space-between; font-size:12px;" class="subtext">
                  <span>Armor Damage Taken: ${s.stats.damageTaken} pts</span>
                  <span>Damage Dealt: ${s.stats.damageDealt} pts</span>
                </div>
              </div>
              ${damagedCompsHtml}
            </div>

          </div>

        </div>

        <!-- Bottom Action Bar -->
        <div class="card" style="padding:16px 24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div class="subtext" style="font-size:13px;">
            AAR logged to company records. Calendar time advanced by 1 week.
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-secondary" onclick="App.switchTab('garage')">
              2. Go to Garage &amp; Factory
            </button>
            <button class="btn btn-secondary" onclick="App.switchTab('hq')">
              1. Go to Jockey HQ
            </button>
            <button class="btn btn-primary" style="background:var(--accent-green); color:#000; font-weight:800; padding:10px 20px;" onclick="BattleModule.closeSummary()">
              Return to Operations Board &rarr;
            </button>
          </div>
        </div>

      </div>
    `;
  },

  renderOperationsBoard(jock, mech, metrics) {
    const st = window.GameState.data;
    window.GameState.ensureBattleOffers();
    const curWeeks = st.calendar?.totalWeeks || 0;
    const curCalText = window.GameState.getCalendarText();

    const scheduledHtml = st.scheduledBattles.length === 0 ? `
      <div class="panel" style="padding:22px; text-align:center; color:var(--text-muted);">
        <div style="font-weight:700; font-size:15px; margin-bottom:6px; color:var(--text-bright);">No Scheduled Drops on the Campaign Calendar</div>
        <div style="font-size:13px; max-width:540px; margin:0 auto;">
          Review the <strong>Incoming Battle Offers</strong> below, negotiate terms (bounty, salvage, match date), and sign a contract to lock a battle into your schedule.
        </div>
      </div>
    ` : `
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${st.scheduledBattles.map(b => {
          const isReady = curWeeks >= b.targetTotalWeeks;
          const wksLeft = Math.max(0, b.targetTotalWeeks - curWeeks);
          const terrainDesc = b.terrain ? `${b.terrain.name} (${b.terrain.desc})` : 'Standard Hex Terrain';
          return `
            <div class="panel" style="border-left:4px solid ${isReady ? 'var(--accent-green)' : 'var(--accent-blue)'}; display:flex; flex-direction:column; gap:10px; padding:16px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
                <div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span class="badge ${isReady ? 'green' : 'primary'}">${isReady ? 'DROP WINDOW READY' : `T-MINUS ${wksLeft} WK${wksLeft > 1 ? 'S' : ''}`}</span>
                    <strong style="font-size:16px; color:var(--text-bright);">${b.title}</strong>
                  </div>
                  <div class="subtext" style="margin-top:3px;">
                    Sponsor: <strong>${b.client?.name || 'Mercenary Guild'}</strong> • Signed: ${b.dateSigned || 'Earlier'}
                  </div>
                </div>
                <div style="text-align:right;">
                  <div class="mono" style="font-size:14px; font-weight:800; color:var(--accent-amber);">
                    Target Date: ${b.targetDateText || window.GameState.getCalendarTextForWeeks(b.targetTotalWeeks)}
                  </div>
                  <div class="subtext" style="font-size:12px;">Campaign Week #${b.targetTotalWeeks} (Current: #${curWeeks})</div>
                </div>
              </div>

              <!-- Contract Terms & Target Intel -->
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; background:rgba(0,0,0,0.25); padding:10px; border-radius:6px; font-size:13px;">
                <div>
                  <span class="subtext">Target Unit:</span><br>
                  <strong style="color:var(--accent-red);">${b.enemy?.name || 'Hostile Titan'}</strong> (${b.enemy?.weight || 'Heavy'})
                </div>
                <div>
                  <span class="subtext">Combat Theater:</span><br>
                  <span style="color:var(--text-bright);">${terrainDesc}</span>
                </div>
                <div>
                  <span class="subtext">Negotiated Bounty:</span><br>
                  <strong style="color:var(--accent-green);">${(b.negotiatedBounty || 35000).toLocaleString()} Cr</strong>
                </div>
                <div>
                  <span class="subtext">Salvage Rights:</span><br>
                  <strong style="color:var(--accent-cyan);">${b.negotiatedSalvagePct || 20}% Salvage</strong>
                </div>
              </div>

              <!-- Action Bar -->
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-top:4px;">
                <button class="btn btn-secondary" style="font-size:12px; padding:6px 12px; color:var(--accent-red);" onclick="BattleModule.cancelScheduledBattle('${b.id}')">
                  Abort Contract
                </button>
                <div style="display:flex; gap:10px;">
                  ${!isReady ? `
                    <button class="btn btn-primary" onclick="BattleModule.advanceToScheduledBattle('${b.id}')">
                      Advance Time to Drop Date (${wksLeft} Wk${wksLeft > 1 ? 's' : ''}) &rarr;
                    </button>
                  ` : `
                    <button class="btn btn-primary" style="background:var(--accent-green); color:#000; font-weight:800; padding:10px 20px; font-size:14px; box-shadow:0 0 16px rgba(16,185,129,0.4);" onclick="BattleModule.deployScheduledBattle('${b.id}')">
                      &#9876; DEPLOY LANCE TO HEX ARENA
                    </button>
                  `}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    const offersHtml = st.battleOffers.map(o => {
      const terrainDesc = o.terrain ? `${o.terrain.name} • ${o.terrain.desc}` : 'Standard Terrain';
      const enemyThreat = o.enemy?.threat || 'Standard Threat';
      return `
        <div class="panel" style="display:flex; flex-direction:column; justify-content:space-between; gap:12px; padding:16px;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
              <div>
                <span class="badge primary" style="font-size:11px;">${o.client?.badge || 'CONTRACT'}</span>
                <div style="font-size:16px; font-weight:800; color:var(--text-bright); margin-top:4px;">${o.title}</div>
                <div class="subtext">${o.client?.name || 'Client Sponsor'}</div>
              </div>
              <div class="mono" style="font-size:15px; font-weight:800; color:var(--accent-green); text-align:right;">
                ${o.baseBounty.toLocaleString()} Cr
                <div class="subtext" style="font-size:11px;">Base Bounty</div>
              </div>
            </div>

            <div style="margin-top:10px; font-size:13px; font-style:italic; color:var(--text-bright); background:rgba(0,0,0,0.2); padding:8px 10px; border-radius:4px; border-left:3px solid var(--accent-amber);">
              "${o.client?.introQuote || 'We require an elite mercenary unit for a surgical strike.'}"
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; font-size:12px;">
              <div>
                <span class="subtext">Target:</span><br>
                <strong style="color:var(--accent-red);">${o.enemy?.name}</strong> (${o.enemy?.weight})
              </div>
              <div>
                <span class="subtext">Threat Rating:</span><br>
                <span class="badge ${enemyThreat.includes('High') || enemyThreat.includes('Assault') ? 'red' : 'amber'}" style="font-size:11px;">${enemyThreat}</span>
              </div>
              <div style="grid-column:1 / -1;">
                <span class="subtext">Combat Zone:</span><br>
                <span style="color:var(--text-bright);">${terrainDesc}</span>
              </div>
              <div>
                <span class="subtext">Base Salvage:</span><br>
                <strong>${o.baseSalvagePct || 20}% Share</strong>
              </div>
              <div>
                <span class="subtext">Lead Time:</span><br>
                <strong>${o.suggestedPrepWeeks || 2} Weeks Prep</strong>
              </div>
            </div>
          </div>

          <button class="btn btn-primary" style="width:100%; padding:10px; font-weight:700; margin-top:6px;" onclick="BattleModule.openNegotiation('${o.id}')">
            Negotiate Contract &amp; Match Date &rarr;
          </button>
        </div>
      `;
    }).join('');

    const completedHtml = (st.completedBattles && st.completedBattles.length > 0) ? `
      <div class="panel mono" style="font-size:12px; display:flex; flex-direction:column; gap:6px; max-height:160px; overflow-y:auto;">
        ${st.completedBattles.slice(0, 8).map(cb => `
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:4px;">
            <div>
              <span class="badge ${cb.outcome === 'VICTORY' ? 'green' : 'red'}" style="font-size:10px; padding:2px 6px;">${cb.outcome}</span>
              <strong style="color:var(--text-bright); margin-left:6px;">${cb.title || 'Tactical Drop'}</strong> vs. ${cb.enemyName} (${cb.client})
            </div>
            <div style="text-align:right;">
              <span style="color:var(--accent-green); font-weight:700;">+${(cb.payout || 0).toLocaleString()} Cr</span> • <span class="subtext">${cb.date}</span>
            </div>
          </div>
        `).join('')}
      </div>
    ` : `<div class="subtext mono" style="padding:8px;">No combat operations recorded in company archive yet.</div>`;

    return `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <!-- Top Operations Command Bar -->
        <div class="card" style="padding:18px 24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="badge primary">SECTOR 04 COMBAT OPERATIONS</span>
                <span class="badge green">COMMS LINK ACTIVE</span>
              </div>
              <h2 style="font-size:24px; font-weight:900; margin-top:4px; text-transform:uppercase; letter-spacing:0.02em;">
                Tactical Battle Arena &amp; Contract Registry
              </h2>
              <div class="subtext">
                Negotiate combat match dates on the campaign calendar, lock in bounty and salvage terms, and deploy lance mechs into action-time hex arenas.
              </div>
            </div>

            <!-- Ready Lance Telemetry -->
            <div style="display:flex; align-items:center; gap:12px; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); padding:10px 16px; border-radius:8px;">
              <div style="text-align:right;">
                <div class="subtext" style="font-size:11px; text-transform:uppercase;">Active Deploy Lance</div>
                <div style="font-weight:800; color:var(--text-bright); font-size:14px;">
                  ${jock ? jock.callsign : 'No Jock'} &bull; ${mech ? mech.customName : 'No Mech'}
                </div>
                <div class="subtext" style="font-size:12px;">
                  Current Date: <strong style="color:var(--accent-amber);">${curCalText}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 1: Scheduled Future Battles -->
        <div class="card">
          <div class="section-header">
            <div>
              <div class="section-title">1. Scheduled Tactical Drops (${st.scheduledBattles.length} in Calendar Queue)</div>
              <div class="subtext">Contracts negotiated and locked for future calendar drop dates. Advance time or perform HQ activities until mission window opens.</div>
            </div>
          </div>
          ${scheduledHtml}
        </div>

        <!-- Section 2: Incoming Sector Battle Offers -->
        <div class="card">
          <div class="section-header">
            <div>
              <div class="section-title">2. Incoming Sector Battle Offers (Awaiting Negotiation)</div>
              <div class="subtext">Sector sponsors offering tactical bounties. Inspect threats, negotiate match terms, and schedule on campaign calendar.</div>
            </div>
            <button class="btn btn-secondary" style="font-size:12px;" onclick="BattleModule.refreshBattleOffers()">
              Scan Comms Wire (-500 Cr)
            </button>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:16px;">
            ${offersHtml}
          </div>
        </div>

        <!-- Section 3: Operations Archive -->
        <div class="card">
          <div class="section-header">
            <div class="section-title">3. Sector Operations Archive</div>
            <span class="subtext">Recent combat drop telemetry and payout logs</span>
          </div>
          ${completedHtml}
        </div>
      </div>
    `;
  },

  renderNegotiationScreen(jock, mech, metrics) {
    const offer = this.negotiatingOffer;
    if (!offer) {
      this.closeNegotiation();
      return '';
    }

    const st = window.GameState.data;
    const curWeeks = st.calendar?.totalWeeks || 0;
    const targetWeeks = curWeeks + this.proposedPrepWeeks;
    const targetDatePreview = window.GameState.getCalendarTextForWeeks(targetWeeks);

    const baseBounty = offer.baseBounty;
    const minBounty = Math.round((baseBounty * 0.7) / 500) * 500;
    const maxBounty = Math.round((baseBounty * 1.6) / 500) * 500;

    const terrainDesc = offer.terrain ? `${offer.terrain.name} (${offer.terrain.desc})` : 'Standard Hex Grid';

    const patiencePips = [1, 2, 3].map(i => {
      const active = i <= this.patience;
      const color = this.patience === 3 ? 'var(--accent-green)' : this.patience === 2 ? 'var(--accent-amber)' : 'var(--accent-red)';
      return `<span style="font-size:18px; color:${active ? color : 'var(--border-subtle)'};">&#9679;</span>`;
    }).join(' ');

    return `
      <div style="display:flex; flex-direction:column; gap:16px; max-width:1100px; margin:0 auto;">
        
        <!-- Header & Breadcrumb -->
        <div class="card" style="padding:16px 20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <button class="btn btn-secondary" style="font-size:12px; padding:6px 12px; color:var(--accent-red); border-color:rgba(239,68,68,0.4);" onclick="BattleModule.walkAwayFromNegotiation()">
                  &#128682; Walk Away &larr;
                </button>
                <span class="badge primary">${offer.client?.badge || 'CONTRACT SPONSOR'}</span>
              </div>
              <h2 style="font-size:22px; font-weight:900; margin-top:6px; text-transform:uppercase;">
                Contract Negotiation: ${offer.title}
              </h2>
              <div class="subtext">
                Client Liaison: <strong>${offer.client?.name}</strong> • Current Date: ${window.GameState.getCalendarText()}
              </div>
            </div>
            <div style="text-align:right;">
              <div class="subtext" style="font-size:11px;">LIAISON PATIENCE</div>
              <div style="letter-spacing:4px;">${patiencePips}</div>
            </div>
          </div>
        </div>

        <div class="grid-12" style="gap:16px;">
          <!-- Left 5 Cols: Tactical Intelligence & Liaison Comms -->
          <div class="col-5" style="display:flex; flex-direction:column; gap:16px;">
            
            <!-- Hostile Titan Intel -->
            <div class="card">
              <div class="section-header">
                <div class="section-title">Hostile Threat Telemetry</div>
                <span class="badge red">${offer.enemy?.threat || 'Hostile'}</span>
              </div>
              <div class="panel" style="display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; justify-content:space-between;">
                  <span class="subtext">Hostile Chassis:</span>
                  <strong style="color:var(--text-bright);">${offer.enemy?.name}</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span class="subtext">Weight Class:</span>
                  <strong>${offer.enemy?.weight}</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span class="subtext">Designated Pilot:</span>
                  <strong>${offer.enemy?.pilot || 'Unknown Opponent'}</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span class="subtext">Estimated Firepower:</span>
                  <span class="mono" style="color:var(--accent-red);">${offer.enemy?.dmg || 14} Dmg / salvo (~${offer.enemy?.hit || 65}% Acc)</span>
                </div>
              </div>

              <!-- Hostile Armor Layout -->
              <div style="margin-top:12px;">
                <div class="subtext" style="font-weight:700; margin-bottom:6px; font-size:11px; text-transform:uppercase;">
                  Target Armor Profile (Estimated Max)
                </div>
                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px;">
                  ${Object.entries(offer.enemy?.maxArmor || { HD: 20, CT: 56, LT: 40, RT: 40, LA: 34, RA: 34, LL: 38, RL: 38 }).map(([loc, val]) => `
                    <div class="panel" style="text-align:center; padding:4px;">
                      <div style="font-size:11px; font-weight:700;">${loc}</div>
                      <div class="mono subtext" style="font-size:11px;">${val} pts</div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Combat Theater Profile -->
              <div style="margin-top:14px; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); padding:10px; border-radius:6px;">
                <div class="subtext" style="font-size:11px; text-transform:uppercase; font-weight:700;">Battlefield Environment</div>
                <div style="font-weight:700; color:var(--text-bright); margin-top:2px;">${offer.terrain?.name || 'Standard Basin'}</div>
                <div class="subtext" style="font-size:12px; margin-top:2px;">${offer.terrain?.desc || 'Standard terrain conditions.'}</div>
              </div>
            </div>

            <!-- Client Comms Readout -->
            <div class="card">
              <div class="section-header">
                <div class="section-title">Comms Telemetry Feed</div>
              </div>
              <div class="panel" style="background:#050b14; border-left:3px solid var(--accent-cyan); min-height:80px; display:flex; align-items:center;">
                <div class="mono" style="font-size:13px; color:var(--text-bright); line-height:1.5;">
                  ${this.negotiationMessage}
                </div>
              </div>
            </div>

          </div>

          <!-- Right 7 Cols: Interactive Terms Negotiation Terminal -->
          <div class="col-7" style="display:flex; flex-direction:column; gap:16px;">
            
            <div class="card">
              <div class="section-header">
                <div>
                  <div class="section-title">Counter-Offer Terms Console</div>
                  <div class="subtext">Adjust bounty, salvage allocation, and scheduled future drop date.</div>
                </div>
              </div>

              <!-- Term 1: Bounty (Credits) -->
              <div class="panel" style="display:flex; flex-direction:column; gap:10px; margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong style="font-size:15px; color:var(--text-bright);">1. Mission Bounty (Credits)</strong>
                    <div class="subtext">Standard client offer: ${baseBounty.toLocaleString()} Cr</div>
                  </div>
                  <div class="mono" style="font-size:20px; font-weight:900; color:var(--accent-green);">
                    ${this.proposedBounty.toLocaleString()} Cr
                  </div>
                </div>

                <input type="range" id="neg-inp-bounty" min="${minBounty}" max="${maxBounty}" step="500" value="${this.proposedBounty}" oninput="BattleModule.updateNegotiationInputs()" style="width:100%; cursor:pointer;">

                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                  <button class="btn btn-secondary" style="font-size:12px; flex:1;" onclick="BattleModule.setQuickBountyPct(100)">Standard (100%)</button>
                  <button class="btn btn-secondary" style="font-size:12px; flex:1;" onclick="BattleModule.setQuickBountyPct(115)">+15% Counter</button>
                  <button class="btn btn-secondary" style="font-size:12px; flex:1;" onclick="BattleModule.setQuickBountyPct(130)">+30% Premium</button>
                  <button class="btn btn-secondary" style="font-size:12px; flex:1;" onclick="BattleModule.setQuickBountyPct(145)">+45% High-Stakes</button>
                </div>
              </div>

              <!-- Term 2: Salvage Rights (%) -->
              <div class="panel" style="display:flex; flex-direction:column; gap:10px; margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong style="font-size:15px; color:var(--text-bright);">2. Salvage Rights Allocation</strong>
                    <div class="subtext">Higher salvage provides extra bonus credits + chances to recover intact enemy Titan weapon/part systems.</div>
                  </div>
                  <div class="mono" style="font-size:20px; font-weight:900; color:var(--accent-cyan);">
                    ${this.proposedSalvage}%
                  </div>
                </div>

                <input type="range" id="neg-inp-salvage" min="10" max="50" step="5" value="${this.proposedSalvage}" oninput="BattleModule.updateNegotiationInputs()" style="width:100%; cursor:pointer;">

                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                  <button class="btn btn-secondary" style="font-size:12px; flex:1;" onclick="BattleModule.setQuickSalvage(15)">15% (Basic)</button>
                  <button class="btn btn-secondary" style="font-size:12px; flex:1;" onclick="BattleModule.setQuickSalvage(25)">25% (Standard)</button>
                  <button class="btn btn-secondary" style="font-size:12px; flex:1;" onclick="BattleModule.setQuickSalvage(35)">35% (Priority)</button>
                  <button class="btn btn-secondary" style="font-size:12px; flex:1;" onclick="BattleModule.setQuickSalvage(50)">50% (Full Strip)</button>
                </div>
              </div>

              <!-- Term 3: Scheduled Future Match Date (Prep Weeks) -->
              <div class="panel" style="display:flex; flex-direction:column; gap:10px; margin-bottom:12px;">
                <div>
                  <strong style="font-size:15px; color:var(--text-bright);">3. Scheduled Match Date (Campaign Lead Time)</strong>
                  <div class="subtext">Set when this drop will take place on the campaign calendar. Allows time to repair mechs, refit weapons, or train pilots in HQ.</div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">
                  ${[1, 2, 3, 4].map(w => `
                    <button class="btn ${this.proposedPrepWeeks === w ? 'btn-primary' : 'btn-secondary'}" style="padding:10px; text-align:center;" onclick="BattleModule.setPrepWeeks(${w})">
                      <div style="font-weight:800; font-size:14px;">+${w} Week${w > 1 ? 's' : ''}</div>
                      <div class="subtext" style="font-size:11px;">${w === 1 ? 'Rapid Drop' : w === 2 ? 'Standard' : w === 3 ? 'Extended' : 'Full Overhaul'}</div>
                    </button>
                  `).join('')}
                </div>

                <!-- Calendar Date Preview Banner -->
                <div style="background:rgba(0,0,0,0.3); border:1px solid var(--accent-blue); padding:12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                  <div>
                    <span class="subtext" style="font-size:11px; text-transform:uppercase;">Scheduled Drop Calendar Date:</span>
                    <div class="mono" style="font-size:15px; font-weight:800; color:var(--accent-amber); margin-top:2px;">
                      &#128197; ${targetDatePreview}
                    </div>
                  </div>
                  <div class="subtext" style="text-align:right;">
                    T-Minus ${this.proposedPrepWeeks} Week${this.proposedPrepWeeks > 1 ? 's' : ''} from Today
                  </div>
                </div>
              </div>

              <!-- Action Confirmation Buttons -->
              <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px;">
                <button class="btn btn-secondary" style="flex:1; padding:12px; font-weight:700; color:var(--accent-red); border-color:rgba(239,68,68,0.5); background:rgba(239,68,68,0.06);" onclick="BattleModule.walkAwayFromNegotiation()">
                  &#128682; Walk Away (Keep Offer)
                </button>
                <button class="btn btn-secondary" style="flex:1; padding:12px; font-weight:700; color:#cbd5e1;" onclick="BattleModule.walkAwayFromNegotiation(true)">
                  &#10006; Decline &amp; Discard
                </button>
                <button class="btn btn-secondary" style="flex:1.1; padding:12px; font-weight:700;" onclick="BattleModule.testContractOffer()">
                  Test Client Response
                </button>
                <button class="btn btn-primary" style="flex:1.4; padding:12px; font-weight:800; font-size:14px; background:var(--accent-green); color:#000;" onclick="BattleModule.signBattleContract()">
                  &#9997; Sign &amp; Lock Match Date
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>
    `;
  },

  renderCombatArena(jock, mech, metrics) {
    const mins = String(Math.floor(this.clockSec / 60)).padStart(2, '0');
    const secs = String(this.clockSec % 60).padStart(2, '0');
    const dist = this.getHexDistance(this.playerPos.r, this.playerPos.c, this.enemy.r, this.enemy.c);
    const maxMove = Math.max(2, Math.min(3, metrics?.tpl?.baseSpeedHex || 2));
    const standChance = this.calcStandUpChance(jock, mech);

    // Build 8x10 SVG Hex Grid with Stylized Terrain Artwork & Mini-Mech Sprites
    const R = 27;
    const dx = 40.5;
    const dy = 46.77;
    const svgGrid = this.hexes.map(h => {
      const cx = 36 + h.c * dx;
      const cy = 34 + h.r * dy + (h.c % 2 === 1 ? dy / 2 : 0);
      const isP = h.r === this.playerPos.r && h.c === this.playerPos.c;
      const isE = h.r === this.enemy.r && h.c === this.enemy.c;
      const moveDist = this.getHexDistance(this.playerPos.r, this.playerPos.c, h.r, h.c);
      const isReachable = (moveDist > 0 && moveDist <= maxMove && !isE && !this.playerFallen);

      const stroke = isP ? '#38bdf8'
                   : isE ? '#f43f5e'
                   : isReachable ? '#38bdf8'
                   : h.terrain === 'woods' ? '#16a34a'
                   : h.terrain === 'water' ? '#0284c7'
                   : h.terrain === 'hill' ? '#d97706'
                   : h.terrain === 'rubble' ? '#dc2626'
                   : '#334155';

      let innerContent = this.renderHexTileArtwork(h, cx, cy, R, isP || isE);

      if (isP) {
        const pLabel = this.playerFallen ? 'PRONE' : (jock ? jock.callsign.slice(0, 7).toUpperCase() : 'PLAYER');
        innerContent += this.renderHexMechSprite(cx, cy - 2, mech.armor, mech.maxArmorCurrent, pLabel, this.playerFallen ? '#ef4444' : '#38bdf8', this.playerFallen);
      } else if (isE) {
        const eLabel = this.enemyFallen ? 'PRONE' : 'HOSTILE';
        innerContent += this.renderHexMechSprite(cx, cy - 2, this.enemy.armor, this.enemy.maxArmor, eLabel, this.enemyFallen ? '#f97316' : '#f43f5e', this.enemyFallen);
      } else if (isReachable) {
        innerContent += `
          <circle cx="${cx}" cy="${cy}" r="3.5" fill="#38bdf8" opacity="0.85" />
          <circle cx="${cx}" cy="${cy}" r="7.5" fill="none" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2,2" opacity="0.65" />
        `;
      }

      return `
        <g onclick="BattleModule.moveHex(${h.r},${h.c})" style="cursor:${isReachable ? 'pointer' : 'default'};">
          <polygon points="${this.hexPoints(cx, cy, R)}" fill="url(#hex-grad-${h.terrain || 'clear'})" stroke="${stroke}" stroke-width="${isP || isE ? 2.5 : isReachable ? 1.8 : 1}" stroke-dasharray="${isReachable ? '4,2' : 'none'}" />
          ${innerContent}
        </g>
      `;
    }).join('');

    const aimLocations = ['General', 'HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];

    return `
      <div class="grid-12">
        <!-- Left 6 Cols: Hex Arena Map, Action-Time Clock & Pilot Telemetry -->
        <div class="col-6" style="display:flex; flex-direction:column; gap:16px;">
          
          <div class="card">
            <div class="section-header">
              <div>
                <div class="section-title">Tactical Hex Arena // 80-Tile Operational Theater</div>
                <div class="subtext">Click highlighted waypoints (up to ${maxMove} hexes) to move. Woods/Ruins grant cover; Water cools heat; Ridges elevate LoS.</div>
              </div>
              <button class="btn btn-secondary" onclick="BattleModule.abortCombatToOperations()">
                ${this.contractWon || this.contractLost ? '&larr; Return to Operations' : 'Tactical Retreat'}
              </button>
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
              <div class="hud-pill" style="${this.playerFallen ? 'border:1px solid #ef4444; background:rgba(239,68,68,0.15);' : ''}">
                <div class="label" style="${this.playerFallen ? 'color:#f87171;' : ''}">Titan Posture</div>
                <div class="val" style="color:${this.playerFallen ? '#f87171' : 'var(--accent-green)'}; font-weight:700;">
                  ${this.playerFallen ? 'PRONE (DOWNED)' : 'UPRIGHT'}
                </div>
              </div>
            </div>

            <!-- Interactive SVG Hex Map with Stylized Terrain & 8-Part Mech Sprites -->
            <div class="panel" style="display:flex; flex-direction:column; align-items:center; gap:8px; padding:12px;">
              <svg viewBox="0 0 448 426" style="width:100%; max-width:620px; height:auto; user-select:none; filter:drop-shadow(0 4px 16px rgba(0,0,0,0.5));">
                <defs>
                  <radialGradient id="hex-grad-woods" cx="50%" cy="45%" r="65%">
                    <stop offset="0%" stop-color="#144626" />
                    <stop offset="60%" stop-color="#0a2a16" />
                    <stop offset="100%" stop-color="#04140b" />
                  </radialGradient>
                  <radialGradient id="hex-grad-water" cx="50%" cy="45%" r="65%">
                    <stop offset="0%" stop-color="#0284c7" />
                    <stop offset="60%" stop-color="#075985" />
                    <stop offset="100%" stop-color="#082f49" />
                  </radialGradient>
                  <radialGradient id="hex-grad-hill" cx="50%" cy="40%" r="65%">
                    <stop offset="0%" stop-color="#92400e" />
                    <stop offset="60%" stop-color="#542308" />
                    <stop offset="100%" stop-color="#240c02" />
                  </radialGradient>
                  <radialGradient id="hex-grad-rubble" cx="50%" cy="45%" r="65%">
                    <stop offset="0%" stop-color="#450a0a" />
                    <stop offset="60%" stop-color="#261010" />
                    <stop offset="100%" stop-color="#140606" />
                  </radialGradient>
                  <radialGradient id="hex-grad-clear" cx="50%" cy="45%" r="65%">
                    <stop offset="0%" stop-color="#1e293b" />
                    <stop offset="65%" stop-color="#0f172a" />
                    <stop offset="100%" stop-color="#070c14" />
                  </radialGradient>
                </defs>
                ${svgGrid}
              </svg>

              <!-- Armor Damage Legend -->
              <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center; font-size:11px;" class="mono subtext">
                <span><strong style="color:#10b981;">&#9632;</strong> 70–100% Armor</span>
                <span><strong style="color:#f59e0b;">&#9632;</strong> 35–69% Damaged</span>
                <span><strong style="color:#ef4444;">&#9632;</strong> 1–34% Critical</span>
                <span><strong style="color:#475569;">&#9632;</strong> 0% Breached</span>
              </div>

              <!-- Terrain Effect Legend -->
              <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center; font-size:11px; margin-top:2px;" class="mono subtext">
                <span><strong style="color:#22c55e;">&#9670; WOODS</strong> (+15% Cover)</span>
                <span><strong style="color:#38bdf8;">&#9670; WATER</strong> (Cool +3C)</span>
                <span><strong style="color:#f59e0b;">&#9670; RIDGE</strong> (LoS +10% Hit)</span>
                <span><strong style="color:#f87171;">&#9670; RUINS</strong> (+8% Cover)</span>
                <span><strong style="color:#94a3b8;">&#9670; CLEAR</strong> (Plains)</span>
                <span><strong style="color:#38bdf8;">&#9678; WAYPOINT</strong> (Move)</span>
              </div>
            </div>

            <!-- Prone Warning & Stand Up Button Banner -->
            ${this.playerFallen ? `
              <div style="background:linear-gradient(90deg, rgba(185,28,28,0.35) 0%, rgba(220,38,38,0.18) 100%); border:2px solid #ef4444; border-radius:8px; padding:12px 16px; margin-bottom:10px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; box-shadow:0 0 16px rgba(239,68,68,0.4);">
                <div>
                  <div style="color:#ffffff; font-weight:800; font-size:14px; display:flex; align-items:center; gap:8px;">
                    <span style="font-size:18px; color:#f87171;">&#9888;</span> TITAN CRASHED PRONE (ACTUATOR FAILURE)
                  </div>
                  <div class="subtext" style="color:#fecaca; font-size:12px; margin-top:3px;">
                    Maneuver blocked &bull; Aim penalty: -20% &bull; Jockey Piloting: <strong>${jock ? jock.stats.Piloting : 30}</strong> (Recovery Chance: <strong>${standChance}%</strong>)
                  </div>
                </div>
                <button class="btn btn-primary" style="background:#dc2626; color:#ffffff; font-weight:800; font-size:13px; padding:10px 18px; border:2px solid #f87171; box-shadow:0 4px 14px rgba(220,38,38,0.6); cursor:pointer;" onclick="BattleModule.standUp()">
                  &#9650; STAND UP (${standChance}%) &rarr;
                </button>
              </div>
            ` : ''}

            <!-- Action-Time Maneuver Controls -->
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              ${this.playerFallen ? `
                <button class="btn btn-primary" style="flex:1 1 100%; padding:10px; background:#dc2626; color:#ffffff; font-weight:800; border:1px solid #f87171;" onclick="BattleModule.standUp()">
                  &#9650; STAND UP TITAN &bull; Piloting Check: ${standChance}% (3s / +4C)
                </button>
              ` : ''}
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
              <div class="section-title">Your Titan Telemetry: ${mech.customName} (${jock ? jock.callsign : 'Pilot'}) ${this.playerFallen ? '<span class="badge" style="background:#dc2626; color:#fff; font-size:11px; margin-left:8px;">PRONE</span>' : ''}</div>
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
                <div class="section-title">Target Lock: ${this.enemy.name} (${this.enemy.weight}) ${this.enemyFallen ? '<span class="badge" style="background:#dc2626; color:#fff; font-size:11px; margin-left:8px; animation:pulse 1.5s infinite;">PRONE (+15% HIT)</span>' : ''}</div>
                <div class="subtext">Select a Called Shot body part or fire at General mass. Leg hits may topple enemy!</div>
              </div>
              ${this.contractWon ? `
                <div style="display:flex; align-items:center; gap:8px;">
                  <button class="btn btn-primary" style="background:var(--accent-green); color:#000; font-weight:800;" onclick="BattleModule.returnFromVictoryOrDefeat()">
                    View Combat Debriefing Summary &rarr;
                  </button>
                </div>
              ` : ''}
            </div>

            <div>
              <div class="subtext" style="margin-bottom:6px; font-weight:600;">Called Shot Aim Location:</div>
              <div style="display:flex; flex-wrap:wrap; gap:6px;">
                ${aimLocations.map(loc => {
                  const mod = this.getAimModifier(loc);
                  const tag = (loc === 'LL' || loc === 'RL') ? `${loc} (${mod}% &bull; Leg Trip)` : `${loc} (${mod >= 0 ? '+0%' : mod + '%'})`;
                  return `
                    <button class="btn ${this.aimTarget === loc ? 'btn-primary' : ''}" onclick="BattleModule.setAim('${loc}')">
                      ${tag}
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
              <div style="display:flex; gap:10px; font-size:11px;" class="mono subtext">
                <span><strong style="color:var(--accent-green, #10b981);">&#9632;</strong> My Actions</span>
                <span><strong style="color:var(--accent-red, #ef4444);">&#9632;</strong> Hostile Actions</span>
              </div>
            </div>
            <div class="panel mono" style="font-size:12px; display:flex; flex-direction:column; gap:6px; max-height:180px; overflow-y:auto; background:#070d18;">
              ${this.logs.map(l => {
                const time = typeof l === 'object' ? l.time : '';
                const text = typeof l === 'object' ? l.text : l;
                const type = typeof l === 'object' ? l.type : 'system';
                const color = type === 'player' ? 'var(--accent-green, #10b981)'
                            : type === 'hostile' ? 'var(--accent-red, #ef4444)'
                            : '#94a3b8';
                const tag = type === 'player' ? '<span style="color:#10b981; font-weight:800;">[PLAYER]</span>'
                          : type === 'hostile' ? '<span style="color:#ef4444; font-weight:800;">[HOSTILE]</span>'
                          : '<span style="color:#38bdf8; font-weight:700;">[TAC-NET]</span>';
                return `
                  <div style="color:${color}; line-height:1.45;">
                    <span style="color:#64748b; font-size:11px;">${time}</span> ${tag} ${text}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

        </div>
      </div>
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

    const metrics = window.GameState.computeMechMetrics(mech);

    if (this.active) {
      container.innerHTML = this.renderCombatArena(jock, mech, metrics);
    } else if (this.arenaTab === 'summary' && this.battleSummary) {
      container.innerHTML = this.renderSummaryPage();
    } else if (this.arenaTab === 'negotiate' && this.negotiatingOffer) {
      container.innerHTML = this.renderNegotiationScreen(jock, mech, metrics);
    } else {
      container.innerHTML = this.renderOperationsBoard(jock, mech, metrics);
    }
  }
};
