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
  proposedYears: 2,
  proposedFights: 10,
  negotiationMessage: '',
  candidateWalkedOut: false,
  interviewSubTab: 'inquire', // 'inquire' | 'terms' | 'notes'
  interviewQuestionCategory: 'all', // 'all' | 'attribute' | 'weapon' | 'support'

  // Contract Expiration Prompt & Renegotiation State
  renegotiateOpen: false,
  renegotiateJockId: '',
  renegotiateIsExpiredPrompt: false,
  renegotiateReason: '',
  renegYears: 2,
  renegFights: 10,
  renegBonus: 3000,
  renegWage: 1200,
  renegMessage: '',
  renegPatience: 3,

  render() {
    this.updateRenegotiationModalMount();
    const st = window.GameState.data;
    const container = document.getElementById('view-hq');
    if (!container) return;

    // First-Person POV Interview Screen (Interviewer POV, table, interviewee seated across)
    if (this.interviewOpen && this.candidate) {
      container.innerHTML = this.renderInterviewPOVScreen();
      return;
    }

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
    window.GameState.ensureJobListing();
    const jobListing = st.jobListing;
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
          
          <!-- Mercenary Recruitment Job Posting & Calendar Applicant Queue Card -->
          <div class="card" style="border-color:var(--primary);">
            <div class="section-header">
              <div>
                <div class="section-title">Recruit Jockey — Job Listing &amp; Queue</div>
                <div class="subtext">Post a listing; applicants line up as Calendar Weeks pass</div>
              </div>
              <span class="badge ${jobListing.active ? 'green' : 'amber'} mono">
                ${jobListing.active ? `LIVE (${jobListing.applicants.length}/4 In Line)` : 'NO LISTING'}
              </span>
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

              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button class="btn btn-primary" style="flex:1; padding:9px;" onclick="HQModule.postJobListing()">
                  ${jobListing.active ? 'Update Job Listing Bonus' : 'Post Job Listing on Comms'}
                </button>
                ${jobListing.active ? `
                  <button class="btn btn-danger" style="padding:9px;" onclick="HQModule.closeJobListing()">
                    Close Listing
                  </button>
                ` : ''}
              </div>

              ${jobListing.active ? `
                <div class="card" style="background:var(--bg-main); padding:10px; gap:8px; border-color:var(--accent-green);">
                  <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px;">
                    <span style="color:var(--accent-green); font-weight:700;">&#9679; Active Listing: ${(jobListing.advertisedBonus || 6000).toLocaleString()} Cr Bonus</span>
                    <span class="mono subtext">Open ${jobListing.weeksActive || 0} Wk${jobListing.weeksActive === 1 ? '' : 's'}</span>
                  </div>
                  <div class="subtext" style="font-size:12px;">
                    Applicants arrive automatically as calendar time passes (while building Mechs, equipping parts, or advancing weeks below).
                  </div>
                  <div style="display:flex; gap:6px;">
                    <button class="btn" style="flex:1; padding:6px 8px; font-size:12px;" onclick="HQModule.waitForApplicants(1)">
                      &#9201; Advance +1 Week
                    </button>
                    <button class="btn" style="flex:1; padding:6px 8px; font-size:12px;" onclick="HQModule.waitForApplicants(4)">
                      &#9201; Advance +1 Month (4 Wks)
                    </button>
                  </div>
                </div>
              ` : `
                <div class="subtext" style="line-height:1.4;">
                  Post a Job Listing with your Signing Bonus offer above. Once active, applicants will line up over time on the game calendar so you can choose who to interview!
                </div>
              `}

              <!-- Waiting Line of Applicants -->
              <div style="display:flex; flex-direction:column; gap:8px; margin-top:2px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span class="subtext" style="font-weight:700; text-transform:uppercase;">Applicants Lined Up (${jobListing.applicants.length} / 4):</span>
                </div>
                ${jobListing.applicants.length === 0 ? `
                  <div class="card subtext" style="background:var(--bg-main); padding:12px; text-align:center; font-size:12px;">
                    ${jobListing.active
                      ? 'No applicants in line yet. Pilots hear about your listing and apply periodically over calendar time (roughly ~1 pilot per month) while you build or maintain Titans!'
                      : 'Post a Job Listing above so Jockey applicants begin lining up over time.'}
                  </div>
                ` : jobListing.applicants.map(cand => `
                  <div class="card" style="background:var(--bg-main); padding:10px; gap:8px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                      <div style="flex-shrink:0;">${window.GameState.getPortraitSvg(cand.portraitId, 48)}</div>
                      <div style="flex:1; min-width:0;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:4px;">
                          <strong style="font-size:13px;">${cand.firstName} "${cand.callsign}" ${cand.lastName}</strong>
                          <span class="badge primary mono" style="font-size:10px;">${cand.appliedDate || 'Just Arrived'}</span>
                        </div>
                        <div class="subtext" style="font-size:11px; margin-top:2px;">${cand.bio}</div>
                        <div class="mono" style="font-size:11px; color:var(--accent-amber); margin-top:3px;">
                          Est. Wage Target: ~${cand.askingWage.toLocaleString()} Cr/mo
                        </div>
                      </div>
                    </div>
                    <div style="display:flex; gap:6px;">
                      <button
                        class="btn btn-primary"
                        style="flex:1; padding:5px 8px; font-size:12px;"
                        ${st.jocks.length >= 8 ? 'disabled' : ''}
                        onclick="HQModule.interviewQueuedApplicant('${cand.applicantId}')"
                      >
                        Choose for Interview (+1 Wk) &rarr;
                      </button>
                      <button
                        class="btn"
                        style="padding:5px 8px; font-size:12px;"
                        onclick="HQModule.dismissQueuedApplicant('${cand.applicantId}')"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
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

        <!-- Right 8 Cols: Company Roster Overview & Applicant Waiting Lobby -->
        <div class="col-8" style="display:flex; flex-direction:column; gap:16px;">
          ${st.jocks.length > 0 ? this.renderSquadOverviewDirectory() : `
            <div class="card" style="padding:36px 28px; text-align:center; align-items:center; gap:16px;">
              <span class="badge primary">RECRUITMENT &amp; INTERVIEW OFFICE</span>
              <h2 style="font-size:22px; font-weight:800;">No MechJocks Under Contract Yet</h2>
              <p class="subtext" style="max-width:580px; font-size:14px;">
                To recruit your first MechJock, <strong>1. Post a Job Listing</strong> on the left with your Signing Bonus offer, <strong>2. Advance the Game Calendar</strong> (or build a Mech in the Garage) as applicants line up over time, and <strong>3. Choose an Applicant from the Line</strong> to conduct a Job Interview!
              </p>
              <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center; margin-top:6px;">
                ${!jobListing.active ? `
                  <button class="btn btn-primary" style="padding:10px 18px; font-size:13px;" onclick="HQModule.postJobListing()">
                    1. Post Job Listing (${this.offeredBonusInput.toLocaleString()} Cr Bonus Offer)
                  </button>
                ` : `
                  <button class="btn btn-primary" style="padding:10px 18px; font-size:13px;" onclick="HQModule.waitForApplicants(1)">
                    &#9201; Advance Calendar +1 Week (${jobListing.applicants.length} Applicant${jobListing.applicants.length === 1 ? '' : 's'} Lined Up)
                  </button>
                `}
                <button class="btn" style="padding:10px 18px; font-size:13px;" onclick="App.switchTab('garage')">
                  2. Commission a Mech in Garage &rarr;
                </button>
              </div>
            </div>
          `}
        </div>
      </div>

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

  postJobListing() {
    const st = window.GameState.data;
    window.GameState.ensureJobListing();
    const bonusInput = document.getElementById('inp-signing-bonus');
    if (bonusInput) this.offeredBonusInput = Math.max(500, Number(bonusInput.value) || 2000);

    st.jobListing.active = true;
    st.jobListing.advertisedBonus = this.offeredBonusInput;
    st.jobListing.postedDateText = window.GameState.getCalendarText();
    window.GameState.save();
    App.updateHUD();
    this.render();
  },

  closeJobListing() {
    const st = window.GameState.data;
    window.GameState.ensureJobListing();
    st.jobListing.active = false;
    window.GameState.save();
    App.updateHUD();
    this.render();
  },

  waitForApplicants(weeks = 1) {
    window.GameState.ensureJobListing();
    const jl = window.GameState.data.jobListing;
    if (!jl.active) {
      this.postJobListing();
    }
    window.GameState.advanceTimeWeeks(weeks, 'Recruiting Comms Broadcast');
    this.render();
  },

  dismissQueuedApplicant(applicantId) {
    const st = window.GameState.data;
    window.GameState.ensureJobListing();
    st.jobListing.applicants = st.jobListing.applicants.filter(a => a.applicantId !== applicantId);
    window.GameState.save();
    this.render();
  },

  interviewQueuedApplicant(applicantId) {
    const st = window.GameState.data;
    window.GameState.ensureJobListing();
    const cand = st.jobListing.applicants.find(a => a.applicantId === applicantId);
    if (!cand) return;

    const offerBonus = cand.offeredBonusAtApply || st.jobListing.advertisedBonus || this.offeredBonusInput;
    if (st.credits < offerBonus) {
      alert(`Insufficient treasury funds to back a ${offerBonus.toLocaleString()} Cr signing bonus offer!`);
      return;
    }

    // Remove chosen applicant from the waiting line as they enter the interview room
    st.jobListing.applicants = st.jobListing.applicants.filter(a => a.applicantId !== applicantId);

    this.candidate = cand;
    this.askedQuestions = {};
    this.proposedBonus = offerBonus;
    this.proposedWage = this.candidate.askingWage;
    this.proposedYears = 2;
    this.proposedFights = 10;
    this.candidateWalkedOut = false;
    this.interviewSubTab = 'inquire';
    this.lastAskedQId = '';
    this.interviewQuestionCategory = 'all';
    this.negotiationMessage = `"Thanks for calling me in from the applicant queue, Commander. I'm ready to discuss joining your company. Ask me anything about my combat training or cockpit record."`;
    this.interviewOpen = true;
    window.GameState.advanceTimeWeeks(1, `Interviewed Applicant ${this.candidate.callsign}`);
    this.render();
  },

  startJobInterview() {
    const st = window.GameState.data;
    window.GameState.ensureJobListing();
    if (st.jobListing.applicants.length > 0) {
      this.interviewQueuedApplicant(st.jobListing.applicants[0].applicantId);
      return;
    }
    this.postJobListing();
    this.waitForApplicants(1);
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
      fullPrompt: `"${qObj.prompt}"`,
      reply,
      clue
    };
    this.negotiationMessage = reply;
    this.lastAskedQId = qId;

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

  getContractTermLabel() {
    return `${this.proposedFights} Fights or ${this.proposedYears} Yr${this.proposedYears > 1 ? 's' : ''} Max (Whichever First)`;
  },

  // Longer contracts require slightly more signing bonus or wage security to lock the pilot in
  getContractLengthModifier() {
    const fightsMod = Math.round((this.proposedFights - 10) * 14);
    const yearsMod = Math.round((this.proposedYears - 2) * 55);
    return fightsMod + yearsMod;
  },

  testCounterOffer() {
    this.lastAskedQId = '';
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

    // Deduct signing bonus and add Jock to active squad with negotiated base salary & dual-condition contract!
    st.credits -= this.proposedBonus;
    const newId = 'jock-' + Date.now();
    const freeMech = st.mechs.find(m => !st.jocks.some(j => j.assignedMechId === m.id));

    const tempJock = { xpSpent: c.xpSpent };
    const rk = window.GameState.getJockRank(tempJock);
    const baseSalary = Math.max(300, Math.round(this.proposedWage / rk.salaryMult));

    const contractObj = {
      type: 'standard',
      totalYears: this.proposedYears,
      totalMonths: this.proposedYears * 12,
      monthsRemaining: this.proposedYears * 12,
      totalFights: this.proposedFights,
      fightsRemaining: this.proposedFights,
      whicheverComesFirst: true,
      expired: false
    };

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

  setInterviewSubTab(tab) {
    this.updateNegotiationInputs();
    this.interviewSubTab = tab;
    this.render();
  },

  setInterviewCategory(cat) {
    this.interviewQuestionCategory = cat;
    this.render();
  },

  // Full question readout shown in the spoken response box: hover preview, or the last asked question kept up
  getInterviewQuestionLineHtml(previewId = '') {
    const qs = window.TOS_DATA.interviewQuestions || [];
    if (previewId) {
      const q = qs.find(x => x.id === previewId);
      if (q) {
        const asked = !!this.askedQuestions[q.id];
        return `<span class="badge ${q.type === 'attribute' ? 'primary' : 'green'} mono" style="font-size:10px;">${q.badge}</span> ${asked ? 'Already asked' : 'Potential question'}: "${q.prompt}"`;
      }
    }
    const last = qs.find(x => x.id === this.lastAskedQId);
    if (last) {
      return `<span class="badge ${last.type === 'attribute' ? 'primary' : 'green'} mono" style="font-size:10px;">${last.badge}</span> You asked: "${last.prompt}"`;
    }
    return '<span class="subtext" style="font-weight:400;">Hover over a topic below to read the full question.</span>';
  },

  previewInterviewQuestion(qId) {
    const el = document.getElementById('interview-question-line');
    if (el) el.innerHTML = this.getInterviewQuestionLineHtml(qId);
  },

  renderInterviewPOVScreen() {
    if (!this.interviewOpen || !this.candidate) return '';
    const st = window.GameState.data;
    const c = this.candidate;
    const questions = window.TOS_DATA.interviewQuestions || [];
    const askedList = Object.values(this.askedQuestions);
    const askedCount = askedList.length;
    const repLvl = window.GameState.getCompanyReputationLevel();
    const maxAllowed = window.GameState.getMaxInterviewQuestions();
    const limitReached = askedCount >= maxAllowed;

    const lengthMod = this.getContractLengthModifier();
    const targetAsking = Math.max(450, c.askingWage + lengthMod);
    const p = window.TOS_DATA.portraits.find(x => x.id === c.portraitId) || window.TOS_DATA.portraits[0];
    const portraitHtml = p && p.img
      ? `<img src="${p.img}" alt="${c.callsign}" />`
      : (p ? p.svg : '');

    // Filter questions by selected category
    const cat = this.interviewQuestionCategory || 'all';
    const filteredQuestions = questions.filter(q => {
      if (cat === 'attribute') return q.type === 'attribute';
      if (cat === 'weapon') return q.badge.includes('ENERGY') || q.badge.includes('CANNON') || q.badge.includes('MISSILE') || q.badge.includes('MELEE');
      if (cat === 'support') return q.badge.includes('RECON') || q.badge.includes('DAMAGE') || q.badge.includes('LEADERSHIP') || q.badge.includes('SURVIVAL') || q.badge.includes('MECHANIC') || q.badge.includes('MEDICAL');
      return true;
    });

    const latestAskedKey = Object.keys(this.askedQuestions).pop();
    const latestClue = latestAskedKey ? this.askedQuestions[latestAskedKey]?.clue : '';

    return `
      <div class="interview-pov-stage">
        <!-- Top Bar / POV HUD -->
        <div class="interview-pov-top">
          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            <button class="btn" onclick="HQModule.closeInterview()" style="background:rgba(15,23,42,0.85); border-color:#64748b; font-weight:700;">
              &larr; Dismiss Applicant (Exit Interview)
            </button>
            <span class="badge primary">MERCENARY RECRUITMENT INTERVIEW // FIRST-PERSON POV</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span class="badge amber mono">Company Reputation Lvl ${repLvl}</span>
            <span class="badge green mono">Treasury: ${st.credits.toLocaleString()} Cr</span>
          </div>
        </div>

        <!-- Center View Across Desk: Seated Applicant & Spoken Dialogue -->
        <div class="interview-pov-center">
          <div class="interview-candidate-portrait-frame">
            ${portraitHtml}
            ${this.candidateWalkedOut ? `
              <div style="position:absolute; inset:0; background:rgba(239,68,68,0.78); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900; font-size:13px; text-transform:uppercase; letter-spacing:0.08em;">
                Walked Out
              </div>
            ` : ''}
          </div>

          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center;">
            <h2 style="font-size:18px; font-weight:800; color:#f8fafc; text-shadow:0 2px 8px rgba(0,0,0,0.9);">
              ${c.firstName} "${c.callsign}" ${c.lastName}
            </h2>
            <span class="badge ${this.candidateWalkedOut ? 'red' : 'green'} mono">
              ${this.candidateWalkedOut ? 'Interview Concluded' : `Patience: ${c.patience}/3`}
            </span>
          </div>
          <div class="subtext" style="color:#cbd5e1; font-size:12px; margin-top:2px; text-shadow:0 2px 6px rgba(0,0,0,0.9);">
            Asking Wage: <strong class="mono" style="color:var(--accent-amber);">${targetAsking.toLocaleString()} Cr/mo</strong> • ${c.bio}
          </div>

          <!-- Spoken Dialogue Across the Table -->
          <div class="interview-speech-bubble">
            <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#38bdf8; letter-spacing:0.06em; margin-bottom:4px; display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
              <span>${c.callsign}'s Spoken Response:</span>
              ${latestClue ? `<span class="mono" style="color:var(--accent-green);">&rarr; ${latestClue}</span>` : '<span class="subtext mono">Awaiting Topic</span>'}
            </div>
            ${limitReached ? `
              <div style="text-align:left; max-height:210px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; padding-right:4px;">
                <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--accent-amber); letter-spacing:0.06em;">Interview Recap (${askedCount}/${maxAllowed} Questions Asked)</div>
                ${askedList.map((item, i) => `
                  <div style="border-left:2px solid var(--accent-green); padding-left:8px;">
                    <div style="font-size:12px; font-weight:700; color:#93c5fd;">Q${i + 1}: ${item.fullPrompt || item.q}</div>
                    <div style="font-size:13px; font-style:italic; color:#f8fafc; margin-top:2px;">${item.reply}</div>
                    <div class="mono" style="font-size:11px; color:var(--accent-green); margin-top:2px;">&rarr; ${item.clue}</div>
                  </div>
                `).join('')}
                ${this.lastAskedQId ? '' : `
                  <div style="border-top:1px solid rgba(148,163,184,0.3); padding-top:6px; font-size:14px; font-style:italic; color:#f8fafc;">${this.negotiationMessage}</div>
                `}
              </div>
            ` : `
              <div id="interview-question-line" style="font-size:13px; font-weight:700; color:#93c5fd; margin-bottom:6px; text-align:left;">
                ${this.getInterviewQuestionLineHtml()}
              </div>
              <div style="font-size:14px; font-style:italic; color:#f8fafc; line-height:1.45;">
                ${this.negotiationMessage}
              </div>
            `}
          </div>
        </div>

        <!-- Foreground: Commander's Table / Tactical Datapad (Uncluttered) -->
        <div class="interview-pov-desk">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px; border-bottom:1px solid rgba(148,163,184,0.25); padding-bottom:10px;">
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <span style="font-size:12px; font-weight:700; text-transform:uppercase; color:#94a3b8; letter-spacing:0.06em; margin-right:4px;">Commander's Desk Datapad:</span>
              <button class="interview-datapad-tab ${this.interviewSubTab === 'inquire' ? 'active' : ''}" onclick="HQModule.setInterviewSubTab('inquire')">
                💬 1. Ask Questions (${maxAllowed - askedCount} Remaining)
              </button>
              <button class="interview-datapad-tab ${this.interviewSubTab === 'terms' ? 'active' : ''}" onclick="HQModule.setInterviewSubTab('terms')">
                📝 2. Contract Terms &amp; Hire
              </button>
              <button class="interview-datapad-tab ${this.interviewSubTab === 'notes' ? 'active' : ''}" onclick="HQModule.setInterviewSubTab('notes')">
                📋 3. Intel Notes &amp; Transcript (${askedCount})
              </button>
            </div>
            <div class="subtext mono" style="font-size:12px;">
              Reputation Limit: <strong>${askedCount} / ${maxAllowed} Questions Used</strong>
            </div>
          </div>

          <!-- TAB 1: Inquire (Categorized, Uncluttered Questions) -->
          ${this.interviewSubTab === 'inquire' ? `
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                  <button class="btn ${cat === 'all' ? 'btn-primary' : ''}" style="padding:6px 12px; font-size:12px;" onclick="HQModule.setInterviewCategory('all')">
                    All Topics (${questions.length})
                  </button>
                  <button class="btn ${cat === 'attribute' ? 'btn-primary' : ''}" style="padding:6px 12px; font-size:12px;" onclick="HQModule.setInterviewCategory('attribute')">
                    Attributes (6)
                  </button>
                  <button class="btn ${cat === 'weapon' ? 'btn-primary' : ''}" style="padding:6px 12px; font-size:12px;" onclick="HQModule.setInterviewCategory('weapon')">
                    Weapons (4)
                  </button>
                  <button class="btn ${cat === 'support' ? 'btn-primary' : ''}" style="padding:6px 12px; font-size:12px;" onclick="HQModule.setInterviewCategory('support')">
                    Support &amp; Crew (6)
                  </button>
                </div>
                ${limitReached ? `
                  <button class="btn btn-primary" onclick="HQModule.setInterviewSubTab('terms')">
                    Proceed to Contract Terms &rarr;
                  </button>
                ` : `
                  <span class="subtext mono" style="font-size:12px; color:var(--accent-green);">
                    ✔ Click any topic below to question ${c.callsign}
                  </span>
                `}
              </div>

              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:8px; max-height:220px; overflow-y:auto; padding-right:4px;">
                ${filteredQuestions.map(q => {
                  const alreadyAsked = !!this.askedQuestions[q.id];
                  const disabled = this.candidateWalkedOut || (!alreadyAsked && limitReached);
                  return `
                    <button
                      class="btn ${alreadyAsked ? '' : 'btn-primary'}"
                      style="text-align:left; padding:8px 10px; display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:12px;"
                      ${disabled ? 'disabled' : ''}
                      onclick="HQModule.askInterviewQuestion('${q.id}')" onmouseenter="HQModule.previewInterviewQuestion('${q.id}')" onmouseleave="HQModule.previewInterviewQuestion('')" onfocus="HQModule.previewInterviewQuestion('${q.id}')" onblur="HQModule.previewInterviewQuestion('')"
                    >
                      <div style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        <span class="badge ${q.type === 'attribute' ? 'primary' : 'green'} mono" style="margin-right:6px; font-size:10px;">${q.badge}</span>
                        <span>${q.prompt}</span>
                      </div>
                      <span class="mono" style="font-size:11px; flex-shrink:0;">
                        ${alreadyAsked ? '&#9989; Asked' : limitReached ? 'Locked' : 'Ask &rarr;'}
                      </span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <!-- TAB 2: Contract Terms & Hiring -->
          ${this.interviewSubTab === 'terms' ? `
            <div>
              <div class="grid-12" style="gap:14px; align-items:flex-end;">
                <div class="col-3">
                  <label class="subtext" style="font-weight:700;">1. Contract Fights:</label>
                  <select id="neg-inp-fights" class="select mono" style="margin-top:4px;" onchange="HQModule.updateNegotiationInputs(); HQModule.render();" ${this.candidateWalkedOut ? 'disabled' : ''}>
                    ${[3, 5, 10, 15, 25].map(f => `
                      <option value="${f}" ${this.proposedFights === f ? 'selected' : ''}>${f} Combat Fights</option>
                    `).join('')}
                  </select>
                </div>
                <div class="col-3">
                  <label class="subtext" style="font-weight:700;">2. Max Length of Time:</label>
                  <select id="neg-inp-years" class="select mono" style="margin-top:4px;" onchange="HQModule.updateNegotiationInputs(); HQModule.render();" ${this.candidateWalkedOut ? 'disabled' : ''}>
                    ${[1, 2, 3, 4, 5].map(yr => `
                      <option value="${yr}" ${this.proposedYears === yr ? 'selected' : ''}>${yr} Year${yr > 1 ? 's' : ''} (${yr * 12} Mos Max)</option>
                    `).join('')}
                  </select>
                </div>
                <div class="col-3">
                  <label class="subtext" style="font-weight:700;">3. Signing Bonus Offer (Cr):</label>
                  <input id="neg-inp-bonus" type="number" step="500" class="input mono" style="margin-top:4px;" value="${this.proposedBonus}" onchange="HQModule.updateNegotiationInputs()" ${this.candidateWalkedOut ? 'disabled' : ''} />
                </div>
                <div class="col-3">
                  <label class="subtext" style="font-weight:700;">4. Monthly Wage Offer (Cr/mo):</label>
                  <input id="neg-inp-wage" type="number" step="50" class="input mono" style="margin-top:4px;" value="${this.proposedWage}" onchange="HQModule.updateNegotiationInputs()" ${this.candidateWalkedOut ? 'disabled' : ''} />
                </div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-top:10px; font-size:12px; border-top:1px solid rgba(148,163,184,0.15); padding-top:8px;">
                <div class="subtext">
                  Contract Rule: Concludes after <strong>${this.proposedFights} Fights</strong> OR <strong>${this.proposedYears * 12} Months (${this.proposedYears} Yr${this.proposedYears > 1 ? 's' : ''})</strong>, whichever comes first.
                </div>
                <div class="mono" style="font-size:12px;">
                  Target Asking: <strong style="color:var(--accent-amber);">${targetAsking.toLocaleString()} Cr/mo</strong> • Treasury: <strong style="color:var(--accent-green);">${st.credits.toLocaleString()} Cr</strong>
                </div>
              </div>

              <div style="display:flex; gap:12px; margin-top:12px;">
                <button class="btn" style="flex:1; padding:11px; font-weight:700;" ${this.candidateWalkedOut ? 'disabled' : ''} onclick="HQModule.testCounterOffer()">
                  Propose Counter-Offer
                </button>
                <button class="btn btn-primary" style="flex:1.5; padding:11px; font-weight:800; font-size:14px;" ${this.candidateWalkedOut ? 'disabled' : ''} onclick="HQModule.signInterviewContract()">
                  &#128221; Sign Contract &amp; Onboard Jockey (+1 Wk)
                </button>
              </div>
            </div>
          ` : ''}

          <!-- TAB 3: Notes & Evaluation Transcript -->
          ${this.interviewSubTab === 'notes' ? `
            <div style="max-height:220px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
              ${askedCount === 0 ? `
                <div class="panel subtext" style="text-align:center; padding:16px;">
                  No questions asked yet. Switch to <strong>1. Ask Questions</strong> above to interrogate the applicant.
                </div>
              ` : askedList.map(item => `
                <div class="panel" style="padding:10px 14px; display:flex; flex-direction:column; gap:4px;">
                  <div style="font-weight:700; font-size:12px; color:#93c5fd;">Q: ${item.q}</div>
                  <div style="font-size:13px; font-style:italic; color:#f8fafc;">"${item.reply}"</div>
                  <div class="mono" style="font-size:12px; color:var(--accent-green); font-weight:700;">&rarr; ${item.clue}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

        </div>
      </div>
    `;
  },

  // Personality is generated once from the Jockey's stats (seeded by id) and then stored on the Jockey
  getJockPersonality(jock) {
    if (jock.personality && jock.personality.archetype) return jock.personality;

    const archetypes = {
      Constitution: { name: 'The Rock', temperament: 'Stoic and unshakeable', motto: '"I\'ve walked away from worse."' },
      Intelligence: { name: 'The Tactician', temperament: 'Calm, calculating, always three moves ahead', motto: '"Every fight is just math with louder noises."' },
      Instinct: { name: 'The Gambler', temperament: 'Impulsive and quick on the draw', motto: '"Gut feeling beats a plan every time."' },
      Reflexes: { name: 'The Hotshot', temperament: 'Cocky, fast, and eager to prove it', motto: '"Blink and you\'ll miss me."' },
      Piloting: { name: 'The Artist', temperament: 'Smooth, focused, in love with the machine', motto: '"A good Titan dances. It doesn\'t stomp."' },
      Bravery: { name: 'The Daredevil', temperament: 'Fearless to the point of reckless', motto: '"Close range is the only range."' }
    };
    const traitPool = [
      ['Loyal', 'Sticks with a company that treats them fairly'],
      ['Mercenary Heart', 'Follows the biggest paycheck'],
      ['Hot-Headed', 'Rises to every insult and provocation'],
      ['Superstitious', 'Never launches without a lucky charm'],
      ['Team Player', 'Looks out for the rest of the lance'],
      ['Lone Wolf', 'Prefers to fight on their own terms'],
      ['Perfectionist', 'Obsesses over every misstep'],
      ['Easygoing', 'Jokes through the worst drops'],
      ['Grudge Holder', 'Never forgets a rival'],
      ['Gearhead', 'Happiest with a wrench in hand'],
      ['Showboat', 'Plays to the crowd in the arena'],
      ['Disciplined', 'Follows orders to the letter']
    ];
    const likesPool = ['Well-maintained Titans', 'Prompt pay', 'Heavy weapons', 'Quiet hangars', 'Arena crowds', 'Long contracts', 'Clean victories', 'Strong coffee'];
    const dislikesPool = ['Overheating cockpits', 'Late wages', 'Pointless retreats', 'Cheap armor', 'Being micromanaged', 'Short contracts', 'Rival companies', 'Boring patrols'];

    // Deterministic seeded picks so a Jockey's personality never changes between reloads
    let seed = 0;
    const key = (jock.id || '') + (jock.callsign || '') + (jock.lastName || '');
    for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const pickIdx = (len, used = []) => { let n; do { n = Math.floor(rnd() * len); } while (used.includes(n)); return n; };

    let topAttr = 'Constitution';
    let topVal = -1;
    Object.entries(jock.stats || {}).forEach(([k, v]) => { if (v > topVal && archetypes[k]) { topVal = v; topAttr = k; } });
    const arch = archetypes[topAttr];

    const t1 = pickIdx(traitPool.length);
    const t2 = pickIdx(traitPool.length, [t1]);
    const l1 = pickIdx(likesPool.length);
    const d1 = pickIdx(dislikesPool.length);

    jock.personality = {
      archetype: arch.name,
      temperament: arch.temperament,
      motto: arch.motto,
      traits: [traitPool[t1], traitPool[t2]],
      likes: likesPool[l1],
      dislikes: dislikesPool[d1]
    };
    return jock.personality;
  },

  renderContractAndPersonality(jock) {
    const gs = window.GameState;
    gs.ensureJockContract(jock);
    const c = jock.contract;
    const isMerc = c.type === 'mercenary';
    const p = this.getJockPersonality(jock);
    const salary = gs.getJockSalary(jock);
    const fightsUsed = Math.max(0, (c.totalFights || 0) - (c.fightsRemaining || 0));
    const monthsUsed = Math.max(0, (c.totalMonths || 0) - (c.monthsRemaining || 0));
    const fightPct = c.totalFights ? Math.round((c.fightsRemaining / c.totalFights) * 100) : 0;
    const monthPct = c.totalMonths ? Math.round((c.monthsRemaining / c.totalMonths) * 100) : 0;

    // Estimated end date (if no more fights are fought, the time limit applies)
    gs.ensureCalendar();
    const endWeeks = gs.data.calendar.totalWeeks + Math.max(0, c.monthsRemaining) * 4;
    const endYear = Math.floor(endWeeks / 48) + 1;
    const endMonth = (Math.floor(endWeeks / 4) % 12) + 1;
    const termLabel = isMerc ? 'Short-Term Mercenary (Flat Fee)' : `Standard Contract (${c.totalYears || 2} Yr Max)`;

    return `
      <div class="grid-12">
        <!-- Contract Details -->
        <div class="col-6 card">
          <div class="section-header">
            <div>
              <div class="section-title">Contract Details</div>
              <div class="subtext">Ends at the Fight limit or the Time limit, whichever comes first</div>
            </div>
            <span class="badge ${c.expired ? 'red' : 'green'} mono">${c.expired ? 'EXPIRED' : 'ACTIVE'}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Contract Type</span><strong>${termLabel}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Monthly Wage</span><strong class="mono">${isMerc ? '0 Cr/mo (Flat Fee Paid)' : salary.toLocaleString() + ' Cr/mo'}</strong></div>
            <div>
              <div style="display:flex; justify-content:space-between;"><span class="subtext">Fights</span><strong class="mono">${c.fightsRemaining} left of ${c.totalFights} (${fightsUsed} fought)</strong></div>
              <div class="bar-bg" style="margin-top:4px;"><div class="bar-fill" style="width:${fightPct}%"></div></div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between;"><span class="subtext">Time</span><strong class="mono">${c.monthsRemaining} Mos left of ${c.totalMonths} (${monthsUsed} served)</strong></div>
              <div class="bar-bg" style="margin-top:4px;"><div class="bar-fill" style="width:${monthPct}%"></div></div>
            </div>
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Latest End Date</span><strong class="mono">${c.expired ? 'Contract finished' : `Year ${endYear} • Month ${endMonth}`}</strong></div>
            <button class="btn ${c.expired ? 'btn-primary' : ''}" onclick="HQModule.openRenegotiationModal('${jock.id}', false)">&#128221; Renegotiate Contract</button>
          </div>
        </div>

        <!-- Jockey Personality -->
        <div class="col-6 card">
          <div class="section-header">
            <div>
              <div class="section-title">Jockey Personality</div>
              <div class="subtext">How ${jock.callsign} carries themselves on and off the field</div>
            </div>
            <span class="badge primary">${p.archetype}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">
            <div style="font-style:italic; color:#e2e8f0; border-left:3px solid var(--primary); padding-left:10px;">${p.motto}</div>
            <div style="display:flex; justify-content:space-between; gap:10px;"><span class="subtext">Temperament</span><strong style="text-align:right;">${p.temperament}</strong></div>
            ${p.traits.map(t => `
              <div class="panel" style="padding:8px 10px;">
                <strong>${t[0]}</strong>
                <div class="subtext" style="font-size:12px;">${t[1]}</div>
              </div>
            `).join('')}
            <div style="display:flex; justify-content:space-between; gap:10px;"><span class="subtext">Likes</span><strong style="color:var(--accent-green); text-align:right;">${p.likes}</strong></div>
            <div style="display:flex; justify-content:space-between; gap:10px;"><span class="subtext">Dislikes</span><strong style="color:var(--accent-red); text-align:right;">${p.dislikes}</strong></div>
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
                  <button
                    class="btn ${j.contract?.expired ? 'btn-primary' : ''}"
                    style="${j.contract?.expired ? 'background:var(--accent-amber); color:#0b0f17; font-weight:800;' : ''}"
                    onclick="HQModule.openRenegotiationModal('${j.id}', false)"
                  >
                    &#128221; Renegotiate Contract
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
                <span class="badge ${jock.contract?.expired ? 'red' : 'amber'} mono">${window.GameState.getContractSummary(jock)}</span>
              </div>
              <h2 style="font-size:20px; font-weight:800; margin-top:3px;">
                ${jock.firstName} "${jock.callsign}" ${jock.lastName}
              </h2>
            </div>
          </div>

          <!-- Dedicated Jockey Page Sub-Tabs & Renegotiate Contract Button -->
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
            <button
              class="btn"
              style="padding:9px 16px; font-size:13px; border-color:var(--accent-amber); color:var(--accent-amber); font-weight:700;"
              onclick="HQModule.openRenegotiationModal('${jock.id}', false)"
            >
              &#128221; Renegotiate Contract
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
                <span class="badge ${jock.contract?.expired ? 'red' : 'amber'} mono">${window.GameState.getContractSummary(jock)}</span>
                <button class="btn" onclick="HQModule.openCreator(true)">Edit Callsign / Portrait / Bio</button>
                <button
                  class="btn"
                  style="border-color:var(--accent-amber); color:var(--accent-amber); font-weight:700;"
                  onclick="HQModule.openRenegotiationModal('${jock.id}', false)"
                >
                  &#128221; Renegotiate Contract
                </button>
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

      ${this.renderContractAndPersonality(jock)}

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
  },

  // --- CONTRACT EXPIRATION NOTIFICATION & RENEGOTIATION MODAL ---

  triggerContractExpirationPrompt(jockId, reason) {
    this.openRenegotiationModal(jockId, true, reason);
  },

  getRenegotiationAskingTerms(jock, fights, years) {
    const rk = window.GameState.getJockRank(jock);
    const currentWage = Math.max(700, window.GameState.getJockSalary(jock) || 950);
    const fightsMod = Math.round((fights - 10) * 14);
    const yearsMod = Math.round((years - 2) * 55);
    const lengthMod = fightsMod + yearsMod;

    // Veteran/skilled pilots ask for a modest raise or renewal bonus based on rank and kills
    const careerPrestige = Math.round((jock.kills || 0) * 35 + (jock.xpSpent || 0) * 0.15);
    const askingWage = Math.max(550, Math.round((currentWage + careerPrestige + lengthMod) / 50) * 50);
    const minWage = Math.max(450, Math.round(askingWage * 0.85 / 50) * 50);
    const askingBonus = Math.max(1500, Math.round((askingWage * 2.2 * rk.salaryMult) / 500) * 500);
    return { askingWage, minWage, askingBonus };
  },

  openRenegotiationModal(jockId, isExpiredPrompt = false, reason = '') {
    const st = window.GameState.data;
    const jock = st.jocks.find(j => j.id === jockId);
    if (!jock) return;

    window.GameState.ensureJockContract(jock);
    this.renegotiateOpen = true;
    this.renegotiateJockId = jock.id;
    this.renegotiateIsExpiredPrompt = !!isExpiredPrompt;
    this.renegotiateReason = reason || (jock.contract.expired ? 'Contract term reached' : '');
    this.renegYears = jock.contract.totalYears || 2;
    this.renegFights = jock.contract.totalFights || 10;
    this.renegPatience = 3;

    const terms = this.getRenegotiationAskingTerms(jock, this.renegFights, this.renegYears);
    this.renegBonus = terms.askingBonus;
    this.renegWage = terms.askingWage;

    if (isExpiredPrompt || jock.contract.expired) {
      this.renegMessage = `"Commander, my contract has concluded (${this.renegotiateReason || 'term completed'}). Would you like to renegotiate a new Fights & Max-Time contract to keep me on the roster, or part ways?"`;
    } else {
      this.renegMessage = `"Ready to talk contract extension, Commander. Here are my terms for a fresh ${this.renegFights}-Fight / ${this.renegYears}-Year Max contract (whichever comes first)."`;
    }

    this.updateRenegotiationModalMount();
  },

  updateRenegotiationInputs() {
    const fEl = document.getElementById('reneg-inp-fights');
    const yEl = document.getElementById('reneg-inp-years');
    const bEl = document.getElementById('reneg-inp-bonus');
    const wEl = document.getElementById('reneg-inp-wage');
    if (fEl) this.renegFights = Math.max(1, Number(fEl.value) || 10);
    if (yEl) this.renegYears = Math.max(1, Number(yEl.value) || 2);
    if (bEl) this.renegBonus = Math.max(0, Number(bEl.value) || 0);
    if (wEl) this.renegWage = Math.max(300, Number(wEl.value) || 600);
  },

  onRenegotiationDurationChange() {
    this.updateRenegotiationInputs();
    this.updateRenegotiationModalMount();
  },

  testRenegotiationOffer() {
    const st = window.GameState.data;
    const jock = st.jocks.find(j => j.id === this.renegotiateJockId);
    if (!jock || this.renegPatience <= 0) return;

    this.updateRenegotiationInputs();
    const terms = this.getRenegotiationAskingTerms(jock, this.renegFights, this.renegYears);
    const bonusDiff = Math.round((this.renegBonus - terms.askingBonus) * 0.05);
    const effectiveWage = this.renegWage + bonusDiff;
    const label = `${this.renegFights} Fights or ${this.renegYears} Yr${this.renegYears > 1 ? 's' : ''} Max (Whichever First)`;

    if (effectiveWage >= terms.askingWage) {
      this.renegMessage = `"${this.renegBonus.toLocaleString()} Cr renewal bonus and ${this.renegWage.toLocaleString()} Cr/mo for ${label}? Deal! Click 'Sign Renegotiated Contract' and I'm locked in."`;
    } else if (effectiveWage >= terms.minWage) {
      this.renegPatience -= 1;
      if (this.renegPatience <= 0) {
        this.renegMessage = `"We're too far apart on numbers, Commander. Take a breather and reopen contract talks when you're ready to meet my minimum rate."`;
      } else {
        const counter = Math.round(((this.renegWage + terms.askingWage) / 2) / 50) * 50;
        this.renegMessage = `"For ${label}, ${this.renegWage.toLocaleString()} Cr/mo is a little light given my combat record. Come up to ${counter.toLocaleString()} Cr/mo (or boost the renewal bonus) and I'll sign."`;
      }
    } else {
      this.renegPatience -= 1;
      this.renegMessage = `"Commander, ${this.renegWage.toLocaleString()} Cr/mo for ${label} is well below market rate for a ${window.GameState.getJockRank(jock).name} Jockey. You'll need to come closer to ${terms.askingWage.toLocaleString()} Cr/mo."`;
    }

    this.updateRenegotiationModalMount();
  },

  confirmRenegotiation() {
    const st = window.GameState.data;
    const jock = st.jocks.find(j => j.id === this.renegotiateJockId);
    if (!jock || this.renegPatience <= 0) return;

    this.updateRenegotiationInputs();
    if (st.credits < this.renegBonus) {
      alert('Not enough credits in Company Treasury to pay that Renewal Signing Bonus!');
      return;
    }

    const terms = this.getRenegotiationAskingTerms(jock, this.renegFights, this.renegYears);
    const bonusDiff = Math.round((this.renegBonus - terms.askingBonus) * 0.05);
    const effectiveWage = this.renegWage + bonusDiff;

    if (effectiveWage < terms.minWage) {
      this.testRenegotiationOffer();
      return;
    }

    st.credits -= this.renegBonus;
    const rk = window.GameState.getJockRank(jock);
    jock.baseSalary = Math.max(300, Math.round(this.renegWage / rk.salaryMult));
    jock.contract = {
      type: 'standard',
      totalYears: this.renegYears,
      totalMonths: this.renegYears * 12,
      monthsRemaining: this.renegYears * 12,
      totalFights: this.renegFights,
      fightsRemaining: this.renegFights,
      whicheverComesFirst: true,
      expired: false
    };

    this.renegotiateOpen = false;
    this.renegotiateJockId = '';
    this.updateRenegotiationModalMount();
    window.GameState.advanceTimeWeeks(1, `Renegotiated Contract with ${jock.callsign}`);
    this.render();
  },

  releaseExpiredJock(jockId) {
    const st = window.GameState.data;
    const idx = st.jocks.findIndex(j => j.id === jockId);
    if (idx === -1) return;
    const jock = st.jocks[idx];
    st.jocks.splice(idx, 1);
    if (st.selectedJockId === jockId) {
      st.selectedJockId = st.jocks[0]?.id || '';
      if (!st.selectedJockId) this.jockeyPageOpen = false;
    }
    this.renegotiateOpen = false;
    this.renegotiateJockId = '';
    this.updateRenegotiationModalMount();
    window.GameState.save();
    window.GameState.updateHeaderBar();
    this.render();
  },

  closeRenegotiationModal() {
    this.renegotiateOpen = false;
    this.renegotiateJockId = '';
    this.updateRenegotiationModalMount();
    this.render();
  },

  updateRenegotiationModalMount() {
    const mount = document.getElementById('renegotiation-modal-mount');
    if (!mount) return;
    mount.innerHTML = this.renderRenegotiationModal();
  },

  renderRenegotiationModal() {
    if (!this.renegotiateOpen || !this.renegotiateJockId) return '';
    const st = window.GameState.data;
    const jock = st.jocks.find(j => j.id === this.renegotiateJockId);
    if (!jock) return '';

    const rk = window.GameState.getJockRank(jock);
    const terms = this.getRenegotiationAskingTerms(jock, this.renegFights, this.renegYears);
    const isExpired = this.renegotiateIsExpiredPrompt || jock.contract?.expired;

    return `
      <div class="modal-backdrop" style="z-index:200;">
        <div class="modal-card" style="max-width:680px; border-color:${isExpired ? 'var(--accent-amber)' : 'var(--primary)'};">
          <div class="section-header">
            <div>
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span class="badge ${isExpired ? 'amber' : 'primary'}">
                  ${isExpired ? '&#9888; CONTRACT COMPLETED — RENEGOTIATE CONTRACT?' : '&#128221; JOCKEY CONTRACT RENEGOTIATION'}
                </span>
                <span class="badge green mono">Treasury: ${st.credits.toLocaleString()} Cr</span>
              </div>
              <h3 style="font-size:19px; font-weight:800; margin-top:6px;">
                ${jock.firstName} "${jock.callsign}" ${jock.lastName} (${rk.name})
              </h3>
              ${isExpired ? `
                <div class="subtext" style="color:var(--accent-amber); font-weight:600; margin-top:2px;">
                  Contract Finished (${this.renegotiateReason || 'Fights or Max Time limit reached'}). Would you like to renegotiate a new contract with ${jock.callsign}?
                </div>
              ` : `
                <div class="subtext" style="margin-top:2px;">
                  Current Contract: <span class="mono">${window.GameState.getContractSummary(jock)}</span>
                </div>
              `}
            </div>
            <button class="btn" onclick="HQModule.closeRenegotiationModal()">Decide Later</button>
          </div>

          <!-- Pilot Summary & Dialogue -->
          <div class="panel" style="display:flex; gap:14px; align-items:center;">
            <div style="flex-shrink:0;">${window.GameState.getPortraitSvg(jock.portraitId, 72)}</div>
            <div style="flex:1;">
              <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:12px;" class="mono subtext">
                <span>Rank: <strong style="color:#f8fafc;">${rk.name}</strong></span>
                <span>Missions: <strong style="color:#f8fafc;">${jock.missions}</strong></span>
                <span>Kills: <strong style="color:#f8fafc;">${jock.kills}</strong></span>
                <span>Awards: <strong style="color:var(--accent-amber);">${(jock.awards || []).length}</strong></span>
              </div>
              <div style="margin-top:8px; font-size:13px; color:#f8fafc; font-style:italic; line-height:1.45;">
                ${this.renegMessage}
              </div>
            </div>
          </div>

          <!-- Dual-Condition Contract Terms (Both Fights & Max Time — Whichever Comes First) -->
          <div class="panel" style="display:flex; flex-direction:column; gap:12px; border-color:var(--primary);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="font-size:13px;">New Contract Structure (Fights &amp; Max Time — Whichever Comes First)</strong>
              <span class="badge ${this.renegPatience <= 0 ? 'red' : 'green'} mono">Patience: ${this.renegPatience}/3</span>
            </div>

            <div class="grid-12">
              <div class="col-6">
                <label class="subtext" style="font-weight:600;">Contract Fights Limit:</label>
                <select id="reneg-inp-fights" class="select mono" style="margin-top:4px;" onchange="HQModule.onRenegotiationDurationChange()">
                  ${[3, 5, 10, 15, 25].map(f => `
                    <option value="${f}" ${this.renegFights === f ? 'selected' : ''}>${f} Combat Fights</option>
                  `).join('')}
                </select>
              </div>
              <div class="col-6">
                <label class="subtext" style="font-weight:600;">Max Length of Time:</label>
                <select id="reneg-inp-years" class="select mono" style="margin-top:4px;" onchange="HQModule.onRenegotiationDurationChange()">
                  ${[1, 2, 3, 4, 5].map(yr => `
                    <option value="${yr}" ${this.renegYears === yr ? 'selected' : ''}>${yr} Year${yr > 1 ? 's' : ''} (${yr * 12} Months Max)</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div class="subtext" style="font-size:12px;">
              Contract ends after <strong>${this.renegFights} Fights</strong> OR <strong>${this.renegYears * 12} Months (${this.renegYears} Yr${this.renegYears > 1 ? 's' : ''})</strong>, whichever comes first.
            </div>

            <div style="display:flex; justify-content:space-between; font-size:12px; border-top:1px solid var(--border); padding-top:8px;">
              <span class="subtext">Pilot's Target Renewal Terms:</span>
              <strong class="mono" style="color:var(--accent-amber);">
                ${terms.askingBonus.toLocaleString()} Cr Bonus + ${terms.askingWage.toLocaleString()} Cr/mo
              </strong>
            </div>

            <div class="grid-12">
              <div class="col-6">
                <label class="subtext">Renewal Signing Bonus Offer (Cr)</label>
                <input id="reneg-inp-bonus" type="number" step="500" class="input mono" value="${this.renegBonus}" onchange="HQModule.updateRenegotiationInputs()" />
              </div>
              <div class="col-6">
                <label class="subtext">New Monthly Wage Offer (Cr/mo)</label>
                <input id="reneg-inp-wage" type="number" step="50" class="input mono" value="${this.renegWage}" onchange="HQModule.updateRenegotiationInputs()" />
              </div>
            </div>

            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:4px;">
              <button class="btn" style="flex:1;" ${this.renegPatience <= 0 ? 'disabled' : ''} onclick="HQModule.testRenegotiationOffer()">
                Test Counter-Offer
              </button>
              <button class="btn btn-primary" style="flex:1.4;" ${this.renegPatience <= 0 ? 'disabled' : ''} onclick="HQModule.confirmRenegotiation()">
                &#128221; Sign Renegotiated Contract (+1 Wk)
              </button>
              ${isExpired ? `
                <button class="btn btn-danger" onclick="HQModule.releaseExpiredJock('${jock.id}')">
                  Release Jockey (End Service)
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
