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
      reputationLevel: 1
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
        // Migrate any old 1-20 attributes to the new 1-100 scale
        (this.data.jocks || []).forEach(j => {
          if (j.stats) {
            const maxStat = Math.max(...Object.values(j.stats));
            if (maxStat <= 20) {
              Object.keys(j.stats).forEach(k => {
                j.stats[k] = Math.round(j.stats[k] * 2);
              });
            }
          }
        });
      } catch (e) {
        this.data = createDefaultState();
      }
    } else {
      this.data = createDefaultState();
    }
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

  getCalendarText() {
    this.ensureCalendar();
    const c = this.data.calendar;
    return `Year ${c.year} • Month ${c.month} • Week ${c.week}`;
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
    const st = this.data;
    const wCount = Math.max(1, Math.round(Number(weeksToAdd) || 1));

    for (let i = 0; i < wCount; i++) {
      st.calendar.totalWeeks += 1;
      this.ensureCalendar();

      // If a Jockey Job Listing is active, new applicants line up over time as weeks pass (up to 6 waiting in lobby)
      if (st.jobListing && st.jobListing.active && window.HQModule && typeof window.HQModule.generateApplicant === 'function') {
        st.jobListing.weeksActive = (st.jobListing.weeksActive || 0) + 1;
        if (st.jobListing.applicants.length < 6) {
          const arrivals = (st.jobListing.applicants.length < 5 && Math.random() < 0.35) ? 2 : 1;
          for (let a = 0; a < arrivals; a++) {
            if (st.jobListing.applicants.length >= 6) break;
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
        // Decrement monthsRemaining on Year-based or Mercenary contracts
        const expiredIds = [];
        (st.jocks || []).forEach(j => {
          if (j.contract && (j.contract.type === 'years' || j.contract.type === 'mercenary')) {
            if (typeof j.contract.monthsRemaining === 'number') {
              j.contract.monthsRemaining = Math.max(0, j.contract.monthsRemaining - 1);
              if (j.contract.monthsRemaining <= 0) {
                expiredIds.push(j.id);
              }
            }
          }
        });
        if (expiredIds.length > 0) {
          st.jocks = st.jocks.filter(j => !expiredIds.includes(j.id));
          if (expiredIds.includes(st.selectedJockId)) {
            st.selectedJockId = st.jocks[0]?.id || '';
          }
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
    if (!jock.contract) return 'Standard Charter';
    if (jock.contract.type === 'mercenary') {
      const remF = jock.contract.fightsRemaining ?? jock.contract.totalFights;
      const remM = jock.contract.monthsRemaining ?? jock.contract.totalMonths;
      return `Mercenary: ${remF}/${jock.contract.totalFights} Fights • ${remM}/${jock.contract.totalMonths} Mos`;
    }
    if (jock.contract.type === 'fights') {
      const rem = jock.contract.fightsRemaining ?? jock.contract.totalFights;
      return `${rem} / ${jock.contract.totalFights} Fights Left`;
    } else {
      const yrs = jock.contract.totalYears || 1;
      const mos = jock.contract.monthsRemaining ?? (yrs * 12);
      return `${yrs} Yr Term (${mos} Mos Left)`;
    }
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
    return Math.max(1, baseRep + bonusFromMissions);
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
    // At Company Reputation Level 1, only 3 questions can be asked per interview (2 + RepLevel)
    return 2 + this.getCompanyReputationLevel();
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
