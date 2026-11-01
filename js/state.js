// Persistent Game State & Calculations for Titans of Steel Remake

const STORAGE_KEY = 'TOS_REMAKE_SAVE_V1';

function createDefaultState() {
  return {
    credits: 520000,
    missionsCompleted: 0,
    selectedJockId: 'jock-1',
    selectedMechId: 'mech-1',
    selectedBodyPart: 'RA',

    jocks: [
      {
        id: 'jock-1',
        firstName: 'Marcus',
        lastName: 'Vance',
        callsign: 'Valkyrie',
        portraitId: 'visor-blue',
        bio: 'Former Solar Navy recon ace. Known for surgical laser fire and staying calm inside overheating cockpits.',
        xp: 550,
        xpSpent: 2100,
        baseSalary: 1200,
        health: 100,
        kills: 7,
        missions: 12,
        assignedMechId: 'mech-1',
        stats: {
          Constitution: 14,
          Intelligence: 16,
          Instinct: 15,
          Reflexes: 17,
          Piloting: 16,
          Bravery: 15
        },
        skills: {
          'Energy Weapons': 78,
          'Cannons / Ballistic': 50,
          'Guided Missiles': 65,
          'Close Combat': 45,
          'Recon / Scanner': 72,
          'Damage Control': 62,
          'Leadership': 55,
          'Survival': 60,
          'Mechanic (Repair)': 55,
          'Medical (First Aid)': 35
        }
      },
      {
        id: 'jock-2',
        firstName: 'Kara',
        lastName: 'Kovács',
        callsign: 'Anvil',
        portraitId: 'crimson-ace',
        bio: 'Outer Rim arena gladiator who favors heavy ballistic cannons and brutal close-quarters Power Axe strikes.',
        xp: 400,
        xpSpent: 3600,
        baseSalary: 1300,
        health: 100,
        kills: 14,
        missions: 19,
        assignedMechId: 'mech-2',
        stats: {
          Constitution: 18,
          Intelligence: 13,
          Instinct: 16,
          Reflexes: 15,
          Piloting: 17,
          Bravery: 19
        },
        skills: {
          'Energy Weapons': 55,
          'Cannons / Ballistic': 84,
          'Guided Missiles': 50,
          'Close Combat': 82,
          'Recon / Scanner': 48,
          'Damage Control': 75,
          'Leadership': 60,
          'Survival': 70,
          'Mechanic (Repair)': 70,
          'Medical (First Aid)': 40
        }
      },
      {
        id: 'jock-3',
        firstName: 'Devon',
        lastName: 'Takahashi',
        callsign: 'Ghost',
        portraitId: 'recon-ghost',
        bio: 'Electronic warfare specialist and chief squad medic. Excels at deep-scanner locks and evasive light mech piloting.',
        xp: 650,
        xpSpent: 1150,
        baseSalary: 1100,
        health: 100,
        kills: 4,
        missions: 8,
        assignedMechId: 'mech-3',
        stats: {
          Constitution: 13,
          Intelligence: 18,
          Instinct: 16,
          Reflexes: 18,
          Piloting: 17,
          Bravery: 14
        },
        skills: {
          'Energy Weapons': 64,
          'Cannons / Ballistic': 42,
          'Guided Missiles': 60,
          'Close Combat': 45,
          'Recon / Scanner': 85,
          'Damage Control': 55,
          'Leadership': 48,
          'Survival': 65,
          'Mechanic (Repair)': 48,
          'Medical (First Aid)': 74
        }
      }
    ],

    mechs: [
      {
        id: 'mech-1',
        customName: 'TAT-120M "Guillotine"',
        templateId: 'medium-120',
        armor: { HD: 18, CT: 50, LT: 38, RT: 38, LA: 32, RA: 32, LL: 38, RL: 38 },
        maxArmorCurrent: { HD: 18, CT: 50, LT: 38, RT: 38, LA: 32, RA: 32, LL: 38, RL: 38 },
        locations: {
          HD: ['bcomp'],
          CT: ['hs', 'hs'],
          LT: ['lrm10', 'hs'],
          RT: ['srm6', 'hs'],
          LA: ['hlas', 'paxe'],
          RA: ['hlas', 'mlas'],
          LL: ['jjet'],
          RL: ['jjet']
        }
      },
      {
        id: 'mech-2',
        customName: 'TAT-160H "Ironclad"',
        templateId: 'heavy-160',
        armor: { HD: 22, CT: 70, LT: 52, RT: 52, LA: 44, RA: 44, LL: 50, RL: 50 },
        maxArmorCurrent: { HD: 22, CT: 70, LT: 52, RT: 52, LA: 44, RA: 44, LL: 50, RL: 50 },
        locations: {
          HD: ['bcomp'],
          CT: ['dhs', 'hs'],
          LT: ['lrm15', 'hs'],
          RT: ['ac12', 'hs'],
          LA: ['mlas', 'vsword'],
          RA: ['ac12', 'mlas'],
          LL: ['hs'],
          RL: ['hs']
        }
      },
      {
        id: 'mech-3',
        customName: 'TAT-50R "Nightshade"',
        templateId: 'recon-50',
        armor: { HD: 14, CT: 26, LT: 20, RT: 20, LA: 16, RA: 16, LL: 20, RL: 20 },
        maxArmorCurrent: { HD: 14, CT: 26, LT: 20, RT: 20, LA: 16, RA: 16, LL: 20, RL: 20 },
        locations: {
          HD: ['ecm'],
          CT: ['hs'],
          LT: ['srm6'],
          RT: ['hs'],
          LA: ['mlas'],
          RA: ['mlas', 'slas'],
          LL: ['jjet'],
          RL: ['jjet']
        }
      }
    ],

    recruits: [
      {
        id: 'rec-1',
        firstName: 'Nadia',
        lastName: 'Chen',
        callsign: 'Spark',
        portraitId: 'cyber-violet',
        bio: 'Academy honors graduate specializing in high-output Plasma and Meson beam weaponry.',
        xp: 500,
        xpSpent: 450,
        hireCost: 6500,
        baseSalary: 950,
        stats: { Constitution: 13, Intelligence: 16, Instinct: 15, Reflexes: 17, Piloting: 15, Bravery: 14 },
        skills: {
          'Energy Weapons': 68, 'Cannons / Ballistic': 40, 'Guided Missiles': 50, 'Close Combat': 35,
          'Recon / Scanner': 60, 'Damage Control': 55, 'Leadership': 40, 'Survival': 50,
          'Mechanic (Repair)': 45, 'Medical (First Aid)': 40
        }
      },
      {
        id: 'rec-2',
        firstName: 'Viktor',
        lastName: 'Orlov',
        callsign: 'Kodiak',
        portraitId: 'iron-veteran',
        bio: 'Seasoned frontier defender with decades of experience in Heavy and Assault missile platforms.',
        xp: 350,
        xpSpent: 2200,
        hireCost: 16000,
        baseSalary: 1250,
        stats: { Constitution: 17, Intelligence: 14, Instinct: 17, Reflexes: 15, Piloting: 16, Bravery: 18 },
        skills: {
          'Energy Weapons': 55, 'Cannons / Ballistic': 68, 'Guided Missiles': 80, 'Close Combat': 55,
          'Recon / Scanner': 55, 'Damage Control': 70, 'Leadership': 65, 'Survival': 65,
          'Mechanic (Repair)': 60, 'Medical (First Aid)': 35
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
