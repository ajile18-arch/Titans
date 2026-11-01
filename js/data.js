// Core Catalog & Reference Data for Titans of Steel Remake (Mode A: Classic Sim)

window.TOS_DATA = {
  ranks: [
    { name: 'Rookie', minXpSpent: 0, salaryMult: 1.0 },
    { name: 'Green', minXpSpent: 400, salaryMult: 1.3 },
    { name: 'Regular', minXpSpent: 1000, salaryMult: 1.7 },
    { name: 'Veteran', minXpSpent: 2000, salaryMult: 2.3 },
    { name: 'Elite', minXpSpent: 3500, salaryMult: 3.1 },
    { name: 'Champion', minXpSpent: 5500, salaryMult: 4.2 }
  ],

  attributes: [
    { key: 'Constitution', abbr: 'CON', desc: 'Resists cockpit trauma, wound penalties, and blackout checks.' },
    { key: 'Intelligence', abbr: 'INT', desc: 'Governs Scanner operation, ECM warfare, Mechanic, and Medical efficiency.' },
    { key: 'Instinct', abbr: 'INS', desc: 'Improves combat initiative, indirect missile locks, and situational awareness.' },
    { key: 'Reflexes', abbr: 'REF', desc: 'Boosts direct-fire weapon accuracy and torso-twist reaction speed.' },
    { key: 'Piloting', abbr: 'PIL', desc: 'Controls stability on rough terrain, jump landings, and knockdown recovery.' },
    { key: 'Bravery', abbr: 'BRV', desc: 'Prevents panic under heavy fire or critical internal damage.' }
  ],

  skills: [
    { key: 'Energy Weapons', cat: 'Weapon', desc: 'Accuracy with Lasers, Plasma Guns, and Meson Beams.' },
    { key: 'Cannons / Ballistic', cat: 'Weapon', desc: 'Accuracy with Autocannons, Gauss Rifles, and Machine Guns.' },
    { key: 'Guided Missiles', cat: 'Weapon', desc: 'Lock-on and cluster efficiency with SRM and LRM Missile Racks.' },
    { key: 'Close Combat', cat: 'Weapon', desc: 'Hit chance with Power Axes, Vibro-Swords, Punches, and Kicks.' },
    { key: 'Recon / Scanner', cat: 'Support', desc: 'Target detection range, deep subsystem scanning, and ECM resistance.' },
    { key: 'Damage Control', cat: 'Support', desc: 'Reduces heat buildup penalties and critical system failure checks.' },
    { key: 'Leadership', cat: 'Support', desc: 'Boosts squad initiative and lowers mission upkeep overhead.' },
    { key: 'Survival', cat: 'Support', desc: 'Safe cockpit ejection and reduced pilot injury duration.' },
    { key: 'Mechanic (Repair)', cat: 'Crew', desc: 'Speeds up Titan armor and internal structure repairs in the Hangar.' },
    { key: 'Medical (First Aid)', cat: 'Crew', desc: 'Accelerates wounded Jock recovery between battles.' }
  ],

  portraits: [
    {
      id: 'visor-blue',
      label: 'Strike Visor (Cyan)',
      svg: `<svg viewBox="0 0 64 64" width="54" height="54" fill="none">
        <rect width="64" height="64" rx="12" fill="#0f172a"/>
        <path d="M16 26C16 16 23 10 32 10C41 10 48 16 48 26V42C48 49 41 54 32 54C23 54 16 49 16 42V26Z" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
        <rect x="20" y="24" width="24" height="9" rx="4" fill="#0284c7" stroke="#bae6fd" stroke-width="1.5"/>
        <path d="M24 42H40" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`
    },
    {
      id: 'crimson-ace',
      label: 'Assault Helm (Crimson)',
      svg: `<svg viewBox="0 0 64 64" width="54" height="54" fill="none">
        <rect width="64" height="64" rx="12" fill="#0f172a"/>
        <polygon points="32,8 50,20 48,46 32,56 16,46 14,20" fill="#1e293b" stroke="#f43f5e" stroke-width="2"/>
        <polygon points="20,25 44,25 40,33 24,33" fill="#e11d48" stroke="#fecdd3" stroke-width="1.5"/>
        <path d="M26 44H38" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`
    },
    {
      id: 'recon-ghost',
      label: 'Recon Optics (Emerald)',
      svg: `<svg viewBox="0 0 64 64" width="54" height="54" fill="none">
        <rect width="64" height="64" rx="12" fill="#0f172a"/>
        <circle cx="32" cy="32" r="21" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
        <circle cx="25" cy="28" r="5" fill="#10b981" stroke="#a7f3d0" stroke-width="1.5"/>
        <circle cx="39" cy="28" r="5" fill="#10b981" stroke="#a7f3d0" stroke-width="1.5"/>
        <path d="M25 42C28 45 36 45 39 42" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
      </svg>`
    },
    {
      id: 'gold-commander',
      label: 'Command Crest (Amber)',
      svg: `<svg viewBox="0 0 64 64" width="54" height="54" fill="none">
        <rect width="64" height="64" rx="12" fill="#0f172a"/>
        <path d="M15 24L32 10L49 24V45L32 55L15 45V24Z" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
        <rect x="21" y="25" width="22" height="8" rx="2" fill="#d97706" stroke="#fde68a" stroke-width="1.5"/>
        <path d="M32 10V21" stroke="#f59e0b" stroke-width="2.5"/>
      </svg>`
    },
    {
      id: 'cyber-violet',
      label: 'Neural Jack (Violet)',
      svg: `<svg viewBox="0 0 64 64" width="54" height="54" fill="none">
        <rect width="64" height="64" rx="12" fill="#0f172a"/>
        <rect x="16" y="12" width="32" height="40" rx="10" fill="#1e293b" stroke="#8b5cf6" stroke-width="2"/>
        <path d="M19 28H45" stroke="#a78bfa" stroke-width="4" stroke-linecap="round"/>
        <circle cx="26" cy="40" r="2.5" fill="#8b5cf6"/>
        <circle cx="38" cy="40" r="2.5" fill="#8b5cf6"/>
      </svg>`
    },
    {
      id: 'iron-veteran',
      label: 'Iron Guard (Steel)',
      svg: `<svg viewBox="0 0 64 64" width="54" height="54" fill="none">
        <rect width="64" height="64" rx="12" fill="#0f172a"/>
        <rect x="15" y="13" width="34" height="38" rx="6" fill="#334155" stroke="#94a3b8" stroke-width="2"/>
        <rect x="20" y="22" width="24" height="7" fill="#0f172a"/>
        <path d="M22 37H42M22 42H42" stroke="#cbd5e1" stroke-width="2"/>
      </svg>`
    }
  ],

  chassisTemplates: [
    {
      id: 'recon-50',
      model: 'TAT-50R "Wasp"',
      weightClass: 'Recon',
      maxTons: 50,
      baseChassisTons: 20,
      baseSpeedHex: 7,
      baseHeatCap: 20,
      baseCost: 75000,
      slotLimits: { HD: 4, CT: 6, LT: 6, RT: 6, LA: 5, RA: 5, LL: 4, RL: 4 },
      maxArmor: { HD: 16, CT: 30, LT: 24, RT: 24, LA: 20, RA: 20, LL: 24, RL: 24 }
    },
    {
      id: 'light-80',
      model: 'TAT-80L "Lynx"',
      weightClass: 'Light',
      maxTons: 80,
      baseChassisTons: 32,
      baseSpeedHex: 6,
      baseHeatCap: 24,
      baseCost: 125000,
      slotLimits: { HD: 4, CT: 7, LT: 7, RT: 7, LA: 6, RA: 6, LL: 4, RL: 4 },
      maxArmor: { HD: 18, CT: 42, LT: 32, RT: 32, LA: 28, RA: 28, LL: 32, RL: 32 }
    },
    {
      id: 'medium-120',
      model: 'TAT-120M "Guillotine"',
      weightClass: 'Medium',
      maxTons: 120,
      baseChassisTons: 48,
      baseSpeedHex: 5,
      baseHeatCap: 28,
      baseCost: 195000,
      slotLimits: { HD: 4, CT: 8, LT: 8, RT: 8, LA: 6, RA: 6, LL: 4, RL: 4 },
      maxArmor: { HD: 20, CT: 55, LT: 42, RT: 42, LA: 36, RA: 36, LL: 42, RL: 42 }
    },
    {
      id: 'heavy-160',
      model: 'TAT-160H "Marauder"',
      weightClass: 'Heavy',
      maxTons: 160,
      baseChassisTons: 64,
      baseSpeedHex: 4,
      baseHeatCap: 34,
      baseCost: 290000,
      slotLimits: { HD: 4, CT: 10, LT: 10, RT: 10, LA: 8, RA: 8, LL: 5, RL: 5 },
      maxArmor: { HD: 24, CT: 75, LT: 56, RT: 56, LA: 48, RA: 48, LL: 56, RL: 56 }
    },
    {
      id: 'assault-200',
      model: 'TAT-200A "Sovereign"',
      weightClass: 'Assault',
      maxTons: 200,
      baseChassisTons: 80,
      baseSpeedHex: 3,
      baseHeatCap: 40,
      baseCost: 420000,
      slotLimits: { HD: 4, CT: 12, LT: 12, RT: 12, LA: 9, RA: 9, LL: 6, RL: 6 },
      maxArmor: { HD: 28, CT: 95, LT: 72, RT: 72, LA: 60, RA: 60, LL: 72, RL: 72 }
    }
  ],

  components: [
    // Energy Weapons
    { id: 'slas', name: 'Small Laser', cat: 'Energy Weapons', tons: 1.5, slots: 1, dmg: 6, heat: 3, sec: 3, range: 4, cost: 6000 },
    { id: 'mlas', name: 'Medium Laser', cat: 'Energy Weapons', tons: 3.0, slots: 1, dmg: 10, heat: 5, sec: 4, range: 7, cost: 11000 },
    { id: 'hlas', name: 'Heavy Laser', cat: 'Energy Weapons', tons: 5.0, slots: 2, dmg: 16, heat: 9, sec: 6, range: 10, cost: 18000 },
    { id: 'pgun', name: 'Plasma Rifle', cat: 'Energy Weapons', tons: 8.0, slots: 3, dmg: 22, heat: 13, sec: 7, range: 11, cost: 32000 },
    { id: 'meson', name: 'Meson Gun', cat: 'Energy Weapons', tons: 11.0, slots: 4, dmg: 28, heat: 16, sec: 9, range: 14, cost: 48000 },

    // Cannons / Ballistic
    { id: 'mg', name: 'Heavy Machine Gun', cat: 'Cannons / Ballistic', tons: 2.0, slots: 1, dmg: 5, heat: 1, sec: 2, range: 4, cost: 5000 },
    { id: 'ac8', name: 'Autocannon / 8', cat: 'Cannons / Ballistic', tons: 6.5, slots: 2, dmg: 12, heat: 2, sec: 4, range: 9, cost: 16000 },
    { id: 'ac12', name: 'Autocannon / 12', cat: 'Cannons / Ballistic', tons: 9.5, slots: 3, dmg: 18, heat: 4, sec: 5, range: 8, cost: 24000 },
    { id: 'ac20', name: 'Autocannon / 20', cat: 'Cannons / Ballistic', tons: 14.0, slots: 4, dmg: 26, heat: 6, sec: 7, range: 5, cost: 38000 },
    { id: 'gauss', name: 'Gauss Cannon', cat: 'Cannons / Ballistic', tons: 13.0, slots: 4, dmg: 24, heat: 2, sec: 8, range: 15, cost: 45000 },

    // Guided Missiles
    { id: 'srm6', name: 'SRM-6 Rack', cat: 'Guided Missiles', tons: 3.5, slots: 1, dmg: 12, heat: 4, sec: 4, range: 6, cost: 12000 },
    { id: 'lrm10', name: 'LRM-10 Launcher', cat: 'Guided Missiles', tons: 6.0, slots: 2, dmg: 14, heat: 5, sec: 6, range: 16, cost: 21000 },
    { id: 'lrm15', name: 'LRM-15 Launcher', cat: 'Guided Missiles', tons: 9.0, slots: 3, dmg: 21, heat: 7, sec: 7, range: 16, cost: 31000 },

    // Close Combat
    { id: 'paxe', name: 'Power Axe', cat: 'Close Combat', tons: 4.0, slots: 2, dmg: 18, heat: 1, sec: 4, range: 1, cost: 12000 },
    { id: 'vsword', name: 'Vibro-Blade', cat: 'Close Combat', tons: 5.5, slots: 2, dmg: 24, heat: 2, sec: 4, range: 1, cost: 19000 },

    // Cooling, Mobility & Support Systems
    { id: 'hs', name: 'Heat Sink (+3 Cool)', cat: 'Support', tons: 2.0, slots: 1, dmg: 0, heat: -3, sec: 0, range: 0, cost: 6000 },
    { id: 'dhs', name: 'Cryo Heat Sink (+6 Cool)', cat: 'Support', tons: 3.5, slots: 2, dmg: 0, heat: -6, sec: 0, range: 0, cost: 14000 },
    { id: 'jjet', name: 'Jump Jet Thruster', cat: 'Support', tons: 2.0, slots: 1, dmg: 0, heat: 2, sec: 0, range: 0, cost: 8000 },
    { id: 'bcomp', name: 'Battle Computer (+8% Hit)', cat: 'Support', tons: 3.0, slots: 2, dmg: 0, heat: 1, sec: 0, range: 0, cost: 22000, hitBonus: 8 },
    { id: 'ecm', name: 'ECM Jammer Suite', cat: 'Support', tons: 3.5, slots: 2, dmg: 0, heat: 2, sec: 0, range: 0, cost: 26000, defenseBonus: 10 },
    { id: 'shield', name: 'Deflector Shield (+20 Shd)', cat: 'Support', tons: 6.0, slots: 3, dmg: 0, heat: 3, sec: 0, range: 0, cost: 34000 }
  ],

  locationOrder: [
    { code: 'HD', name: 'Head (HD)' },
    { code: 'CT', name: 'Center Torso (CT)' },
    { code: 'LT', name: 'Left Torso (LT)' },
    { code: 'RT', name: 'Right Torso (RT)' },
    { code: 'LA', name: 'Left Arm (LA)' },
    { code: 'RA', name: 'Right Arm (RA)' },
    { code: 'LL', name: 'Left Leg (LL)' },
    { code: 'RL', name: 'Right Leg (RL)' }
  ]
};
