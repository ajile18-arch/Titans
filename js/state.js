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

    // Start from complete scratch with no Jockeys and no Mechs
    jocks: [],
    mechs: [],

    // Optional Mercenary Hiring Hall applicants if the player wants to hire in addition to creating custom Jocks
    recruits: [
      {
        id: 'rec-1',
        firstName: 'Nadia',
        lastName: 'Chen',
        callsign: 'Spark',
        portraitId: 'cyber-violet',
        bio: 'Academy graduate specializing in Energy weaponry and heat management.',
        xp: 500,
        xpSpent: 0,
        hireCost: 4500,
        baseSalary: 900,
        stats: { Constitution: 22, Intelligence: 28, Instinct: 25, Reflexes: 27, Piloting: 24, Bravery: 23 },
        skills: {
          'Energy Weapons': 60, 'Cannons / Ballistic': 40, 'Guided Missiles': 45, 'Close Combat': 35,
          'Recon / Scanner': 55, 'Damage Control': 50, 'Leadership': 40, 'Survival': 45,
          'Mechanic (Repair)': 45, 'Medical (First Aid)': 40
        }
      },
      {
        id: 'rec-2',
        firstName: 'Viktor',
        lastName: 'Orlov',
        callsign: 'Kodiak',
        portraitId: 'iron-veteran',
        bio: 'Frontier defender trained in Ballistic Cannons and Guided Missile salvos.',
        xp: 500,
        xpSpent: 0,
        hireCost: 4500,
        baseSalary: 900,
        stats: { Constitution: 28, Intelligence: 21, Instinct: 25, Reflexes: 23, Piloting: 26, Bravery: 29 },
        skills: {
          'Energy Weapons': 40, 'Cannons / Ballistic': 60, 'Guided Missiles': 60, 'Close Combat': 45,
          'Recon / Scanner': 45, 'Damage Control': 55, 'Leadership': 45, 'Survival': 50,
          'Mechanic (Repair)': 50, 'Medical (First Aid)': 35
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
    const bonusFromMissions = Math.floor((st?.missionsCompleted || 0) / 4);
    return Math.max(1, baseRep + bonusFromMissions);
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
