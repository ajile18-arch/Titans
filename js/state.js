// Persistent Game State & Calculations for Titans of Steel Remake

const STORAGE_KEY = 'TOS_REMAKE_SAVE_V2';

function createDefaultState() {
  return {
    credits: 500000,
    missionsCompleted: 0,
    selectedJockId: '',
    selectedMechId: '',
    selectedBodyPart: 'RA',

    company: {
      registered: false,
      name: 'Unregistered Mercenary Unit',
      commander: 'Commander',
      emblemId: 'emblem-wolf',
      motto: 'Steel Before Surrender',
      goalId: 'wealth',
      customGoals: 'Build a premier MechJock mercenary company from the ground up.',
      reputationLevel: 1,
      xp: 0
    },

    // Campaign Time Counter (1 Month = 4 Weeks, 1 Year = 12 Months = 48 Weeks)
    calendar: {
      totalWeeks: 0,
      year: 1,
      month: 1,
      week: 1,
      lastEvent: 'Company Charter Registered'
    },

    // Active Job Listing & Applicant Waiting Line (Applicants arrive over time as weeks pass)
    jobListing: {
      active: false,
      advertisedBonus: 6000,
      postedDateText: 'Year 1 • Month 1 • Week 1',
      weeksActive: 0,
      applicants: []
    },

    // Start from complete scratch with no Jockeys, no Mechs, and empty Parts Storage
    jocks: [],
    mechs: [],
    partInventory: {},
    partStorage: [],

    // Short-Term Freelance Mercenaries available on the main HQ screen for a flat fee (short time & small number of fights)
    recruits: [
      {
        id: 'merc-1',
        firstName: 'Nadia',
        lastName: 'Chen',
        callsign: 'Spark',
        portraitId: 'gold-commander',
        bio: 'Freelance Energy gunner available for short-term contract drops.',
        xp: 150,
        xpSpent: 600,
        flatFee: 6500,
        termMonths: 2,
        termFights: 2,
        baseSalary: 0,
        stats: { Constitution: 24, Intelligence: 29, Instinct: 26, Reflexes: 31, Piloting: 25, Bravery: 24 },
        skills: {
          'Energy Weapons': 68, 'Cannons / Ballistic': 42, 'Guided Missiles': 48, 'Close Combat': 35,
          'Recon / Scanner': 58, 'Damage Control': 54, 'Leadership': 40, 'Survival': 48,
          'Mechanic (Repair)': 45, 'Medical (First Aid)': 40
        }
      },
      {
        id: 'merc-2',
        firstName: 'Viktor',
        lastName: 'Orlov',
        callsign: 'Kodiak',
        portraitId: 'iron-veteran',
        bio: 'Veteran heavy ballistic & missile freelancer for hire by the drop.',
        xp: 100,
        xpSpent: 1400,
        flatFee: 9500,
        termMonths: 3,
        termFights: 3,
        baseSalary: 0,
        stats: { Constitution: 32, Intelligence: 23, Instinct: 28, Reflexes: 27, Piloting: 29, Bravery: 34 },
        skills: {
          'Energy Weapons': 48, 'Cannons / Ballistic': 72, 'Guided Missiles': 70, 'Close Combat': 52,
          'Recon / Scanner': 50, 'Damage Control': 64, 'Leadership': 55, 'Survival': 60,
          'Mechanic (Repair)': 55, 'Medical (First Aid)': 35
        }
      },
      {
        id: 'merc-3',
        firstName: 'Talia',
        lastName: 'Moreau',
        callsign: 'Spectre',
        portraitId: 'cyber-violet',
        bio: 'High-precision sniper ringer available for a single urgent contract.',
        xp: 100,
        xpSpent: 2100,
        flatFee: 5500,
        termMonths: 1,
        termFights: 1,
        baseSalary: 0,
        stats: { Constitution: 25, Intelligence: 32, Instinct: 34, Reflexes: 38, Piloting: 30, Bravery: 28 },
        skills: {
          'Energy Weapons': 78, 'Cannons / Ballistic': 74, 'Guided Missiles': 55, 'Close Combat': 40,
          'Recon / Scanner': 72, 'Damage Control': 60, 'Leadership': 45, 'Survival': 62,
          'Mechanic (Repair)': 40, 'Medical (First Aid)': 45
        }
      }
    ]
  };
}

window.GameState = {
  data: null,

  init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
        if (!this.data.company) {
          this.data.company = createDefaultState().company;
        }
        this.ensureCalendar();
        this.ensureJobListing();
        this.ensureBattleOffers();
        if (!Array.isArray(this.data.partStorage)) {
          this.data.partStorage = [];
          // Migrate any count-based partInventory into condition-tracked partStorage items
          if (this.data.partInventory && typeof this.data.partInventory === 'object') {
            Object.entries(this.data.partInventory).forEach(([cid, count]) => {
              const n = Number(count) || 0;
              for (let i = 0; i < n; i++) {
                this.data.partStorage.push({
                  uid: 'part-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
                  compId: cid,
                  condition: 100
                });
              }
            });
            this.data.partInventory = {};
          }
        }
        // Ensure every Mech has parallel partConditions arrays for all 8 locations
        (this.data.mechs || []).forEach(m => {
          this.ensureMechPartConditions(m);
        });
        // Ensure recruits have the new flat-fee short-term mercenary fields
        if (!this.data.recruits || !this.data.recruits.length || !this.data.recruits[0].flatFee) {
          this.data.recruits = createDefaultState().recruits;
        }
        // Migrate any old 1-20 attributes to the new 1-100 scale & ensure dual-condition contracts
        (this.data.jocks || []).forEach(j => {
          if (j.stats) {
            const maxStat = Math.max(...Object.values(j.stats));
            if (maxStat <= 20) {
              Object.keys(j.stats).forEach(k => {
                j.stats[k] = Math.round(j.stats[k] * 2);
              });
            }
          }
          this.ensureJockContract(j);
        });
      } catch (e) {
        this.data = createDefaultState();
      }
    } else {
      this.data = createDefaultState();
    }
  },

  ensureJockContract(j) {
    if (!j) return;
    if (!j.contract || typeof j.contract !== 'object') {
      j.contract = {
        type: 'standard',
        totalYears: 2,
        totalMonths: 24,
        monthsRemaining: 24,
        totalFights: 10,
        fightsRemaining: 10,
        expired: false
      };
      return;
    }
    if (j.contract.type === 'mercenary') {
      j.contract.totalMonths = j.contract.totalMonths || 2;
      if (typeof j.contract.monthsRemaining !== 'number') j.contract.monthsRemaining = j.contract.totalMonths;
      j.contract.totalFights = j.contract.totalFights || 2;
      if (typeof j.contract.fightsRemaining !== 'number') j.contract.fightsRemaining = j.contract.totalFights;
    } else {
      j.contract.type = 'standard';
      j.contract.totalYears = j.contract.totalYears || 2;
      j.contract.totalMonths = j.contract.totalYears * 12;
      if (typeof j.contract.monthsRemaining !== 'number') j.contract.monthsRemaining = j.contract.totalMonths;
      j.contract.totalFights = j.contract.totalFights || 10;
      if (typeof j.contract.fightsRemaining !== 'number') j.contract.fightsRemaining = j.contract.totalFights;
    }
    j.contract.expired = (j.contract.fightsRemaining <= 0 || j.contract.monthsRemaining <= 0);
  },

  ensureCalendar() {
    if (!this.data) return;
    if (!this.data.calendar || typeof this.data.calendar.totalWeeks !== 'number') {
      this.data.calendar = {
        totalWeeks: 0,
        year: 1,
        month: 1,
        week: 1,
        lastEvent: 'Company Charter Registered'
      };
    }
    const tw = Math.max(0, Math.floor(this.data.calendar.totalWeeks || 0));
    this.data.calendar.totalWeeks = tw;
    this.data.calendar.year = Math.floor(tw / 48) + 1;
    this.data.calendar.month = (Math.floor(tw / 4) % 12) + 1;
    this.data.calendar.week = (tw % 4) + 1;
  },

  ensureJobListing() {
    if (!this.data) return;
    if (!this.data.jobListing || typeof this.data.jobListing !== 'object') {
      this.data.jobListing = {
        active: false,
        advertisedBonus: 6000,
        postedDateText: this.getCalendarText(),
        weeksActive: 0,
        applicants: []
      };
    }
    if (!Array.isArray(this.data.jobListing.applicants)) {
      this.data.jobListing.applicants = [];
    }
  },

  getCalendarTextForWeeks(tw) {
    const w = Math.max(0, Math.floor(Number(tw) || 0));
    const y = Math.floor(w / 48) + 1;
    const m = (Math.floor(w / 4) % 12) + 1;
    const wk = (w % 4) + 1;
    return `Year ${y} • Month ${m} • Week ${wk}`;
  },

  getCalendarText() {
    this.ensureCalendar();
    return this.getCalendarTextForWeeks(this.data.calendar.totalWeeks);
  },

  ensureBattleOffers() {
    if (!this.data) return;
    if (!Array.isArray(this.data.battleOffers)) this.data.battleOffers = [];
    if (!Array.isArray(this.data.scheduledBattles)) this.data.scheduledBattles = [];
    if (!Array.isArray(this.data.completedBattles)) this.data.completedBattles = [];

    // Update readiness of all scheduled battles based on current calendar week
    const curWeeks = this.data.calendar?.totalWeeks || 0;
    this.data.scheduledBattles.forEach(b => {
      b.isReady = (curWeeks >= b.targetTotalWeeks);
      b.weeksRemaining = Math.max(0, b.targetTotalWeeks - curWeeks);
    });

    // Populate offers if low
    while (this.data.battleOffers.length < 3) {
      this.data.battleOffers.push(this.generateBattleOffer());
    }
  },

  generateBattleOffer() {
    this.ensureCalendar();
    const repLvl = this.getCompanyReputationLevel();
    const clients = window.TOS_DATA.battleClients || [];
    const client = clients[Math.floor(Math.random() * clients.length)] || clients[0];

    // Pick enemy titan appropriate for company reputation level
    const allEnemies = window.TOS_DATA.enemyTitans || [];
    const eligibleEnemies = allEnemies.filter(e => (e.reqRep || 1) <= Math.max(1, repLvl));
    const enemyTpl = eligibleEnemies[Math.floor(Math.random() * eligibleEnemies.length)] || allEnemies[0];

    const terrains = [
      { id: 'woods', name: 'Dense Forest Basin', desc: 'Heavy foliage provides defensive cover (+15% Evasion)' },
      { id: 'water', name: 'Flooded River Valley', desc: 'Cool water hexes accelerate heat venting by +3 C/sec' },
      { id: 'hill', name: 'Granite High Ridge', desc: 'Elevated terrain provides line-of-sight elevation advantage' },
      { id: 'rubble', name: 'Industrial Ruins Zone', desc: 'Shattered factory complexes and blast craters (+8% Cover)' },
      { id: 'clear', name: 'Open Sand Flats', desc: 'Flat scorched terrain, ideal for direct long-range gunnery' }
    ];
    const terrain = terrains[Math.floor(Math.random() * terrains.length)];

    const opsPrefix = ['Iron', 'Crimson', 'Obsidian', 'Solar', 'Vanguard', 'Apex', 'Thunder', 'Ghost', 'Cobalt'];
    const opsSuffix = ['Recon', 'Siege', 'Intercept', 'Dawn', 'Horizon', 'Strike', 'Breach', 'Protocol'];
    const pfx = opsPrefix[Math.floor(Math.random() * opsPrefix.length)];
    const sfx = opsSuffix[Math.floor(Math.random() * opsSuffix.length)];
    const opName = `Operation ${pfx} ${sfx}`;

    // Base Bounty calculation (28k–55k scaling with enemy tonnage and client multiplier)
    const baseFee = Math.round((28000 + (enemyTpl.reqRep || 1) * 7500) * (client.bountyMultiplier || 1) / 500) * 500;
    const curWeeks = this.data.calendar?.totalWeeks || 0;
    const defaultPrepWeeks = 2; // Suggested 2 weeks prep
    const targetWeeks = curWeeks + defaultPrepWeeks;

    return {
      id: 'offer-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      title: opName,
      client: {
        id: client.id,
        name: client.name,
        badge: client.badge,
        category: client.category,
        emblem: client.emblem,
        introQuote: client.introQuote
      },
      enemy: {
        id: enemyTpl.id,
        name: enemyTpl.model,
        weight: enemyTpl.weightClass,
        dmg: enemyTpl.dmg,
        hit: enemyTpl.hit,
        armor: { ...enemyTpl.armor },
        maxArmor: { ...enemyTpl.maxArmor },
        pilot: enemyTpl.pilot,
        threat: enemyTpl.threat
      },
      terrain: terrain,
      baseBounty: baseFee,
      negotiatedBounty: baseFee,
      baseSalvagePct: client.baseSalvagePct || 20,
      negotiatedSalvagePct: client.baseSalvagePct || 20,
      suggestedPrepWeeks: defaultPrepWeeks,
      targetTotalWeeks: targetWeeks,
      targetDateText: this.getCalendarTextForWeeks(targetWeeks),
      patience: 3,
      status: 'offered' // 'offered' | 'signed'
    };
  },

  formatWeeksDuration(weeks) {
    const w = Math.max(1, Math.round(Number(weeks) || 1));
    const years = Math.floor(w / 48);
    const remAfterYears = w % 48;
    const months = Math.floor(remAfterYears / 4);
    const remWeeks = remAfterYears % 4;
    const parts = [];
    if (years > 0) parts.push(`${years} Yr${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} Mo${months > 1 ? 's' : ''}`);
    if (remWeeks > 0) parts.push(`${remWeeks} Wk${remWeeks > 1 ? 's' : ''}`);
    return parts.join(', ');
  },

  // Larger Mech Chassis take more Months to manufacture/commission
  getChassisBuildWeeks(tpl, mode = 'stripped') {
    const tons = tpl?.maxTons || 50;
    let baseWeeks = 4; // 50t Recon = 1 Month (4 Weeks)
    if (tons >= 200) baseWeeks = 16;      // 200t Assault = 4 Months (16 Weeks)
    else if (tons >= 160) baseWeeks = 12; // 160t Heavy   = 3 Months (12 Weeks)
    else if (tons >= 120) baseWeeks = 8;  // 120t Medium  = 2 Months (8 Weeks)
    else if (tons >= 80) baseWeeks = 6;   // 80t Light    = 1 Mo, 2 Wks (6 Weeks)
    if (mode === 'standard') baseWeeks += 2; // +2 Weeks for factory starter weapon/armor package
    return baseWeeks;
  },

  // Advance campaign time by N weeks; processes monthly wage upkeep, contract durations & incoming Job Listing applicants
  advanceTimeWeeks(weeksToAdd, actionLabel = '') {
    this.ensureCalendar();
    this.ensureJobListing();
    this.ensureBattleOffers();
    const st = this.data;
    const wCount = Math.max(1, Math.round(Number(weeksToAdd) || 1));

    for (let i = 0; i < wCount; i++) {
      st.calendar.totalWeeks += 1;
      this.ensureCalendar();

      // If a Jockey Job Listing is active, applicants respond at a measured, realistic pace (roughly once every 3 to 4 weeks)
      if (st.jobListing && st.jobListing.active && window.HQModule && typeof window.HQModule.generateApplicant === 'function') {
        st.jobListing.weeksActive = (st.jobListing.weeksActive || 0) + 1;
        const maxApplicants = 4;
        if (st.jobListing.applicants.length < maxApplicants) {
          // Controlled arrival rate: ~25% chance per week (roughly 1 applicant per month)
          // Higher signing bonuses give a modest boost (+4% to +8%)
          const bonus = Number(st.jobListing.advertisedBonus) || 5000;
          const bonusMod = bonus >= 15000 ? 0.08 : (bonus >= 8000 ? 0.04 : 0.0);
          const arrivalChance = 0.25 + bonusMod;

          if (Math.random() < arrivalChance) {
            const cand = window.HQModule.generateApplicant(st.jobListing.advertisedBonus || 6000);
            cand.applicantId = 'app-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
            cand.appliedDate = this.getCalendarText();
            cand.offeredBonusAtApply = st.jobListing.advertisedBonus || 6000;
            st.jobListing.applicants.push(cand);
          }
        }
      }

      // Every 4 weeks (1 Month), process monthly payroll & contract month countdowns
      if (st.calendar.totalWeeks % 4 === 0) {
        const monthlyUpkeep = (st.jocks || []).reduce((sum, j) => sum + this.getJockSalary(j), 0);
        if (monthlyUpkeep > 0) {
          st.credits = Math.max(0, st.credits - monthlyUpkeep);
        }
        // Decrement monthsRemaining on all active contracts (both fights and max time, whichever comes first)
        let newlyExpiredJockId = null;
        let newlyExpiredReason = '';
        (st.jocks || []).forEach(j => {
          this.ensureJockContract(j);
          const wasExpired = j.contract.expired;
          if (typeof j.contract.monthsRemaining === 'number' && j.contract.monthsRemaining > 0) {
            j.contract.monthsRemaining = Math.max(0, j.contract.monthsRemaining - 1);
          }
          if (j.contract.monthsRemaining <= 0 || j.contract.fightsRemaining <= 0) {
            j.contract.expired = true;
            if (!wasExpired && !newlyExpiredJockId) {
              newlyExpiredJockId = j.id;
              newlyExpiredReason = j.contract.monthsRemaining <= 0
                ? 'Max Contract Time Reached (0 Months Remaining)'
                : 'All Contract Fights Completed (0 Fights Remaining)';
            }
          }
        });
        if (newlyExpiredJockId && window.HQModule && typeof window.HQModule.triggerContractExpirationPrompt === 'function') {
          setTimeout(() => {
            window.HQModule.triggerContractExpirationPrompt(newlyExpiredJockId, newlyExpiredReason);
          }, 20);
        }
      }
    }

    this.ensureCalendar();
    if (actionLabel) {
      st.calendar.lastEvent = `${actionLabel} (+${this.formatWeeksDuration(wCount)})`;
    }
    this.save();
    if (window.App && typeof window.App.updateHUD === 'function') {
      window.App.updateHUD();
    }
  },

  // Escalating XP cost to raise a 1-100 Attribute by +1 (starts high and climbs steep)
  getAttrUpgradeCost(currentVal) {
    const v = Number(currentVal) || 20;
    return Math.round((350 + v * 15) / 10) * 10;
  },

  // High escalating XP cost to raise a 0-100% Skill by +1%
  getSkillUpgradeCost(currentVal) {
    const v = Number(currentVal) || 30;
    return Math.round((220 + v * 8.5) / 10) * 10;
  },

  getContractSummary(jock) {
    if (!jock) return 'Standard Charter';
    this.ensureJockContract(jock);
    const c = jock.contract;
    const remF = c.fightsRemaining ?? c.totalFights;
    const totF = c.totalFights || 10;
    const remM = c.monthsRemaining ?? c.totalMonths;
    const totM = c.totalMonths || ((c.totalYears || 2) * 12);

    if (c.expired || remF <= 0 || remM <= 0) {
      return `CONTRACT DONE (${remF}/${totF} Fights • ${remM}/${totM} Mos) — Renegotiate!`;
    }
    if (c.type === 'mercenary') {
      return `Merc: ${remF}/${totF} Fights or ${remM}/${totM} Mos (1st)`;
    }
    return `${remF}/${totF} Fights or ${remM}/${totM} Mos Max (${c.totalYears || 2} Yr)`;
  },

  getCompanyEmblemSvg(emblemId) {
    const list = window.TOS_DATA.companyEmblems || [];
    const found = list.find(e => e.id === emblemId) || list[0];
    return found ? found.svg : '';
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  },

  reset() {
    this.data = createDefaultState();
    this.save();
  },

  getJockRank(jock) {
    const ranks = window.TOS_DATA.ranks;
    let current = ranks[0];
    for (const r of ranks) {
      if (jock.xpSpent >= r.minXpSpent) current = r;
    }
    return current;
  },

  getJockSalary(jock) {
    const rank = this.getJockRank(jock);
    return Math.round(jock.baseSalary * rank.salaryMult);
  },

  getPortraitSvg(portraitId, size = 58) {
    const p = window.TOS_DATA.portraits.find(x => x.id === portraitId) || window.TOS_DATA.portraits[0];
    if (p && p.img) {
      return `<img src="${p.img}" alt="${p.label}" style="width:${size}px; height:${size}px; object-fit:cover; border-radius:10px; border:2px solid var(--border-bright); display:block; background:#0f172a;" />`;
    }
    return p ? p.svg : '';
  },

  getCompanyReputationLevel() {
    const st = this.data;
    const baseRep = st?.company?.reputationLevel || 1;
    const bonusFromMissions = Math.floor((st?.missionsCompleted || 0) / 2);
    const bonusFromXp = Math.floor((st?.company?.xp || 0) / 800);
    return Math.max(1, baseRep + bonusFromMissions + bonusFromXp);
  },

  getOwnedPartCount(compId) {
    return (this.data?.partStorage || []).filter(p => p.compId === compId).length;
  },

  getOwnedPartsByCompId(compId) {
    // Sort highest condition first when equipping, or lowest condition first when inspecting
    return (this.data?.partStorage || [])
      .filter(p => p.compId === compId)
      .sort((a, b) => (b.condition ?? 100) - (a.condition ?? 100));
  },

  ensureMechPartConditions(mech) {
    if (!mech) return;
    if (!mech.partConditions) mech.partConditions = {};
    const locs = ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
    locs.forEach(loc => {
      const compArr = mech.locations?.[loc] || [];
      if (!Array.isArray(mech.partConditions[loc])) {
        mech.partConditions[loc] = compArr.map(() => 100);
      } else {
        while (mech.partConditions[loc].length < compArr.length) {
          mech.partConditions[loc].push(100);
        }
        if (mech.partConditions[loc].length > compArr.length) {
          mech.partConditions[loc].length = compArr.length;
        }
      }
    });
  },

  getInstalledPartCondition(mech, locCode, idx) {
    this.ensureMechPartConditions(mech);
    const val = mech?.partConditions?.[locCode]?.[idx];
    return val !== undefined ? val : 100;
  },

  // Base resale is 50% (half off) at 100% condition, and reduced further if the part is damaged
  getPartResaleValue(compId, condition = 100) {
    const comp = this.getComponent(compId);
    if (!comp) return 0;
    const condPct = Math.max(0, Math.min(100, Number(condition) ?? 100));
    return Math.round(comp.cost * 0.50 * (condPct / 100));
  },

  // Chassis condition % based on current armor vs max armor capacity
  getChassisConditionPct(mech) {
    if (!mech) return 100;
    const curArmor = Object.values(mech.armor || {}).reduce((a, b) => a + b, 0);
    const maxArmor = Object.values(mech.maxArmorCurrent || {}).reduce((a, b) => a + b, 0);
    if (maxArmor <= 0) return 100;
    return Math.max(10, Math.min(100, Math.round((curArmor / maxArmor) * 100)));
  },

  // Base chassis resale is 50% (half off) of chassis baseCost at 100% condition, reduced if damaged
  getChassisResaleInfo(mech) {
    if (!mech) return { conditionPct: 100, chassisResale: 0, partsResale: 0, totalResale: 0, partCount: 0 };
    this.ensureMechPartConditions(mech);
    const tpl = this.getMechTemplate(mech);
    const conditionPct = this.getChassisConditionPct(mech);
    const baseHalfOff = Math.round(tpl.baseCost * 0.50);
    const chassisResale = Math.round(baseHalfOff * (conditionPct / 100));

    let partsResale = 0;
    let partCount = 0;
    Object.entries(mech.locations || {}).forEach(([loc, compIds]) => {
      compIds.forEach((cid, idx) => {
        const cond = this.getInstalledPartCondition(mech, loc, idx);
        partsResale += this.getPartResaleValue(cid, cond);
        partCount += 1;
      });
    });

    return {
      conditionPct,
      baseHalfOff,
      chassisResale,
      partsResale,
      totalResale: chassisResale + partsResale,
      partCount
    };
  },

  getMaxInterviewQuestions() {
    // Interviews are limited to exactly 3 questions
    return 3;
  },

  getMechTemplate(mech) {
    return window.TOS_DATA.chassisTemplates.find(t => t.id === mech.templateId) || window.TOS_DATA.chassisTemplates[2];
  },

  getComponent(compId) {
    return window.TOS_DATA.components.find(c => c.id === compId);
  },

  computeMechMetrics(mech) {
    const tpl = this.getMechTemplate(mech);
    let compTons = 0;
    let alphaHeat = 3; // base movement heat
    let coolingCap = tpl.baseHeatCap;
    let compCost = 0;
    let jumpJets = 0;
    let hitBonus = 0;
    let defenseBonus = 0;
    let shieldPts = 0;
    const weapons = [];

    Object.entries(mech.locations).forEach(([locCode, compIds]) => {
      compIds.forEach((cid, idx) => {
        const c = this.getComponent(cid);
        if (!c) return;
        compTons += c.tons;
        compCost += c.cost;
        if (c.heat < 0) coolingCap += Math.abs(c.heat);
        else alphaHeat += c.heat;
        if (c.id === 'jjet') jumpJets++;
        if (c.hitBonus) hitBonus += c.hitBonus;
        if (c.defenseBonus) defenseBonus += c.defenseBonus;
        if (c.id === 'shield') shieldPts += 20;
        if (c.dmg > 0) {
          weapons.push({ ...c, locCode, instanceKey: `${locCode}-${idx}-${c.id}` });
        }
      });
    });

    const totalMaxArmor = Object.values(mech.maxArmorCurrent).reduce((a, b) => a + b, 0);
    const totalCurrentArmor = Object.values(mech.armor).reduce((a, b) => a + b, 0);
    const armorTons = +(totalMaxArmor * 0.08).toFixed(1);
    const totalTons = +(tpl.baseChassisTons + compTons + armorTons).toFixed(1);
    const totalCost = tpl.baseCost + compCost + totalMaxArmor * 120;

    return {
      tpl,
      totalTons,
      maxTons: tpl.maxTons,
      alphaHeat,
      coolingCap,
      totalCost,
      totalCurrentArmor,
      totalMaxArmor,
      jumpJets,
      hitBonus,
      defenseBonus,
      shieldPts,
      weapons
    };
  }
};
