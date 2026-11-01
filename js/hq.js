// HQ & Jockey Management Module — Featuring Mercenary Job Posting, Interview & Wage Negotiation

window.HQModule = {
  creatorOpen: false,
  editMode: false,
  selectedPortraitId: 'visor-blue',

  // Job Posting & Interview State
  offeredBonusInput: 5000,
  interviewOpen: false,
  candidate: null,
  askedQuestions: {},
  proposedWage: 1200,
  proposedBonus: 5000,
  negotiationMessage: '',
  candidateWalkedOut: false,

  render() {
    const st = window.GameState.data;
    const container = document.getElementById('view-hq');
    if (!container) return;

    const jock = st.jocks.find(j => j.id === st.selectedJockId) || st.jocks[0];
    if (jock && st.selectedJockId !== jock.id) st.selectedJockId = jock.id;

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
                Post Offer &amp; Interview Next Applicant &rarr;
              </button>
            </div>
          </div>

          <!-- Squad Roster Card -->
          <div class="card">
            <div class="section-header">
              <div>
                <div class="section-title">Active Squad Jocks (${st.jocks.length} / 8)</div>
                <div class="subtext">Click a Jock to inspect dossier or train XP</div>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${st.jocks.length === 0 ? `
                <div class="panel subtext" style="text-align:center; padding:18px 12px;">
                  No Jocks on your payroll yet.<br/>Set a Signing Bonus above and click <strong>Post Offer &amp; Interview Next Applicant</strong>!
                </div>
              ` : st.jocks.map(j => {
                const rk = window.GameState.getJockRank(j);
                const mech = st.mechs.find(m => m.id === j.assignedMechId);
                const isSel = j.id === jock?.id;
                return `
                  <div class="list-item ${isSel ? 'selected' : ''}" onclick="HQModule.selectJock('${j.id}')">
                    <div style="display:flex; align-items:center; gap:10px;">
                      <div style="flex-shrink:0;">${window.GameState.getPortraitSvg(j.portraitId)}</div>
                      <div style="flex:1; min-width:0;">
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
                          <strong style="font-size:14px;">${j.firstName} "${j.callsign}" ${j.lastName}</strong>
                          <span class="badge primary">${rk.name}</span>
                        </div>
                        <div class="subtext" style="margin-top:2px;">
                          Titan: <strong>${mech ? mech.customName : 'Unassigned'}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:12px;">
                          <span class="mono" style="color:var(--accent-green); font-weight:700;">${j.xp} XP Ready</span>
                          <span class="mono subtext">Wage: ${window.GameState.getJockSalary(j).toLocaleString()} Cr/mo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
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
                <button class="btn" style="flex:1;" onclick="HQModule.repairAllMechs()">Repair All Mechs</button>
                <button class="btn" style="flex:1;" onclick="HQModule.healAllJocks()">Treat Wounded Jocks</button>
              </div>
            </div>
          </div>

        </div>

        <!-- Right 8 Cols: Selected Jock Full Dossier, Attributes & 0-100% Skills -->
        <div class="col-8" style="display:flex; flex-direction:column; gap:16px;">
          ${jock ? this.renderDossier(jock) : `
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

    // Generate 6 attributes (10 to 19)
    const baseAttr = Math.round(11 + tier * 5);
    const stats = {
      Constitution: Math.min(20, Math.max(9, baseAttr + randRange(-2, 3))),
      Intelligence: Math.min(20, Math.max(9, baseAttr + randRange(-2, 3))),
      Instinct: Math.min(20, Math.max(9, baseAttr + randRange(-2, 3))),
      Reflexes: Math.min(20, Math.max(9, baseAttr + randRange(-2, 3))),
      Piloting: Math.min(20, Math.max(9, baseAttr + randRange(-2, 3))),
      Bravery: Math.min(20, Math.max(9, baseAttr + randRange(-2, 3)))
    };

    // Pick 1 primary weapon specialty and 1 secondary weapon skill
    const weaponKeys = ['Energy Weapons', 'Cannons / Ballistic', 'Guided Missiles', 'Close Combat'];
    const primaryWeapon = pick(weaponKeys);
    const baseSkill = Math.round(40 + tier * 38);

    const skills = {};
    weaponKeys.forEach(wk => {
      if (wk === primaryWeapon) {
        skills[wk] = Math.min(95, baseSkill + randRange(8, 18));
      } else {
        skills[wk] = Math.min(90, Math.max(25, baseSkill + randRange(-15, 8)));
      }
    });

    skills['Recon / Scanner'] = Math.min(92, Math.max(25, baseSkill + randRange(-12, 14)));
    skills['Damage Control'] = Math.min(92, Math.max(25, baseSkill + randRange(-10, 12)));
    skills['Leadership'] = Math.min(90, Math.max(25, baseSkill + randRange(-15, 10)));
    skills['Survival'] = Math.min(90, Math.max(30, baseSkill + randRange(-10, 12)));
    skills['Mechanic (Repair)'] = Math.min(90, Math.max(25, baseSkill + randRange(-15, 18)));
    skills['Medical (First Aid)'] = Math.min(90, Math.max(25, baseSkill + randRange(-15, 18)));

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
      xp: randRange(250, 500),
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
    this.candidateWalkedOut = false;
    this.negotiationMessage = `"Thanks for bringing me in, Commander. With a ${this.proposedBonus.toLocaleString()} Cr signing bonus on the table, I'm looking for ${this.candidate.askingWage.toLocaleString()} Cr per month. Feel free to ask me anything about my cockpit record."`;
    this.interviewOpen = true;
    this.render();
  },

  askInterviewQuestion(qKey) {
    if (!this.candidate || this.candidateWalkedOut) return;
    const c = this.candidate;
    const s = c.stats;
    const sk = c.skills;

    if (qKey === 'weapons') {
      const topWep = c.primaryWeapon;
      const topVal = sk[topWep];
      const worstWep = ['Energy Weapons', 'Cannons / Ballistic', 'Guided Missiles', 'Close Combat']
        .reduce((w, k) => (sk[k] < sk[w] ? k : w), 'Close Combat');

      let reply = '';
      let clue = '';
      if (topVal >= 75) {
        reply = `"Put me in a cockpit with ${topWep} and I don't miss—I've drilled target cores at maximum range under heavy fire. Just don't ask me to rely on ${worstWep}; I never cared for them."`;
        clue = `Strong mastery in ${topWep} (Est. 75–95%), weak in ${worstWep}.`;
      } else if (topVal >= 55) {
        reply = `"I'm qualifying-certified and comfortable firing ${topWep} in combat salvos, though I'm still sharpening my edge with ${worstWep}."`;
        clue = `Solid proficiency in ${topWep} (Est. 55–74%), lower ${worstWep}.`;
      } else {
        reply = `"I've mostly logged academy simulator hours on ${topWep} so far. I'll need live-fire combat XP to really dial in my gunnery."`;
        clue = `Green gunnery across the board; best is ${topWep} (Est. <55%).`;
      }
      this.askedQuestions.weapons = { q: '1. Weapon Systems & Gunnery Preference', reply, clue };
    } else if (qKey === 'piloting') {
      const pil = s.Piloting;
      const ref = s.Reflexes;
      let reply = '';
      let clue = '';
      if (pil >= 16 && ref >= 16) {
        reply = `"My neural reaction times tested in the top decile. Rough boulders, swamp mud, jump-jet landings on one leg—I keep the gyro upright when everyone else faceplants."`;
        clue = `High Piloting & Reflexes (Est. 16–20).`;
      } else if (pil >= 13 || ref >= 13) {
        reply = `"I keep my Titan steady on standard terrain and react fast enough in a torso-twist duel, though extreme jump landings still make me sweat."`;
        clue = `Moderate Piloting & Reflexes (Est. 13–15).`;
      } else {
        reply = `"Truthfully, heavy mechs feel sluggish to me and I've had a couple rough knockdowns in training. Give me wide-open ground if you can."`;
        clue = `Below-average Piloting/Reflexes (Est. 9–12).`;
      }
      this.askedQuestions.piloting = { q: '2. Reflexes & Terrain Piloting', reply, clue };
    } else if (qKey === 'pressure') {
      const brv = s.Bravery;
      const con = s.Constitution;
      const dc = sk['Damage Control'];
      let reply = '';
      let clue = '';
      if (brv >= 16 && con >= 15) {
        reply = `"When the cockpit hits 40 degrees Celsius, alarms are screaming, and chest armor is stripped to the reactor, my pulse doesn't even spike. I override the thermal shutdown and finish the shot."`;
        clue = `Iron-willed Bravery & Constitution (Est. 16+), Damage Control ~${dc >= 65 ? 'High' : 'Moderate'}.`;
      } else if (brv >= 13) {
        reply = `"I hold my nerve in a firefight and know how to manage reactor coolant, though I'm not suicidal if a 200-ton Assault mech corners me."`;
        clue = `Steady Bravery & Constitution (Est. 13–15).`;
      } else {
        reply = `"Look, I'm a professional, not a martyr. If my cockpit canopy cracks or the reactor redlines, I'm reaching for the ejection handle early."`;
        clue = `Cautious/Low Bravery or Constitution (Est. 9–12).`;
      }
      this.askedQuestions.pressure = { q: '3. Cockpit Stress, Heat & Guts Under Fire', reply, clue };
    } else if (qKey === 'tech') {
      const mechSk = sk['Mechanic (Repair)'];
      const medSk = sk['Medical (First Aid)'];
      const intStat = s.Intelligence;
      let reply = '';
      let clue = '';
      if (mechSk >= 65 || medSk >= 65) {
        const bestSupport = mechSk >= medSk ? 'Hangar Gantry Mechanic' : 'Trauma Field Medic';
        reply = `"Between contracts I don't just sit in the lounge—I worked as a certified ${bestSupport}. I can patch armor plates or stitch up wounded squadmates myself."`;
        clue = `High Technical/Support value (${bestSupport} Est. 65%+, INT ~${intStat}).`;
      } else {
        reply = `"I know basic cockpit pre-flight checks and how to slap on a field bandage, but I'm a combat pilot, not a chief engineer or surgeon."`;
        clue = `Standard/Low Mechanic & Medical skills (Est. 25–55%).`;
      }
      this.askedQuestions.tech = { q: '4. Hangar Repair & Medical Triage Skills', reply, clue };
    } else if (qKey === 'recon') {
      const scanSk = sk['Recon / Scanner'];
      const leadSk = sk['Leadership'];
      const ins = s.Instinct;
      let reply = '';
      let clue = '';
      if (scanSk >= 65 || ins >= 16) {
        reply = `"I read deep-pulse scanner returns like a book. I'll spot enemy missile boats through dense woods long before they get a lock on our lance."`;
        clue = `Strong Recon/Scanner & Instinct (Est. 65%+ Scan, INS ~${ins}).`;
      } else {
        reply = `"I rely on visual line-of-sight and standard targeting computers. Leave the fancy electronic warfare to someone else."`;
        clue = `Basic Recon/Scanner & Leadership (Est. <60%).`;
      }
      this.askedQuestions.recon = { q: '5. Electronic Warfare, Scanners & Command', reply, clue };
    }

    this.render();
  },

  updateNegotiationInputs() {
    const wEl = document.getElementById('neg-inp-wage');
    const bEl = document.getElementById('neg-inp-bonus');
    if (wEl) this.proposedWage = Math.max(200, Number(wEl.value) || 500);
    if (bEl) this.proposedBonus = Math.max(500, Number(bEl.value) || 1000);
  },

  testCounterOffer() {
    if (!this.candidate || this.candidateWalkedOut) return;
    this.updateNegotiationInputs();
    const c = this.candidate;

    // Effective monthly value combines wage + amortized bonus difference
    const bonusAdjustment = Math.round((this.proposedBonus - this.offeredBonusInput) * 0.05);
    const effectiveWageOffer = this.proposedWage + bonusAdjustment;

    if (effectiveWageOffer >= c.askingWage) {
      this.negotiationMessage = `"${this.proposedBonus.toLocaleString()} Cr up front and ${this.proposedWage.toLocaleString()} Cr a month? That's a square deal, Commander. Put the contract in front of me and I'll sign right now!"`;
    } else if (effectiveWageOffer >= c.minWage) {
      c.patience -= 1;
      if (c.patience <= 0) {
        this.candidateWalkedOut = true;
        this.negotiationMessage = `"We've been haggling in circles over nickels and dimes while I put my life on the line in a reactor core. I'm withdrawing my application."`;
      } else {
        const counter = Math.round(((this.proposedWage + c.askingWage) / 2) / 50) * 50;
        c.askingWage = counter;
        this.negotiationMessage = `"Hmm... ${this.proposedWage.toLocaleString()} Cr/mo is a bit tight for my skill set. Meet me halfway at ${counter.toLocaleString()} Cr/mo (or sweeten the signing bonus) and you have a deal."`;
      }
    } else {
      c.patience -= 2;
      if (c.patience <= 0) {
        this.candidateWalkedOut = true;
        this.negotiationMessage = `"${this.proposedWage.toLocaleString()} Cr a month?! That's an insult to a Titan Jock. Find yourself a desperate academy washout—interview's over!"`;
      } else {
        this.negotiationMessage = `"Commander, ${this.proposedWage.toLocaleString()} Cr/mo won't even cover my life-support insurance! You'll need to come much closer to ${c.askingWage.toLocaleString()} Cr/mo before I walk out."`;
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

    const bonusAdjustment = Math.round((this.proposedBonus - this.offeredBonusInput) * 0.05);
    const effectiveWageOffer = this.proposedWage + bonusAdjustment;

    if (effectiveWageOffer < c.minWage) {
      this.testCounterOffer();
      return;
    }

    // Deduct signing bonus and add Jock to active squad with negotiated base salary!
    st.credits -= this.proposedBonus;
    const newId = 'jock-' + Date.now();
    const freeMech = st.mechs.find(m => !st.jocks.some(j => j.assignedMechId === m.id));

    const tempJock = { xpSpent: c.xpSpent };
    const rk = window.GameState.getJockRank(tempJock);
    const baseSalary = Math.max(300, Math.round(this.proposedWage / rk.salaryMult));

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
      health: 100,
      kills: 0,
      missions: 0,
      assignedMechId: freeMech ? freeMech.id : '',
      stats: { ...c.stats },
      skills: { ...c.skills }
    });

    st.selectedJockId = newId;
    this.interviewOpen = false;
    this.candidate = null;
    window.GameState.save();
    App.updateHUD();
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
    const questions = [
      { key: 'weapons', label: 'Ask About Weapon & Gunnery Specialties' },
      { key: 'piloting', label: 'Ask About Piloting, Reflexes & Rough Terrain' },
      { key: 'pressure', label: 'Ask About Cockpit Heat, Guts & Pressure Under Fire' },
      { key: 'tech', label: 'Ask About Hangar Mechanic & Medical Experience' },
      { key: 'recon', label: 'Ask About Scanners, ECM & Squad Leadership' }
    ];
    const askedList = Object.values(this.askedQuestions);
    const askedCount = askedList.length;

    return `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:880px;">
          <div class="section-header">
            <div>
              <span class="badge primary">MERCENARY RECRUITMENT INTERVIEW</span>
              <h3 style="font-size:18px; font-weight:800; margin-top:4px;">
                Applicant: ${c.firstName} "${c.callsign}" ${c.lastName}
              </h3>
            </div>
            <button class="btn" onclick="HQModule.closeInterview()">Dismiss Applicant (Pay 0 Cr)</button>
          </div>

          <div class="grid-12">
            <!-- Left 5 Cols: Applicant Dossier (Stats Hidden until Hired) + Wage Negotiation -->
            <div class="col-5" style="display:flex; flex-direction:column; gap:12px;">
              <div class="panel" style="display:flex; gap:12px; align-items:center;">
                <div>${window.GameState.getPortraitSvg(c.portraitId)}</div>
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
                  <strong style="font-size:13px;">Commander's Interview Notes</strong>
                  <span class="mono subtext">${askedCount} / 5 Probed</span>
                </div>
                ${askedCount === 0 ? `
                  <div class="subtext" style="font-style:italic; padding:6px 0;">
                    No questions asked yet. Question the applicant on the right to uncover clues about their true Attributes and Skills!
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
                  <strong style="font-size:13px;">Contract &amp; Wage Negotiation</strong>
                  <span class="badge ${this.candidateWalkedOut ? 'red' : 'green'}">
                    ${this.candidateWalkedOut ? 'Walked Out' : `Patience: ${c.patience}/3`}
                  </span>
                </div>

                <div style="display:flex; justify-content:space-between; font-size:12px;">
                  <span class="subtext">Applicant's Asking Wage:</span>
                  <strong class="mono" style="color:var(--accent-amber);">${c.askingWage.toLocaleString()} Cr / month</strong>
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

              <!-- 5 Interview Questions to Probe Hidden Stats -->
              <div style="display:flex; flex-direction:column; gap:6px;">
                <div class="subtext" style="font-weight:700; text-transform:uppercase;">Ask Interview Questions to Gauge Hidden Stats:</div>
                ${questions.map(q => {
                  const alreadyAsked = !!this.askedQuestions[q.key];
                  return `
                    <button
                      class="btn ${alreadyAsked ? '' : 'btn-primary'}"
                      style="text-align:left; padding:9px 12px; display:flex; justify-content:space-between; align-items:center;"
                      ${this.candidateWalkedOut ? 'disabled' : ''}
                      onclick="HQModule.askInterviewQuestion('${q.key}')"
                    >
                      <span>${q.label}</span>
                      <span class="mono" style="font-size:12px;">${alreadyAsked ? '&#9989; Asked' : 'Ask &rarr;'}</span>
                    </button>
                  `;
                }).join('')}
              </div>

              <!-- Full Interview Q&A Transcript -->
              <div class="panel" style="display:flex; flex-direction:column; gap:8px; max-height:210px; overflow-y:auto;">
                <div class="subtext" style="font-weight:700; text-transform:uppercase;">Interview Transcript</div>
                ${askedCount === 0 ? `<div class="subtext">Click any question above to begin interviewing ${c.callsign}.</div>` : askedList.map(item => `
                  <div style="border-bottom:1px solid var(--border); padding-bottom:8px;">
                    <div style="font-weight:700; font-size:12px; color:#93c5fd;">Q: ${item.q}</div>
                    <div style="font-size:13px; font-style:italic; margin-top:3px;">${item.reply}</div>
                  </div>
                `).join('')}
              </div>

            </div>
          </div>

        </div>
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
            <div class="panel" style="padding:8px;">
              ${window.GameState.getPortraitSvg(jock.portraitId)}
            </div>
            <div>
              <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px;">
                <h2 style="font-size:18px; font-weight:700;">${jock.firstName} "${jock.callsign}" ${jock.lastName}</h2>
                <span class="badge primary">${rank.name}</span>
                <span class="badge green">HP ${jock.health}%</span>
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
              <div class="section-title">6 Classic Attributes</div>
              <div class="subtext">Cost: 100 XP per +1 Attribute Point (Max 20)</div>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${window.TOS_DATA.attributes.map(attr => {
              const val = jock.stats[attr.key] || 10;
              const pct = Math.min(100, Math.round((val / 20) * 100));
              return `
                <div class="panel" style="display:flex; flex-direction:column; gap:6px;">
                  <div style="display:flex; align-items:center; justify-content:space-between;">
                    <div>
                      <strong>${attr.key}</strong> <span class="subtext mono">(${attr.abbr})</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="mono" style="font-size:15px; font-weight:700;">${val}</span>
                      <button class="btn btn-primary" ${jock.xp < 100 || val >= 20 ? 'disabled' : ''} onclick="HQModule.trainAttr('${attr.key}')">
                        +1 (100 XP)
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
              <div class="subtext">Cost: 50 XP per +5% Skill Increase</div>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${window.TOS_DATA.skills.map(sk => {
              const val = jock.skills[sk.key] || 30;
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
                      <button class="btn btn-primary" ${jock.xp < 50 || val >= 100 ? 'disabled' : ''} onclick="HQModule.trainSkill('${sk.key}')">
                        +5% (50 XP)
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
            <label class="subtext">Select Jock Portrait Helmet / Visor</label>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-top:6px;">
              ${window.TOS_DATA.portraits.map(p => `
                <div class="list-item ${this.selectedPortraitId === p.id ? 'selected' : ''}" onclick="HQModule.pickPortrait('${p.id}')" style="display:flex; align-items:center; gap:8px;">
                  ${p.svg}
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
    if (!jock || jock.xp < 100 || jock.stats[attrKey] >= 20) return;
    jock.xp -= 100;
    jock.xpSpent += 100;
    jock.stats[attrKey] += 1;
    window.GameState.save();
    App.updateHUD();
    this.render();
  },

  trainSkill(skillKey) {
    const st = window.GameState.data;
    const jock = st.jocks.find(j => j.id === st.selectedJockId);
    if (!jock || jock.xp < 50 || jock.skills[skillKey] >= 100) return;
    jock.xp -= 50;
    jock.xpSpent += 50;
    jock.skills[skillKey] = Math.min(100, jock.skills[skillKey] + 5);
    window.GameState.save();
    App.updateHUD();
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
      Object.keys(m.armor).forEach(k => {
        totalMissing += Math.max(0, m.maxArmorCurrent[k] - m.armor[k]);
        m.armor[k] = m.maxArmorCurrent[k];
      });
    });
    const bestMechSkill = Math.max(30, ...st.jocks.map(j => j.skills['Mechanic (Repair)'] || 30));
    const discount = Math.min(0.5, bestMechSkill / 200);
    const cost = Math.round(totalMissing * 40 * (1 - discount));
    if (totalMissing > 0 && st.credits >= cost) {
      st.credits -= cost;
      window.GameState.save();
      App.updateHUD();
      this.render();
    }
  },

  healAllJocks() {
    const st = window.GameState.data;
    st.jocks.forEach(j => { j.health = 100; });
    window.GameState.save();
    this.render();
  }
};
