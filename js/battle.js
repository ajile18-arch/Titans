// Tactical Battle Arena Module (Stylized Turn-Based JRPG 3D Side-Angle Duel System)

window.BattleModule = {
  active: false,
  arenaTab: 'offers', // 'offers' | 'negotiate' | 'combat' | 'summary'

  // Stylized 3D Duel State (Pokemon / Final Fantasy Style)
  round: 1,
  firstTurn: 'player', // 'player' | 'enemy' (decided by chassis affinity)
  initiativeWinner: 'player',
  playerChassisClass: 'Medium',
  playerAffinity: 20,
  playerAffTier: null,
  playerArmorRating: 100,
  playerDamageReductionPct: 35,
  turn: 'player', // 'player' | 'enemy' | 'animating' | 'ended'
  commandTab: 'attack', // 'attack' | 'defend' | 'tactics' | 'retreat'
  aimTarget: 'General', // 'General' | 'HD' | 'CT' | 'LT' | 'RT' | 'LA' | 'RA' | 'LL' | 'RL'
  selectedPlayerPart: null, // Player mech region highlighted for the condition readout
  playerStance: 'normal', // 'normal' | 'braced' | 'evasive' | 'twisted'
  enemyStance: 'normal',
  playerFallen: false,
  enemyFallen: false,
  isCloseRange: false,
  isWalking: false,
  walkDirection: 'forward',
  sensorLockTurns: 0,
  damagePopups: [],
  activeBeam: null,
  shaking: false,
  logs: [],
  contractWon: false,
  contractLost: false,
  battleOver: false,
  pendingDebriefing: null,
  battleStats: { rounds: 0, shotsFired: 0, shotsHit: 0, damageDealt: 0, damageTaken: 0 },

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

  getActiveCombatJock() {
    const st = window.GameState.data;
    const sel = st.jocks.find(j => j.id === st.selectedJockId && j.assignedMechId && !j.isDead && !j.medicallyDisabled);
    if (sel) return sel;
    return st.jocks.find(j => j.assignedMechId && !j.isDead && !j.medicallyDisabled)
        || st.jocks.find(j => !j.isDead && !j.medicallyDisabled)
        || st.jocks.find(j => !j.isDead)
        || st.jocks[0];
  },

  getChassisClass(text) {
    if (!text) return 'Medium';
    const str = String(text).toLowerCase();
    if (str.includes('recon')) return 'Recon';
    if (str.includes('assault')) return 'Assault';
    if (str.includes('heavy')) return 'Heavy';
    if (str.includes('light')) return 'Light';
    if (str.includes('medium')) return 'Medium';
    return 'Medium';
  },

  calcEnemyAffinity(enemy) {
    if (typeof enemy?.affinity === 'number') return enemy.affinity;
    const threat = String(enemy?.threat || 'Moderate').toLowerCase();
    const seed = (enemy?.name || enemy?.pilot || 'Hostile').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    let base = 38;
    let spread = 12;
    if (threat.includes('low')) {
      base = 22; spread = 12;
    } else if (threat.includes('challeng')) {
      base = 52; spread = 12;
    } else if (threat.includes('high')) {
      base = 68; spread = 10;
    } else if (threat.includes('dead')) {
      base = 84; spread = 10;
    } else {
      base = 36; spread = 12;
    }
    const offset = seed % spread;
    return Math.min(99, Math.max(15, base + offset));
  },

  calcEnemyArmorRating(enemy) {
    if (typeof enemy?.armorRating === 'number') return enemy.armorRating;
    const wClass = this.getChassisClass(enemy?.weight);
    const threat = String(enemy?.threat || 'Moderate').toLowerCase();
    let baseAR = 140;
    if (wClass === 'Recon') baseAR = 60;
    else if (wClass === 'Light') baseAR = 95;
    else if (wClass === 'Medium') baseAR = 140;
    else if (wClass === 'Heavy') baseAR = 200;
    else if (wClass === 'Assault') baseAR = 280;

    let threatMod = 0;
    if (threat.includes('low')) threatMod = -20;
    else if (threat.includes('challeng')) threatMod = +20;
    else if (threat.includes('high')) threatMod = +40;
    else if (threat.includes('dead')) threatMod = +60;

    return Math.max(30, baseAR + threatMod);
  },

  onPlayerActionComplete() {
    if (this.battleOver || this.contractWon || this.contractLost) return;
    if (this.firstTurn === 'player') {
      this.runEnemyTurn();
    } else {
      this.endRound();
    }
  },

  onEnemyActionComplete() {
    if (this.battleOver || this.contractWon || this.contractLost) return;
    if (this.firstTurn === 'enemy') {
      this.turn = 'player';
      this.render();
    } else {
      this.endRound();
    }
  },

  initEncounter(contract = null) {
    const st = window.GameState.data;
    const jock = this.getActiveCombatJock();
    if (jock && (jock.medicallyDisabled || jock.health < 25) && !jock.isDead) {
      alert(`Deployment Blocked: Pilot ${jock.callsign} is MEDICALLY DISABLED (${jock.health}% HP). Grounded from combat duty until 100% full recovery in Medical Bay!`);
      this.active = false;
      this.arenaTab = 'offers';
      this.render();
      return;
    }
    const mech = jock ? st.mechs.find(m => m.id === jock.assignedMechId) : st.mechs[0];

    // Ensure player mech armor object has all locations
    if (mech) {
      if (!mech.armor) mech.armor = {};
      if (!mech.maxArmorCurrent) mech.maxArmorCurrent = {};
      ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'].forEach(loc => {
        if (typeof mech.armor[loc] !== 'number') mech.armor[loc] = 30;
        if (typeof mech.maxArmorCurrent[loc] !== 'number') mech.maxArmorCurrent[loc] = 30;
      });
    }

    this.active = true;
    this.arenaTab = 'combat';
    this.currentContract = contract;
    this.round = 1;
    if (window.MusicModule && typeof window.MusicModule.setMode === 'function') {
      window.MusicModule.setMode('battle');
    }
    this.commandTab = 'attack';
    this.aimTarget = 'General';
    this.selectedPlayerPart = null;
    this.playerStance = 'normal';
    this.enemyStance = 'normal';
    this.playerFallen = false;
    this.enemyFallen = false;
    this.isCloseRange = false;
    this.isWalking = false;
    this.walkDirection = 'forward';
    this.sensorLockTurns = 0;
    this.damagePopups = [];
    this.activeBeam = null;
    this.shaking = false;
    this.contractWon = false;
    this.contractLost = false;
    this.battleOver = false;
    this.pendingDebriefing = null;
    this.battleStats = { rounds: 1, shotsFired: 0, shotsHit: 0, damageDealt: 0, damageTaken: 0 };

    // Spawn Enemy Titan
    if (contract && contract.enemy) {
      this.enemy = {
        name: contract.enemy.name,
        weight: contract.enemy.weight,
        dmg: contract.enemy.dmg || 16,
        hit: contract.enemy.hit || 68,
        armor: { ...contract.enemy.armor },
        maxArmor: { ...contract.enemy.maxArmor },
        pilot: contract.enemy.pilot || 'Hostile Combat AI',
        threat: contract.enemy.threat || 'Moderate',
        affinity: contract.enemy.affinity,
        armorRating: contract.enemy.armorRating,
        weapons: [
          { name: 'Particle Projector Cannon (PPC)', cat: 'Energy', dmg: 24, accMod: 0 },
          { name: 'Long-Range Missile 15 (LRM-15)', cat: 'Missile', dmg: 18, accMod: 4 },
          { name: 'Twin Medium Lasers', cat: 'Energy', dmg: 14, accMod: 6 },
          { name: 'Heavy Autocannon AC/10', cat: 'Ballistic', dmg: 20, accMod: 0 }
        ]
      };
    } else {
      const enemyTemplates = [
        { name: 'Enemy TAT-110M "Enforcer"', weight: '110t Medium', dmg: 14, hit: 66, pilot: 'Sector Raider', threat: 'Low' },
        { name: 'Enemy TAT-155H "Warhammer"', weight: '155t Heavy', dmg: 18, hit: 70, pilot: 'Veteran Duelist', threat: 'Challenging' },
        { name: 'Enemy TAT-190A "Colossus"', weight: '190t Assault', dmg: 24, hit: 74, pilot: 'Elite Warlord', threat: 'Deadly' }
      ];
      const pick = enemyTemplates[(st.missionsCompleted || 0) % enemyTemplates.length];
      this.enemy = {
        name: pick.name,
        weight: pick.weight,
        dmg: pick.dmg,
        hit: pick.hit,
        armor: { HD: 20, CT: 56, LT: 40, RT: 40, LA: 34, RA: 34, LL: 38, RL: 38 },
        maxArmor: { HD: 20, CT: 56, LT: 40, RT: 40, LA: 34, RA: 34, LL: 38, RL: 38 },
        pilot: pick.pilot,
        threat: pick.threat || 'Moderate',
        weapons: [
          { name: 'Heavy Ion Blast', cat: 'Energy', dmg: pick.dmg + 4, accMod: 0 },
          { name: 'Missile Swarm', cat: 'Missile', dmg: pick.dmg, accMod: 5 },
          { name: 'Rotary Autocannon', cat: 'Ballistic', dmg: pick.dmg + 2, accMod: 2 }
        ]
      };
    }

    // Determine hostile chassis weight class & affinity
    const enemyClass = this.getChassisClass(this.enemy.weight);
    const enemyAffinity = this.calcEnemyAffinity(this.enemy);
    const enemyAffTier = window.GameState.getAffinityTier(enemyAffinity);
    this.enemy.chassisClass = enemyClass;
    this.enemy.affinity = enemyAffinity;
    this.enemy.affTier = enemyAffTier;

    // Calculate enemy Armor Rating & Damage Reduction
    if (typeof this.enemy.armorRating !== 'number') {
      this.enemy.armorRating = this.calcEnemyArmorRating(this.enemy);
    }
    this.enemy.damageReductionPct = Math.min(65, Math.round((this.enemy.armorRating / (this.enemy.armorRating + 120)) * 80));

    // Determine player chassis weight class & affinity
    const playerTpl = mech ? window.GameState.getMechTemplate(mech) : null;
    const playerClass = playerTpl ? playerTpl.weightClass : 'Medium';
    window.GameState.ensureJockAffinity(jock);
    const playerAffinity = jock ? (jock.affinity?.[playerClass] ?? 20) : 20;
    const playerAffTier = window.GameState.getAffinityTier(playerAffinity);
    this.playerChassisClass = playerClass;
    this.playerAffinity = playerAffinity;
    this.playerAffTier = playerAffTier;

    // Calculate player Armor Rating & Damage Reduction from equipped open-weight armor
    const pMetrics = mech ? window.GameState.computeMechMetrics(mech) : null;
    this.playerArmorRating = pMetrics?.armorRating ?? 100;
    this.playerDamageReductionPct = pMetrics?.damageReductionPct ?? 35;

    // INITIATIVE DECISION: Whoever has a higher affinity in their size of Mech has the first turn!
    if (playerAffinity > enemyAffinity) {
      this.firstTurn = 'player';
      this.initiativeWinner = 'player';
    } else if (enemyAffinity > playerAffinity) {
      this.firstTurn = 'enemy';
      this.initiativeWinner = 'enemy';
    } else {
      // Tie-breaker: pilot Piloting attribute or default commander advantage
      const piloting = jock?.stats?.Piloting || 25;
      this.firstTurn = (piloting >= 25) ? 'player' : 'enemy';
      this.initiativeWinner = this.firstTurn;
    }

    this.turn = this.firstTurn;

    const pName = jock ? jock.callsign : 'Pilot';
    const eName = this.enemy.pilot || 'Hostile Pilot';
    const isPlayerFirst = (this.initiativeWinner === 'player');

    this.logs = [
      { time: '[RND 1]', text: `COMBAT DROP: 1v1 Arena Duel initiated! ${pName} deployed in ${mech ? mech.customName : 'Titan'}.`, type: 'system' },
      { time: '[RND 1]', text: `HOSTILE CONTACT: Locked onto ${this.enemy.name} (${this.enemy.weight}) piloted by ${this.enemy.pilot}.`, type: 'hostile' },
      {
        time: '[INITIATIVE]',
        text: isPlayerFirst
          ? `INITIATIVE SEIZED: ${pName} (${playerAffinity}% ${playerClass} Affinity [${playerAffTier.tier}]) out-maneuvered ${eName} (${enemyAffinity}% ${enemyClass} Affinity [${enemyAffTier.tier}])! Commander has the opening turn!`
          : `INITIATIVE LOST: Hostile ${eName} (${enemyAffinity}% ${enemyClass} Affinity [${enemyAffTier.tier}]) out-paced ${pName} (${playerAffinity}% ${playerClass} Affinity [${playerAffTier.tier}])! Hostile attacks first!`,
        type: isPlayerFirst ? 'player' : 'hostile'
      },
      {
        time: '[DEFENSE]',
        text: `ARMOR RATINGS: Commander Titan Plating: ${this.playerArmorRating} (-${this.playerDamageReductionPct}% DR) vs Hostile Plating: ${this.enemy.armorRating} (-${this.enemy.damageReductionPct}% DR).`,
        type: 'system'
      }
    ];

    if (this.firstTurn === 'enemy') {
      setTimeout(() => {
        if (!this.contractWon && !this.contractLost && !this.battleOver && this.turn === 'enemy') {
          this.runEnemyTurn();
        }
      }, 1200);
    }
  },

  log(msg, type = 'system') {
    const time = `[RND ${this.round}]`;
    this.logs.unshift({ time, text: msg, type });
    if (this.logs.length > 25) this.logs.pop();
  },

  finishBattle(outcome, killMethod, killCode, weapon) {
    this.battleOver = true;
    this.turn = 'ended';
    if (outcome === 'VICTORY') {
      this.contractWon = true;
      this.contractLost = false;
      this.enemyFallen = true;
    } else {
      this.contractLost = true;
      this.contractWon = false;
      if (outcome === 'DEFEAT') {
        this.playerFallen = true;
      }
    }
    this.pendingDebriefing = { outcome, killMethod, killCode, weapon };
    this.spawnDamagePopup(outcome === 'VICTORY' ? 'VICTORY!' : (outcome === 'DEFEAT' ? 'DEFEAT!' : 'RETREAT'), false, true);
    this.render();
  },

  proceedToDebriefing() {
    if (!this.pendingDebriefing) {
      if (this.battleSummary) {
        this.active = false;
        this.arenaTab = 'summary';
        this.render();
      }
      return;
    }
    const { outcome, killMethod, killCode, weapon } = this.pendingDebriefing;
    this.pendingDebriefing = null;
    this.battleOver = false;
    this.buildBattleSummary(outcome, killMethod, killCode, weapon);
  },

  // Records the fight in the jockey's service history and grants any earned commendations
  recordBattleHistory(jock, mech, outcome, killMethod, xpEarned, killCode) {
    if (!jock) return;
    if (!Array.isArray(jock.fightHistory)) jock.fightHistory = [];
    if (!Array.isArray(jock.awards)) jock.awards = [];

    const enemyName = this.enemy?.name || 'Hostile Titan';
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
      grantAward('first-blood', `Neutralized ${enemyName} in Fight #${fightNumber}.`);
      if (killCode === 'HD') {
        grantAward('headhunter', `Decapitated ${enemyName} with a Cockpit Headshot (HD) in Fight #${fightNumber}.`);
      } else if (killCode === 'CT') {
        grantAward('core-breaker', `Cored ${enemyName}'s Center Torso (CT) reactor in Fight #${fightNumber}.`);
      } else if (killCode === 'LEGS' || killCode === 'MOBILITY') {
        grantAward('leg-sweeper', `Swept both legs (LL & RL) of ${enemyName} in Fight #${fightNumber}.`);
      }

      const acc = this.battleStats.shotsFired > 0
        ? Math.round((this.battleStats.shotsHit / this.battleStats.shotsFired) * 100)
        : 0;
      if (this.battleStats.shotsFired >= 3 && acc >= 75) {
        grantAward('sharpshooter', `Finished Fight #${fightNumber} with ${acc}% gunnery accuracy (${this.battleStats.shotsHit}/${this.battleStats.shotsFired}).`);
      }
      if (this.battleStats.damageTaken >= 36) {
        grantAward('ironclad-survivor', `Endured ${this.battleStats.damageTaken} armor damage against ${enemyName} and emerged victorious.`);
      }
      if (jock.kills >= 3) {
        grantAward('titan-ace', `Achieved ${jock.kills} confirmed Titan kills in service of the company.`);
      }
    }

    const tpl = mech ? window.GameState.getMechTemplate(mech) : null;
    const wClass = tpl ? tpl.weightClass : 'Medium';
    const pilotAffinity = (jock && jock.affinity) ? (jock.affinity[wClass] || 0) : 0;

    jock.fightHistory.unshift({
      fightNumber,
      campaignDate: window.GameState.getCalendarText(),
      enemyName,
      enemyWeight: this.enemy?.weight || '',
      mechName: mech ? mech.customName : 'Titan-AT',
      mechWeightClass: wClass,
      chassisAffinity: pilotAffinity,
      outcome,
      durationSec: (this.battleStats.rounds || this.round || 1) * 15, // each duel round is ~15s of combat
      shotsFired: this.battleStats.shotsFired,
      shotsHit: this.battleStats.shotsHit,
      damageDealt: this.battleStats.damageDealt,
      damageTaken: this.battleStats.damageTaken,
      killMethod,
      xpEarned,
      awardsEarned: newAwards
    });
  },

  setCommandTab(tab) {
    if (this.turn !== 'player' || this.battleOver) return;
    this.commandTab = tab;
    this.render();
  },

  setAimTarget(loc) {
    if (this.turn !== 'player' || this.battleOver) return;
    this.aimTarget = loc;
    this.render();
  },

  // Hit-chance modifier (percentage points) applied when aiming at a specific hostile region
  getAimModifier(loc) {
    if (loc === 'HD') return -24;
    if (loc === 'CT') return 6;
    if (loc === 'LL' || loc === 'RL') return -8;
    if (loc === 'LA' || loc === 'RA') return -5;
    return 0;
  },

  // Click handler for the clickable regions on the 3D BattleMech sprites
  onRegionClick(side, loc) {
    if (side === 'enemy') {
      if (this.turn !== 'player' || this.battleOver) return;
      this.aimTarget = (this.aimTarget === loc) ? 'General' : loc;
    } else {
      this.selectedPlayerPart = (this.selectedPlayerPart === loc) ? null : loc;
    }
    this.render();
  },

  closePartReadout() {
    this.selectedPlayerPart = null;
    this.render();
  },

  getPlayerWeapons(mech) {
    const weapons = [];
    if (mech && mech.locations) {
      Object.entries(mech.locations).forEach(([loc, compIds]) => {
        (compIds || []).forEach(cId => {
          const comp = window.GameState.getComponent(cId);
          if (comp && (comp.cat === 'Energy Weapons' || comp.cat === 'Ballistic Weapons' || comp.cat === 'Missile Weapons' || comp.cat === 'Close Combat')) {
            const isMeleeWeapon = (comp.cat === 'Close Combat' || comp.range === 1 || comp.id === 'paxe' || comp.id === 'vsword' || comp.name.toLowerCase().includes('axe') || comp.name.toLowerCase().includes('blade') || comp.name.toLowerCase().includes('sword'));
            weapons.push({
              id: comp.id,
              name: comp.name,
              cat: comp.cat.replace(' Weapons', ''),
              damage: comp.damage || comp.dmg || (comp.heat ? Math.round(comp.heat * 1.4) : 14),
              accMod: isMeleeWeapon ? (comp.accMod || 16) : (comp.accMod || 0),
              ammo: comp.ammoMax ? (comp.ammo ?? comp.ammoMax) : null,
              loc: loc,
              isMelee: isMeleeWeapon,
              requiresApproach: isMeleeWeapon
            });
          }
        });
      });
    }

    if (!weapons.length) {
      weapons.push(
        { id: 'w-ppc', name: 'Particle Projector Cannon (PPC)', cat: 'Energy', damage: 24, accMod: 0, ammo: null, loc: 'RA' },
        { id: 'w-lrm', name: 'LRM-10 Missile Launcher', cat: 'Missile', damage: 16, accMod: 5, ammo: 8, loc: 'LT' },
        { id: 'w-laser', name: 'Twin Medium Pulse Lasers', cat: 'Energy', damage: 14, accMod: 6, ammo: null, loc: 'LA' },
        { id: 'w-ac', name: 'Rotary Autocannon RAC/5', cat: 'Ballistic', damage: 18, accMod: 2, ammo: 12, loc: 'RT' }
      );
    }

    // Physical Melee Attacks when in an Approached State (Punch LA/RA, Kick LL/RL)
    if (this.isCloseRange) {
      const tons = mech?.weightTons || 50;
      const punchDmg = Math.max(12, Math.round(tons * 0.3));
      const kickDmg = Math.max(18, Math.round(tons * 0.5));

      weapons.push(
        {
          id: 'phys-punch-la',
          name: '🥊 Punch (Left Arm)',
          shortName: 'Punch (LA)',
          cat: 'Physical',
          damage: punchDmg,
          accMod: 16,
          ammo: null,
          loc: 'LA',
          isPhysical: true,
          physType: 'punch'
        },
        {
          id: 'phys-punch-ra',
          name: '🥊 Punch (Right Arm)',
          shortName: 'Punch (RA)',
          cat: 'Physical',
          damage: punchDmg,
          accMod: 16,
          ammo: null,
          loc: 'RA',
          isPhysical: true,
          physType: 'punch'
        },
        {
          id: 'phys-kick-ll',
          name: '🦵 Kick (Left Leg)',
          shortName: 'Kick (LL)',
          cat: 'Physical',
          damage: kickDmg,
          accMod: 14,
          ammo: null,
          loc: 'LL',
          isPhysical: true,
          physType: 'kick'
        },
        {
          id: 'phys-kick-rl',
          name: '🦵 Kick (Right Leg)',
          shortName: 'Kick (RL)',
          cat: 'Physical',
          damage: kickDmg,
          accMod: 14,
          ammo: null,
          loc: 'RL',
          isPhysical: true,
          physType: 'kick'
        }
      );
    }

    return weapons;
  },

  calcHitChance(weapon, isPlayer = true, aimLoc = 'General') {
    const st = window.GameState.data;
    const jock = this.getActiveCombatJock();
    let hit = 72;

    if (isPlayer) {
      if (weapon?.isPhysical || weapon?.isMelee || weapon?.cat === 'Close Combat') {
        // Melee weapons require Approached state (range: 1)
        if (weapon?.isMelee && !this.isCloseRange) {
          return 0;
        }
        // High hit probability for close-combat melee physical attacks & melee weapons
        hit = 84;
        const meleeSkill = jock?.skills?.['Close Combat'] || jock?.skills?.piloting || 50;
        hit += Math.round((meleeSkill - 50) * 0.3);
        hit += (weapon?.accMod || 16);
      } else {
        const gunnery = jock?.skills?.gunnery || jock?.skills?.['Energy Weapons'] || 50;
        hit += Math.round((gunnery - 50) * 0.4);
        hit += (weapon?.accMod || 0);
      }

      // Chassis Affinity Comfort Modifier
      const mech = jock ? st.mechs?.find(m => m.id === jock.assignedMechId) : st.mechs?.[0];
      if (mech && jock) {
        const tpl = window.GameState.getMechTemplate(mech);
        const wClass = tpl ? tpl.weightClass : 'Medium';
        window.GameState.ensureJockAffinity(jock);
        const rating = jock.affinity?.[wClass] ?? 20;
        const affTier = window.GameState.getAffinityTier(rating);
        hit += (affTier.hitBonus || 0);
      }

      // Aimed Shot Modifiers
      hit += this.getAimModifier(aimLoc);

      // Enemy Posture & Stance
      if (this.enemyFallen) hit += 20;
      if (this.playerFallen) hit -= 20;
      if (this.enemyStance === 'evasive') hit -= 20;
      if (this.sensorLockTurns > 0) hit += 15;
      if (this.isCloseRange) hit += 10;
    } else {
      if (weapon?.isPhysical || weapon?.isMelee || weapon?.cat === 'Close Combat') {
        if (weapon?.isMelee && !this.isCloseRange) return 0;
        hit = 82;
        hit += (weapon?.accMod || 14);
      } else {
        hit = this.enemy?.hit || 68;
      }

      // Pilot Chassis Mastery Evasion Bonus (e.g. Apex Specialist)
      const mech = jock ? st.mechs?.find(m => m.id === jock.assignedMechId) : st.mechs?.[0];
      if (mech && jock) {
        const tpl = window.GameState.getMechTemplate(mech);
        const wClass = tpl ? tpl.weightClass : 'Medium';
        window.GameState.ensureJockAffinity(jock);
        const rating = jock.affinity?.[wClass] ?? 20;
        const affTier = window.GameState.getAffinityTier(rating);
        if (affTier.evadeBonus) hit -= affTier.evadeBonus;
      }

      if (this.enemyFallen) hit -= 20;
      if (this.playerFallen) hit += 20;
      if (this.playerStance === 'evasive') hit -= 25;
      if (this.playerStance === 'braced') hit -= 5;
      if (this.isCloseRange) hit += 5;
    }

    return Math.max(15, Math.min(95, Math.round(hit)));
  },

  // Calculates fall chance on a missed kick, factoring in Titan Affinity, Close Combat, and Piloting skills
  calcKickFallChance(isPlayer = true) {
    if (isPlayer) {
      const st = window.GameState?.data;
      const jock = this.getActiveCombatJock();
      const piloting = jock?.skills?.piloting || 50;
      const closeCombat = jock?.skills?.['Close Combat'] || jock?.skills?.closeCombat || 50;
      const mech = jock ? st?.mechs?.find(m => m.id === jock.assignedMechId) : st?.mechs?.[0];
      const tpl = window.GameState?.getMechTemplate(mech);
      const wClass = tpl ? tpl.weightClass : (mech?.weight || 'Medium');
      if (jock && window.GameState?.ensureJockAffinity) window.GameState.ensureJockAffinity(jock);
      const affinityRating = jock?.affinity?.[wClass] ?? 20;

      // Base 50% risk when over-extending a missed multi-ton kick
      const pilotingMod = Math.round((piloting - 50) * 0.4);
      const combatMod = Math.round((closeCombat - 50) * 0.3);
      const affinityMod = Math.round((affinityRating - 20) * 0.3);

      let fallChance = 50 - pilotingMod - combatMod - affinityMod;
      if (this.playerStance === 'braced') {
        fallChance = Math.round(fallChance * 0.5); // Braced hydraulics stabilize gyro
      }

      return {
        fallChance: Math.max(5, Math.min(80, Math.round(fallChance))),
        piloting,
        closeCombat,
        affinityRating,
        wClass
      };
    } else {
      const enemyPiloting = this.enemy?.piloting || 50;
      const enemyAffinity = this.enemy?.affinity || 30;
      const pilotingMod = Math.round((enemyPiloting - 50) * 0.4);
      const affinityMod = Math.round((enemyAffinity - 20) * 0.3);
      let fallChance = 50 - pilotingMod - affinityMod;
      return {
        fallChance: Math.max(5, Math.min(80, Math.round(fallChance))),
        piloting: enemyPiloting,
        closeCombat: 50,
        affinityRating: enemyAffinity,
        wClass: this.enemy?.weight || 'Medium'
      };
    }
  },

  spawnDamagePopup(text, isPlayer = false, isCrit = false) {
    const id = 'pop-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const x = isPlayer ? (20 + Math.random() * 12) : (72 + Math.random() * 10);
    const y = isPlayer ? (38 + Math.random() * 12) : (22 + Math.random() * 12);
    const color = isCrit ? '#facc15' : (isPlayer ? '#f87171' : '#38bdf8');
    this.damagePopups.push({ id, text, x, y, color });
    setTimeout(() => {
      this.damagePopups = this.damagePopups.filter(p => p.id !== id);
      this.render();
    }, 1300);
  },

  executePlayerAttack(weaponIndex = 0) {
    if (this.turn !== 'player' || this.contractWon || this.contractLost || this.battleOver) return;
    const st = window.GameState.data;
    const jock = this.getActiveCombatJock();
    const mech = jock ? st.mechs.find(m => m.id === jock.assignedMechId) : st.mechs[0];
    const weapons = this.getPlayerWeapons(mech);
    const weapon = weapons[weaponIndex] || weapons[0];
    if (!weapon) return;

    // Melee weapons require an "Approached" state
    if (weapon.isMelee && !this.isCloseRange) {
      alert(`Out of Melee Reach: ${weapon.name} requires your Mech to be in an "Approached" state! Use the 'Approach' tactic in Box 2 to close the distance first.`);
      return;
    }

    this.turn = 'animating';
    this.battleStats.shotsFired++;

    // Ammo
    if (typeof weapon.ammo === 'number') {
      weapon.ammo = Math.max(0, weapon.ammo - 1);
    }

    const hitChance = this.calcHitChance(weapon, true, this.aimTarget);
    const roll = Math.floor(Math.random() * 100) + 1;
    const isHit = (roll <= hitChance);

    // Audio SFX
    if (window.SoundFX && typeof window.SoundFX.playWeaponShot === 'function') {
      window.SoundFX.playWeaponShot(weapon, isHit);
    }

    // Trigger Firing Beam Animation
    this.activeBeam = {
      type: (window.SoundFX?.classifyWeapon(weapon) || 'energy'),
      from: this.isCloseRange ? { x: 44, y: 52 } : { x: 36, y: 50 },
      to: this.isCloseRange ? { x: 68, y: 44 } : { x: 80, y: 36 }
    };
    this.render();

    setTimeout(() => {
      this.activeBeam = null;
      if (isHit) {
        this.battleStats.shotsHit++;
        let rawDmg = Math.round((weapon.damage || 16) * (0.85 + Math.random() * 0.3));
        const enemyDR = this.enemy.damageReductionPct || 0;
        const armorAbsorbed = Math.round(rawDmg * (enemyDR / 100));
        let dmg = Math.max(1, rawDmg - armorAbsorbed);

        if (this.enemyStance === 'braced') {
          dmg = Math.max(1, Math.round(dmg * 0.6));
        }
        this.battleStats.damageDealt += dmg;

        // Determine hit location
        const locChart = ['HD', 'CT', 'CT', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
        let loc;
        if (this.aimTarget !== 'General' && Math.random() < 0.65) {
          loc = this.aimTarget;
        } else if (weapon.isPhysical && weapon.physType === 'punch') {
          const punchLocs = ['HD', 'CT', 'CT', 'LT', 'RT', 'LA', 'RA'];
          loc = punchLocs[Math.floor(Math.random() * punchLocs.length)];
        } else if (weapon.isPhysical && weapon.physType === 'kick') {
          const kickLocs = ['LL', 'LL', 'RL', 'RL', 'CT'];
          loc = kickLocs[Math.floor(Math.random() * kickLocs.length)];
        } else {
          loc = locChart[Math.floor(Math.random() * locChart.length)];
        }
        if (!this.enemy.armor[loc]) loc = 'CT';

        this.enemy.armor[loc] = Math.max(0, this.enemy.armor[loc] - dmg);
        const isCrit = (Math.random() < 0.22);
        const critText = isCrit ? ' [CRITICAL!]' : '';
        const drText = enemyDR > 0 ? ` (absorbed ${armorAbsorbed} DMG via Hostile Armor Rating ${this.enemy.armorRating} [-${enemyDR}% DR])` : '';

        if (weapon.physType === 'punch') {
          this.log(`MELEE PUNCH: ${jock ? jock.callsign : 'Pilot'} landed a heavy ${weapon.name} across ${this.enemy.name}'s ${loc}! Impact dealt ${dmg} DMG${drText}${critText}. (Hit Roll ${roll} <= ${hitChance}%)`, 'player');
        } else if (weapon.physType === 'kick') {
          this.log(`HEAVY KICK: ${jock ? jock.callsign : 'Pilot'} drove a brutal ${weapon.name} into ${this.enemy.name}'s ${loc}! Direct Hit for ${dmg} DMG${drText}${critText}. (Hit Roll ${roll} <= ${hitChance}%)`, 'player');
        } else if (weapon.isMelee) {
          this.log(`MELEE WEAPON STRIKE: ${jock ? jock.callsign : 'Pilot'} swung ${weapon.name} into ${this.enemy.name}'s ${loc}! Brutal Direct Hit for ${dmg} DMG${drText}${critText}. (Hit Roll ${roll} <= ${hitChance}%)`, 'player');
        } else {
          this.log(`${jock ? jock.callsign : 'Pilot'} fired ${weapon.name} at ${loc}! Direct Hit for ${dmg} DMG${drText}${critText}. (Hit Roll ${roll} <= ${hitChance}%)`, 'player');
        }
        this.spawnDamagePopup(`-${dmg} [${loc}]${critText}`, false, isCrit);

        // --- Kick Knockdown Check (Heavy brawling kicks can trip/topple mechs) ---
        if (weapon.physType === 'kick' && !this.enemyFallen) {
          const kickTripRoll = Math.floor(Math.random() * 100) + 1;
          if (kickTripRoll <= 35) {
            this.enemyFallen = true;
            if (window.SoundFX && typeof window.SoundFX.playMechFall === 'function') window.SoundFX.playMechFall();
            this.log(`KICK KNOCKDOWN: The staggering impact of the ${weapon.name} toppled ${this.enemy.name} to the ground (PRONE)! (Trip Roll ${kickTripRoll} <= 35%)`, 'crit');
            this.spawnDamagePopup('KNOCKDOWN (PRONE)!', false, true);
          }
        }

        // --- Leg Damage Knockdown Check (50% reduced fall rate table) ---
        if ((loc === 'LL' || loc === 'RL') && !this.enemyFallen) {
          const legMax = this.enemy.maxArmor[loc] || 38;
          const legCur = this.enemy.armor[loc];
          const legPct = (legCur / legMax) * 100;
          let fallChance = 0;
          if (this.enemy.armor.LL <= 0 && this.enemy.armor.RL <= 0) {
            fallChance = 50;
          } else if (legCur <= 0) {
            fallChance = 40;
          } else if (legPct < 25) {
            fallChance = 25;
          } else if (legPct <= 50) {
            fallChance = 10;
          } else {
            fallChance = 0;
          }

          if (fallChance > 0) {
            const fallRoll = Math.floor(Math.random() * 100) + 1;
            if (fallRoll <= fallChance) {
              this.enemyFallen = true;
              if (window.SoundFX && typeof window.SoundFX.playMechFall === 'function') window.SoundFX.playMechFall();
              this.log(`KNOCKDOWN: Severe leg damage caused ${this.enemy.name} to lose gyro balance and collapse to the ground (PRONE)! (Fall Roll ${fallRoll} <= ${fallChance}%)`, 'crit');
              this.spawnDamagePopup('KNOCKDOWN (PRONE)!', false, true);
            }
          }
        }

        // --- Enemy Victory Checks ---
        if (this.enemy.armor.HD <= 0) {
          this.log(`DECAPITATION! Enemy Cockpit canopy obliterated by ${weapon.name}! Hostile neutralized!`, 'crit');
          this.finishBattle('VICTORY', 'Enemy Cockpit Decapitation', 'HD', weapon.name);
          return;
        }
        if (this.enemy.armor.CT <= 0) {
          this.log(`REACTOR CORE BREACH! ${this.enemy.name}'s Center Torso pierced! Massive explosion neutralizes hostile!`, 'crit');
          this.finishBattle('VICTORY', 'Reactor Core Breach', 'CT', weapon.name);
          return;
        }
        if (this.enemy.armor.LL <= 0 && this.enemy.armor.RL <= 0) {
          this.log(`MOBILITY KILL! Both legs severed! ${this.enemy.name} incapacitated on the battlefield!`, 'crit');
          this.finishBattle('VICTORY', 'Total Mobility Kill (Both Legs Severed)', 'MOBILITY', weapon.name);
          return;
        }

      } else {
        if (weapon?.physType === 'kick' || weapon?.name?.toLowerCase().includes('kick')) {
          const { fallChance, piloting, closeCombat, affinityRating, wClass } = this.calcKickFallChance(true);
          const fallRoll = Math.floor(Math.random() * 100) + 1;
          if (!this.playerFallen && fallRoll <= fallChance) {
            this.playerFallen = true;
            this.shaking = true;
            setTimeout(() => { this.shaking = false; this.render(); }, 400);
            if (window.SoundFX && typeof window.SoundFX.playMechFall === 'function') window.SoundFX.playMechFall();
            this.log(`MISSED KICK OVERBALANCE: ${jock ? jock.callsign : 'Pilot'}'s ${weapon.name} missed! Overextended leg actuators caused the Titan to lose gyro balance and collapse (PRONE)! (Fall Roll ${fallRoll} <= ${fallChance}% | Piloting: ${piloting}, Close Combat: ${closeCombat}, ${wClass} Affinity: ${affinityRating}%)`, 'crit');
            this.spawnDamagePopup('FELL (PRONE)!', true, true);
          } else {
            this.log(`KICK RECOVERY: ${jock ? jock.callsign : 'Pilot'}'s ${weapon.name} missed, but gyro compensation and chassis mastery kept the Titan upright! (Roll ${fallRoll} > ${fallChance}% | Piloting: ${piloting}, Close Combat: ${closeCombat}, ${wClass} Affinity: ${affinityRating}%)`, 'player');
            this.spawnDamagePopup('BALANCE RECOVERED', true, false);
          }
        } else {
          this.log(`${jock ? jock.callsign : 'Pilot'} fired ${weapon.name} but missed! (Roll ${roll} > ${hitChance}%)`, 'player');
          this.spawnDamagePopup('MISS!', false, false);
        }
      }

      this.render();

      setTimeout(() => {
        if (!this.contractWon && !this.contractLost && !this.battleOver) {
          this.onPlayerActionComplete();
        }
      }, 1100);

    }, 350);
  },

  executePlayerDefend(stance) {
    if (this.turn !== 'player' || this.contractWon || this.contractLost || this.battleOver) return;
    this.turn = 'animating';

    if (stance === 'brace') {
      this.playerStance = 'braced';
      this.log(`DEFENSIVE BRACE: Hydraulics locked! Next incoming damage reduced by 40% (+50% Gyro stability against falls).`, 'player');
    } else {
      this.playerStance = 'twisted';
      this.log(`TORSO TWIST: Armor presentation angled to deflect incoming projectiles away from vulnerable core.`, 'player');
    }

    this.render();

    setTimeout(() => {
      if (!this.contractWon && !this.contractLost && !this.battleOver) {
        this.onPlayerActionComplete();
      }
    }, 900);
  },

  executePlayerTactic(tacticKey) {
    if (this.turn !== 'player' || this.contractWon || this.contractLost || this.battleOver) return;

    if (tacticKey === 'approach') {
      if (this.playerFallen) {
        alert("Cannot approach while your Titan is prone! Stand up first.");
        return;
      }
      if (this.isCloseRange) {
        alert("Mechs have already closed the distance! Use 'Separate' to disengage.");
        return;
      }
      this.turn = 'animating';
      this.walkDirection = 'forward';
      this.isWalking = true;
      this.isCloseRange = true;

      if (window.SoundFX && typeof window.SoundFX.playMechMarch === 'function') {
        window.SoundFX.playMechMarch();
      }

      this.log(`APPROACH MANEUVER: Actuators power forward! Closing distance into Point-Blank Brawling Range (+10% Hit Accuracy).`, 'player');
      this.spawnDamagePopup('APPROACHING!', true, true);

      this.render();

      setTimeout(() => {
        this.isWalking = false;
        this.render();
        if (!this.contractWon && !this.contractLost && !this.battleOver) {
          this.onPlayerActionComplete();
        }
      }, 1400);
      return;
    }

    if (tacticKey === 'separate' || tacticKey === 'seperate' || tacticKey === 'fall_back') {
      if (this.playerFallen) {
        alert("Cannot separate while your Titan is prone! Stand up first.");
        return;
      }
      if (!this.isCloseRange) {
        alert("Mechs are already separated at normal standoff distance!");
        return;
      }
      this.turn = 'animating';
      this.walkDirection = 'backward';
      this.isWalking = true;
      this.isCloseRange = false;

      if (window.SoundFX && typeof window.SoundFX.playMechMarch === 'function') {
        window.SoundFX.playMechMarch();
      }

      this.log(`TACTICAL SEPARATION: Reverse actuators engaged! Mechs walk backwards with animation and return to normal standoff distance.`, 'player');
      this.spawnDamagePopup('SEPARATING!', true, false);

      this.render();

      setTimeout(() => {
        this.isWalking = false;
        this.render();
        if (!this.contractWon && !this.contractLost && !this.battleOver) {
          this.onPlayerActionComplete();
        }
      }, 1400);
      return;
    }

    if (tacticKey === 'stand_up') {
      if (!this.playerFallen) {
        alert("Your Titan is already upright!");
        return;
      }
      this.turn = 'animating';
      const st = window.GameState.data;
      const jock = this.getActiveCombatJock();
      const piloting = jock?.skills?.piloting || 50;
      const standChance = Math.min(90, Math.max(30, piloting + 20));
      const roll = Math.floor(Math.random() * 100) + 1;

      if (roll <= standChance) {
        this.playerFallen = false;
        this.log(`RECOVERY: ${jock ? jock.callsign : 'Pilot'} successfully righted the Titan! Posture restored to UPRIGHT! (Roll ${roll} <= ${standChance}%)`, 'player');
        this.spawnDamagePopup('UPRIGHT!', true, true);
      } else {
        this.log(`RECOVERY FAILED: Actuators groaned under chassis weight. Titan remains PRONE! (Roll ${roll} > ${standChance}%)`, 'hostile');
      }

      this.render();
      setTimeout(() => {
        if (!this.contractWon && !this.contractLost && !this.battleOver) this.onPlayerActionComplete();
      }, 1000);
      return;
    }

    if (tacticKey === 'evasion') {
      this.turn = 'animating';
      this.playerStance = 'evasive';
      this.log(`EVASIVE JINK: Jump jets & sprint thrusters engaged! +30% Evasion against hostile attacks next turn.`, 'player');
      this.render();
      setTimeout(() => {
        if (!this.contractWon && !this.contractLost && !this.battleOver) this.onPlayerActionComplete();
      }, 900);
      return;
    }

    if (tacticKey === 'sensor_lock') {
      this.turn = 'animating';
      this.sensorLockTurns = 2;
      this.log(`TACTICAL SCAN: Target structural telemetry acquired! Target internal weaknesses tagged (+15% Hit Chance for 2 turns).`, 'player');
      this.render();
      setTimeout(() => {
        if (!this.contractWon && !this.contractLost && !this.battleOver) this.onPlayerActionComplete();
      }, 900);
      return;
    }

    if (tacticKey === 'snipe') {
      this.commandTab = 'attack';
      this.aimTarget = 'HD';
      this.render();
    }
  },

  executePlayerRetreat() {
    if (confirm("Tactical Retreat: Deploy smoke screen and withdraw from the combat arena?")) {
      this.finishBattle('RETREAT', 'Tactical Field Withdrawal under Smoke', 'RETREAT', null);
    }
  },

  runEnemyTurn() {
    if (this.battleOver) return;
    this.turn = 'enemy';
    this.render();

    setTimeout(() => {
      if (this.battleOver) return;
      const st = window.GameState.data;
      const jock = this.getActiveCombatJock();
      const mech = jock ? st.mechs.find(m => m.id === jock.assignedMechId) : st.mechs[0];

      // Enemy Prone Recovery
      if (this.enemyFallen) {
        const recoverRoll = Math.random();
        if (recoverRoll < 0.65) {
          this.enemyFallen = false;
          this.log(`ENEMY RECOVERY: ${this.enemy.name} engaged hydraulic lifters and stood back up! (UPRIGHT)`, 'hostile');
          this.spawnDamagePopup('ENEMY UPRIGHT', false, false);
          this.render();
          this.onEnemyActionComplete();
          return;
        } else {
          this.log(`ENEMY STUMBLED: ${this.enemy.name} failed to regain balance and remains PRONE!`, 'player');
        }
      }

      // Enemy Attack
      const allWeapons = this.enemy.weapons || [
        { name: 'Heavy Cannon', cat: 'Ballistic', dmg: this.enemy.dmg, accMod: 0 }
      ];
      const validWeapons = allWeapons.filter(w => !w.isMelee || this.isCloseRange);
      const weapons = validWeapons.length ? validWeapons : allWeapons;
      const weapon = weapons[Math.floor(Math.random() * weapons.length)];

      const hitChance = this.calcHitChance(weapon, false);
      const roll = Math.floor(Math.random() * 100) + 1;
      const isHit = (roll <= hitChance);

      // Audio & Beam VFX
      if (window.SoundFX && typeof window.SoundFX.playIncomingShot === 'function') {
        window.SoundFX.playIncomingShot(isHit);
      }
      this.activeBeam = {
        type: (window.SoundFX?.classifyWeapon(weapon) || 'ballistic'),
        from: this.isCloseRange ? { x: 68, y: 44 } : { x: 80, y: 36 },
        to: this.isCloseRange ? { x: 42, y: 54 } : { x: 30, y: 52 }
      };
      this.render();

      setTimeout(() => {
        this.activeBeam = null;
        if (isHit) {
          this.shaking = true;
          setTimeout(() => { this.shaking = false; this.render(); }, 400);

          let rawDmg = Math.round((weapon.dmg || this.enemy.dmg) * (0.85 + Math.random() * 0.3));
          const playerDR = this.playerDamageReductionPct || 0;
          const armorAbsorbed = Math.round(rawDmg * (playerDR / 100));
          let dmg = Math.max(1, rawDmg - armorAbsorbed);

          if (this.playerStance === 'braced') {
            dmg = Math.max(1, Math.round(dmg * 0.6));
          }
          this.battleStats.damageTaken += dmg;

          // Hit location on player mech
          const locChart = ['HD', 'CT', 'CT', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
          const loc = locChart[Math.floor(Math.random() * locChart.length)];

          if (mech && mech.armor) {
            mech.armor[loc] = Math.max(0, (mech.armor[loc] || 30) - dmg);
          }

          const drText = playerDR > 0 ? ` (absorbed ${armorAbsorbed} DMG via Titan Armor Rating ${this.playerArmorRating} [-${playerDR}% DR])` : '';
          this.log(`HOSTILE IMPACT: ${this.enemy.name} fired ${weapon.name} at your ${loc}! Direct Hit for ${dmg} DMG${drText}!`, 'hostile');
          this.spawnDamagePopup(`-${dmg} [${loc}]`, true, true);

          // --- Cockpit Head Injury & Decapitation Checks ---
          if (loc === 'HD' && jock && !jock.isDead) {
            const concRoll = Math.floor(Math.random() * 100) + 1;
            if (concRoll <= 40) {
              const hpLoss = Math.floor(Math.random() * 16) + 10;
              jock.health = Math.max(5, jock.health - hpLoss);
              if (jock.health < 25) {
                jock.medicallyDisabled = true;
                jock.status = 'Medically Disabled';
              }
              if (window.SoundFX && typeof window.SoundFX.playCockpitConcussion === 'function') {
                window.SoundFX.playCockpitConcussion();
              }
              this.log(`COCKPIT TRAUMA: Canopy shaken violently! ${jock.callsign} suffers head concussion (-${hpLoss} HP, Health: ${jock.health}%)!`, 'hostile');
              this.spawnDamagePopup(`PILOT INJURY -${hpLoss} HP!`, true, true);
            }

            // Head Destruction / Decapitation
            if (mech.armor.HD <= 0) {
              const fatalRoll = Math.floor(Math.random() * 100) + 1;
              const surv = jock.skills?.survival || 50;
              const fatalChance = Math.max(25, 75 - Math.round(surv * 0.4));
              if (fatalRoll <= fatalChance) {
                jock.isDead = true;
                jock.health = 0;
                jock.status = 'KIA';
                this.log(`FATAL COCKPIT BREACH: Titan head decapitated! Cockpit canopy crushed. Pilot ${jock.callsign} is KILLED IN ACTION!`, 'hostile');
                this.finishBattle('DEFEAT', 'Fatal Cockpit Decapitation', 'HEAD_KIA', weapon.name);
                return;
              } else {
                this.log(`EMERGENCY EJECTION: Titan head decapitated, but ${jock.callsign} successfully triggered the ejection pod and survived!`, 'system');
                this.finishBattle('DEFEAT', 'Cockpit Decapitated — Emergency Ejection Pod Cleared', 'HEAD_EJECT', weapon.name);
                return;
              }
            }
          }

          // --- Center Torso Core Breach ---
          if (mech && mech.armor && mech.armor.CT <= 0) {
            this.log(`REACTOR CORE CRITICAL! Center torso breached! Reactor containment failed!`, 'hostile');
            this.finishBattle('DEFEAT', 'Reactor Core Critical Breach', 'CORE_BREACH', weapon.name);
            return;
          }

          // --- Player Leg Damage Knockdown Check (50% reduced fall rate table) ---
          if ((loc === 'LL' || loc === 'RL') && !this.playerFallen) {
            const legMax = (mech?.maxArmorCurrent?.[loc] || 38);
            const legCur = (mech?.armor?.[loc] || 0);
            const legPct = (legCur / legMax) * 100;
            let fallChance = 0;
            if ((mech?.armor?.LL || 0) <= 0 && (mech?.armor?.RL || 0) <= 0) {
              fallChance = 50;
            } else if (legCur <= 0) {
              fallChance = 40;
            } else if (legPct < 25) {
              fallChance = 25;
            } else if (legPct <= 50) {
              fallChance = 10;
            } else {
              fallChance = 0;
            }

            if (fallChance > 0) {
              const gyroResist = this.playerStance === 'braced' ? 25 : 0;
              const pilotingMod = Math.round(((jock?.skills?.piloting || 50) - 50) * 0.3);
              const finalFallChance = Math.max(5, fallChance - gyroResist - pilotingMod);
              const fallRoll = Math.floor(Math.random() * 100) + 1;

              if (fallRoll <= finalFallChance) {
                this.playerFallen = true;
                if (window.SoundFX && typeof window.SoundFX.playMechFall === 'function') window.SoundFX.playMechFall();
                this.log(`CRITICAL INSTABILITY: Heavy strike to ${loc}! Your Titan LOSES GYRO BALANCE AND FALLS PRONE! (Fall Roll ${fallRoll} <= ${finalFallChance}%)`, 'hostile');
                this.spawnDamagePopup('DOWNED (PRONE)!', true, true);
              }
            }
          }

        } else {
          if (weapon?.physType === 'kick' || weapon?.name?.toLowerCase().includes('kick')) {
            const { fallChance, piloting, affinityRating } = this.calcKickFallChance(false);
            const fallRoll = Math.floor(Math.random() * 100) + 1;
            if (!this.enemyFallen && fallRoll <= fallChance) {
              this.enemyFallen = true;
              if (window.SoundFX && typeof window.SoundFX.playMechFall === 'function') window.SoundFX.playMechFall();
              this.log(`ENEMY KICK OVERBALANCE: ${this.enemy.name} whiffed their kick, lost gyro footing, and crashed to the ground (PRONE)! (Fall Roll ${fallRoll} <= ${fallChance}%)`, 'player');
              this.spawnDamagePopup('ENEMY FELL (PRONE)!', false, true);
            } else {
              this.log(`HOSTILE MISSED: ${this.enemy.name}'s kick missed, but the hostile caught their balance!`, 'player');
              this.spawnDamagePopup('EVADED!', true, false);
            }
          } else {
            this.log(`HOSTILE MISSED: ${this.enemy.name}'s ${weapon.name} sailed harmlessly past your Titan!`, 'player');
            this.spawnDamagePopup('EVADED!', true, false);
          }
        }

        this.onEnemyActionComplete();
      }, 350);

    }, 600);
  },

  endRound() {
    if (this.battleOver || this.contractWon || this.contractLost) return;
    const st = window.GameState.data;
    const jock = this.getActiveCombatJock();
    const mech = jock ? st.mechs.find(m => m.id === jock.assignedMechId) : st.mechs[0];
    if (this.sensorLockTurns > 0) this.sensorLockTurns--;

    this.playerStance = 'normal';
    this.enemyStance = 'normal';

    this.round++;
    this.battleStats.rounds = this.round;

    if (this.firstTurn === 'player') {
      this.turn = 'player';
      this.render();
    } else {
      this.turn = 'enemy';
      this.render();
      setTimeout(() => {
        if (!this.battleOver && !this.contractWon && !this.contractLost && this.turn === 'enemy') {
          this.runEnemyTurn();
        }
      }, 800);
    }
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

    // Recon & Intelligence Officer negotiation patience buffer
    const reconOff = window.GameState.getAssignedJobJock('reconOfficer');
    this.patience = (offer.patience || 3) + (reconOff ? 1 : 0);
    this.negotiationMessage = reconOff
      ? `Recon Officer ${reconOff.callsign} intercepted corporate negotiation margins (+1 strike patience buffer). Starting patience: ${this.patience}/4!`
      : `Liaison: "${offer.client.introQuote || 'We need an experienced mercenary lance for this assignment.'}"`;
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

    // Recon & Intelligence Officer bounty bonus on victorious execution
    const reconOff = window.GameState.getAssignedJobJock('reconOfficer');
    const intelMod = reconOff ? ((window.TOS_DATA?.companyJobs || []).find(j => j.id === 'reconOfficer')?.calcModifier(reconOff)) : null;
    const intelBonus = (outcome === 'VICTORY' && intelMod) ? Math.round(bounty * (intelMod.bountyBonusPct / 100)) : 0;

    const totalPayout = outcome === 'VICTORY' ? (bounty + salvageBonus + intelBonus) : 0;
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
    let newlyRevealedTrait = null;
    if (jock) {
      if (outcome === 'VICTORY') {
        jockXpEarned = 250 + (killCode === 'HD' ? 75 : 0);
        jock.kills = (jock.kills || 0) + 1;
        jock.missions = (jock.missions || 0) + 1;
      } else if (outcome === 'DEFEAT') {
        if (jock.isDead) {
          jockXpEarned = 0;
          jock.health = 0;
          jock.status = 'KIA';
        } else {
          jockXpEarned = 75; // Survival XP
          jock.health = Math.max(10, jock.health - 25);
          jock.missions = (jock.missions || 0) + 1;
        }
      } else {
        jockXpEarned = 50; // Tactical retreat
      }
      jock.xp += jockXpEarned;
      window.GameState.ensureJockContract(jock);
      if (!jock.isDead) {
        jock.contract.fightsRemaining = Math.max(0, (jock.contract.fightsRemaining ?? jock.contract.totalFights) - 1);
      }

      const beforeAwardsCount = (jock.awards || []).length;
      this.recordBattleHistory(jock, mech, outcome === 'VICTORY' ? 'VICTORY' : 'DEFEAT', killMethod, jockXpEarned, killCode);
      newlyAwarded = (jock.awards || []).slice(beforeAwardsCount).map(a => a.title);

      // Check for newly revealed personality trait after battles 1, 4, 10, 15, 25
      newlyRevealedTrait = null;
      const milestones = window.TOS_DATA?.personalityMilestones || [1, 4, 10, 15, 25];
      if (milestones.includes(jock.missions)) {
        window.GameState.ensureJockPersonalityTraits(jock);
        const traits = window.GameState.getJockPersonalityTraitObjects(jock);
        newlyRevealedTrait = traits.find(t => t.threshold === jock.missions) || null;
      }

      // Check Medical Disability Threshold (< 25% Health)
      if (jock && !jock.isDead) {
        if (jock.health < 25) {
          jock.medicallyDisabled = true;
          jock.status = 'Medically Disabled';
        } else if (jock.health >= 100) {
          jock.medicallyDisabled = false;
          jock.status = 'Active';
        }
      }

      // Calculate Chassis Affinity Gain after using this size of Mech in battle
      let affinityProgress = null;
      if (jock && mech) {
        window.GameState.ensureJockAffinity(jock);
        const tpl = window.GameState.getMechTemplate(mech);
        const weightClass = tpl ? tpl.weightClass : 'Medium';
        let affinityGain = 0;
        if (outcome === 'VICTORY') {
          affinityGain = 4;
          if (killCode === 'HD' || (this.battleStats.shotsFired >= 3 && (this.battleStats.shotsHit / this.battleStats.shotsFired) >= 0.75)) {
            affinityGain += 1;
          }
        } else if (outcome === 'DEFEAT') {
          affinityGain = 2;
        } else {
          affinityGain = 1;
        }
        affinityProgress = window.GameState.addJockChassisAffinity(jock, weightClass, affinityGain);
        if (affinityProgress) {
          affinityProgress.mechModel = tpl ? tpl.model : 'Titan';
          affinityProgress.mechName = mech ? mech.customName : 'Titan';
        }
      }
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
        intelBonus,
        intelOfficerCallsign: reconOff ? reconOff.callsign : '',
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
        newlyAwarded,
        isDead: jock?.isDead || false,
        medicallyDisabled: jock?.medicallyDisabled || false,
        health: jock ? jock.health : 0,
        status: jock ? (jock.status || (jock.isDead ? 'KIA' : 'Active')) : 'Unknown',
        weeklyHealRate: jock ? window.GameState.calcJockWeeklyHealRate(jock) : 0,
        cmoCallsign: window.GameState.getChiefMedicalOfficer()?.callsign || 'Staff Medic',
        newlyRevealedTrait,
        affinityProgress
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
        durationSec: (this.battleStats.rounds || this.round || 1) * 15,
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
      <div class="card" style="padding:22px 26px; border:2px solid ${s.jockProgression.isDead ? '#ef4444' : 'var(--accent-red)'}; background:${s.jockProgression.isDead ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(127, 29, 29, 0.5) 50%, rgba(40, 5, 5, 0.7) 100%)' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(127, 29, 29, 0.35) 50%, rgba(69, 10, 10, 0.45) 100%)'}; box-shadow:0 0 32px rgba(239,68,68,0.4);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div style="display:flex; align-items:center; gap:18px;">
            <div style="font-size:46px; line-height:1; filter:drop-shadow(0 0 16px rgba(239,68,68,0.7));">
              ${s.jockProgression.isDead ? '&#9760;' : '&#9888;'}
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="badge red" style="font-weight:900; font-size:11px; letter-spacing:0.06em; padding:3px 10px;">${s.jockProgression.isDead ? 'FATAL CASUALTY // PILOT KIA' : 'TACTICAL CASUALTY'}</span>
                <span class="badge primary">${s.client.badge || 'CONTRACT'}</span>
              </div>
              <h1 style="font-size:32px; font-weight:900; color:#ef4444; margin:4px 0 2px 0; text-transform:uppercase; letter-spacing:0.03em; text-shadow:0 0 20px rgba(239,68,68,0.5);">
                ${s.jockProgression.isDead ? 'PILOT KILLED IN ACTION &bull; BATTLE LOST' : 'DEFEAT &bull; YOU LOST THE BATTLE'}
              </h1>
              <div style="font-size:15px; color:#fef2f2; font-weight:600;">
                Operation: <strong>${s.title}</strong> &bull; ${s.killMethod}
              </div>
              <div class="subtext" style="font-size:12px; margin-top:3px; color:${s.jockProgression.isDead ? '#fca5a5' : 'inherit'};">
                ${s.jockProgression.isDead ? `Employer: <strong>${s.client.name}</strong> &bull; Campaign Date: <strong>${s.date}</strong> &bull; ☠️ Pilot <strong>${s.jockProgression.callsign}</strong> lost in combat` : `Employer: <strong>${s.client.name}</strong> &bull; Campaign Date: <strong>${s.date}</strong> &bull; Pilot ${s.jockProgression.callsign} survived emergency ejection (${s.jockProgression.health}% HP)`}
              </div>
            </div>
          </div>
          <div style="text-align:right;">
            <button class="btn btn-secondary" style="color:var(--accent-red); border-color:var(--accent-red); font-weight:800; padding:12px 24px; font-size:15px;" onclick="BattleModule.closeSummary()">
              ${s.jockProgression.isDead ? 'Return to Memorial &rarr;' : 'Complete Debriefing &rarr;'}
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
              ${isVictory ? `Bounty: ${s.financials.baseBounty.toLocaleString()} Cr + Salvage: ${s.financials.salvageBonus.toLocaleString()} Cr (${s.financials.salvagePct}%)${s.financials.intelBonus > 0 ? ` + Intel: ${s.financials.intelBonus.toLocaleString()} Cr (${s.financials.intelOfficerCallsign})` : ''}` : `No combat bounty awarded (Mission failed)`}
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
              Titan Hull: ${s.stats.remainingArmorPct}% Structural Integrity (Armor Rating: ${this.playerArmorRating || 100})
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
                ${s.jockProgression.isDead ? `
                  <div style="background:rgba(239,68,68,0.22); border:1px solid #ef4444; border-radius:6px; padding:10px;">
                    <div style="color:#ef4444; font-weight:900; font-size:14px; display:flex; align-items:center; gap:6px;">
                      <span>&#9760;</span> KILLED IN ACTION (KIA)
                    </div>
                    <div class="subtext" style="color:#fca5a5; font-size:12px; margin-top:2px;">
                      Cockpit was compromised during battle. Pilot lost their life in service and is honored in the memorial roster.
                    </div>
                  </div>
                ` : s.jockProgression.medicallyDisabled ? `
                  <div style="background:rgba(239,68,68,0.22); border:2px solid #ef4444; border-radius:6px; padding:10px;">
                    <div style="color:#ef4444; font-weight:900; font-size:13px; display:flex; align-items:center; gap:6px;">
                      <span>&#9888;</span> MEDICALLY DISABLED // GROUNDED (&lt;25% HP)
                    </div>
                    <div class="subtext" style="color:#fca5a5; font-size:12px; margin-top:3px;">
                      Critical trauma (${s.jockProgression.health}% HP). Pilot is grounded from combat duty until healed to 100% full recovery.
                    </div>
                    <div class="subtext" style="color:#fde68a; font-size:11px; margin-top:3px;">
                      Recovery rate: <strong>+${s.jockProgression.weeklyHealRate} HP/wk</strong> (Survival + CMO <strong>${s.jockProgression.cmoCallsign}</strong>).
                    </div>
                  </div>
                ` : `
                  <div style="display:flex; justify-content:space-between;">
                    <span class="subtext">Pilot Medical Status:</span>
                    <strong style="color:${s.jockProgression.health < 40 ? '#ef4444' : (s.jockProgression.health < 75 ? '#f59e0b' : 'var(--accent-green)')};">
                      ${s.jockProgression.health < 40 ? `CRITICAL TRAUMA (${s.jockProgression.health}% HP)` : (s.jockProgression.health < 75 ? `WOUNDED (${s.jockProgression.health}% HP)` : `COMBAT READY (${s.jockProgression.health}% HP)`)}
                    </strong>
                  </div>
                `}
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
                  <span>${s.jockProgression.isDead ? 'TERMINATED (DECEASED)' : `${s.jockProgression.fightsRemaining} Fights Remaining`}</span>
                </div>

                ${s.jockProgression.affinityProgress ? `
                  <div style="background:rgba(56, 189, 248, 0.08); border:1px solid rgba(56, 189, 248, 0.3); border-radius:6px; padding:10px; margin-top:4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap;">
                      <div>
                        <strong style="color:#f8fafc; font-size:13px;">🤖 Chassis Affinity: ${s.jockProgression.affinityProgress.weightClass} Class</strong>
                        <div class="subtext mono" style="font-size:11px; color:#94a3b8;">${s.jockProgression.affinityProgress.mechModel} (${s.jockProgression.affinityProgress.mechName})</div>
                      </div>
                      <div style="display:flex; align-items:center; gap:6px;">
                        <span class="badge ${s.jockProgression.affinityProgress.tier.badgeClass} mono" style="font-size:11px;">
                          ${s.jockProgression.affinityProgress.newTier}
                        </span>
                        <span class="mono" style="font-size:13px; font-weight:800; color:var(--accent-cyan);">
                          +${s.jockProgression.affinityProgress.gain}% &rarr; ${s.jockProgression.affinityProgress.newRating}%
                        </span>
                      </div>
                    </div>
                    <div class="bar-bg" style="margin-top:6px; height:7px;">
                      <div class="bar-fill ${s.jockProgression.affinityProgress.newRating >= 80 ? 'green' : (s.jockProgression.affinityProgress.newRating >= 40 ? '' : 'amber')}" style="width:${s.jockProgression.affinityProgress.newRating}%;"></div>
                    </div>
                    ${s.jockProgression.affinityProgress.tierUpgraded ? `
                      <div style="margin-top:6px; padding:5px 8px; background:rgba(16,185,129,0.18); border:1px solid #10b981; border-radius:4px; color:#6ee7b7; font-size:11px; font-weight:800;">
                        ★ COMFORT LEVEL ADVANCEMENT: Reached [${s.jockProgression.affinityProgress.newTier}] rating in ${s.jockProgression.affinityProgress.weightClass} Titans (+${s.jockProgression.affinityProgress.tier.hitBonus}% Hit bonus)!
                      </div>
                    ` : ''}
                  </div>
                ` : ''}

                ${s.jockProgression.newlyRevealedTrait ? `
                  <div style="background:linear-gradient(135deg, rgba(168,85,247,0.22), rgba(59,130,246,0.22)); border:2px solid #a855f7; border-radius:8px; padding:12px; margin-top:6px;">
                    <div style="display:flex; align-items:flex-start; gap:10px;">
                      <span style="font-size:28px; line-height:1;">${s.jockProgression.newlyRevealedTrait.icon}</span>
                      <div style="flex:1;">
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; flex-wrap:wrap;">
                          <span class="badge purple mono" style="font-size:10px; font-weight:900;">
                            &#9733; PERSONALITY TRAIT REVEALED (BATTLE ${s.jockProgression.newlyRevealedTrait.threshold})
                          </span>
                        </div>
                        <div style="font-size:15px; font-weight:800; color:#f8fafc; margin-top:4px;">
                          ${s.jockProgression.newlyRevealedTrait.name}
                        </div>
                        <div style="font-size:12px; color:#cbd5e1; margin-top:2px;">
                          ${s.jockProgression.newlyRevealedTrait.desc}
                        </div>
                        <div class="subtext" style="color:#fde68a; font-size:11px; margin-top:4px;">
                          <strong>&#128221; Contract Tendency:</strong> ${s.jockProgression.newlyRevealedTrait.contractDesc}
                        </div>
                      </div>
                    </div>
                  </div>
                ` : ''}
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
                  <span class="subtext">Remaining Structural Integrity:</span>
                  <strong style="color:${s.stats.remainingArmorPct > 65 ? 'var(--accent-green)' : (s.stats.remainingArmorPct > 30 ? 'var(--accent-amber)' : 'var(--accent-red)')};">${s.stats.remainingArmorPct}%</strong>
                </div>
                <div class="bar-bg" style="height:10px;"><div class="bar-fill ${s.stats.remainingArmorPct > 65 ? 'green' : (s.stats.remainingArmorPct > 30 ? 'amber' : 'red')}" style="width:${s.stats.remainingArmorPct}%;"></div></div>
                <div style="display:flex; justify-content:space-between; font-size:12px;" class="subtext">
                  <span>Structural Damage Taken: ${s.stats.damageTaken} pts</span>
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
    const activeJock = jock || this.getActiveCombatJock();
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
                  ` : (activeJock && (activeJock.medicallyDisabled || activeJock.health < 25)) ? `
                    <button class="btn" style="background:#450a0a; color:#fca5a5; border:1px solid #ef4444; font-weight:800; padding:10px 16px; font-size:13px; cursor:not-allowed;" disabled title="Pilot is Medically Disabled until 100% HP">
                      &#9888; PILOT GROUNDED (${activeJock.health}% HP)
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
  getArenaBackground(contract) {
    const tId = contract?.terrain?.id || '';
    const cId = contract?.client?.id || '';
    if (cId === 'solaris') return 'assets/arenas/arena_solaris.jpg';
    if (tId === 'rubble') return 'assets/arenas/arena_industrial.jpg';
    if (tId === 'hill' || tId === 'woods' || tId === 'water') return 'assets/arenas/arena_canyon.jpg';
    if (tId === 'clear') return 'assets/arenas/arena_wasteland.jpg';
    // Dynamic fallback based on hostile weight
    const eWeight = (contract?.enemy?.weight || this.enemy?.weight || '').toLowerCase();
    if (eWeight.includes('assault')) return 'assets/arenas/arena_solaris.jpg';
    if (eWeight.includes('heavy')) return 'assets/arenas/arena_industrial.jpg';
    if (eWeight.includes('medium')) return 'assets/arenas/arena_canyon.jpg';
    return 'assets/arenas/arena_wasteland.jpg';
  },
  renderCombatArena(jock, mech, metrics) {
    if (!this.enemy) {
      this.initEncounter();
    }

    // Compute player total armor stats
    let curPlayerArmor = 0;
    let maxPlayerArmor = 0;
    ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'].forEach(loc => {
      curPlayerArmor += (mech?.armor?.[loc] ?? 30);
      maxPlayerArmor += (mech?.maxArmorCurrent?.[loc] ?? 30);
    });
    const playerArmorPct = maxPlayerArmor > 0 ? Math.round((curPlayerArmor / maxPlayerArmor) * 100) : 100;

    // Compute enemy total armor stats
    let curEnemyArmor = 0;
    let maxEnemyArmor = 0;
    ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'].forEach(loc => {
      curEnemyArmor += (this.enemy?.armor?.[loc] ?? 30);
      maxEnemyArmor += (this.enemy?.maxArmor?.[loc] ?? 30);
    });
    const enemyArmorPct = maxEnemyArmor > 0 ? Math.round((curEnemyArmor / maxEnemyArmor) * 100) : 100;

    const weapons = this.getPlayerWeapons(mech);
    const isPlayerTurn = (this.turn === 'player' && !this.battleOver);
    const bgUrl = this.getArenaBackground(this.currentContract);
    const playerWalkClass = this.isWalking ? (this.walkDirection === 'backward' ? 'walking-backward' : 'walking-forward') : '';
    const enemyWalkClass = this.isWalking ? (this.walkDirection === 'backward' ? 'walking-backward' : 'walking-forward') : '';

    return `
      <div class="jrpg-battle-container">
        
        <!-- Top Status Bar & Phase Notification -->
        <div class="card" style="padding:10px 16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; flex:1;">
            ${this.battleOver ? `
              <span class="badge ${this.contractWon ? 'green' : 'red'}" style="font-size:13px; font-weight:900; letter-spacing:0.5px; padding:6px 12px;">
                ${this.contractWon ? '🏆 ENGAGEMENT RESOLVED: VICTORY!' : '☠️ ENGAGEMENT RESOLVED: DEFEAT'}
              </span>
            ` : `
              <span class="badge ${isPlayerTurn ? 'green' : 'amber'}" style="font-size:12px; font-weight:900; letter-spacing:0.5px;">
                ROUND ${this.round} &bull; ${isPlayerTurn ? 'COMMANDER ACTION PHASE' : 'HOSTILE COMBAT PHASE'}
              </span>
              <span class="badge ${this.firstTurn === 'player' ? 'cyan' : 'amber'} mono" style="font-size:11px; font-weight:800;" title="Initiative awarded to higher mech chassis affinity">
                INITIATIVE: ${this.firstTurn === 'player' ? '★ PLAYER FIRST' : '⚠️ HOSTILE FIRST'} (${this.playerAffinity}% vs ${this.enemy.affinity}%)
              </span>
            `}
            <span class="subtext mono" style="font-size:12px;">
              Target: <strong style="color:var(--accent-red);">${this.enemy.name}</strong> (${this.enemy.weight}) &bull; Pilot: ${this.enemy.pilot}
              <span class="badge ${this.enemy.affTier?.badgeClass || 'purple'} mono" style="font-size:9px; margin-left:4px;" title="Hostile chassis affinity: ${this.enemy.affinity}%">
                Affinity: ${this.enemy.affinity}% (${this.enemy.affTier?.tier || 'Familiar'})
              </span>
            </span>
            <span class="jrpg-topbar-meter" title="Hostile structural integrity ${curEnemyArmor} / ${maxEnemyArmor}">
              <span>HOSTILE STRUCTURE ${enemyArmorPct}%</span>
              <span class="jrpg-bar-track" style="display:inline-block; width:80px; height:7px;"><span class="jrpg-bar-fill ${enemyArmorPct > 55 ? 'armor' : (enemyArmorPct > 25 ? 'armor-mid' : 'armor-low')}" style="display:block; width:${enemyArmorPct}%;"></span></span>
            </span>
            <span class="badge cyan mono" style="font-size:10px;" title="Hostile armor rating damage reduction">
              🛡️ ARMOR: ${this.enemy.armorRating} (-${this.enemy.damageReductionPct}% DR)
            </span>
            <span class="badge ${this.isCloseRange ? 'green' : 'cyan'} mono" style="font-size:10px;" title="Engagement Range">
              ${this.isCloseRange ? '⚔️ RANGE: POINT-BLANK (+10% HIT)' : '🎯 RANGE: STANDOFF'}
            </span>
            <span class="badge red mono" style="font-size:10px;">${this.enemyFallen ? 'PRONE (+20% HIT)' : 'COMBAT READY'}</span>
            <span class="badge amber mono" style="font-size:10px;">AIM: ${this.aimTarget === 'General' ? 'GENERAL' : `${this.aimTarget} (${this.getAimModifier(this.aimTarget) > 0 ? '+' : ''}${this.getAimModifier(this.aimTarget)}% HIT)`}</span>
            ${this.sensorLockTurns > 0 ? '<span class="badge purple mono" style="font-size:10px;">TACTICAL SCAN ACTIVE (+15% HIT)</span>' : ''}
          </div>
          <div style="display:flex; gap:8px;">
            ${this.battleOver ? `
              <button class="btn btn-primary" style="background:${this.contractWon ? 'var(--accent-green)' : 'var(--accent-red)'}; color:${this.contractWon ? '#000' : '#fff'}; font-weight:900; font-size:13px; padding:8px 18px; box-shadow:0 0 16px ${this.contractWon ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}; cursor:pointer;" onclick="BattleModule.proceedToDebriefing()">
                ${this.contractWon ? '🏆 Continue to Debriefing & Salvage &rarr;' : '📋 Continue to Debriefing &rarr;'}
              </button>
            ` : `
              <button class="btn btn-secondary" style="font-size:12px; padding:6px 12px; color:var(--accent-red);" onclick="BattleModule.executePlayerRetreat()">
                🏃 Retreat &larr;
              </button>
            `}
          </div>
        </div>

        <!-- FIXED 3D SIDE-ANGLE VIEWPORT (POKEMON / FINAL FANTASY STYLE) -->
        <div class="jrpg-3d-viewport ${this.shaking ? 'jrpg-shake-screen' : ''}">
          <div class="jrpg-3d-stage">
            
            <!-- Realistic Matte-Painted Arena Backdrop & Vignette -->
          <div class="jrpg-arena-bg" style="background-image: url('${bgUrl}');"></div>
          <div class="jrpg-arena-vignette"></div>

            <!-- Tilted 3D Holographic Ground Grid (Tactical AR Overlay) -->
            <div class="jrpg-3d-ground"></div>

            <!-- Player Titan (Bottom-Left Foreground, Angled Northeast) -->
            <div class="jrpg-combatant player-side ${this.isCloseRange ? 'close-range' : ''} ${playerWalkClass} ${this.playerFallen ? 'prone' : ''}">
              ${this.renderIsometricTitanSvg('player', this.playerFallen, playerArmorPct, '#38bdf8', mech)}
              <div class="jrpg-shadow"></div>
            </div>

            <!-- Enemy Titan (Top-Right Background, Angled Southwest) -->
            <div class="jrpg-combatant enemy-side ${this.isCloseRange ? 'close-range' : ''} ${enemyWalkClass} ${this.enemyFallen ? 'prone' : ''}">
              ${this.renderIsometricTitanSvg('enemy', this.enemyFallen, enemyArmorPct, '#f43f5e', this.enemy)}
              <div class="jrpg-shadow"></div>
            </div>

            <!-- Dynamic Beam / Projectile VFX Layer -->
            <svg class="jrpg-vfx-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
              ${this.activeBeam ? `
                <defs>
                  <filter id="beam-glow">
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <line x1="${this.activeBeam.from.x}" y1="${this.activeBeam.from.y}"
                      x2="${this.activeBeam.to.x}" y2="${this.activeBeam.to.y}"
                      stroke="${this.activeBeam.type === 'laser' ? '#38bdf8' : (this.activeBeam.type === 'ppc' ? '#a855f7' : (this.activeBeam.type === 'missile' ? '#f59e0b' : (this.activeBeam.type === 'melee' ? '#f97316' : '#ef4444')))}"
                      stroke-width="${this.activeBeam.type === 'melee' ? '4.5' : '2.5'}"
                      stroke-linecap="round"
                      filter="url(#beam-glow)"/>
                <circle cx="${this.activeBeam.to.x}" cy="${this.activeBeam.to.y}" r="4" fill="#ffffff" filter="url(#beam-glow)"/>
              ` : ''}
            </svg>

            <!-- Floating Arcade Damage Popups -->
            ${this.damagePopups.map(p => `
              <div class="jrpg-damage-num" style="left:${p.x}%; top:${p.y}%; color:${p.color};">
                ${p.text}
              </div>
            `).join('')}

            <!-- Battle Over Modal Overlay directly on the 3D battlefield -->
            ${this.battleOver ? `
              <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(2, 6, 23, 0.72); backdrop-filter:blur(5px); z-index:70;">
                <div class="card" style="padding:26px 36px; text-align:center; max-width:480px; border:2px solid ${this.contractWon ? 'var(--accent-green)' : 'var(--accent-red)'}; box-shadow:0 0 36px ${this.contractWon ? 'rgba(16,185,129,0.45)' : 'rgba(239,68,68,0.45)'}; background:#0f172a;">
                  <div style="font-size:44px; line-height:1; margin-bottom:10px;">${this.contractWon ? '🏆' : (this.pendingDebriefing?.outcome === 'RETREAT' ? '🏃' : '☠️')}</div>
                  <h2 style="font-size:24px; font-weight:900; color:${this.contractWon ? '#10b981' : '#ef4444'}; margin:0 0 6px 0; text-transform:uppercase; letter-spacing:0.04em;">
                    ${this.contractWon ? 'COMBAT VICTORY!' : (this.pendingDebriefing?.outcome === 'RETREAT' ? 'TACTICAL WITHDRAWAL' : 'BATTLE DEFEAT')}
                  </h2>
                  <div style="font-size:14px; color:#f8fafc; font-weight:600; margin-bottom:6px;">
                    ${this.pendingDebriefing?.killMethod || 'Combat Concluded'}
                  </div>
                  <div class="subtext" style="font-size:12px; margin-bottom:20px;">
                    Hostile: <strong>${this.enemy.name}</strong> (${this.enemy.weight}) &bull; Pilot: <strong>${jock ? jock.callsign : 'Pilot'}</strong>
                  </div>
                  <button class="btn btn-primary" style="font-size:15px; font-weight:900; padding:12px 28px; width:100%; background:${this.contractWon ? 'var(--accent-green)' : 'var(--accent-red)'}; color:${this.contractWon ? '#000' : '#fff'}; box-shadow:0 0 20px ${this.contractWon ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}; cursor:pointer;" onclick="BattleModule.proceedToDebriefing()">
                    ${this.contractWon ? '🏆 Continue to Debriefing & Salvage &rarr;' : '📋 Continue to Debriefing &rarr;'}
                  </button>
                </div>
              </div>
            ` : ''}

            <!-- Player Body-Part Condition Readout (shown when a part of our Mech is clicked) -->
            ${this.selectedPlayerPart ? this.renderPartReadout(mech) : ''}

            <!-- Player Status HUD Badge (Bottom-Center) -->
            <div class="jrpg-hud-badge player-hud">
              <div style="display:flex; gap:10px; align-items:center;">
                <div style="flex-shrink:0;">
                  ${window.GameState.getPortraitSvg(jock?.portraitId, 46)}
                </div>
                <div style="flex:1;">
                  <div class="jrpg-hud-name">
                    <span>${jock?.callsign || 'Pilot'} <small style="color:#94a3b8; font-weight:600;">(${window.GameState.getJockRank(jock).name})</small></span>
                    <span class="badge ${jock?.health < 25 ? 'red' : 'green'} mono" style="font-size:10px;">${jock?.health || 100}% HP</span>
                  </div>
                  <div style="font-size:11px; color:#cbd5e1; font-weight:600; display:flex; justify-content:space-between; align-items:center; gap:6px;">
                    <span>${mech?.customName || 'Titan Mech'}</span>
                    ${(() => {
                      const tpl = window.GameState.getMechTemplate(mech);
                      const wClass = tpl ? tpl.weightClass : 'Medium';
                      const affInfo = window.GameState.getJockChassisAffinity(jock, wClass);
                      return `<span class="badge ${affInfo.tier.badgeClass} mono" style="font-size:9px; padding:1px 6px;" title="${affInfo.tier.desc}">Comfort: ${affInfo.rating}% (${affInfo.tier.tier})</span>`;
                    })()}
                  </div>
                </div>
              </div>

              <!-- Armor Rating & Structural Integrity Bar -->
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; margin-top:6px; margin-bottom:2px;">
                <span style="color:#38bdf8; font-weight:700;">🛡️ Armor Rating: ${this.playerArmorRating}</span>
                <span class="badge cyan mono" style="font-size:10px;">-${this.playerDamageReductionPct}% DR</span>
              </div>
              <div class="jrpg-bar-container">
                <div class="jrpg-bar-label">
                  <span>Structural Integrity (Hull)</span>
                  <span>${curPlayerArmor} / ${maxPlayerArmor} (${playerArmorPct}%)</span>
                </div>
                <div class="jrpg-bar-track">
                  <div class="jrpg-bar-fill ${playerArmorPct > 55 ? 'armor' : (playerArmorPct > 25 ? 'armor-mid' : 'armor-low')}" style="width:${playerArmorPct}%;"></div>
                </div>
              </div>

              <!-- Posture & Section Paperdoll Mini -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; font-size:11px;">
                <div style="display:flex; gap:4px; flex-wrap:wrap;">
                  <span class="badge ${this.playerFallen ? 'red' : 'green'} mono" style="font-size:10px;">
                    ${this.playerFallen ? '⚠️ PRONE (DOWNED)' : 'UPRIGHT'}
                  </span>
                  ${this.playerStance !== 'normal' ? `<span class="badge primary mono" style="font-size:10px;">${this.playerStance.toUpperCase()}</span>` : ''}
                </div>
                <span class="subtext mono" style="font-size:10px;">
                  HD:${mech?.armor?.HD || 0} CT:${mech?.armor?.CT || 0} LL:${mech?.armor?.LL || 0} RL:${mech?.armor?.RL || 0}
                </span>
              </div>
            </div>

            <!-- Hostile Titan Damage Silhouette HUD (Lower-Right) -->
            ${this.renderHostileSilhouetteHud()}

          </div>
        </div>

        <!-- JRPG CLASSIC 4-BOX COMMAND & DIALOGUE CONSOLE -->
        <div class="jrpg-console">
          
          <!-- Box 1: Primary Command Categories -->
          <div class="jrpg-box">
            <div class="jrpg-box-title">Commands</div>
            ${this.battleOver ? `
              <div style="display:flex; flex-direction:column; gap:8px; height:100%; justify-content:center;">
                <button class="btn btn-primary" style="padding:14px; font-size:13px; font-weight:900; background:${this.contractWon ? 'var(--accent-green)' : 'var(--accent-red)'}; color:${this.contractWon ? '#000' : '#fff'}; box-shadow:0 0 16px ${this.contractWon ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'};" onclick="BattleModule.proceedToDebriefing()">
                  ${this.contractWon ? '🏆 Debriefing &rarr;' : '📋 Debriefing &rarr;'}
                </button>
              </div>
            ` : `
              <button class="jrpg-menu-btn ${this.commandTab === 'attack' ? 'active' : ''}" ${!isPlayerTurn ? 'disabled' : ''} onclick="BattleModule.setCommandTab('attack')">
                <span>⚔️ ATTACK</span>
                <span class="mono" style="font-size:11px;">&rarr;</span>
              </button>
              <button class="jrpg-menu-btn ${this.commandTab === 'defend' ? 'active' : ''}" ${!isPlayerTurn ? 'disabled' : ''} onclick="BattleModule.setCommandTab('defend')">
                <span>🛡️ DEFEND</span>
                <span class="mono" style="font-size:11px;">&rarr;</span>
              </button>
              <button class="jrpg-menu-btn ${this.commandTab === 'tactics' ? 'active' : ''}" ${!isPlayerTurn ? 'disabled' : ''} onclick="BattleModule.setCommandTab('tactics')">
                <span>⚡ TACTICS</span>
                <span class="mono" style="font-size:11px;">&rarr;</span>
              </button>
            `}
          </div>

          <!-- Box 2: Action Submenu (Weapons, Stances, Maneuvers) -->
          <div class="jrpg-box">
            <div class="jrpg-box-title">
              <span>${this.battleOver ? 'BATTLE OUTCOME' : `${this.commandTab.toUpperCase()} SELECTION`}</span>
              <span class="subtext mono" style="font-size:10px;">${this.battleOver ? 'ENGAGEMENT RESOLVED' : `Aim: ${this.aimTarget}`}</span>
            </div>

            ${this.battleOver ? `
              <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; height:100%; gap:8px; padding:10px;">
                <div style="font-size:16px; font-weight:900; color:${this.contractWon ? '#10b981' : '#ef4444'};">
                  ${this.contractWon ? 'VICTORY ACHIEVED!' : 'BATTLE TERMINATED'}
                </div>
                <div class="subtext" style="font-size:11px;">
                  ${this.pendingDebriefing?.killMethod || 'Combat has concluded.'} Click below to collect contract bounty, salvage components, and pilot XP.
                </div>
                <button class="btn btn-primary" style="margin-top:6px; width:100%; padding:10px; font-weight:800; font-size:13px; background:${this.contractWon ? 'var(--accent-green)' : 'var(--accent-red)'}; color:${this.contractWon ? '#000' : '#fff'}; box-shadow:0 0 16px ${this.contractWon ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}; cursor:pointer;" onclick="BattleModule.proceedToDebriefing()">
                  ${this.contractWon ? '🏆 Continue to Debriefing & Salvage &rarr;' : '📋 Continue to Debriefing &rarr;'}
                </button>
              </div>
            ` : !isPlayerTurn ? `
              <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; height:100%; gap:8px; padding:12px; background:rgba(239,68,68,0.06); border:1px dashed rgba(239,68,68,0.3); border-radius:6px;">
                <div style="font-size:20px;">⚠️</div>
                <div style="font-size:13px; font-weight:900; color:var(--accent-amber); text-transform:uppercase; letter-spacing:0.5px;">
                  Hostile Action In Progress
                </div>
                <div class="subtext mono" style="font-size:11px; max-width:260px; line-height:1.4;">
                  Hostile ${this.enemy.name} is calculating firing solution... Controls will unlock when hostile turn finishes.
                </div>
              </div>
            ` : this.commandTab === 'attack' ? `
              <div style="display:flex; flex-direction:column; gap:5px;">
                ${this.isCloseRange ? `
                  <div style="font-size:10px; font-weight:800; color:#fbbf24; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:2px; display:flex; justify-content:space-between;">
                    <span>⚔️ Close Combat &amp; Ranged Arsenal</span>
                    <span>Point-Blank</span>
                  </div>
                ` : ''}
                ${weapons.map((w, idx) => {
                  const isMeleeBlocked = (w.isMelee && !this.isCloseRange);
                  const hit = isMeleeBlocked ? 0 : this.calcHitChance(w, true, this.aimTarget);
                  const isPhys = !!w.isPhysical;
                  const isMelee = !!w.isMelee;
                  const btnDisabled = !isPlayerTurn || isMeleeBlocked;
                  return `
                    <button class="jrpg-menu-btn ${isPhys || isMelee ? 'physical-attack' : ''}" ${btnDisabled ? 'disabled' : ''} onclick="BattleModule.executePlayerAttack(${idx})" style="padding:6px 10px; font-size:12px; ${isMeleeBlocked ? 'opacity:0.55; border-style:dashed;' : ''} ${isPhys || isMelee ? 'border-color:rgba(245,158,11,0.4); background:rgba(245,158,11,0.08);' : ''}">
                      <div>
                        <div><strong>${w.name}</strong></div>
                        <div class="subtext mono" style="font-size:10px; color:${isMeleeBlocked ? '#f87171' : (isPhys || isMelee ? '#fbbf24' : '#94a3b8')};">
                          ${w.damage} DMG &bull; ${isMeleeBlocked ? '⚠️ REQUIRES APPROACHED STATE TO USE' : (w.ammo !== null ? `Ammo: ${w.ammo}` : (isPhys ? (w.physType === 'kick' ? 'Brawling Kick • Fall Risk on Miss' : 'Close Combat Punch') : (isMelee ? 'Equipped Melee Weapon' : 'Energy')))}
                        </div>
                      </div>
                      <span class="badge ${isMeleeBlocked ? 'red' : (hit >= 70 ? 'green' : (hit >= 50 ? 'amber' : 'red'))} mono" style="font-size:11px;">
                        ${isMeleeBlocked ? 'APPROACH REQ' : `${hit}%`}
                      </span>
                    </button>
                  `;
                }).join('')}
              </div>
            ` : this.commandTab === 'defend' ? `
              <div style="display:flex; flex-direction:column; gap:6px;">
                <button class="jrpg-menu-btn" ${!isPlayerTurn ? 'disabled' : ''} onclick="BattleModule.executePlayerDefend('brace')">
                  <div>
                    <div><strong>🛡️ Defensive Brace</strong></div>
                    <div class="subtext" style="font-size:11px;">Lock actuators: -40% damage &amp; +50% Gyro stability vs falling</div>
                  </div>
                </button>
                <button class="jrpg-menu-btn" ${!isPlayerTurn ? 'disabled' : ''} onclick="BattleModule.executePlayerDefend('twist')">
                  <div>
                    <div><strong>🔄 Torso Twist</strong></div>
                    <div class="subtext" style="font-size:11px;">Re-angle torso to deflect incoming shots to shielded arms</div>
                  </div>
                </button>
              </div>
            ` : this.commandTab === 'tactics' ? `
              <div style="display:flex; flex-direction:column; gap:6px;">
                ${!this.isCloseRange ? `
                  <button class="jrpg-menu-btn" ${!isPlayerTurn || this.playerFallen ? 'disabled' : ''} onclick="BattleModule.executePlayerTactic('approach')">
                    <div>
                      <div><strong>⏩ Approach (Close Distance)</strong></div>
                      <div class="subtext" style="font-size:11px;">March forward into point-blank brawling range (+10% Hit Accuracy)</div>
                    </div>
                  </button>
                ` : `
                  <button class="jrpg-menu-btn active" ${!isPlayerTurn || this.playerFallen ? 'disabled' : ''} onclick="BattleModule.executePlayerTactic('separate')" style="border-color:#38bdf8; background:rgba(56,189,248,0.15);">
                    <div>
                      <div><strong>🔙 Separate (Walk Backwards)</strong></div>
                      <div class="subtext" style="font-size:11px;">Walk backwards to return Mechs to normal distance away</div>
                    </div>
                  </button>
                `}
                <button class="jrpg-menu-btn ${this.playerFallen ? 'active' : ''}" ${!isPlayerTurn || !this.playerFallen ? 'disabled' : ''} onclick="BattleModule.executePlayerTactic('stand_up')" style="${this.playerFallen ? 'border-color:#ef4444; background:rgba(239,68,68,0.2);' : ''}">
                  <div>
                    <div><strong>🦾 Stand Up (Piloting Recovery)</strong></div>
                    <div class="subtext" style="font-size:11px;">Restore upright posture from prone position</div>
                  </div>
                </button>
                <button class="jrpg-menu-btn" ${!isPlayerTurn ? 'disabled' : ''} onclick="BattleModule.executePlayerTactic('evasion')">
                  <div>
                    <div><strong>💨 Evasive Jink Sprint</strong></div>
                    <div class="subtext" style="font-size:11px;">+30% Evasion against hostile attacks next turn</div>
                  </div>
                </button>
                <button class="jrpg-menu-btn" ${!isPlayerTurn ? 'disabled' : ''} onclick="BattleModule.executePlayerTactic('sensor_lock')">
                  <div>
                    <div><strong>📡 Sensor Lock &amp; Scan</strong></div>
                    <div class="subtext" style="font-size:11px;">Highlight structural flaws: +15% Hit Chance for 2 turns</div>
                  </div>
                </button>
                <button class="jrpg-menu-btn" ${!isPlayerTurn ? 'disabled' : ''} onclick="BattleModule.executePlayerTactic('snipe')">
                  <div>
                    <div><strong>🎯 Headhunter Snipe Stance</strong></div>
                    <div class="subtext" style="font-size:11px;">Locks targeting reticle directly onto cockpit canopy (HD)</div>
                  </div>
                </button>
              </div>
            ` : `
              <div style="padding:10px; font-size:12px; color:#94a3b8;">
                <p>Deploy defensive smoke grenades and withdraw under tactical concealment.</p>
                <button class="btn btn-secondary" style="margin-top:10px; width:100%; color:var(--accent-red);" onclick="BattleModule.executePlayerRetreat()">
                  Confirm Smoke Withdrawal &rarr;
                </button>
              </div>
            `}
          </div>

          <!-- Box 3: Target Section Aiming -->
          <div class="jrpg-box">
            <div class="jrpg-box-title">
              <span>AIM TARGET</span>
              <span class="mono" style="color:var(--accent-amber);">${this.aimTarget}</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <button class="jrpg-menu-btn ${this.aimTarget === 'General' ? 'active' : ''}" style="padding:6px 10px; font-size:11px;" ${!isPlayerTurn ? 'disabled' : ''} onclick="BattleModule.setAimTarget('General')">
                <span>[GENERAL] Standard Fire</span>
                <span class="mono" style="font-size:10px;">0%</span>
              </button>
              <button class="jrpg-menu-btn ${this.aimTarget === 'HD' ? 'active' : ''}" style="padding:6px 10px; font-size:11px;" ${!isPlayerTurn ? 'disabled' : ''} onclick="BattleModule.setAimTarget('HD')">
                <span>[HEAD] Cockpit Canopy</span>
                <span class="mono" style="font-size:10px; color:#f87171;">-24%</span>
              </button>
              <button class="jrpg-menu-btn ${this.aimTarget === 'CT' ? 'active' : ''}" style="padding:6px 10px; font-size:11px;" ${!isPlayerTurn ? 'disabled' : ''} onclick="BattleModule.setAimTarget('CT')">
                <span>[CT] Center Torso</span>
                <span class="mono" style="font-size:10px; color:#4ade80;">+6%</span>
              </button>
              <div style="display:flex; gap:4px;">
                <button class="jrpg-menu-btn ${this.aimTarget === 'LA' ? 'active' : ''}" style="flex:1; padding:6px 8px; font-size:11px;" ${!isPlayerTurn ? 'disabled' : ''} onclick="BattleModule.setAimTarget('LA')">
                  <span>[LA] Arm</span>
                </button>
                <button class="jrpg-menu-btn ${this.aimTarget === 'RA' ? 'active' : ''}" style="flex:1; padding:6px 8px; font-size:11px;" ${!isPlayerTurn ? 'disabled' : ''} onclick="BattleModule.setAimTarget('RA')">
                  <span>[RA] Arm</span>
                </button>
              </div>
              <div style="display:flex; gap:4px;">
                <button class="jrpg-menu-btn ${this.aimTarget === 'LL' ? 'active' : ''}" style="flex:1; padding:6px 8px; font-size:11px;" ${!isPlayerTurn ? 'disabled' : ''} onclick="BattleModule.setAimTarget('LL')">
                  <span>[LL] Leg</span>
                </button>
                <button class="jrpg-menu-btn ${this.aimTarget === 'RL' ? 'active' : ''}" style="flex:1; padding:6px 8px; font-size:11px;" ${!isPlayerTurn ? 'disabled' : ''} onclick="BattleModule.setAimTarget('RL')">
                  <span>[RL] Leg</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Box 4: Live Combat Dialogue & Battle Feed -->
          <div class="jrpg-box" style="background:#020617;">
            <div class="jrpg-box-title">
              <span>Combat Feed</span>
              <span class="badge ${isPlayerTurn ? 'green' : 'amber'} mono" style="font-size:9px;">TAC-NET</span>
            </div>
            <div class="jrpg-feed">
              ${this.logs.map(l => {
                const type = typeof l === 'object' ? l.type : 'system';
                const time = typeof l === 'object' ? l.time : '';
                const text = typeof l === 'object' ? l.text : l;
                return `
                  <div class="jrpg-feed-entry ${type}">
                    <span style="color:#64748b;">${time}</span> ${text}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

        </div>

      </div>
    `;
  },

  // Sprite catalogue: image aspect + clickable body regions as [x, y, w, h] percentages of the sprite
  // (sprites face right; enemy variants are mirrored and their regions are mirrored with them).
  MECH_SPRITES: {
    wasp: {
      src: 'assets/mechs/mech_wasp.png', aw: 732, ah: 948,
      regions: { hd: [52, 13, 18, 11], torso: [14, 10, 58, 24], la: [2, 30, 50, 14], ra: [60, 31, 38, 11], ll: [12, 40, 34, 58], rl: [44, 40, 34, 56] }
    },
    lynx: {
      src: 'assets/mechs/mech_lynx.png', aw: 751, ah: 885,
      regions: { hd: [46, 11, 21, 12], torso: [12, 6, 58, 40], la: [2, 31, 44, 13], ra: [66, 33, 32, 9], ll: [14, 42, 30, 56], rl: [42, 40, 36, 52] }
    },
    guillotine: {
      src: 'assets/mechs/mech_guillotine.png', aw: 804, ah: 961,
      regions: { hd: [47, 17, 16, 12], torso: [19, 10, 56, 33], la: [2, 36, 42, 20], ra: [64, 33, 34, 19], ll: [18, 54, 28, 44], rl: [48, 45, 30, 49] }
    },
    marauder: {
      src: 'assets/mechs/mech_marauder.png', aw: 913, ah: 940,
      regions: { hd: [60, 20, 20, 10], torso: [9, 3, 72, 37], la: [2, 36, 40, 15], ra: [66, 38, 32, 12], ll: [14, 50, 34, 46], rl: [43, 54, 38, 42] }
    },
    sovereign: {
      src: 'assets/mechs/mech_sovereign.png', aw: 802, ah: 1155,
      regions: { hd: [47, 11, 13, 11], torso: [11, 3, 68, 41], la: [2, 35, 50, 16], ra: [71, 32, 27, 14], ll: [16, 51, 34, 46], rl: [50, 46, 30, 50] }
    },
    colossus: {
      src: 'assets/mechs/mech_enemy_colossus.png', aw: 854, ah: 1113,
      regions: { hd: [45, 13, 14, 10], torso: [28, 5, 62, 33], la: [2, 31, 42, 17], ra: [57, 33, 41, 14], ll: [21, 48, 35, 48], rl: [54, 47, 30, 50] }
    }
  },

  getMechArtworkSpec(side, mechOrEnemy) {
    const S = this.MECH_SPRITES;
    if (side === 'player') {
      const tid = (mechOrEnemy?.templateId || '').toLowerCase();
      const name = (mechOrEnemy?.customName || '').toLowerCase();
      let key = 'guillotine';
      let h = 570;
      if (tid.startsWith('recon') || name.includes('wasp')) { key = 'wasp'; h = 515; }
      else if (tid.startsWith('light') || name.includes('lynx')) { key = 'lynx'; h = 540; }
      else if (tid.startsWith('heavy') || name.includes('marauder')) { key = 'marauder'; h = 550; }
      else if (tid.startsWith('assault') || name.includes('sovereign')) { key = 'sovereign'; h = 615; }
      return { ...S[key], flip: false, h, tint: '' };
    }

    const eName = (mechOrEnemy?.name || this.enemy?.name || '').toLowerCase();
    const eWeight = (mechOrEnemy?.weight || this.enemy?.weight || '').toLowerCase();
    const glow = 'drop-shadow(0 0 14px rgba(244,63,94,0.38))';
    if (eName.includes('colossus') || eName.includes('sovereign') || /19\d|20\d|assault/.test(eWeight)) {
      return { ...S.colossus, flip: false, h: 530, tint: glow };
    }
    if (eName.includes('warhammer') || eName.includes('marauder') || /15\d|16\d|heavy/.test(eWeight)) {
      return { ...S.marauder, flip: true, h: 500, tint: 'hue-rotate(155deg) saturate(1.3) ' + glow };
    }
    if (eName.includes('enforcer') || eName.includes('guillotine') || /11\d|12\d|medium/.test(eWeight)) {
      return { ...S.guillotine, flip: true, h: 505, tint: 'hue-rotate(140deg) saturate(1.25) ' + glow };
    }
    if (eName.includes('jackal') || eName.includes('lynx') || /\b8\d|light/.test(eWeight)) {
      return { ...S.lynx, flip: true, h: 470, tint: 'hue-rotate(145deg) saturate(1.3) ' + glow };
    }
    if (eName.includes('stinger') || eName.includes('wasp') || /\b5\d|recon/.test(eWeight)) {
      return { ...S.wasp, flip: true, h: 455, tint: 'hue-rotate(250deg) saturate(1.35) ' + glow };
    }
    return { ...S.colossus, flip: false, h: 520, tint: glow };
  },

  // Clickable body-region overlay for a BattleMech sprite.
  // Player side: click highlights the part and opens its condition readout.
  // Enemy side: click selects the aimed region and shows its hit-chance modifier.
  renderMechRegions(side, spec, mechOrEnemy) {
    const isEnemy = (side === 'enemy');
    const armor = (isEnemy ? this.enemy?.armor : mechOrEnemy?.armor) || {};
    const maxArmor = (isEnemy ? this.enemy?.maxArmor : mechOrEnemy?.maxArmorCurrent) || {};
    const r = spec.regions;
    const t = r.torso;
    const list = [
      ['CT', [t[0] + t[2] * 0.32, t[1], t[2] * 0.36, t[3]], 1],
      ['LT', [t[0], t[1], t[2] * 0.32, t[3]], 2],
      ['RT', [t[0] + t[2] * 0.68, t[1], t[2] * 0.32, t[3]], 2],
      ['LL', r.ll, 3],
      ['RL', r.rl, 3],
      ['LA', r.la, 4],
      ['RA', r.ra, 4],
      ['HD', r.hd, 5]
    ];
    const fullNames = { HD: 'Head', CT: 'Center Torso', LT: 'Left Torso', RT: 'Right Torso', LA: 'Left Arm', RA: 'Right Arm', LL: 'Left Leg', RL: 'Right Leg' };
    const canAim = isEnemy && this.turn === 'player' && !this.battleOver;

    return list.map(([loc, box, z]) => {
      let [x, y, w, h] = box;
      if (spec.flip) x = 100 - x - w;
      const cur = Math.max(0, Math.round(armor[loc] ?? 0));
      const max = Math.max(1, Math.round(maxArmor[loc] ?? 30));
      const pct = Math.round((cur / max) * 100);
      const state = cur <= 0 ? 'destroyed' : (pct <= 25 ? 'critical' : (pct <= 60 ? 'damaged' : 'intact'));
      const selected = isEnemy ? (this.aimTarget === loc) : (this.selectedPlayerPart === loc);
      const mod = this.getAimModifier(loc);
      const modText = `${mod > 0 ? '+' : (mod < 0 ? '\u2212' : '\u00B1')}${Math.abs(mod)}% HIT`;
      const title = isEnemy
        ? `${fullNames[loc]} \u2014 structure ${cur}/${max} \u2014 ${modText}`
        : `${fullNames[loc]} \u2014 structure ${cur}/${max} (${pct}%) \u2014 click for condition readout`;
      return `
        <div class="mech-hotspot ${side} ${state} ${selected ? 'selected' : ''} ${isEnemy && !canAim ? 'locked' : ''}"
             style="left:${x.toFixed(1)}%; top:${y.toFixed(1)}%; width:${w.toFixed(1)}%; height:${h.toFixed(1)}%; z-index:${z + 2};"
             title="${title}"
             onclick="BattleModule.onRegionClick('${side}', '${loc}')">
          <span class="mech-hs-tag">${loc}${isEnemy ? '' : ` ${pct}%`}</span>
          ${isEnemy ? `<span class="mech-hs-mod ${mod > 0 ? 'pos' : (mod < 0 ? 'neg' : '')}">${fullNames[loc].toUpperCase()} &bull; ${modText}</span>` : ''}
        </div>
      `;
    }).join('');
  },

  // Condition readout card for the player's selected body part
  renderPartReadout(mech) {
    const loc = this.selectedPlayerPart;
    if (!loc || !mech) return '';
    const fullNames = { HD: 'Head / Cockpit', CT: 'Center Torso', LT: 'Left Torso', RT: 'Right Torso', LA: 'Left Arm', RA: 'Right Arm', LL: 'Left Leg', RL: 'Right Leg' };
    const cur = Math.max(0, Math.round(mech.armor?.[loc] ?? 0));
    const max = Math.max(1, Math.round(mech.maxArmorCurrent?.[loc] ?? 30));
    const pct = Math.round((cur / max) * 100);
    const status = cur <= 0 ? 'BREACHED' : (pct <= 25 ? 'CRITICAL' : (pct <= 60 ? 'DAMAGED' : 'OPERATIONAL'));
    const color = cur <= 0 ? '#ef4444' : (pct <= 25 ? '#f87171' : (pct <= 60 ? '#f59e0b' : '#10b981'));
    const comps = (mech.locations?.[loc] || []).map((cid, idx) => {
      const comp = window.GameState.getComponent(cid);
      if (!comp) return '';
      const cond = Math.round(window.GameState.getInstalledPartCondition(mech, loc, idx) ?? 100);
      const cc = cond >= 80 ? '#10b981' : (cond >= 50 ? '#f59e0b' : '#ef4444');
      return `
        <div class="mech-readout-comp">
          <div style="display:flex; justify-content:space-between; gap:6px;">
            <span>${comp.name}</span>
            <span class="mono" style="color:${cc}; font-weight:800;">${cond}%</span>
          </div>
          <div class="jrpg-bar-track" style="height:5px;"><div class="jrpg-bar-fill" style="width:${cond}%; background:${cc};"></div></div>
        </div>
      `;
    }).join('');

    return `
      <div class="mech-part-readout" style="border-color:${color};">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <strong style="font-size:13px; color:#f8fafc;">${fullNames[loc]} <span class="mono" style="color:#94a3b8;">[${loc}]</span></strong>
          <button class="btn" style="padding:1px 8px; font-size:12px;" onclick="BattleModule.closePartReadout()">&times;</button>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
          <span class="badge mono" style="font-size:10px; background:${color}22; color:${color}; border:1px solid ${color};">${status}</span>
          <span class="mono" style="font-size:12px; font-weight:800; color:${color};">${cur} / ${max} STRUCTURE (${pct}%)</span>
        </div>
        <div class="jrpg-bar-track" style="margin-top:4px;"><div class="jrpg-bar-fill" style="width:${pct}%; background:${color};"></div></div>
        <div style="margin-top:8px; font-size:10px; font-weight:800; color:#38bdf8; letter-spacing:0.5px;">INSTALLED SYSTEMS</div>
        <div style="display:flex; flex-direction:column; gap:5px; margin-top:4px;">
          ${comps || '<div class="subtext" style="font-size:11px;">No components installed in this section.</div>'}
        </div>
        ${cur <= 0 ? '<div style="margin-top:8px; font-size:11px; color:#fca5a5;">Section structure breached \u2014 internal systems exposed to direct damage.</div>' : ''}
      </div>
    `;
  },

  // Tactical damage silhouette HUD for the hostile Titan (Lower-Right of Combat Arena)
  renderHostileSilhouetteHud() {
    if (!this.enemy) return '';
    const fullNames = {
      HD: 'Head (Cockpit)',
      CT: 'Center Torso (Core)',
      LT: 'Left Torso',
      RT: 'Right Torso',
      LA: 'Left Arm',
      RA: 'Right Arm',
      LL: 'Left Leg',
      RL: 'Right Leg'
    };

    const getPartColor = (loc) => {
      const cur = Math.max(0, Math.round(this.enemy.armor?.[loc] ?? 0));
      const max = Math.max(1, Math.round(this.enemy.maxArmor?.[loc] ?? 30));
      const pct = Math.round((cur / max) * 100);
      if (cur <= 0) {
        return { fill: '#1c1917', stroke: '#ef4444', pct: 0, status: 'BREACHED', strokeDash: '3 2' };
      }
      if (pct >= 99) {
        return { fill: '#10b981', stroke: '#047857', pct, status: 'INTACT', strokeDash: 'none' };
      }
      if (pct >= 75) {
        return { fill: '#84cc16', stroke: '#4d7c0f', pct, status: 'LIGHT', strokeDash: 'none' };
      }
      if (pct >= 40) {
        return { fill: '#f59e0b', stroke: '#b45309', pct, status: 'MODERATE', strokeDash: 'none' };
      }
      return { fill: '#ef4444', stroke: '#991b1b', pct, status: 'CRITICAL', strokeDash: 'none' };
    };

    const parts = ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
    const colors = {};
    parts.forEach(p => { colors[p] = getPartColor(p); });

    // Calculate total hostile structure %
    let curTotal = 0;
    let maxTotal = 0;
    parts.forEach(p => {
      curTotal += Math.max(0, this.enemy.armor?.[p] ?? 0);
      maxTotal += Math.max(1, this.enemy.maxArmor?.[p] ?? 30);
    });
    const totalPct = Math.round((curTotal / maxTotal) * 100);

    return `
      <div class="hostile-silhouette-hud">
        <div class="hostile-silhouette-title">
          <span>HOSTILE DAMAGE SCAN</span>
          <span class="mono" style="color:${this.enemyFallen ? '#ef4444' : '#f87171'}; font-size:9px;">
            ${this.enemyFallen ? '⚠️ PRONE' : `${totalPct}% HULL`}
          </span>
        </div>
        <div class="hostile-silhouette-target" title="${this.enemy.name} (${this.enemy.weight})">
          ${this.enemy.name}
        </div>

        <!-- Tactical SVG Silhouette of Hostile Titan -->
        <svg class="hostile-silhouette-svg" viewBox="0 0 120 148">
          <defs>
            <pattern id="breach-hatch" width="4" height="4" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="4" stroke="#ef4444" stroke-width="1.2" />
            </pattern>
            <filter id="part-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.8"/>
            </filter>
          </defs>

          <!-- Background Silhouette Grid / Hologram Frame -->
          <rect x="2" y="2" width="116" height="144" rx="4" fill="rgba(2, 6, 23, 0.55)" stroke="rgba(244, 63, 94, 0.2)" stroke-width="1"/>
          <line x1="60" y1="6" x2="60" y2="142" stroke="rgba(244, 63, 94, 0.12)" stroke-width="1" stroke-dasharray="2 2"/>
          <line x1="6" y1="74" x2="114" y2="74" stroke="rgba(244, 63, 94, 0.12)" stroke-width="1" stroke-dasharray="2 2"/>

          <!-- Hips / Skeletal Core Joint -->
          <polygon points="49,70 71,70 67,82 53,82" fill="#334155" stroke="#1e293b" stroke-width="1.2"/>

          <!-- LEFT LEG (LL) -->
          <g class="hostile-part-node ${this.aimTarget === 'LL' ? 'aim-target' : ''}" onclick="BattleModule.setAimTarget('LL')">
            <title>${fullNames.LL}: ${this.enemy.armor?.LL ?? 0}/${this.enemy.maxArmor?.LL ?? 38} HP (${colors.LL.pct}%) - ${colors.LL.status}</title>
            <polygon points="33,78 51,78 47,104 49,134 29,134 31,104"
                     fill="${colors.LL.fill}" stroke="${colors.LL.stroke}" stroke-width="1.5" stroke-dasharray="${colors.LL.strokeDash}" filter="url(#part-glow)"/>
            ${colors.LL.pct <= 0 ? '<polygon points="33,78 51,78 47,104 49,134 29,134 31,104" fill="url(#breach-hatch)" opacity="0.65"/>' : ''}
            <polygon points="25,134 53,134 53,142 25,142" fill="${colors.LL.fill}" stroke="${colors.LL.stroke}" stroke-width="1.2"/>
            <text x="39" y="112" fill="#ffffff" font-size="8" font-weight="900" text-anchor="middle" font-family="monospace">LL</text>
          </g>

          <!-- RIGHT LEG (RL) -->
          <g class="hostile-part-node ${this.aimTarget === 'RL' ? 'aim-target' : ''}" onclick="BattleModule.setAimTarget('RL')">
            <title>${fullNames.RL}: ${this.enemy.armor?.RL ?? 0}/${this.enemy.maxArmor?.RL ?? 38} HP (${colors.RL.pct}%) - ${colors.RL.status}</title>
            <polygon points="69,78 87,78 89,104 91,134 71,134 73,104"
                     fill="${colors.RL.fill}" stroke="${colors.RL.stroke}" stroke-width="1.5" stroke-dasharray="${colors.RL.strokeDash}" filter="url(#part-glow)"/>
            ${colors.RL.pct <= 0 ? '<polygon points="69,78 87,78 89,104 91,134 71,134 73,104" fill="url(#breach-hatch)" opacity="0.65"/>' : ''}
            <polygon points="67,134 95,134 95,142 67,142" fill="${colors.RL.fill}" stroke="${colors.RL.stroke}" stroke-width="1.2"/>
            <text x="81" y="112" fill="#ffffff" font-size="8" font-weight="900" text-anchor="middle" font-family="monospace">RL</text>
          </g>

          <!-- LEFT TORSO (LT) -->
          <g class="hostile-part-node ${this.aimTarget === 'LT' ? 'aim-target' : ''}" onclick="BattleModule.setAimTarget('LT')">
            <title>${fullNames.LT}: ${this.enemy.armor?.LT ?? 0}/${this.enemy.maxArmor?.LT ?? 40} HP (${colors.LT.pct}%) - ${colors.LT.status}</title>
            <polygon points="22,28 45,28 45,71 27,69 22,46"
                     fill="${colors.LT.fill}" stroke="${colors.LT.stroke}" stroke-width="1.5" stroke-dasharray="${colors.LT.strokeDash}" filter="url(#part-glow)"/>
            ${colors.LT.pct <= 0 ? '<polygon points="22,28 45,28 45,71 27,69 22,46" fill="url(#breach-hatch)" opacity="0.65"/>' : ''}
            <text x="34" y="52" fill="#ffffff" font-size="8" font-weight="900" text-anchor="middle" font-family="monospace">LT</text>
          </g>

          <!-- RIGHT TORSO (RT) -->
          <g class="hostile-part-node ${this.aimTarget === 'RT' ? 'aim-target' : ''}" onclick="BattleModule.setAimTarget('RT')">
            <title>${fullNames.RT}: ${this.enemy.armor?.RT ?? 0}/${this.enemy.maxArmor?.RT ?? 40} HP (${colors.RT.pct}%) - ${colors.RT.status}</title>
            <polygon points="75,28 98,28 98,46 93,69 75,71"
                     fill="${colors.RT.fill}" stroke="${colors.RT.stroke}" stroke-width="1.5" stroke-dasharray="${colors.RT.strokeDash}" filter="url(#part-glow)"/>
            ${colors.RT.pct <= 0 ? '<polygon points="75,28 98,28 98,46 93,69 75,71" fill="url(#breach-hatch)" opacity="0.65"/>' : ''}
            <text x="86" y="52" fill="#ffffff" font-size="8" font-weight="900" text-anchor="middle" font-family="monospace">RT</text>
          </g>

          <!-- CENTER TORSO (CT) -->
          <g class="hostile-part-node ${this.aimTarget === 'CT' ? 'aim-target' : ''}" onclick="BattleModule.setAimTarget('CT')">
            <title>${fullNames.CT}: ${this.enemy.armor?.CT ?? 0}/${this.enemy.maxArmor?.CT ?? 56} HP (${colors.CT.pct}%) - ${colors.CT.status}</title>
            <polygon points="46,28 74,28 73,71 47,71"
                     fill="${colors.CT.fill}" stroke="${colors.CT.stroke}" stroke-width="1.6" stroke-dasharray="${colors.CT.strokeDash}" filter="url(#part-glow)"/>
            ${colors.CT.pct <= 0 ? '<polygon points="46,28 74,28 73,71 47,71" fill="url(#breach-hatch)" opacity="0.65"/>' : ''}
            <polygon points="50,35 70,35 66,56 54,56" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.3)" stroke-width="0.8"/>
            <text x="60" y="49" fill="#ffffff" font-size="9" font-weight="900" text-anchor="middle" font-family="monospace">CT</text>
          </g>

          <!-- LEFT ARM (LA) -->
          <g class="hostile-part-node ${this.aimTarget === 'LA' ? 'aim-target' : ''}" onclick="BattleModule.setAimTarget('LA')">
            <title>${fullNames.LA}: ${this.enemy.armor?.LA ?? 0}/${this.enemy.maxArmor?.LA ?? 34} HP (${colors.LA.pct}%) - ${colors.LA.status}</title>
            <polygon points="9,38 21,38 23,66 17,92 9,92 11,66"
                     fill="${colors.LA.fill}" stroke="${colors.LA.stroke}" stroke-width="1.5" stroke-dasharray="${colors.LA.strokeDash}" filter="url(#part-glow)"/>
            ${colors.LA.pct <= 0 ? '<polygon points="9,38 21,38 23,66 17,92 9,92 11,66" fill="url(#breach-hatch)" opacity="0.65"/>' : ''}
            <rect x="7" y="90" width="10" height="6" fill="${colors.LA.fill}" stroke="${colors.LA.stroke}" stroke-width="1"/>
            <text x="15" y="68" fill="#ffffff" font-size="8" font-weight="900" text-anchor="middle" font-family="monospace">LA</text>
          </g>

          <!-- RIGHT ARM (RA) -->
          <g class="hostile-part-node ${this.aimTarget === 'RA' ? 'aim-target' : ''}" onclick="BattleModule.setAimTarget('RA')">
            <title>${fullNames.RA}: ${this.enemy.armor?.RA ?? 0}/${this.enemy.maxArmor?.RA ?? 34} HP (${colors.RA.pct}%) - ${colors.RA.status}</title>
            <polygon points="99,38 111,38 109,66 111,92 103,92 97,66"
                     fill="${colors.RA.fill}" stroke="${colors.RA.stroke}" stroke-width="1.5" stroke-dasharray="${colors.RA.strokeDash}" filter="url(#part-glow)"/>
            ${colors.RA.pct <= 0 ? '<polygon points="99,38 111,38 109,66 111,92 103,92 97,66" fill="url(#breach-hatch)" opacity="0.65"/>' : ''}
            <rect x="103" y="90" width="10" height="6" fill="${colors.RA.fill}" stroke="${colors.RA.stroke}" stroke-width="1"/>
            <text x="105" y="68" fill="#ffffff" font-size="8" font-weight="900" text-anchor="middle" font-family="monospace">RA</text>
          </g>

          <!-- HEAD / COCKPIT (HD) -->
          <g class="hostile-part-node ${this.aimTarget === 'HD' ? 'aim-target' : ''}" onclick="BattleModule.setAimTarget('HD')">
            <title>${fullNames.HD}: ${this.enemy.armor?.HD ?? 0}/${this.enemy.maxArmor?.HD ?? 20} HP (${colors.HD.pct}%) - ${colors.HD.status}</title>
            <polygon points="52,12 68,12 71,27 49,27"
                     fill="${colors.HD.fill}" stroke="${colors.HD.stroke}" stroke-width="1.5" stroke-dasharray="${colors.HD.strokeDash}" filter="url(#part-glow)"/>
            ${colors.HD.pct <= 0 ? '<polygon points="52,12 68,12 71,27 49,27" fill="url(#breach-hatch)" opacity="0.65"/>' : ''}
            <line x1="54" y1="18" x2="66" y2="18" stroke="#38bdf8" stroke-width="1.5"/>
            <text x="60" y="24" fill="#ffffff" font-size="8" font-weight="900" text-anchor="middle" font-family="monospace">HD</text>
          </g>

          <!-- Crosshair Reticle on Currently Selected Aim Target -->
          ${this.aimTarget !== 'General' ? (() => {
            const centers = {
              HD: { x: 60, y: 19 },
              CT: { x: 60, y: 49 },
              LT: { x: 34, y: 49 },
              RT: { x: 86, y: 49 },
              LA: { x: 15, y: 65 },
              RA: { x: 105, y: 65 },
              LL: { x: 40, y: 106 },
              RL: { x: 80, y: 106 }
            };
            const c = centers[this.aimTarget];
            if (!c) return '';
            return `
              <circle cx="${c.x}" cy="${c.y}" r="9" fill="none" stroke="#38bdf8" stroke-width="1.6" stroke-dasharray="3 2">
                <animateTransform attributeName="transform" type="rotate" from="0 ${c.x} ${c.y}" to="360 ${c.x} ${c.y}" dur="4s" repeatCount="indefinite"/>
              </circle>
              <circle cx="${c.x}" cy="${c.y}" r="2" fill="#38bdf8"/>
            `;
          })() : ''}
        </svg>

        <!-- Mini Color Legend & Aim Lock Info -->
        <div class="hostile-silhouette-legend">
          <span style="color:#10b981;" title="100% Intact">● Intact</span>
          <span style="color:#84cc16;" title="75-99% Light Damage">● Light</span>
          <span style="color:#f59e0b;" title="40-74% Moderate Damage">● Med</span>
          <span style="color:#ef4444;" title="1-39% Critical Damage">● Crit</span>
          <span style="color:#ef4444; font-weight:700;" title="0% Breached">✕ Out</span>
        </div>

        <!-- Quick Reset / Aim Modifier Pill -->
        <div style="margin-top:4px; display:flex; justify-content:space-between; align-items:center; font-size:10px;">
          <span class="mono" style="color:var(--accent-amber); font-weight:700;">
            AIM: ${this.aimTarget === 'General' ? 'GENERAL' : `[${this.aimTarget}] ${this.getAimModifier(this.aimTarget) > 0 ? '+' : ''}${this.getAimModifier(this.aimTarget)}%`}
          </span>
          ${this.aimTarget !== 'General' ? `
            <button class="btn" style="padding:1px 5px; font-size:9px;" onclick="BattleModule.setAimTarget('General')">Reset</button>
          ` : '<span class="subtext mono" style="font-size:9px;">Click part to aim</span>'}
        </div>
      </div>
    `;
  },

  renderIsometricTitanSvg(side, isProne = false, healthPct = 100, themeColor = '#38bdf8', mechOrEnemy = null) {
    const isPlayer = (side === 'player');
    const spec = this.getMechArtworkSpec(side, mechOrEnemy);
    const widthPx = Math.round(spec.h * spec.aw / spec.ah);
    const isDamaged = healthPct < 55;
    const isCritical = healthPct < 28;

    const baseShadow = isPlayer
      ? 'drop-shadow(0 14px 22px rgba(0,0,0,0.92)) drop-shadow(0 0 12px rgba(56,189,248,0.22))'
      : 'drop-shadow(0 14px 22px rgba(0,0,0,0.92))';
    const filterChain = [baseShadow, spec.tint].filter(Boolean).join(' ');

    // Damage effects are anchored to the torso of the sprite
    const t = spec.regions.torso;
    let fx = t[0] + t[2] * 0.5;
    if (spec.flip) fx = 100 - fx;
    const fy = t[1] + t[3] * 0.35;

    return `
      <div class="jrpg-mech-sprite-wrap ${side}" style="position:relative; height:${spec.h}px; width:${widthPx}px;">
        <img src="${spec.src}"
             alt="${isPlayer ? 'Player BattleMech' : 'Hostile BattleMech'}"
             class="jrpg-mech-img"
             draggable="false"
             style="width:100%; height:100%; display:block; ${spec.flip ? 'transform:scaleX(-1);' : ''} filter:${filterChain}; pointer-events:none;" />
        ${isDamaged ? `<div class="mech-fx smoke" style="left:${fx.toFixed(1)}%; top:${fy.toFixed(1)}%;"></div><div class="mech-fx spark" style="left:${(fx + 6).toFixed(1)}%; top:${(fy + 6).toFixed(1)}%;"></div>` : ''}
        ${isCritical ? `<div class="mech-fx fire" style="left:${fx.toFixed(1)}%; top:${(fy + 4).toFixed(1)}%;"></div><div class="mech-fx smoke dark" style="left:${(fx - 5).toFixed(1)}%; top:${fy.toFixed(1)}%;"></div>` : ''}
        ${this.renderMechRegions(side, spec, mechOrEnemy)}
      </div>
    `;
  },

  render() {
    const container = document.getElementById('view-battle');
    if (!container) return;

    try {
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
    } catch (err) {
      console.error('BattleModule.render error:', err);
      container.innerHTML = `
        <div class="card" style="padding:28px; text-align:center;">
          <h3 style="color:#ef4444; font-size:18px;">Tactical Battle Arena Auto-Recovery</h3>
          <p class="subtext" style="margin:8px auto; max-width:500px;">
            A rendering exception was safely intercepted (${err.message}). Click below to reset to the Operations Board.
          </p>
          <button class="btn btn-primary" style="margin-top:10px;" onclick="BattleModule.active = false; BattleModule.arenaTab = 'offers'; BattleModule.render();">
            Reset to Battle Operations Board &rarr;
          </button>
        </div>
      `;
    }
  }
};