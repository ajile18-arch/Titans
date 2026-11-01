// HQ & Jockey Management Module — Featuring Mercenary Job Posting, Interview & Wage Negotiation

window.HQModule = {
  creatorOpen: false,
  editMode: false,
  selectedPortraitId: 'visor-blue',

  // Dedicated Jockey Information Page & Sub-Tab State
  jockeyPageOpen: false,
  jockeySubTab: 'dossier', // 'dossier' | 'history'

  // Job Posting & Interview State
  offeredBonusInput: 5000,
  interviewOpen: false,
  candidate: null,
  askedQuestions: {},
  proposedWage: 1200,
  proposedBonus: 5000,
  proposedContractType: 'years', // 'years' or 'fights'
  proposedYears: 2,
  proposedFights: 10,
  negotiationMessage: '',
  candidateWalkedOut: false,

  render() {
    const st = window.GameState.data;
    const container = document.getElementById('view-hq');
    if (!container) return;

    const jock = st.jocks.find(j => j.id === st.selectedJockId) || st.jocks[0];
    if (jock && st.selectedJockId !== jock.id) st.selectedJockId = jock.id;
    if (!jock) this.jockeyPageOpen = false;

    // Dedicated Single-Jockey Information Page (Only the chosen Jockey's information + History & Awards Tab)
    if (this.jockeyPageOpen && jock) {
      container.innerHTML = `
        ${this.renderDedicatedJockeyPage(jock)}
        ${this.renderCreatorModal(jock)}
      `;
      return;
    }

    // Best Squad Mechanic & Medic
    const bestMechanic = st.jocks.reduce((best, j) => (j.skills['Mechanic (Repair)'] > (best?.skills['Mechanic (Repair)'] || 0) ? j : best), null);
    const bestMedic = st.jocks.reduce((best, j) => (j.skills['Medical (First Aid)'] > (best?.skills['Medical (First Aid)'] || 0) ? j : best), null);
    const comp = st.company || {};
    const goalObj = (window.TOS_DATA.companyGoals || []).find(g => g.id === comp.goalId) || window.TOS_DATA.companyGoals[0];

    container.innerHTML = `
      <!-- Company Charter Banner -->
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:14px;">
          <div style="display:flex; align-items:center; gap:14px;">
            <div class="panel" style="padding:8px; display:flex; align-items:center; justify-content:center;">
              ${window.GameState.getCompanyEmblemSvg(comp.emblemId)}
            </div>
            <div>
              <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px;">
                <h2 style="font-size:18px; font-weight:800;">${comp.name || 'Unregistered Mercenary Unit'}</h2>
                <span class="badge primary">Cmdr. ${comp.commander || 'Commander'}</span>
                <span class="badge amber mono">Reputation Lvl ${window.GameState.getCompanyReputationLevel()} (${window.GameState.getMaxInterviewQuestions()} Interview Qs)</span>
                <span class="badge green">${goalObj ? goalObj.title : 'Mercenary Charter'}</span>
              </div>
              <div style="font-style:italic; color:#93c5fd; font-size:13px; margin-top:2px;">"${comp.motto || 'Steel Before Surrender'}"</div>
              <div class="subtext" style="margin-top:4px;"><strong>Company Goal:</strong> ${comp.customGoals || (goalObj ? goalObj.desc : '')}</div>
            </div>
          </div>
          <button class="btn" onclick="App.openCompanyCreator(false)">Edit Company Charter</button>
        </div>
      </div>

      <div class="grid-12">
        <!-- Left 4 Cols: Active Jock Roster + Recruitment Job Board + Crew Support -->
        <div class="col-4" style="display:flex; flex-direction:column; gap:16px;">
          
          <!-- Mercenary Recruitment Job Posting Card -->
          <div class="card" style="border-color:var(--primary);">
            <div class="section-header">
              <div>
                <div class="section-title">Recruit Jockey — Post Job Listing</div>
                <div class="subtext">Set your Signing Bonus offer to attract applicants for an interview</div>
              </div>
              <span class="badge primary">Interview Room</span>
            </div>

            <div class="panel" style="display:flex; flex-direction:column; gap:10px;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <label class="subtext" style="font-weight:600;">Advertised Signing Bonus (Cr):</label>
                  <span class="mono" style="font-weight:700; color:var(--accent-green);" id="bonus-tier-hint">
                    ${this.getBonusTierLabel(this.offeredBonusInput)}
                  </span>
                </div>
                <input
                  id="inp-signing-bonus"
                  type="number"
                  min="1000"
                  max="50000"
                  step="500"
                  class="input mono"
                  style="margin-top:6px; font-weight:700; font-size:15px;"
                  value="${this.offeredBonusInput}"
                  oninput="HQModule.updateBonusPreview(this.value)"
                />
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
                  <button class="btn" style="padding:3px 8px;" onclick="HQModule.setQuickBonus(2000)">2,000 Cr (Rookie)</button>
                  <button class="btn" style="padding:3px 8px;" onclick="HQModule.setQuickBonus(6000)">6,000 Cr (Regular)</button>
                  <button class="btn" style="padding:3px 8px;" onclick="HQModule.setQuickBonus(14000)">14,000 Cr (Veteran)</button>
                  <button class="btn" style="padding:3px 8px;" onclick="HQModule.setQuickBonus(25000)">25,000 Cr (Elite)</button>
                </div>
              </div>

              <div class="subtext" style="line-height:1.4;">
                Higher signing bonuses attract more experienced pilots and make them more flexible during monthly wage negotiations. You only pay the bonus if you hire them.
              </div>

              <button class="btn btn-primary" style="padding:10px; font-size:13px;" ${st.jocks.length >= 8 ? 'disabled' : ''} onclick="HQModule.startJobInterview()">
                Post Offer &amp; Interview Next Applicant (+1 Wk) &rarr;
              </button>
            </div>
          </div>

          <!-- Squad Roster Card -->
          <div class="card">
            <div class="section-header">
              <div>
                <div class="section-title">Active Squad Jocks (${st.jocks.length} / 8)</div>
                <div class="subtext">Click a Jockey's name to open their dedicated Jockey Information Page</div>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${st.jocks.length === 0 ? `
                <div class="panel subtext" style="text-align:center; padding:18px 12px;">
                  No Jocks on your payroll yet.<br/>Interview a long-term Jockey above or hire a short-term Flat-Fee Mercenary below!
                </div>
              ` : st.jocks.map(j => {
                const rk = window.GameState.getJockRank(j);
                const mech = st.mechs.find(m => m.id === j.assignedMechId);
                const isSel = j.id === jock?.id;
                const isMerc = j.contract?.type === 'mercenary';
                const awardsCount = (j.awards || []).length;
                return `
                  <div class="list-item ${isSel ? 'selected' : ''}" onclick="HQModule.openJockeyPage('${j.id}')">
                    <div style="display:flex; align-items:center; gap:10px;">
                      <div style="flex-shrink:0;">${window.GameState.getPortraitSvg(j.portraitId)}</div>
                      <div style="flex:1; min-width:0;">
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
                          <a href="javascript:void(0)" onclick="event.stopPropagation(); HQModule.openJockeyPage('${j.id}')" style="font-size:14px; font-weight:800; color:#93c5fd; text-decoration:underline;">
                            ${j.firstName} "${j.callsign}" ${j.lastName} &rarr;
                          </a>
                          <span class="badge ${isMerc ? 'amber' : 'primary'}">${isMerc ? 'Mercenary' : rk.name}</span>
                        </div>
                        <div class="subtext" style="margin-top:2px;">
                          Titan: <strong>${mech ? mech.customName : 'Unassigned'}</strong> • <span class="mono">${window.GameState.getContractSummary(j)}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:12px;">
                          <span class="mono" style="color:var(--accent-green); font-weight:700;">${j.xp} XP • ${awardsCount} Award${awardsCount === 1 ? '' : 's'}</span>
                          <span class="mono subtext">${isMerc ? 'Flat Fee Paid (0 Cr/mo)' : 'Wage: ' + window.GameState.getJockSalary(j).toLocaleString() + ' Cr/mo'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Hire Short-Term Mercenary (Flat Fee / Short Time & Small Number of Fights) -->
          <div class="card">
            <div class="section-header">
              <div>
                <div class="section-title">Hire Mercenary (Short-Term Flat Fee)</div>
                <div class="subtext">Short duration &amp; small fight count for a single flat fee (0 Cr/mo wage)</div>
              </div>
              <button class="btn" onclick="HQModule.refreshMercenaries()" title="Refresh Available Mercenaries (-500 Cr)">Refresh</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px;">
              ${(st.recruits || []).length === 0 ? `
                <div class="panel subtext">No freelance mercenaries currently in sector. Click Refresh above.</div>
              ` : st.recruits.map((r, idx) => `
                <div class="panel" style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                  <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
                    <div style="flex-shrink:0;">${window.GameState.getPortraitSvg(r.portraitId, 52)}</div>
                    <div style="flex:1; min-width:0;">
                      <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                        <strong>${r.firstName} "${r.callsign}" ${r.lastName}</strong>
                        <span class="badge amber mono">${r.termMonths} Mo${r.termMonths > 1 ? 's' : ''} / ${r.termFights} Fight${r.termFights > 1 ? 's' : ''}</span>
                      </div>
                      <div class="subtext" style="margin-top:2px;">${r.bio}</div>
                      <div class="mono" style="font-size:12px; margin-top:4px; color:var(--accent-green); font-weight:700;">
                        Flat Fee: ${(r.flatFee || 6500).toLocaleString()} Cr <span class="subtext" style="font-weight:400;">(0 Cr/mo Wage)</span>
                      </div>
                    </div>
                  </div>
                  <button class="btn btn-primary" ${st.jocks.length >= 8 ? 'disabled' : ''} onclick="HQModule.hireMercenary(${idx})">
                    Hire Merc
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Classic Crew Skills Summary (Mechanic & Medical) -->
          <div class="card">
            <div class="section-header">
              <div>
                <div class="section-title">Squad Technical &amp; Medical Crew</div>
                <div class="subtext">Powered by your Jocks' Mechanic &amp; Medical skills</div>
              </div>
            </div>
            <div class="panel" style="display:flex; flex-direction:column; gap:8px; font-size:13px;">
              <div style="display:flex; justify-content:space-between;">
                <span class="subtext">Lead Mechanic:</span>
                <strong>${bestMechanic ? `${bestMechanic.callsign} (${bestMechanic.skills['Mechanic (Repair)']}% Skill)` : 'None'}</strong>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span class="subtext">Lead Medic:</span>
                <strong>${bestMedic ? `${bestMedic.callsign} (${bestMedic.skills['Medical (First Aid)']}% Skill)` : 'None'}</strong>
              </div>
              <div style="display:flex; gap:8px; padding-top:6px;">
                <button class="btn" style="flex:1;" onclick="HQModule.repairAllMechs()">Repair All Mechs (+2 Wks)</button>
                <button class="btn" style="flex:1;" onclick="HQModule.healAllJocks()">Treat Wounded Jocks (+2 Wks)</button>
              </div>
            </div>
          </div>

        </div>

        <!-- Right 8 Cols: Company Roster Overview (Click any Jockey's name to open Dedicated Jockey Page) -->
        <div class="col-8" style="display:flex; flex-direction:column; gap:16px;">
          ${st.jocks.length > 0 ? this.renderSquadOverviewDirectory() : `
            <div class="card" style="padding:36px 28px; text-align:center; align-items:center; gap:16px;">
              <span class="badge primary">RECRUITMENT &amp; INTERVIEW OFFICE</span>
              <h2 style="font-size:22px; font-weight:800;">No MechJocks Under Contract Yet</h2>
              <p class="subtext" style="max-width:560px; font-size:14px;">
                To recruit your first MechJock, specify how much you are willing to offer as a <strong>Signing Bonus</strong> in the Recruitment panel on the left, then conduct a <strong>Job Interview</strong> to probe their combat background and negotiate their monthly wage!
              </p>
              <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center; margin-top:6px;">
                <button class="btn btn-primary" style="padding:10px 18px; font-size:13px;" onclick="HQModule.startJobInterview()">
                  1. Interview a Jockey Applicant (${this.offeredBonusInput.toLocaleString()} Cr Bonus Offer)
                </button>
                <button class="btn" style="padding:10px 18px; font-size:13px;" onclick="App.switchTab('garage')">
                  2. Commission a Mech in Garage &rarr;
                </button>
              </div>
            </div>
          `}
        </div>
      </div>

      ${this.renderInterviewModal()}
      ${this.renderCreatorModal(jock)}
    `;
  },

  getBonusTierLabel(bonus) {
    const b = Number(bonus) || 0;
    if (b < 3500) return 'Attracts: Rookies & Green Pilots';
    if (b < 9000) return 'Attracts: Regular & Capable Jocks';
    if (b < 18000) return 'Attracts: Hardened Veterans';
    return 'Attracts: Elite Aces & Champions';
  },

  updateBonusPreview(val) {
    this.offeredBonusInput = Math.max(500, Number(val) || 1000);
    const hint = document.getElementById('bonus-tier-hint');
    if (hint) hint.textContent = this.getBonusTierLabel(this.offeredBonusInput);
  },

  setQuickBonus(amount) {
    this.offeredBonusInput = amount;
    this.render();
  },

  // Generate an applicant scaled to the player's Signing Bonus offer
  generateApplicant(offeredBonus) {
    const firstNames = ['Marcus', 'Kara', 'Devon', 'Soren', 'Nadia', 'Viktor', 'Elena', 'Jaxon', 'Lyra', 'Gideon', 'Talia', 'Ronan'];
    const lastNames = ['Vance', 'Kovács', 'Takahashi', 'Lindqvist', 'Chen', 'Orlov', 'Rostova', 'Miller', 'Moreau', 'Kael', 'Sterling', 'Holt'];
    const callsigns = ['Valkyrie', 'Anvil', 'Ghost', 'Spark', 'Kodiak', 'Spectre', 'Brimstone', 'Lynx', 'Striker', 'Wrench', 'Nova', 'Sundown'];
    const bios = [
      'Former orbital defense pilot looking for steady mercenary contract pay.',
      'Arena circuit competitor who prefers aggressive engagements and heavy armor.',
      'Frontier scout pilot experienced in electronic warfare and long-range patrols.',
      'Simulator honors graduate eager to prove themselves in live-fire Titan combat.',
      'Veteran militia officer who survived three planetary campaigns.'
    ];

    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const portrait = pick(window.TOS_DATA.portraits);

    // Tier factor from 0.0 (1,000 Cr) to 1.0 (25,000+ Cr)
    const tier = Math.min(1.0, Math.max(0.0, (offeredBonus - 1000) / 22000));
    const randRange = (min, max) => Math.round(min + Math.random() * (max - min));

    // Generate 6 Classic Attributes on a 1–100 scale (starting recruits roll 15–48 so maxing to 100 takes a long career)
    const baseAttr = Math.round(18 + tier * 20);
    const stats = {
      Constitution: Math.min(55, Math.max(12, baseAttr + randRange(-6, 10))),
      Intelligence: Math.min(55, Math.max(12, baseAttr + randRange(-6, 10))),
      Instinct: Math.min(55, Math.max(12, baseAttr + randRange(-6, 10))),
      Reflexes: Math.min(55, Math.max(12, baseAttr + randRange(-6, 10))),
      Piloting: Math.min(55, Math.max(12, baseAttr + randRange(-6, 10))),
      Bravery: Math.min(55, Math.max(12, baseAttr + randRange(-6, 10)))
    };

    // Pick 1 primary weapon specialty and 1 secondary weapon skill
    const weaponKeys = ['Energy Weapons', 'Cannons / Ballistic', 'Guided Missiles', 'Close Combat'];
    const primaryWeapon = pick(weaponKeys);
    const baseSkill = Math.round(32 + tier * 34);

    const skills = {};
    weaponKeys.forEach(wk => {
      if (wk === primaryWeapon) {
        skills[wk] = Math.min(82, baseSkill + randRange(6, 15));
      } else {
        skills[wk] = Math.min(75, Math.max(20, baseSkill + randRange(-14, 6)));
      }
    });

    skills['Recon / Scanner'] = Math.min(80, Math.max(20, baseSkill + randRange(-12, 12)));
    skills['Damage Control'] = Math.min(80, Math.max(20, baseSkill + randRange(-10, 10)));
    skills['Leadership'] = Math.min(78, Math.max(20, baseSkill + randRange(-14, 8)));
    skills['Survival'] = Math.min(80, Math.max(25, baseSkill + randRange(-10, 10)));
    skills['Mechanic (Repair)'] = Math.min(80, Math.max(20, baseSkill + randRange(-14, 15)));
    skills['Medical (First Aid)'] = Math.min(80, Math.max(20, baseSkill + randRange(-14, 15)));

    // Calculate candidate's true skill score to determine XP spent & wage expectations
    const avgAttr = Object.values(stats).reduce((a, b) => a + b, 0) / 6;
    const maxWep = Math.max(...weaponKeys.map(k => skills[k]));
    const xpSpent = Math.max(0, Math.round((tier * 3600) + randRange(-200, 400)));

    // Desired monthly wage & minimum acceptable wage
    const fairBonus = Math.round(2000 + tier * 18000);
    const bonusDiff = offeredBonus - fairBonus; // positive if player offered a generous signing bonus
    const baseAskingWage = Math.round(750 + tier * 1850 - (bonusDiff * 0.04));
    const askingWage = Math.max(500, Math.round(baseAskingWage / 50) * 50);
    const minWage = Math.max(400, Math.round((askingWage * 0.78) / 50) * 50);

    return {
      firstName: pick(firstNames),
      lastName: pick(lastNames),
      callsign: pick(callsigns),
      portraitId: portrait.id,
      bio: pick(bios),
      xp: randRange(300, 650),
      xpSpent,
      stats,
      skills,
      primaryWeapon,
      avgAttr,
      maxWep,
      fairBonus,
      askingWage,
      minWage,
      patience: 3
    };
  },

  startJobInterview() {
    const st = window.GameState.data;
    const bonusInput = document.getElementById('inp-signing-bonus');
    if (bonusInput) this.offeredBonusInput = Math.max(500, Number(bonusInput.value) || 2000);

    if (st.credits < this.offeredBonusInput) {
      alert(`Insufficient treasury funds to back a ${this.offeredBonusInput.toLocaleString()} Cr signing bonus offer!`);
      return;
    }

    this.candidate = this.generateApplicant(this.offeredBonusInput);
    this.askedQuestions = {};
    this.proposedBonus = this.offeredBonusInput;
    this.proposedWage = this.candidate.askingWage;
    this.proposedContractType = 'years';
    this.proposedYears = 2;
    this.proposedFights = 10;
    this.candidateWalkedOut = false;
    this.negotiationMessage = `"Thanks for bringing me in, Commander. With a ${this.proposedBonus.toLocaleString()} Cr signing bonus on the table, I'm looking for ${this.candidate.askingWage.toLocaleString()} Cr per month on a standard 2-Year (or 10-Fight) contract. Feel free to ask me anything about my cockpit record."`;
    this.interviewOpen = true;
    window.GameState.advanceTimeWeeks(1, `Recruiting Interview: ${this.candidate.callsign}`);
    this.render();
  },

  askInterviewQuestion(qId) {
    if (!this.candidate || this.candidateWalkedOut) return;
    if (this.askedQuestions[qId]) return;

    const maxAllowed = window.GameState.getMaxInterviewQuestions();
    const currentAsked = Object.keys(this.askedQuestions).length;
    if (currentAsked >= maxAllowed) return;

    const qObj = (window.TOS_DATA.interviewQuestions || []).find(q => q.id === qId);
    if (!qObj) return;

    const c = this.candidate;
    let reply = '';
    let clue = '';

    if (qObj.type === 'attribute') {
      const attrName = qObj.target;
      const val = c.stats[attrName] || 20;
      const estLow = Math.max(10, val - 3);
      const estHigh = Math.min(100, val + 3);

      if (val >= 38) {
        reply = `"${attrName} is one of my strongest natural traits, Commander. In academy testing and live drops, I consistently ranked in the top tier."`;
        clue = `${attrName} Reading: Gifted / High (Est. ${estLow}–${estHigh} / 100)`;
      } else if (val >= 25) {
        reply = `"I hold my own when it comes to ${attrName}. I'm reliable under standard combat conditions, with room to grow over a long campaign."`;
        clue = `${attrName} Reading: Solid / Average (Est. ${estLow}–${estHigh} / 100)`;
      } else {
        reply = `"I'll be honest with you—${attrName} has never been my strong suit. I try to compensate for it with positioning and preparation."`;
        clue = `${attrName} Reading: Raw / Low (Est. ${estLow}–${estHigh} / 100)`;
      }
    } else {
      const skillName = qObj.target;
      const val = c.skills[skillName] || 35;
      const estLow = Math.max(15, val - 4);
      const estHigh = Math.min(100, val + 4);

      if (val >= 72) {
        reply = `"${skillName} is my bread and butter. Give me the right equipment and I'll outperform almost anyone in the sector."`;
        clue = `${skillName} Reading: Veteran Mastery (Est. ${estLow}%–${estHigh}%)`;
      } else if (val >= 52) {
        reply = `"I'm combat-certified in ${skillName} and have logged plenty of hours with it, though I'm not a master specialist yet."`;
        clue = `${skillName} Reading: Competent / Trained (Est. ${estLow}%–${estHigh}%)`;
      } else {
        reply = `"I only have basic academy familiarity with ${skillName}. If you need a specialist there right away, you'll have to train me up."`;
        clue = `${skillName} Reading: Novice / Untrained (Est. ${estLow}%–${estHigh}%)`;
      }
    }

    this.askedQuestions[qId] = {
      q: `${qObj.badge} — ${qObj.prompt}`,
      reply,
      clue
    };

    this.render();
  },

  updateNegotiationInputs() {
    const wEl = document.getElementById('neg-inp-wage');
    const bEl = document.getElementById('neg-inp-bonus');
    const yEl = document.getElementById('neg-inp-years');
    const fEl = document.getElementById('neg-inp-fights');
    if (wEl) this.proposedWage = Math.max(200, Number(wEl.value) || 500);
    if (bEl) this.proposedBonus = Math.max(500, Number(bEl.value) || 1000);
    if (yEl) this.proposedYears = Math.max(1, Number(yEl.value) || 2);
    if (fEl) this.proposedFights = Math.max(1, Number(fEl.value) || 10);
  },

  setContractType(type) {
    this.updateNegotiationInputs();
    this.proposedContractType = type;
    this.render();
  },

  getContractTermLabel() {
    if (this.proposedContractType === 'fights') {
      return `${this.proposedFights}-Fight Contract`;
    }
    return `${this.proposedYears}-Year Contract`;
  },

  // Longer contracts require slightly more signing bonus or wage security to lock the pilot in
  getContractLengthModifier() {
    if (this.proposedContractType === 'fights') {
      return Math.round((this.proposedFights - 10) * 18);
    }
    return Math.round((this.proposedYears - 2) * 85);
  },

  testCounterOffer() {
    if (!this.candidate || this.candidateWalkedOut) return;
    this.updateNegotiationInputs();
    const c = this.candidate;
    const termLabel = this.getContractTermLabel();
    const lengthMod = this.getContractLengthModifier();
    const targetAsking = Math.max(450, c.askingWage + lengthMod);
    const targetMin = Math.max(350, c.minWage + Math.round(lengthMod * 0.7));

    // Effective monthly value combines wage + amortized bonus difference
    const bonusAdjustment = Math.round((this.proposedBonus - this.offeredBonusInput) * 0.05);
    const effectiveWageOffer = this.proposedWage + bonusAdjustment;

    if (effectiveWageOffer >= targetAsking) {
      this.negotiationMessage = `"${this.proposedBonus.toLocaleString()} Cr signing bonus and ${this.proposedWage.toLocaleString()} Cr/mo on a ${termLabel}? That's a square deal, Commander. Put the contract in front of me and I'll sign right now!"`;
    } else if (effectiveWageOffer >= targetMin) {
      c.patience -= 1;
      if (c.patience <= 0) {
        this.candidateWalkedOut = true;
        this.negotiationMessage = `"We've been haggling in circles over nickels and dimes while I put my life on the line in a reactor core. I'm withdrawing my application."`;
      } else {
        const counter = Math.round(((this.proposedWage + targetAsking) / 2) / 50) * 50;
        c.askingWage = Math.max(450, counter - lengthMod);
        this.negotiationMessage = `"Hmm... locking into a ${termLabel} at ${this.proposedWage.toLocaleString()} Cr/mo is a bit tight for my skill set. Meet me at ${counter.toLocaleString()} Cr/mo (or sweeten the signing bonus / adjust the term length) and you have a deal."`;
      }
    } else {
      c.patience -= 2;
      if (c.patience <= 0) {
        this.candidateWalkedOut = true;
        this.negotiationMessage = `"${this.proposedWage.toLocaleString()} Cr a month for a ${termLabel}?! That's an insult to a MechJock. Find yourself a desperate academy washout—interview's over!"`;
      } else {
        this.negotiationMessage = `"Commander, ${this.proposedWage.toLocaleString()} Cr/mo for a ${termLabel} won't even cover my life-support insurance! You'll need to come much closer to ${targetAsking.toLocaleString()} Cr/mo before I walk out."`;
      }
    }
    this.render();
  },

  signInterviewContract() {
    if (!this.candidate || this.candidateWalkedOut) return;
    this.updateNegotiationInputs();
    const st = window.GameState.data;
    const c = this.candidate;

    if (st.credits < this.proposedBonus) {
      alert('Not enough credits in Company Treasury to pay that Signing Bonus!');
      return;
    }

    const lengthMod = this.getContractLengthModifier();
    const targetMin = Math.max(350, c.minWage + Math.round(lengthMod * 0.7));
    const bonusAdjustment = Math.round((this.proposedBonus - this.offeredBonusInput) * 0.05);
    const effectiveWageOffer = this.proposedWage + bonusAdjustment;

    if (effectiveWageOffer < targetMin) {
      this.testCounterOffer();
      return;
    }

    // Deduct signing bonus and add Jock to active squad with negotiated base salary & contract term!
    st.credits -= this.proposedBonus;
    const newId = 'jock-' + Date.now();
    const freeMech = st.mechs.find(m => !st.jocks.some(j => j.assignedMechId === m.id));

    const tempJock = { xpSpent: c.xpSpent };
    const rk = window.GameState.getJockRank(tempJock);
    const baseSalary = Math.max(300, Math.round(this.proposedWage / rk.salaryMult));

    const contractObj = this.proposedContractType === 'fights'
      ? { type: 'fights', totalFights: this.proposedFights, fightsRemaining: this.proposedFights }
      : { type: 'years', totalYears: this.proposedYears, monthsRemaining: this.proposedYears * 12 };

    st.jocks.push({
      id: newId,
      firstName: c.firstName,
      lastName: c.lastName,
      callsign: c.callsign,
      portraitId: c.portraitId,
      bio: c.bio,
      xp: c.xp,
      xpSpent: c.xpSpent,
      baseSalary,
      contract: contractObj,
      health: 100,
      kills: 0,
      missions: 0,
      fightHistory: [],
      awards: [],
      assignedMechId: freeMech ? freeMech.id : '',
      stats: { ...c.stats },
      skills: { ...c.skills }
    });

    st.selectedJockId = newId;
    this.interviewOpen = false;
    this.candidate = null;
    window.GameState.advanceTimeWeeks(1, `Hired & Onboarded Jockey ${c.callsign}`);
    this.render();
  },

  closeInterview() {
    this.interviewOpen = false;
    this.candidate = null;
    this.render();
  },

  renderInterviewModal() {
    if (!this.interviewOpen || !this.candidate) return '';
    const c = this.candidate;
    const questions = window.TOS_DATA.interviewQuestions || [];
    const askedList = Object.values(this.askedQuestions);
    const askedCount = askedList.length;
    const repLvl = window.GameState.getCompanyReputationLevel();
    const maxAllowed = window.GameState.getMaxInterviewQuestions();
    const limitReached = askedCount >= maxAllowed;

    return `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:980px; max-height:92vh; overflow-y:auto;">
          <div class="section-header">
            <div>
              <span class="badge primary">MERCENARY RECRUITMENT INTERVIEW</span>
              <span class="badge amber mono" style="margin-left:6px;">Company Reputation Lvl ${repLvl} (Max ${maxAllowed} Questions Allowed)</span>
              <h3 style="font-size:18px; font-weight:800; margin-top:4px;">
                Applicant: ${c.firstName} "${c.callsign}" ${c.lastName}
              </h3>
            </div>
            <button class="btn" onclick="HQModule.closeInterview()">Dismiss Applicant (Pay 0 Cr)</button>
          </div>

          <div class="grid-12">
            <!-- Left 5 Cols: Applicant Portrait & Dossier (Stats Hidden until Hired) + Wage Negotiation -->
            <div class="col-5" style="display:flex; flex-direction:column; gap:12px;">
              <div class="panel" style="display:flex; gap:14px; align-items:center;">
                <div style="flex-shrink:0;">${window.GameState.getPortraitSvg(c.portraitId, 76)}</div>
                <div>
                  <div style="font-weight:700; font-size:15px;">${c.firstName} "${c.callsign}" ${c.lastName}</div>
                  <div class="subtext" style="margin-top:2px;">${c.bio}</div>
                  <div style="margin-top:6px;">
                    <span class="badge amber">Exact Stats Hidden Until Hired</span>
                  </div>
                </div>
              </div>

              <!-- Interviewer Evaluation Notes (Revealed as you ask questions) -->
              <div class="panel" style="display:flex; flex-direction:column; gap:6px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <strong style="font-size:13px;">Commander's Stat Readings</strong>
                  <span class="badge ${limitReached ? 'amber' : 'green'} mono">${askedCount} / ${maxAllowed} Questions Used</span>
                </div>
                ${askedCount === 0 ? `
                  <div class="subtext" style="font-style:italic; padding:6px 0;">
                    No questions asked yet. At <strong>Company Reputation Level ${repLvl}</strong>, you may choose up to <strong>${maxAllowed} questions</strong> from the 16 Attribute &amp; Skill topics on the right!
                  </div>
                ` : askedList.map(item => `
                  <div style="font-size:12px; border-left:2px solid var(--accent-green); padding-left:8px; margin-top:4px;">
                    <div style="color:var(--accent-green); font-weight:700;">${item.clue}</div>
                  </div>
                `).join('')}
              </div>

              <!-- Contract & Monthly Wage Negotiation Box -->
              <div class="panel" style="display:flex; flex-direction:column; gap:10px; border-color:var(--primary);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <strong style="font-size:13px;">Contract Terms &amp; Wage Negotiation</strong>
                  <span class="badge ${this.candidateWalkedOut ? 'red' : 'green'}">
                    ${this.candidateWalkedOut ? 'Walked Out' : `Patience: ${c.patience}/3`}
                  </span>
                </div>

                <!-- Contract Length Type Choice (Years vs. Number of Fights) -->
                <div>
                  <label class="subtext" style="font-weight:600;">1. Choose Contract Length Structure:</label>
                  <div style="display:flex; gap:6px; margin-top:4px;">
                    <button
                      class="btn ${this.proposedContractType === 'years' ? 'btn-primary' : ''}"
                      style="flex:1;"
                      ${this.candidateWalkedOut ? 'disabled' : ''}
                      onclick="HQModule.setContractType('years')"
                    >
                      By Length in Years
                    </button>
                    <button
                      class="btn ${this.proposedContractType === 'fights' ? 'btn-primary' : ''}"
                      style="flex:1;"
                      ${this.candidateWalkedOut ? 'disabled' : ''}
                      onclick="HQModule.setContractType('fights')"
                    >
                      By Number of Fights
                    </button>
                  </div>
                </div>

                <!-- Duration Selector (Years or Fights) -->
                <div>
                  ${this.proposedContractType === 'years' ? `
                    <label class="subtext" style="font-weight:600;">Contract Duration (Years):</label>
                    <select id="neg-inp-years" class="select mono" style="margin-top:4px;" onchange="HQModule.updateNegotiationInputs(); HQModule.render();" ${this.candidateWalkedOut ? 'disabled' : ''}>
                      ${[1, 2, 3, 4, 5].map(yr => `
                        <option value="${yr}" ${this.proposedYears === yr ? 'selected' : ''}>${yr} Year${yr > 1 ? 's' : ''} (${yr * 12} Months)</option>
                      `).join('')}
                    </select>
                  ` : `
                    <label class="subtext" style="font-weight:600;">Contract Duration (Combat Drops / Fights):</label>
                    <select id="neg-inp-fights" class="select mono" style="margin-top:4px;" onchange="HQModule.updateNegotiationInputs(); HQModule.render();" ${this.candidateWalkedOut ? 'disabled' : ''}>
                      ${[3, 5, 10, 15, 25].map(f => `
                        <option value="${f}" ${this.proposedFights === f ? 'selected' : ''}>${f} Combat Fights</option>
                      `).join('')}
                    </select>
                  `}
                </div>

                <div style="display:flex; justify-content:space-between; font-size:12px;">
                  <span class="subtext">Asking Wage (${this.getContractTermLabel()}):</span>
                  <strong class="mono" style="color:var(--accent-amber);">${Math.max(450, c.askingWage + this.getContractLengthModifier()).toLocaleString()} Cr / month</strong>
                </div>

                <div class="grid-12">
                  <div class="col-6">
                    <label class="subtext">Signing Bonus (Cr)</label>
                    <input id="neg-inp-bonus" type="number" step="500" class="input mono" value="${this.proposedBonus}" onchange="HQModule.updateNegotiationInputs()" ${this.candidateWalkedOut ? 'disabled' : ''} />
                  </div>
                  <div class="col-6">
                    <label class="subtext">Your Wage Offer (Cr/mo)</label>
                    <input id="neg-inp-wage" type="number" step="50" class="input mono" value="${this.proposedWage}" onchange="HQModule.updateNegotiationInputs()" ${this.candidateWalkedOut ? 'disabled' : ''} />
                  </div>
                </div>

                <div style="display:flex; gap:8px;">
                  <button class="btn" style="flex:1;" ${this.candidateWalkedOut ? 'disabled' : ''} onclick="HQModule.testCounterOffer()">
                    Propose Counter-Offer
                  </button>
                  <button class="btn btn-primary" style="flex:1;" ${this.candidateWalkedOut ? 'disabled' : ''} onclick="HQModule.signInterviewContract()">
                    Hire &amp; Sign Contract
                  </button>
                </div>
              </div>
            </div>

            <!-- Right 7 Cols: Interview Question Prompts & Applicant Transcript -->
            <div class="col-7" style="display:flex; flex-direction:column; gap:12px;">
              
              <!-- Candidate's Current Statement -->
              <div class="panel" style="border-left:3px solid var(--primary); padding:12px;">
                <div class="subtext" style="font-weight:700; text-transform:uppercase;">${c.callsign}'s Statement:</div>
                <div style="font-size:13px; margin-top:4px; font-style:italic; color:#e2e8f0;">
                  ${this.negotiationMessage}
                </div>
              </div>

              <!-- 16 Interview Questions (6 Attributes + 10 Skills) with Reputation Limit -->
              <div style="display:flex; flex-direction:column; gap:6px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span class="subtext" style="font-weight:700; text-transform:uppercase;">
                    Choose Up to ${maxAllowed} Interview Questions (${maxAllowed - askedCount} Remaining at Rep Lvl ${repLvl}):
                  </span>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px; max-height:245px; overflow-y:auto; padding-right:4px;">
                  ${questions.map(q => {
                    const alreadyAsked = !!this.askedQuestions[q.id];
                    const disabled = this.candidateWalkedOut || (!alreadyAsked && limitReached);
                    return `
                      <button
                        class="btn ${alreadyAsked ? '' : 'btn-primary'}"
                        style="text-align:left; padding:8px 10px; display:flex; justify-content:space-between; align-items:center; gap:10px;"
                        ${disabled ? 'disabled' : ''}
                        onclick="HQModule.askInterviewQuestion('${q.id}')"
                      >
                        <div style="flex:1;">
                          <span class="badge ${q.type === 'attribute' ? 'primary' : 'green'} mono" style="margin-right:6px;">${q.badge}</span>
                          <span>${q.prompt}</span>
                        </div>
                        <span class="mono" style="font-size:12px; flex-shrink:0;">
                          ${alreadyAsked ? '&#9989; Asked' : limitReached ? 'Locked (Rep Lvl ' + repLvl + ')' : 'Ask &rarr;'}
                        </span>
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Full Interview Q&A Transcript -->
              <div class="panel" style="display:flex; flex-direction:column; gap:8px; max-height:175px; overflow-y:auto;">
                <div class="subtext" style="font-weight:700; text-transform:uppercase;">Interview Transcript (${askedCount}/${maxAllowed})</div>
                ${askedCount === 0 ? `<div class="subtext">Select up to ${maxAllowed} questions above to probe ${c.callsign}'s specific Attributes or Skills.</div>` : askedList.map(item => `
                  <div style="border-bottom:1px solid var(--border); padding-bottom:8px;">
                    <div style="font-weight:700; font-size:12px; color:#93c5fd;">Q: ${item.q}</div>
                    <div style="font-size:13px; font-style:italic; margin-top:3px;">${item.reply}</div>
                    <div class="mono" style="font-size:12px; color:var(--accent-green); margin-top:2px;">&rarr; ${item.clue}</div>
                  </div>
                `).join('')}
              </div>

            </div>
          </div>

        </div>
      </div>
    `;
  },

  openJockeyPage(id, subTab = 'dossier') {
    window.GameState.data.selectedJockId = id;
    this.jockeyPageOpen = true;
    this.jockeySubTab = subTab;
    window.GameState.save();
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  closeJockeyPage() {
    this.jockeyPageOpen = false;
    this.render();
  },

  setJockeySubTab(tab) {
    this.jockeySubTab = tab;
    this.render();
  },

  renderSquadOverviewDirectory() {
    const st = window.GameState.data;
    return `
      <div class="card">
        <div class="section-header">
          <div>
            <div class="section-title">Company Jockey Roster Directory</div>
            <div class="subtext">Click any Jockey's name below to open their dedicated Jockey Information Page &amp; Combat History</div>
          </div>
          <span class="badge primary">${st.jocks.length} Active Pilot${st.jocks.length === 1 ? '' : 's'}</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px;">
          ${st.jocks.map(j => {
            const rk = window.GameState.getJockRank(j);
            const salary = window.GameState.getJockSalary(j);
            const mech = st.mechs.find(m => m.id === j.assignedMechId);
            const isMerc = j.contract?.type === 'mercenary';
            const fights = j.fightHistory || [];
            const awards = j.awards || [];
            return `
              <div class="panel" style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:14px; padding:14px;">
                <div style="display:flex; align-items:center; gap:14px; flex:1; min-width:260px;">
                  <div style="flex-shrink:0; cursor:pointer;" onclick="HQModule.openJockeyPage('${j.id}')">
                    ${window.GameState.getPortraitSvg(j.portraitId, 72)}
                  </div>
                  <div style="flex:1; min-width:0;">
                    <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px;">
                      <a href="javascript:void(0)" onclick="HQModule.openJockeyPage('${j.id}')" style="font-size:17px; font-weight:800; color:#93c5fd; text-decoration:underline;">
                        ${j.firstName} "${j.callsign}" ${j.lastName}
                      </a>
                      <span class="badge ${isMerc ? 'amber' : 'primary'}">${isMerc ? 'Mercenary' : rk.name}</span>
                      <span class="badge green">HP ${j.health}%</span>
                      <span class="badge amber mono">${window.GameState.getContractSummary(j)}</span>
                    </div>
                    <div class="subtext" style="margin-top:4px;">${j.bio}</div>
                    <div style="display:flex; flex-wrap:wrap; gap:14px; margin-top:8px; font-size:12px;" class="mono subtext">
                      <span>Assigned Titan: <strong style="color:#f8fafc;">${mech ? mech.customName : 'Unassigned'}</strong></span>
                      <span>Fights: <strong style="color:#f8fafc;">${j.missions || fights.length}</strong></span>
                      <span>Kills: <strong style="color:#f8fafc;">${j.kills}</strong></span>
                      <span>Commendations: <strong style="color:var(--accent-amber);">${awards.length}</strong></span>
                      <span>Ready XP: <strong style="color:var(--accent-green);">${j.xp} XP</strong></span>
                      <span>Wage: <strong>${isMerc ? '0 Cr/mo (Flat Fee)' : salary.toLocaleString() + ' Cr/mo'}</strong></span>
                    </div>
                  </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px; min-width:190px;">
                  <button class="btn btn-primary" onclick="HQModule.openJockeyPage('${j.id}', 'dossier')">
                    Open Jockey Page &rarr;
                  </button>
                  <button class="btn" onclick="HQModule.openJockeyPage('${j.id}', 'history')">
                    Combat History &amp; Awards (${awards.length})
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  renderDedicatedJockeyPage(jock) {
    const rank = window.GameState.getJockRank(jock);
    const isMerc = jock.contract?.type === 'mercenary';
    const awardsCount = (jock.awards || []).length;
    const fightsCount = (jock.fightHistory || []).length;

    return `
      <!-- Dedicated Jockey Information Page Top Bar -->
      <div class="card" style="margin-bottom:16px; border-color:var(--primary);">
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <button class="btn" onclick="HQModule.closeJockeyPage()" style="padding:8px 14px; font-weight:700;">
              &larr; Back to Company HQ
            </button>
            <div>
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span class="badge primary">DEDICATED JOCKEY INFORMATION PAGE</span>
                <span class="badge ${isMerc ? 'amber' : 'green'}">${isMerc ? 'Short-Term Mercenary' : rank.name}</span>
              </div>
              <h2 style="font-size:20px; font-weight:800; margin-top:3px;">
                ${jock.firstName} "${jock.callsign}" ${jock.lastName}
              </h2>
            </div>
          </div>

          <!-- Dedicated Jockey Page Sub-Tabs (Dossier & Training vs. Combat History & Commendations) -->
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button
              class="btn ${this.jockeySubTab === 'dossier' ? 'btn-primary' : ''}"
              style="padding:9px 16px; font-size:13px;"
              onclick="HQModule.setJockeySubTab('dossier')"
            >
              1. Pilot Dossier, Attributes &amp; Skills (${jock.xp} XP)
            </button>
            <button
              class="btn ${this.jockeySubTab === 'history' ? 'btn-primary' : ''}"
              style="padding:9px 16px; font-size:13px;"
              onclick="HQModule.setJockeySubTab('history')"
            >
              2. Combat History, Commendations &amp; Awards (${fightsCount} Fights / ${awardsCount} Awards)
            </button>
          </div>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:16px;">
        ${this.jockeySubTab === 'history' ? this.renderJockeyHistoryTab(jock) : this.renderDossier(jock)}
      </div>
    `;
  },

  renderJockeyHistoryTab(jock) {
    const fights = jock.fightHistory || [];
    const earnedAwards = jock.awards || [];
    const allCommendations = window.TOS_DATA.commendations || [];

    const totalShots = fights.reduce((s, f) => s + (f.shotsFired || 0), 0);
    const totalHits = fights.reduce((s, f) => s + (f.shotsHit || 0), 0);
    const careerAcc = totalShots > 0 ? Math.round((totalHits / totalShots) * 100) : 0;
    const totalDmgDealt = fights.reduce((s, f) => s + (f.damageDealt || 0), 0);
    const totalDmgTaken = fights.reduce((s, f) => s + (f.damageTaken || 0), 0);
    const victories = fights.filter(f => f.outcome === 'VICTORY').length;

    return `
      <!-- Pilot Service Summary Header -->
      <div class="card">
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px;">
          <div style="display:flex; align-items:center; gap:14px;">
            <div class="panel" style="padding:6px;">
              ${window.GameState.getPortraitSvg(jock.portraitId, 76)}
            </div>
            <div>
              <h3 style="font-size:18px; font-weight:800;">Service Record: ${jock.firstName} "${jock.callsign}" ${jock.lastName}</h3>
              <div class="subtext" style="margin-top:2px;">Official Mercenary Combat Log, Battle Performance Telemetry &amp; Commendations</div>
            </div>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:10px;">
            <div class="hud-pill">
              <div class="label">Combat Drops</div>
              <div class="val">${jock.missions || fights.length}</div>
            </div>
            <div class="hud-pill">
              <div class="label">Victories / Kills</div>
              <div class="val" style="color:var(--accent-green);">${victories} / ${jock.kills}</div>
            </div>
            <div class="hud-pill">
              <div class="label">Career Accuracy</div>
              <div class="val">${totalShots > 0 ? careerAcc + '%' : 'N/A'}</div>
            </div>
            <div class="hud-pill">
              <div class="label">Damage Dealt / Taken</div>
              <div class="val">${totalDmgDealt} / ${totalDmgTaken}</div>
            </div>
            <div class="hud-pill">
              <div class="label">Commendations</div>
              <div class="val" style="color:var(--accent-amber);">${earnedAwards.length} / ${allCommendations.length}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Commendations & Awards Section -->
      <div class="card">
        <div class="section-header">
          <div>
            <div class="section-title">Commendations, Medals &amp; Combat Awards</div>
            <div class="subtext">Awarded for distinguished gunnery, precision called-shot kills, and survival in the Battle Arena</div>
          </div>
          <span class="badge amber mono">${earnedAwards.length} Earned</span>
        </div>

        ${earnedAwards.length === 0 ? `
          <div class="panel subtext" style="padding:18px; text-align:center;">
            <strong>${jock.callsign}</strong> has not received any combat commendations yet. Deploy to the <strong>3. Battle &amp; Hex Arena</strong> to earn medals such as the <em>First Blood Ribbon</em>, <em>Headhunter's Star</em>, <em>Core Breaker Cross</em>, or <em>Sharpshooter Citation</em>!
          </div>
        ` : `
          <div class="grid-12">
            ${earnedAwards.map(aw => {
              const def = allCommendations.find(c => c.id === aw.id) || aw;
              return `
                <div class="col-6 panel" style="display:flex; align-items:center; gap:14px; border-color:var(--accent-amber);">
                  <div style="flex-shrink:0;">
                    <svg viewBox="0 0 64 64" width="54" height="54" style="background:#0f172a; border-radius:8px; border:1px solid #f59e0b;">
                      ${def.svg || ''}
                    </svg>
                  </div>
                  <div style="flex:1; min-width:0;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                      <strong style="font-size:14px; color:#fde68a;">${def.title}</strong>
                      <span class="badge amber mono">Fight #${aw.fightNum || 1}</span>
                    </div>
                    <div class="subtext" style="margin-top:3px;">${aw.citation || def.desc}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}

        <!-- Available / Un-earned Commendations Reference -->
        <div style="margin-top:8px;">
          <div class="subtext" style="font-weight:700; text-transform:uppercase; margin-bottom:8px;">All Official Mercenary Commendations &amp; Unlock Criteria:</div>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:8px;">
            ${allCommendations.map(c => {
              const isUnlocked = earnedAwards.some(a => a.id === c.id);
              return `
                <div class="panel" style="display:flex; align-items:center; gap:10px; opacity:${isUnlocked ? '1' : '0.55'};">
                  <svg viewBox="0 0 64 64" width="38" height="38" style="flex-shrink:0; background:#0f172a; border-radius:6px; border:1px solid ${isUnlocked ? '#10b981' : '#334155'};">
                    ${c.svg}
                  </svg>
                  <div style="font-size:12px;">
                    <div style="font-weight:700; color:${isUnlocked ? '#6ee7b7' : '#e2e8f0'};">
                      ${isUnlocked ? '&#9989; ' : ''}${c.title}
                    </div>
                    <div class="subtext" style="font-size:11px;">${c.desc}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Previous Fights & Combat Performance History Log -->
      <div class="card">
        <div class="section-header">
          <div>
            <div class="section-title">Previous Fights &amp; Combat Performance Log</div>
            <div class="subtext">Detailed engagement record for every battle fought by ${jock.firstName} "${jock.callsign}" ${jock.lastName}</div>
          </div>
          <button class="btn btn-primary" onclick="App.switchTab('battle')">Deploy ${jock.callsign} to Next Fight &rarr;</button>
        </div>

        ${fights.length === 0 ? `
          <div class="panel subtext" style="padding:22px; text-align:center;">
            No previous fights recorded for <strong>${jock.callsign}</strong> yet. Complete a combat contract in the <strong>3. Battle &amp; Hex Arena</strong> to log their first battle report!
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${fights.map(f => {
              const acc = f.shotsFired > 0 ? Math.round((f.shotsHit / f.shotsFired) * 100) : 0;
              const isWin = f.outcome === 'VICTORY';
              const mins = String(Math.floor((f.durationSec || 0) / 60)).padStart(2, '0');
              const secs = String((f.durationSec || 0) % 60).padStart(2, '0');
              return `
                <div class="panel" style="display:flex; flex-direction:column; gap:8px; border-left:4px solid ${isWin ? 'var(--accent-green)' : 'var(--accent-red)'};">
                  <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px;">
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                      <span class="badge ${isWin ? 'green' : 'red'} mono">FIGHT #${f.fightNumber} — ${f.outcome}</span>
                      ${f.campaignDate ? `<span class="badge primary mono">${f.campaignDate}</span>` : ''}
                      <strong style="font-size:14px;">vs. ${f.enemyName} (${f.enemyWeight || 'Hostile Titan'})</strong>
                      <span class="subtext">in <strong>${f.mechName || 'Assigned Titan'}</strong></span>
                    </div>
                    <div class="mono subtext" style="font-size:12px;">
                      Action-Time Duration: <strong>${mins}:${secs}s</strong> • Earned: <strong style="color:var(--accent-green);">+${f.xpEarned || 0} XP</strong>
                    </div>
                  </div>

                  <div style="display:flex; flex-wrap:wrap; gap:18px; font-size:12px;" class="mono">
                    <span>Shots Hit / Fired: <strong>${f.shotsHit}/${f.shotsFired} (${acc}%)</strong></span>
                    <span>Damage Dealt: <strong style="color:var(--accent-green);">${f.damageDealt} Dmg</strong></span>
                    <span>Damage Taken: <strong style="color:var(--accent-amber);">${f.damageTaken} Dmg</strong></span>
                    <span>Resolution: <strong>${f.killMethod || (isWin ? 'Hostile Neutralized' : 'Emergency Ejection')}</strong></span>
                  </div>

                  ${(f.awardsEarned && f.awardsEarned.length > 0) ? `
                    <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; padding-top:4px; border-top:1px solid var(--border);">
                      <span class="subtext" style="font-size:11px; font-weight:700;">Commendations Awarded in Fight:</span>
                      ${f.awardsEarned.map(title => `<span class="badge amber">${title}</span>`).join('')}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  renderDossier(jock) {
    const st = window.GameState.data;
    const rank = window.GameState.getJockRank(jock);
    const salary = window.GameState.getJockSalary(jock);

    return `
      <!-- Jock Identity, Bio, Callsign & Titan Assignment Card -->
      <div class="card">
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:16px; border-bottom:1px solid var(--border); padding-bottom:14px;">
          <div style="display:flex; gap:14px; align-items:flex-start;">
            <div class="panel" style="padding:6px;">
              ${window.GameState.getPortraitSvg(jock.portraitId, 82)}
            </div>
            <div>
              <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px;">
                <h2 style="font-size:18px; font-weight:700;">${jock.firstName} "${jock.callsign}" ${jock.lastName}</h2>
                <span class="badge primary">${rank.name}</span>
                <span class="badge green">HP ${jock.health}%</span>
                <span class="badge amber mono">${window.GameState.getContractSummary(jock)}</span>
                <button class="btn" onclick="HQModule.openCreator(true)">Edit Callsign / Portrait / Bio</button>
              </div>
              <p class="subtext" style="margin-top:6px; max-width:620px; font-size:13px;">${jock.bio}</p>
              <div style="display:flex; flex-wrap:wrap; gap:16px; margin-top:8px; font-size:12px;" class="mono subtext">
                <span>Missions: <strong>${jock.missions}</strong></span>
                <span>Confirmed Kills: <strong>${jock.kills}</strong></span>
                <span>Total XP Invested: <strong>${jock.xpSpent} XP</strong></span>
              </div>
            </div>
          </div>

          <div class="panel" style="text-align:right; min-width:165px;">
            <div class="subtext">Available Training XP</div>
            <div class="mono" style="font-size:20px; font-weight:700; color:var(--accent-green);">${jock.xp} XP</div>
            <div class="subtext" style="margin-top:4px;">Contract Wage: <strong class="mono">${salary.toLocaleString()} Cr/mo</strong></div>
          </div>
        </div>

        <!-- Assigned Titan Selector -->
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px;">
          <div style="display:flex; align-items:center; gap:10px; flex:1;">
            <span style="font-weight:600; font-size:13px; white-space:nowrap;">Assigned Titan-AT:</span>
            <select class="select" style="max-width:340px;" onchange="HQModule.assignMech('${jock.id}', this.value)">
              <option value="">-- Unassigned (Pilot Lounge) --</option>
              ${st.mechs.map(m => {
                const metrics = window.GameState.computeMechMetrics(m);
                return `<option value="${m.id}" ${jock.assignedMechId === m.id ? 'selected' : ''}>
                  ${m.customName} (${metrics.totalTons}/${metrics.maxTons}t ${metrics.tpl.weightClass})
                </option>`;
              }).join('')}
            </select>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn" onclick="App.switchTab('garage')">Inspect Mech in Garage &rarr;</button>
            <button class="btn btn-primary" onclick="App.switchTab('battle')">Deploy to Battle Arena &rarr;</button>
          </div>
        </div>
      </div>

      <!-- Classic 6 Attributes & 0-100% Granular Skills Grid -->
      <div class="grid-12">
        <!-- 6 Classic Attributes (5 Cols) -->
        <div class="col-5 card">
          <div class="section-header">
            <div>
              <div class="section-title">6 Classic Attributes (1–100 Scale)</div>
              <div class="subtext">Escalating XP cost per +1 (Rare to max out; choose carefully)</div>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${window.TOS_DATA.attributes.map(attr => {
              const val = jock.stats[attr.key] || 20;
              const cost = window.GameState.getAttrUpgradeCost(val);
              const pct = Math.min(100, Math.round(val));
              return `
                <div class="panel" style="display:flex; flex-direction:column; gap:6px;">
                  <div style="display:flex; align-items:center; justify-content:space-between;">
                    <div>
                      <strong>${attr.key}</strong> <span class="subtext mono">(${attr.abbr})</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="mono" style="font-size:15px; font-weight:700;">${val} / 100</span>
                      <button class="btn btn-primary" ${jock.xp < cost || val >= 100 ? 'disabled' : ''} onclick="HQModule.trainAttr('${attr.key}')">
                        +1 (${cost} XP • 3 Wks)
                      </button>
                    </div>
                  </div>
                  <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
                  <div class="subtext">${attr.desc}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 10 Classic 0-100% Skills (7 Cols) -->
        <div class="col-7 card">
          <div class="section-header">
            <div>
              <div class="section-title">Combat, Recon &amp; Crew Skills (0–100%)</div>
              <div class="subtext">High escalating XP cost per +1% Skill Training</div>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${window.TOS_DATA.skills.map(sk => {
              const val = jock.skills[sk.key] || 30;
              const cost = window.GameState.getSkillUpgradeCost(val);
              const barClass = sk.cat === 'Weapon' ? '' : sk.cat === 'Support' ? 'green' : 'amber';
              return `
                <div class="panel" style="display:flex; flex-direction:column; gap:5px;">
                  <div style="display:flex; align-items:center; justify-content:space-between;">
                    <div>
                      <strong>${sk.key}</strong>
                      <span class="badge" style="margin-left:6px;">${sk.cat}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="mono" style="font-size:14px; font-weight:700;">${val}%</span>
                      <button class="btn btn-primary" ${jock.xp < cost || val >= 100 ? 'disabled' : ''} onclick="HQModule.trainSkill('${sk.key}')">
                        +1% (${cost} XP • 1 Wk)
                      </button>
                    </div>
                  </div>
                  <div class="bar-bg"><div class="bar-fill ${barClass}" style="width:${val}%"></div></div>
                  <div class="subtext">${sk.desc}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderCreatorModal(currentJock) {
    if (!this.creatorOpen || !currentJock) return '';
    return `
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="section-header">
            <div class="section-title">Customize Jock Identity, Portrait &amp; Service Bio</div>
            <button class="btn" onclick="HQModule.closeCreator()">Close</button>
          </div>

          <div class="grid-12">
            <div class="col-4">
              <label class="subtext">First Name</label>
              <input id="inp-fname" class="input" value="${currentJock.firstName}" />
            </div>
            <div class="col-4">
              <label class="subtext">Callsign</label>
              <input id="inp-callsign" class="input" value="${currentJock.callsign}" />
            </div>
            <div class="col-4">
              <label class="subtext">Last Name</label>
              <input id="inp-lname" class="input" value="${currentJock.lastName}" />
            </div>
          </div>

          <div>
            <label class="subtext">Select Jockey Character Portrait</label>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-top:6px;">
              ${window.TOS_DATA.portraits.map(p => `
                <div class="list-item ${this.selectedPortraitId === p.id ? 'selected' : ''}" onclick="HQModule.pickPortrait('${p.id}')" style="display:flex; align-items:center; gap:8px;">
                  ${window.GameState.getPortraitSvg(p.id, 52)}
                  <span style="font-size:12px; font-weight:600;">${p.label}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div>
            <label class="subtext">Pilot Backstory &amp; Service Dossier</label>
            <textarea id="inp-bio" class="textarea" rows="3" style="margin-top:4px;">${currentJock.bio}</textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:4px;">
            <button class="btn" onclick="HQModule.closeCreator()">Cancel</button>
            <button class="btn btn-primary" onclick="HQModule.saveCreator()">Save Changes</button>
          </div>
        </div>
      </div>
    `;
  },

  selectJock(id) {
    window.GameState.data.selectedJockId = id;
    window.GameState.save();
    this.render();
  },

  assignMech(jockId, mechId) {
    const st = window.GameState.data;
    if (mechId) {
      st.jocks.forEach(j => {
        if (j.assignedMechId === mechId) j.assignedMechId = '';
      });
    }
    const jock = st.jocks.find(j => j.id === jockId);
    if (jock) jock.assignedMechId = mechId;
    window.GameState.save();
    App.updateHUD();
    this.render();
  },

  trainAttr(attrKey) {
    const st = window.GameState.data;
    const jock = st.jocks.find(j => j.id === st.selectedJockId);
    if (!jock) return;
    const curVal = jock.stats[attrKey] || 20;
    const cost = window.GameState.getAttrUpgradeCost(curVal);
    if (jock.xp < cost || curVal >= 100) return;
    jock.xp -= cost;
    jock.xpSpent += cost;
    jock.stats[attrKey] = curVal + 1;
    window.GameState.advanceTimeWeeks(3, `${jock.callsign} Trained ${attrKey} +1`);
    this.render();
  },

  trainSkill(skillKey) {
    const st = window.GameState.data;
    const jock = st.jocks.find(j => j.id === st.selectedJockId);
    if (!jock) return;
    const curVal = jock.skills[skillKey] || 30;
    const cost = window.GameState.getSkillUpgradeCost(curVal);
    if (jock.xp < cost || curVal >= 100) return;
    jock.xp -= cost;
    jock.xpSpent += cost;
    jock.skills[skillKey] = Math.min(100, curVal + 1);
    window.GameState.advanceTimeWeeks(1, `${jock.callsign} Trained ${skillKey} +1%`);
    this.render();
  },

  openCreator(editMode) {
    const st = window.GameState.data;
    const jock = st.jocks.find(j => j.id === st.selectedJockId);
    if (!jock) return;
    this.editMode = editMode;
    this.selectedPortraitId = jock.portraitId || 'visor-blue';
    this.creatorOpen = true;
    this.render();
  },

  closeCreator() {
    this.creatorOpen = false;
    this.render();
  },

  pickPortrait(pid) {
    const fName = document.getElementById('inp-fname')?.value;
    const lName = document.getElementById('inp-lname')?.value;
    const cSign = document.getElementById('inp-callsign')?.value;
    const bio = document.getElementById('inp-bio')?.value;
    this.selectedPortraitId = pid;
    this.render();
    if (fName !== undefined) document.getElementById('inp-fname').value = fName;
    if (lName !== undefined) document.getElementById('inp-lname').value = lName;
    if (cSign !== undefined) document.getElementById('inp-callsign').value = cSign;
    if (bio !== undefined) document.getElementById('inp-bio').value = bio;
  },

  saveCreator() {
    const st = window.GameState.data;
    const jock = st.jocks.find(j => j.id === st.selectedJockId);
    if (jock) {
      jock.firstName = (document.getElementById('inp-fname')?.value || jock.firstName).trim();
      jock.callsign = (document.getElementById('inp-callsign')?.value || jock.callsign).trim();
      jock.lastName = (document.getElementById('inp-lname')?.value || jock.lastName).trim();
      jock.bio = (document.getElementById('inp-bio')?.value || jock.bio).trim();
      jock.portraitId = this.selectedPortraitId;
    }
    this.creatorOpen = false;
    window.GameState.save();
    App.updateHUD();
    this.render();
  },

  repairAllMechs() {
    const st = window.GameState.data;
    let totalMissing = 0;
    st.mechs.forEach(m => {
      window.GameState.ensureMechPartConditions(m);
      Object.keys(m.armor).forEach(k => {
        totalMissing += Math.max(0, m.maxArmorCurrent[k] - m.armor[k]);
        m.armor[k] = m.maxArmorCurrent[k];
      });
      Object.keys(m.partConditions || {}).forEach(loc => {
        m.partConditions[loc] = (m.partConditions[loc] || []).map(cond => {
          totalMissing += Math.max(0, Math.round((100 - cond) * 0.5));
          return 100;
        });
      });
    });
    const bestMechSkill = Math.max(30, ...st.jocks.map(j => j.skills['Mechanic (Repair)'] || 30));
    const discount = Math.min(0.5, bestMechSkill / 200);
    const cost = Math.round(totalMissing * 40 * (1 - discount));
    if (totalMissing > 0 && st.credits >= cost) {
      st.credits -= cost;
      window.GameState.advanceTimeWeeks(2, 'Repaired All Hangar Mechs');
      this.render();
    }
  },

  healAllJocks() {
    const st = window.GameState.data;
    const anyWounded = st.jocks.some(j => j.health < 100);
    st.jocks.forEach(j => { j.health = 100; });
    if (anyWounded) {
      window.GameState.advanceTimeWeeks(2, 'Medical Bay Trauma Treatment');
    } else {
      window.GameState.save();
    }
    this.render();
  },

  hireMercenary(idx) {
    const st = window.GameState.data;
    const r = st.recruits[idx];
    if (!r || st.jocks.length >= 8) return;
    const fee = r.flatFee || 6500;
    if (st.credits < fee) {
      alert(`Insufficient funds to pay the ${fee.toLocaleString()} Cr Mercenary Flat Fee!`);
      return;
    }

    st.credits -= fee;
    const newId = 'merc-' + Date.now();
    const freeMech = st.mechs.find(m => !st.jocks.some(j => j.assignedMechId === m.id));

    st.jocks.push({
      id: newId,
      firstName: r.firstName,
      lastName: r.lastName,
      callsign: r.callsign,
      portraitId: r.portraitId,
      bio: r.bio,
      xp: r.xp || 100,
      xpSpent: r.xpSpent || 800,
      baseSalary: 0, // Flat-fee Mercenary has 0 monthly wage
      contract: {
        type: 'mercenary',
        totalMonths: r.termMonths || 2,
        monthsRemaining: r.termMonths || 2,
        totalFights: r.termFights || 2,
        fightsRemaining: r.termFights || 2
      },
      health: 100,
      kills: 0,
      missions: 0,
      fightHistory: [],
      awards: [],
      assignedMechId: freeMech ? freeMech.id : '',
      stats: { ...r.stats },
      skills: { ...r.skills }
    });

    st.recruits.splice(idx, 1);
    st.selectedJockId = newId;
    window.GameState.advanceTimeWeeks(1, `Hired Mercenary ${r.callsign}`);
    this.render();
  },

  refreshMercenaries() {
    const st = window.GameState.data;
    if (st.credits < 500) return;
    st.credits -= 500;

    const terms = [
      { months: 1, fights: 1, fee: 5000 },
      { months: 2, fights: 2, fee: 7500 },
      { months: 3, fights: 3, fee: 10500 }
    ];

    st.recruits = terms.map((t, i) => {
      const gen = this.generateApplicant(t.fee * 1.4);
      return {
        id: 'merc-' + Date.now() + '-' + i,
        firstName: gen.firstName,
        lastName: gen.lastName,
        callsign: gen.callsign,
        portraitId: gen.portraitId,
        bio: `Short-term flat-fee mercenary (${t.months} Mo / ${t.fights} Fight limit, strong in ${gen.primaryWeapon}).`,
        xp: 120,
        xpSpent: gen.xpSpent,
        flatFee: t.fee,
        termMonths: t.months,
        termFights: t.fights,
        baseSalary: 0,
        stats: gen.stats,
        skills: gen.skills
      };
    });

    window.GameState.advanceTimeWeeks(1, 'Scouted Freelance Mercenaries');
    this.render();
  }
};
