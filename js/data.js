// Core Catalog & Reference Data for Titans of Steel Remake (Mode A: Classic Sim)

window.TOS_DATA = {
  commendations: [
    {
      id: 'first-blood',
      title: 'First Blood Ribbon',
      desc: 'Awarded for scoring a confirmed hostile Mech kill in live combat.',
      svg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
        <rect x="6" y="14" width="36" height="20" rx="4" fill="#991b1b" stroke="#f87171" stroke-width="2"/>
        <path d="M18 14V34M30 14V34" stroke="#fef08a" stroke-width="3"/>
        <circle cx="24" cy="24" r="4" fill="#fbbf24"/>
      </svg>`
    },
    {
      id: 'headhunter',
      title: 'Headhunter Cross',
      desc: 'Awarded for neutralizing an enemy Mech by destroying its Head (HD) cockpit.',
      svg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
        <polygon points="24,4 30,18 44,24 30,30 24,44 18,30 4,24 18,18" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
        <circle cx="24" cy="24" r="6" fill="#0284c7" stroke="#bae6fd" stroke-width="1.5"/>
      </svg>`
    },
    {
      id: 'core-breaker',
      title: 'Core Breaker Star',
      desc: 'Awarded for breaching an enemy Mech\'s Center Torso (CT) reactor core.',
      svg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
        <polygon points="24,4 29,16 42,18 32,27 35,40 24,33 13,40 16,27 6,18 19,16" fill="#d97706" stroke="#fef08a" stroke-width="2"/>
        <circle cx="24" cy="24" r="5" fill="#fef9c3"/>
      </svg>`
    },
    {
      id: 'leg-sweeper',
      title: 'Actuator Crippler Citation',
      desc: 'Awarded for toppling an enemy Mech by destroying both Left and Right Legs (LL & RL).',
      svg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
        <circle cx="24" cy="24" r="18" fill="#065f46" stroke="#34d399" stroke-width="2"/>
        <path d="M16 30L24 16L32 30H16Z" fill="#10b981" stroke="#d1fae5" stroke-width="1.5"/>
      </svg>`
    },
    {
      id: 'sharpshooter',
      title: 'Deadeye Marksman Medal',
      desc: 'Awarded for achieving 75%+ weapon accuracy (min 3 shots) and 50+ damage in a battle.',
      svg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
        <circle cx="24" cy="24" r="18" fill="#1e1b4b" stroke="#a78bfa" stroke-width="2"/>
        <circle cx="24" cy="24" r="10" stroke="#c4b5fd" stroke-width="1.5"/>
        <path d="M24 8V40M8 24H40" stroke="#a78bfa" stroke-width="1.5"/>
      </svg>`
    },
    {
      id: 'ironclad-survivor',
      title: 'Crimson Heart of Valor',
      desc: 'Awarded for enduring 45+ incoming armor damage in a single battle and surviving.',
      svg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
        <polygon points="24,6 40,14 40,28 24,42 8,28 8,14" fill="#881337" stroke="#fda4af" stroke-width="2"/>
        <path d="M24 15L28 24L24 33L20 24L24 15Z" fill="#f43f5e"/>
      </svg>`
    },
    {
      id: 'titan-ace',
      title: 'Order of the Titan Ace',
      desc: 'Prestigious medal awarded upon achieving 5 confirmed hostile Mech kills.',
      svg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
        <circle cx="24" cy="24" r="19" fill="#78350f" stroke="#fde047" stroke-width="2.5"/>
        <polygon points="24,9 28,19 39,19 30,26 33,37 24,30 15,37 18,26 9,19 20,19" fill="#eab308"/>
      </svg>`
    }
  ],

  companyEmblems: [
    {
      id: 'emblem-wolf',
      label: 'Iron Wolf Crest',
      svg: `<svg viewBox="0 0 64 64" width="48" height="48" fill="none">
        <polygon points="32,4 56,16 56,42 32,60 8,42 8,16" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5"/>
        <path d="M18 22L24 14L28 22L32 18L36 22L40 14L46 22L42 40L32 48L22 40L18 22Z" fill="#0284c7" stroke="#bae6fd" stroke-width="1.8"/>
        <circle cx="27" cy="30" r="2" fill="#f8fafc"/>
        <circle cx="37" cy="30" r="2" fill="#f8fafc"/>
      </svg>`
    },
    {
      id: 'emblem-skull',
      label: 'Crimson Vanguard',
      svg: `<svg viewBox="0 0 64 64" width="48" height="48" fill="none">
        <polygon points="32,4 56,16 56,42 32,60 8,42 8,16" fill="#0f172a" stroke="#f43f5e" stroke-width="2.5"/>
        <path d="M20 26C20 18 25 14 32 14C39 14 44 18 44 26C44 31 41 34 39 36V44H25V36C23 34 20 31 20 26Z" fill="#e11d48" stroke="#fecdd3" stroke-width="1.8"/>
        <circle cx="27" cy="26" r="3" fill="#0f172a"/>
        <circle cx="37" cy="26" r="3" fill="#0f172a"/>
        <path d="M29 40V44M32 40V44M35 40V44" stroke="#0f172a" stroke-width="2"/>
      </svg>`
    },
    {
      id: 'emblem-talon',
      label: 'SolarHawk Talon',
      svg: `<svg viewBox="0 0 64 64" width="48" height="48" fill="none">
        <polygon points="32,4 56,16 56,42 32,60 8,42 8,16" fill="#0f172a" stroke="#f59e0b" stroke-width="2.5"/>
        <path d="M14 24L32 32L50 24L42 40L32 50L22 40L14 24Z" fill="#d97706" stroke="#fde68a" stroke-width="1.8"/>
        <path d="M32 12L36 26L32 32L28 26L32 12Z" fill="#fef08a"/>
      </svg>`
    },
    {
      id: 'emblem-aegis',
      label: 'Emerald Aegis',
      svg: `<svg viewBox="0 0 64 64" width="48" height="48" fill="none">
        <polygon points="32,4 56,16 56,42 32,60 8,42 8,16" fill="#0f172a" stroke="#10b981" stroke-width="2.5"/>
        <path d="M34 12L20 34H31L28 50L44 28H33L34 12Z" fill="#10b981" stroke="#d1fae5" stroke-width="1.6"/>
      </svg>`
    },
    {
      id: 'emblem-suns',
      label: 'Twin Suns Nova',
      svg: `<svg viewBox="0 0 64 64" width="48" height="48" fill="none">
        <polygon points="32,4 56,16 56,42 32,60 8,42 8,16" fill="#0f172a" stroke="#8b5cf6" stroke-width="2.5"/>
        <circle cx="32" cy="32" r="12" fill="#7c3aed" stroke="#ddd6fe" stroke-width="2"/>
        <path d="M32 12V17M32 47V52M12 32H17M47 32H52M18 18L22 22M42 42L46 46M46 18L42 22M22 42L18 46" stroke="#c4b5fd" stroke-width="2.2" stroke-linecap="round"/>
      </svg>`
    },
    {
      id: 'emblem-anvil',
      label: 'Titan Forge Anvil',
      svg: `<svg viewBox="0 0 64 64" width="48" height="48" fill="none">
        <polygon points="32,4 56,16 56,42 32,60 8,42 8,16" fill="#0f172a" stroke="#94a3b8" stroke-width="2.5"/>
        <path d="M16 24H48L42 34H22L16 24ZM24 34H40L44 46H20L24 34Z" fill="#475569" stroke="#e2e8f0" stroke-width="1.8"/>
      </svg>`
    }
  ],

  commanderPortraits: [
    { id: 'cmdr_m1', gender: 'M', label: 'Young Hotshot', desc: 'Mid-20s • Lean', img: 'assets/commanders/cmdr_m1.jpg' },
    { id: 'cmdr_m2', gender: 'M', label: 'Scarred Captain', desc: 'Early 30s • Athletic', img: 'assets/commanders/cmdr_m2.jpg' },
    { id: 'cmdr_m3', gender: 'M', label: 'Bearded Bruiser', desc: 'Late 30s • Stocky', img: 'assets/commanders/cmdr_m3.jpg' },
    { id: 'cmdr_m4', gender: 'M', label: 'Silver Fox', desc: 'Mid-40s • Tall & Lean', img: 'assets/commanders/cmdr_m4.jpg' },
    { id: 'cmdr_m5', gender: 'M', label: 'Old Warhorse', desc: 'Early 50s • Heavyset', img: 'assets/commanders/cmdr_m5.jpg' },
    { id: 'cmdr_m6', gender: 'M', label: 'One-Eyed Veteran', desc: 'Late 50s • Weathered', img: 'assets/commanders/cmdr_m6.jpg' },
    { id: 'cmdr_m7', gender: 'M', label: 'Grizzled Elder', desc: '60s • Muscular', img: 'assets/commanders/cmdr_m7.jpg' },
    { id: 'cmdr_m8', gender: 'M', label: 'Wired Rookie', desc: 'Late 20s • Wiry', img: 'assets/commanders/cmdr_m8.jpg' },
    { id: 'cmdr_m9', gender: 'M', label: 'Towering Brawler', desc: 'Mid-30s • Large', img: 'assets/commanders/cmdr_m9.jpg' },
    { id: 'cmdr_m10', gender: 'M', label: 'Corporate Strategist', desc: 'Early 40s • Slim', img: 'assets/commanders/cmdr_m10.jpg' },
    { id: 'cmdr_f1', gender: 'F', label: 'Ace Pilot', desc: 'Late 20s • Athletic', img: 'assets/commanders/cmdr_f1.jpg' },
    { id: 'cmdr_f2', gender: 'F', label: 'Battle-Scarred Major', desc: 'Mid-30s • Tall & Strong', img: 'assets/commanders/cmdr_f2.jpg' },
    { id: 'cmdr_f3', gender: 'F', label: 'Veteran Colonel', desc: 'Early 40s • Sturdy', img: 'assets/commanders/cmdr_f3.jpg' },
    { id: 'cmdr_f4', gender: 'F', label: 'Iron Matriarch', desc: 'Mid-50s • Slim', img: 'assets/commanders/cmdr_f4.jpg' },
    { id: 'cmdr_f5', gender: 'F', label: 'Cyber Tech', desc: 'Early 30s • Petite', img: 'assets/commanders/cmdr_f5.jpg' }
  ],

  commanderBackgrounds: [
    { id: 'military', name: 'Ex-Military Officer', desc: 'Disciplined and tactical. Raised on formation drills and chain of command.' },
    { id: 'arena', name: 'Retired Arena Champion', desc: 'Once packed stadiums. Knows what a Jockey needs to win a crowd and a fight.' },
    { id: 'corporate', name: 'Corporate Fixer', desc: 'Contracts, contacts and margins. Never pays full price for anything.' },
    { id: 'salvager', name: 'Wasteland Salvager', desc: 'Built a company out of scrap. Knows what every bolt in a Titan is worth.' }
  ],

  companyGoals: [
    {
      id: 'wealth',
      title: 'Salvage & Fortune Syndicate',
      desc: 'Accumulate a 2,000,000 Cr mercenary war chest and build a profitable 8-Mech hangar.'
    },
    {
      id: 'champions',
      title: 'Grand Arena Champions',
      desc: 'Train an elite roster of Champion-rank MechJocks with 90%+ combat mastery.'
    },
    {
      id: 'assault',
      title: 'Heavy Assault Hegemony',
      desc: 'Engineer and field an unstoppable lance of 200-ton Assault Mechs.'
    },
    {
      id: 'custom',
      title: 'Independent Mercenary Charter',
      desc: 'Follow your own strategic objectives and mercenary doctrine across the sector.'
    }
  ],

  companyJobs: [
    {
      id: 'cmo',
      title: 'Chief Medical Officer',
      shortTitle: 'CMO',
      icon: '🩺',
      governingSkill: 'Medical (First Aid)',
      governingAttr: 'Intelligence',
      category: 'Medical & Recovery',
      desc: 'Directs triage bays, pilot trauma rehabilitation, and biological recovery wards.',
      effectDesc: 'Accelerates weekly health recovery rate for wounded & medically disabled Jockeys.',
      calcModifier(jock) {
        if (!jock) return { label: 'Field Dressings Only (+0% bonus)', value: 1.0, bonusPct: 0 };
        const skill = jock.skills?.['Medical (First Aid)'] || 30;
        const intBonus = Math.max(0, ((jock.stats?.Intelligence || 20) - 20) * 0.5);
        const bonusPct = Math.round((skill * 1.0 + intBonus) * 0.5);
        const mult = 1.0 + (bonusPct / 100);
        return {
          label: `+${bonusPct}% Medical Recovery Speed (${mult.toFixed(2)}x)`,
          value: mult,
          bonusPct: bonusPct
        };
      }
    },
    {
      id: 'leadMechanic',
      title: 'Chief Engineer / Lead Mechanic',
      shortTitle: 'Chief Engineer',
      icon: '🔧',
      governingSkill: 'Mechanic (Repair)',
      governingAttr: 'Intelligence',
      category: 'Hangar & Overhaul',
      desc: 'Supervises depot technician crews, armor replacement welds, and structural repairs.',
      effectDesc: 'Reduces Titan armor and internal chassis/component repair bills in the Garage.',
      calcModifier(jock) {
        if (!jock) return { label: 'Standard Guild Rates (5% discount)', value: 0.05, discountPct: 5 };
        const skill = jock.skills?.['Mechanic (Repair)'] || 30;
        const discountPct = Math.min(25, Math.max(5, Math.round((15 + (skill * 0.40)) * 0.5)));
        return {
          label: `${discountPct}% Repair Cost Discount`,
          value: discountPct / 100,
          discountPct: discountPct
        };
      }
    },
    {
      id: 'quartermaster',
      title: 'Quartermaster / Logistics Officer',
      shortTitle: 'Quartermaster',
      icon: '📦',
      governingSkill: 'Damage Control',
      governingAttr: 'Intelligence',
      category: 'Procurement & Supply',
      desc: 'Controls equipment supply chains, surplus parts procurement, and unit overhead.',
      effectDesc: 'Lowers component store prices in the Garage & reduces monthly payroll overhead.',
      calcModifier(jock) {
        if (!jock) return { label: 'Standard Retail (0% discount)', value: 0, discountPct: 0, payrollDiscount: 0 };
        const intStat = jock.stats?.Intelligence || 20;
        const dmgCtrl = jock.skills?.['Damage Control'] || 30;
        const discountPct = Math.min(12, Math.max(2, Math.round(((intStat - 15) * 0.5 + (dmgCtrl * 0.18)) * 0.5)));
        const payrollDiscount = Math.min(8, Math.max(1, Math.round(discountPct * 0.6)));
        return {
          label: `${discountPct}% Component Catalog Discount & ${payrollDiscount}% Payroll Savings`,
          value: discountPct / 100,
          discountPct: discountPct,
          payrollDiscount: payrollDiscount
        };
      }
    },
    {
      id: 'tacticalOfficer',
      title: 'Tactical Operations Officer',
      shortTitle: 'Tactical Officer',
      icon: '🎖️',
      governingSkill: 'Leadership',
      governingAttr: 'Instinct',
      category: 'Combat Operations',
      desc: 'Formulates firing solutions, tactical vectors, and coordinated lance strikes.',
      effectDesc: 'Grants combat firing accuracy (+% to hit) across all weapons.',
      calcModifier(jock) {
        if (!jock) return { label: 'Standard Doctrine (+0% to hit)', value: 0, hitBonus: 0 };
        const ldr = jock.skills?.['Leadership'] || 30;
        const ins = jock.stats?.Instinct || 20;
        const hitBonus = Math.min(5, Math.max(1, Math.round(((ldr * 0.08) + ((ins - 15) * 0.15)) * 0.5)));
        return {
          label: `+${hitBonus}% Firing Solution Accuracy`,
          value: hitBonus,
          hitBonus: hitBonus
        };
      }
    },
    {
      id: 'reconOfficer',
      title: 'Recon & Intelligence Officer',
      shortTitle: 'Intel Officer',
      icon: '📡',
      governingSkill: 'Recon / Scanner',
      governingAttr: 'Reflexes',
      category: 'Recon & Contracts',
      desc: 'Intercepts regional battlefield telemetry and exploits sponsor contract tolerances.',
      effectDesc: 'Increases negotiation patience (+1 strike buffer) & awards bonus bounty on victory.',
      calcModifier(jock) {
        if (!jock) return { label: 'Standard Recon (+0% bounty)', value: 0, bountyBonusPct: 0, patienceBonus: 0 };
        const recon = jock.skills?.['Recon / Scanner'] || 30;
        const bountyBonusPct = Math.min(10, Math.max(2, Math.round(recon * 0.10)));
        return {
          label: `+1 Negotiation Patience & +${bountyBonusPct}% Contract Bounty Bonus`,
          value: bountyBonusPct / 100,
          bountyBonusPct: bountyBonusPct,
          patienceBonus: 1
        };
      }
    },
    {
      id: 'safetyOfficer',
      title: 'Safety & Damage Control Officer',
      shortTitle: 'Safety Officer',
      icon: '🛡️',
      governingSkill: 'Damage Control',
      governingAttr: 'Constitution',
      category: 'Damage Control & Safety',
      desc: 'Enforces emergency reactor coolant scrams and cockpit dampening protocols.',
      effectDesc: 'Reduces pilot cockpit concussion trauma risk and aids emergency heat dissipation.',
      calcModifier(jock) {
        if (!jock) return { label: 'Standard Safety Protocols (0% bonus)', value: 0, concussionResist: 0 };
        const dmgCtrl = jock.skills?.['Damage Control'] || 30;
        const concussionResist = Math.min(13, Math.max(2, Math.round((dmgCtrl * 0.25) * 0.5)));
        return {
          label: `-${concussionResist}% Cockpit Concussion Risk & +1 Heat Dissipation`,
          value: concussionResist,
          concussionResist: concussionResist
        };
      }
    }
  ],

  personalityMilestones: [1, 4, 10, 15, 25],

  personalityTraits: [
    {
      id: 'long_haul_loyalist',
      name: 'Long-Haul Loyalist',
      icon: '🏛️',
      desc: 'Values company stability, unit loyalty, and long-term security over quick payouts.',
      contractDesc: 'Prefers Long Contracts (10+ fights or 2+ yrs): grants -15% wage discount. Charges +25% wage surcharge on short contracts (<8 fights).',
      prefersLong: true,
      longDiscount: 0.85,
      shortPenalty: 1.25,
      wageMult: 1.0,
      bonusMult: 1.0
    },
    {
      id: 'restless_drifter',
      name: 'Restless Drifter',
      icon: '🦅',
      desc: 'A wandering nomad who feels claustrophobic under long multi-year contracts.',
      contractDesc: 'Prefers Short Contracts (<=5 fights or 1 yr): normal rate. Charges +30% wage surcharge if locked into a long contract (>6 fights).',
      prefersShort: true,
      shortDiscount: 0.90,
      longPenalty: 1.30,
      wageMult: 1.0,
      bonusMult: 1.0
    },
    {
      id: 'mercenary_purist',
      name: 'Mercenary Purist',
      icon: '💰',
      desc: 'Views mech warfare strictly through the bottom line. Unsentimental and business-driven.',
      contractDesc: 'Demands +25% higher monthly wage across all contract types. Rejects lowball salary offers.',
      wageMult: 1.25,
      bonusMult: 1.0
    },
    {
      id: 'upfront_bounty_hunter',
      name: 'Upfront Bounty Hunter',
      icon: '💵',
      desc: 'Demands significant upfront cash in hand before climbing into any combat cockpit.',
      contractDesc: 'Demands +40% higher Signing Bonus, but accepts a 10% discount on monthly salary.',
      bonusMult: 1.40,
      wageMult: 0.90
    },
    {
      id: 'spartan_minimalist',
      name: 'Spartan Minimalist',
      icon: '⚔️',
      desc: 'Austere and disciplined; cares about combat readiness, not corporate luxury.',
      contractDesc: 'Accepts 15% lower monthly wage and modest signing bonuses (-20%). Easy to negotiate with (+1 Patience).',
      wageMult: 0.85,
      bonusMult: 0.80,
      patienceDelta: 1
    },
    {
      id: 'high_roller_diva',
      name: 'High-Roller Diva',
      icon: '💎',
      desc: 'Accustomed to top-shelf accommodations, celebrity per diems, and executive treatment.',
      contractDesc: 'Demands +30% higher salary AND +30% signing bonus. Has short negotiation patience (-1 Patience).',
      wageMult: 1.30,
      bonusMult: 1.30,
      patienceDelta: -1
    },
    {
      id: 'career_veteran',
      name: 'Career Veteran',
      icon: '🎖️',
      desc: 'A seasoned company hand who values a trusted commander and reliable lance mates.',
      contractDesc: 'Prefers Long Contracts (10+ fights): gives 20% wage discount. Charges +25% surcharge on short gigs (<8 fights).',
      prefersLong: true,
      longDiscount: 0.80,
      shortPenalty: 1.25,
      wageMult: 1.0,
      bonusMult: 1.0
    },
    {
      id: 'free_agent',
      name: 'Free Agent',
      icon: '🐺',
      desc: 'Guards personal autonomy fiercely; dislikes long institutional commitments.',
      contractDesc: 'Prefers Short Contracts (<=6 fights): gives 10% wage discount. Demands +25% wage surcharge on long contracts (>6 fights).',
      prefersShort: true,
      shortDiscount: 0.90,
      longPenalty: 1.25,
      wageMult: 1.0,
      bonusMult: 1.0
    },
    {
      id: 'glory_hound',
      name: 'Glory Hound',
      icon: '🏆',
      desc: 'Craves the arena spotlight and prestigious, high-visibility combat deployments.',
      contractDesc: 'Demands +20% higher signing bonus, but grants 10% wage discount on contracts with 8+ fights.',
      bonusMult: 1.20,
      prefersLong: true,
      longDiscount: 0.90,
      shortPenalty: 1.10,
      wageMult: 1.0
    },
    {
      id: 'cautious_operator',
      name: 'Cautious Operator',
      icon: '🛡️',
      desc: 'Risk-conscious pilot who demands hazard coverage and life-support assurances.',
      contractDesc: 'Demands +15% higher monthly wage and +15% signing bonus for emergency hazard reserves.',
      wageMult: 1.15,
      bonusMult: 1.15
    },
    {
      id: 'impulsive_gambler',
      name: 'Impulsive Gambler',
      icon: '🎲',
      desc: 'Loves high risk and sudden windfalls; chases big upfront cash.',
      contractDesc: 'Demands +50% higher signing bonus, but accepts a 15% discount on monthly wage.',
      bonusMult: 1.50,
      wageMult: 0.85
    },
    {
      id: 'pragmatic_professional',
      name: 'Pragmatic Professional',
      icon: '🤝',
      desc: 'Fair, measured, and dependable; honors balanced contracts without drama.',
      contractDesc: 'Balanced contract expectations; grants +1 patience during contract negotiations.',
      wageMult: 1.0,
      bonusMult: 1.0,
      patienceDelta: 1
    }
  ],

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
      label: '"Valkyrie" (Veteran Recon)',
      img: 'assets/portraits/pilot_1.jpg',
      svg: `<svg viewBox="0 0 64 64" width="54" height="54" fill="none">
        <rect width="64" height="64" rx="12" fill="#0f172a"/>
        <path d="M16 26C16 16 23 10 32 10C41 10 48 16 48 26V42C48 49 41 54 32 54C23 54 16 49 16 42V26Z" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
        <rect x="20" y="24" width="24" height="9" rx="4" fill="#0284c7" stroke="#bae6fd" stroke-width="1.5"/>
        <path d="M24 42H40" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`
    },
    {
      id: 'crimson-ace',
      label: '"Anvil" (Assault Brawler)',
      img: 'assets/portraits/pilot_2.jpg',
      svg: `<svg viewBox="0 0 64 64" width="54" height="54" fill="none">
        <rect width="64" height="64" rx="12" fill="#0f172a"/>
        <polygon points="32,8 50,20 48,46 32,56 16,46 14,20" fill="#1e293b" stroke="#f43f5e" stroke-width="2"/>
        <polygon points="20,25 44,25 40,33 24,33" fill="#e11d48" stroke="#fecdd3" stroke-width="1.5"/>
        <path d="M26 44H38" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`
    },
    {
      id: 'recon-ghost',
      label: '"Ghost" (EW Specialist)',
      img: 'assets/portraits/pilot_3.jpg',
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
      label: '"Spark" (Plasma Gunner)',
      img: 'assets/portraits/pilot_4.jpg',
      svg: `<svg viewBox="0 0 64 64" width="54" height="54" fill="none">
        <rect width="64" height="64" rx="12" fill="#0f172a"/>
        <path d="M15 24L32 10L49 24V45L32 55L15 45V24Z" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
        <rect x="21" y="25" width="22" height="8" rx="2" fill="#d97706" stroke="#fde68a" stroke-width="1.5"/>
        <path d="M32 10V21" stroke="#f59e0b" stroke-width="2.5"/>
      </svg>`
    },
    {
      id: 'iron-veteran',
      label: '"Kodiak" (Heavy Commander)',
      img: 'assets/portraits/pilot_5.jpg',
      svg: `<svg viewBox="0 0 64 64" width="54" height="54" fill="none">
        <rect width="64" height="64" rx="12" fill="#0f172a"/>
        <rect x="15" y="13" width="34" height="38" rx="6" fill="#334155" stroke="#94a3b8" stroke-width="2"/>
        <rect x="20" y="22" width="24" height="7" fill="#0f172a"/>
        <path d="M22 37H42M22 42H42" stroke="#cbd5e1" stroke-width="2"/>
      </svg>`
    },
    {
      id: 'cyber-violet',
      label: '"Spectre" (Neural Sniper)',
      img: 'assets/portraits/pilot_6.jpg',
      svg: `<svg viewBox="0 0 64 64" width="54" height="54" fill="none">
        <rect width="64" height="64" rx="12" fill="#0f172a"/>
        <rect x="16" y="12" width="32" height="40" rx="10" fill="#1e293b" stroke="#8b5cf6" stroke-width="2"/>
        <path d="M19 28H45" stroke="#a78bfa" stroke-width="4" stroke-linecap="round"/>
        <circle cx="26" cy="40" r="2.5" fill="#8b5cf6"/>
        <circle cx="38" cy="40" r="2.5" fill="#8b5cf6"/>
      </svg>`
    }
  ],

  interviewQuestions: [
    // 6 Classic Attribute Questions
    {
      id: 'attr_Constitution',
      type: 'attribute',
      target: 'Constitution',
      badge: 'ATTR: CON',
      prompt: 'How does your body hold up under high-G maneuvers, cockpit concussions, and extended campaigns?'
    },
    {
      id: 'attr_Intelligence',
      type: 'attribute',
      target: 'Intelligence',
      badge: 'ATTR: INT',
      prompt: 'Walk me through how you analyze complex battlefield telemetry and technical schematics.'
    },
    {
      id: 'attr_Instinct',
      type: 'attribute',
      target: 'Instinct',
      badge: 'ATTR: INS',
      prompt: 'When an ambush breaks out in zero visibility, how do you read the enemy\'s next move?'
    },
    {
      id: 'attr_Reflexes',
      type: 'attribute',
      target: 'Reflexes',
      badge: 'ATTR: REF',
      prompt: 'How fast is your neural trigger response when a hostile target flashes across your crosshairs?'
    },
    {
      id: 'attr_Piloting',
      type: 'attribute',
      target: 'Piloting',
      badge: 'ATTR: PIL',
      prompt: 'How well do you keep a damaged Mech upright across jagged rubble, swamp mud, or deep water?'
    },
    {
      id: 'attr_Bravery',
      type: 'attribute',
      target: 'Bravery',
      badge: 'ATTR: BRV',
      prompt: 'When your center torso armor is breached and enemy lasers are locked on you, how do you react?'
    },

    // 10 Classic Skill Questions
    {
      id: 'skill_Energy Weapons',
      type: 'skill',
      target: 'Energy Weapons',
      badge: 'SKILL: ENERGY',
      prompt: 'What is your experience managing beam focus and thermal draw on Lasers, Plasma, and Meson guns?'
    },
    {
      id: 'skill_Cannons / Ballistic',
      type: 'skill',
      target: 'Cannons / Ballistic',
      badge: 'SKILL: BALLISTIC',
      prompt: 'Tell me about leading moving targets and managing recoil with Autocannons and Gauss rifles.'
    },
    {
      id: 'skill_Guided Missiles',
      type: 'skill',
      target: 'Guided Missiles',
      badge: 'SKILL: MISSILES',
      prompt: 'How proficient are you at maintaining SRM and LRM missile locks under combat conditions?'
    },
    {
      id: 'skill_Close Combat',
      type: 'skill',
      target: 'Close Combat',
      badge: 'SKILL: MELEE',
      prompt: 'If an enemy Mech closes to 1 hex with a Power Axe or Vibro-Blade, how do you handle close combat?'
    },
    {
      id: 'skill_Recon / Scanner',
      type: 'skill',
      target: 'Recon / Scanner',
      badge: 'SKILL: RECON',
      prompt: 'How skilled are you at calibrating deep-pulse scanners and cutting through enemy ECM jamming?'
    },
    {
      id: 'skill_Damage Control',
      type: 'skill',
      target: 'Damage Control',
      badge: 'SKILL: DMG CTRL',
      prompt: 'When reactor heat redlines and actuators jam mid-battle, how do you handle emergency damage control?'
    },
    {
      id: 'skill_Leadership',
      type: 'skill',
      target: 'Leadership',
      badge: 'SKILL: LEADER',
      prompt: 'Have you ever called tactical formations or coordinated lance initiative on the comm net?'
    },
    {
      id: 'skill_Survival',
      type: 'skill',
      target: 'Survival',
      badge: 'SKILL: SURVIVAL',
      prompt: 'If a reactor goes critical, how trained are you in emergency cockpit ejection and field survival?'
    },
    {
      id: 'skill_Mechanic (Repair)',
      type: 'skill',
      target: 'Mechanic (Repair)',
      badge: 'SKILL: MECHANIC',
      prompt: 'Can you strip a damaged actuator or weld ferro-titanium armor plates in the hangar bay?'
    },
    {
      id: 'skill_Medical (First Aid)',
      type: 'skill',
      target: 'Medical (First Aid)',
      badge: 'SKILL: MEDICAL',
      prompt: 'Do you have trauma triage training to treat wounded squadmates after a rough combat drop?'
    },
    {
      id: 'skill_ChassisAffinity',
      type: 'skill',
      target: 'ChassisAffinity',
      badge: 'CHASSIS PROFILE',
      prompt: 'What Titan chassis weight classes do you have the most cockpit hours and handling comfort in?'
    }
  ],

  chassisAffinityClasses: [
    {
      key: 'Recon',
      label: 'Recon (50t)',
      modelExample: 'TAT-50R "Wasp"',
      icon: '⚡',
      desc: 'High-speed vectoring, jump thrusters, and electronic sensor scanning.',
      playstyle: 'Agile hit-and-run scout'
    },
    {
      key: 'Light',
      label: 'Light (80t)',
      modelExample: 'TAT-80L "Lynx"',
      icon: '🎯',
      desc: 'Rapid flanking, evasive movement, and sustained light laser harassment.',
      playstyle: 'Fast skirmisher & flank ambusher'
    },
    {
      key: 'Medium',
      label: 'Medium (120t)',
      modelExample: 'TAT-120M "Guillotine"',
      icon: '⚔️',
      desc: 'Balanced armor, flexible weapons loadout, and versatile duel brawling.',
      playstyle: 'Workhorse frontline duelist'
    },
    {
      key: 'Heavy',
      label: 'Heavy (160t)',
      modelExample: 'TAT-160H "Marauder"',
      icon: '🛡️',
      desc: 'Heavy composite plating, positional anchor, and high ballistic recoil absorption.',
      playstyle: 'Heavy fire support & anchor'
    },
    {
      key: 'Assault',
      label: 'Assault (200t)',
      modelExample: 'TAT-200A "Sovereign"',
      icon: '💥',
      desc: 'Superheavy siege frame, impenetrable armor envelope, and overwhelming salvo firepower.',
      playstyle: 'Unstoppable siege juggernaut'
    }
  ],

  chassisAffinityTiers: [
    { min: 100, max: 100, tier: 'Apex Specialist', badgeClass: 'green', hitBonus: 5, evadeBonus: 5, desc: 'Peak mastery; seamless neuro-link synchronization (+5% Hit, +5% Evade).' },
    { min: 80, max: 99, tier: 'Master', badgeClass: 'green', hitBonus: 4, evadeBonus: 0, desc: 'Elite muscle memory, instinctive recoil handling & actuator precision (+4% Hit).' },
    { min: 60, max: 79, tier: 'Adept', badgeClass: 'primary', hitBonus: 2, evadeBonus: 0, desc: 'Confident fire timing, responsive vector control, and smooth cycling (+2% Hit).' },
    { min: 40, max: 59, tier: 'Proficient', badgeClass: 'primary', hitBonus: 1, evadeBonus: 0, desc: 'Solid familiarity with cockpit controls, turn rates, and weapon kick (+1% Hit).' },
    { min: 20, max: 39, tier: 'Familiar', badgeClass: 'amber', hitBonus: 0, evadeBonus: 0, desc: 'Standard operating competence with chassis mass and mobility envelopes (+0% Hit).' },
    { min: 0, max: 19, tier: 'Unfamiliar', badgeClass: 'red', hitBonus: -2, evadeBonus: 0, desc: 'Cockpit feels clumsy; unpracticed recoil control and sluggish reaction (-2% Hit).' }
  ],

  chassisTemplates: [
    {
      id: 'recon-50',
      model: 'TAT-50R "Wasp"',
      weightClass: 'Recon',
      sprite: 'assets/mechs/mech_wasp.png',
      reqRepLevel: 1,
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
      sprite: 'assets/mechs/mech_lynx.png',
      reqRepLevel: 2,
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
      sprite: 'assets/mechs/mech_guillotine.png',
      reqRepLevel: 3,
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
      sprite: 'assets/mechs/mech_marauder.png',
      reqRepLevel: 4,
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
      sprite: 'assets/mechs/mech_sovereign.png',
      reqRepLevel: 5,
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
  ],

  battleClients: [
    {
      id: 'solaris',
      name: 'Solaris VII Duel Circuit',
      category: 'Gladiatorial Arena',
      badge: 'ARENA CIRCUIT',
      bountyMultiplier: 1.25,
      baseSalvagePct: 15,
      introQuote: 'The crowd wants steel, sparks, and high-stakes tonnage. Bring a clean Titan and deliver a spectacle.',
      emblem: '⚔️'
    },
    {
      id: 'mining',
      name: 'Aegis Asteroid & Mineral Syndicate',
      category: 'Corporate Defense',
      badge: 'CORP DEFENSE',
      bountyMultiplier: 1.05,
      baseSalvagePct: 30,
      introQuote: 'Rogue marauders are encroaching on our excavation claim. Secure the perimeter and salvage rights are yours.',
      emblem: '⛏️'
    },
    {
      id: 'militia',
      name: 'Colonial Security Directorate',
      category: 'Security Contract',
      badge: 'SECURITY FORCES',
      bountyMultiplier: 1.15,
      baseSalvagePct: 20,
      introQuote: 'Official bounty authorized by sector authorities. Eliminate hostile vanguard elements before civilian infrastructure is damaged.',
      emblem: '🛡️'
    },
    {
      id: 'freeholders',
      name: 'Frontier Freeholder Alliance',
      category: 'Militia League',
      badge: 'FRONTIER MILITIA',
      bountyMultiplier: 0.95,
      baseSalvagePct: 25,
      introQuote: 'We pooled our harvest credits together. We need certified MechJocks to drive off these raiders.',
      emblem: '🌾'
    }
  ],

  enemyTitans: [
    {
      id: 'en-recon',
      model: 'Hostile TAT-50R "Stinger"',
      weightClass: 'Recon (50t)',
      reqRep: 1,
      dmg: 10,
      hit: 66,
      armor: { HD: 16, CT: 30, LT: 24, RT: 24, LA: 20, RA: 20, LL: 24, RL: 24 },
      maxArmor: { HD: 16, CT: 30, LT: 24, RT: 24, LA: 20, RA: 20, LL: 24, RL: 24 },
      pilot: 'Raid Scout',
      threat: 'Low'
    },
    {
      id: 'en-light',
      model: 'Hostile TAT-80L "Jackal"',
      weightClass: 'Light (80t)',
      reqRep: 1,
      dmg: 13,
      hit: 64,
      armor: { HD: 18, CT: 42, LT: 32, RT: 32, LA: 28, RA: 28, LL: 32, RL: 32 },
      maxArmor: { HD: 18, CT: 42, LT: 32, RT: 32, LA: 28, RA: 28, LL: 32, RL: 32 },
      pilot: 'Skirmisher',
      threat: 'Moderate'
    },
    {
      id: 'en-medium',
      model: 'Hostile TAT-120M "Enforcer"',
      weightClass: 'Medium (120t)',
      reqRep: 2,
      dmg: 16,
      hit: 62,
      armor: { HD: 20, CT: 56, LT: 40, RT: 40, LA: 34, RA: 34, LL: 38, RL: 38 },
      maxArmor: { HD: 20, CT: 56, LT: 40, RT: 40, LA: 34, RA: 34, LL: 38, RL: 38 },
      pilot: 'Veteran Duelist',
      threat: 'Challenging'
    },
    {
      id: 'en-heavy',
      model: 'Hostile TAT-160H "Warhammer"',
      weightClass: 'Heavy (160t)',
      reqRep: 3,
      dmg: 20,
      hit: 68,
      armor: { HD: 24, CT: 74, LT: 54, RT: 54, LA: 46, RA: 46, LL: 52, RL: 52 },
      maxArmor: { HD: 24, CT: 74, LT: 54, RT: 54, LA: 46, RA: 46, LL: 52, RL: 52 },
      pilot: 'Syndicate Enforcer',
      threat: 'High'
    },
    {
      id: 'en-assault',
      model: 'Hostile TAT-200A "Colossus"',
      weightClass: 'Assault (200t)',
      reqRep: 4,
      dmg: 25,
      hit: 72,
      armor: { HD: 28, CT: 94, LT: 70, RT: 70, LA: 58, RA: 58, LL: 68, RL: 68 },
      maxArmor: { HD: 28, CT: 94, LT: 70, RT: 70, LA: 58, RA: 58, LL: 68, RL: 68 },
      pilot: 'Arena Champion',
      threat: 'Deadly'
    }
  ]
};

// Shown in place of any commander portrait image that has not been generated/added yet
window.CMDR_FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0f172a"/><circle cx="32" cy="24" r="11" fill="#334155"/><path d="M10 60C10 44 20 38 32 38S54 44 54 60Z" fill="#334155"/></svg>');
