// Persistent Game State & Calculations for Titans of Steel Remake

const STORAGE_KEY = 'TOS_REMAKE_SAVE_V2';

function createDefaultState() {
  return {
    credits: 500000,
    missionsCompleted: 0,
    selectedJockId: '',
    selectedMechId: '',
    selectedBodyPart: 'RA',

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
        stats: { Constitution: 13, Intelligence: 16, Instinct: 15, Reflexes: 16, Piloting: 14, Bravery: 14 },
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
        stats: { Constitution: 16, Intelligence: 13, Instinct: 15, Reflexes: 14, Piloting: 15, Bravery: 16 },
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
      } catch (e) {
        this.data = createDefaultState();
      }
    } else {
      this.data = createDefaultState();
    }
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

  getPortraitSvg(portraitId) {
    const p = window.TOS_DATA.portraits.find(x => x.id === portraitId) || window.TOS_DATA.portraits[0];
    return p.svg;
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
