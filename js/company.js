// Company & Commander pages

window.CompanyModule = {
  render() {
    const gs = window.GameState;
    gs.ensureCompanyJobs();
    const st = gs.data;
    const container = document.getElementById('view-company');
    if (!container) return;

    const comp = st.company || {};
    const goal = (window.TOS_DATA.companyGoals || []).find(g => g.id === comp.goalId) || window.TOS_DATA.companyGoals[0];
    const repLvl = gs.getCompanyReputationLevel();
    const missions = st.missionsCompleted || 0;
    const missionsToNext = 2 - (missions % 2);
    const payroll = (st.jocks || []).reduce((s, j) => s + gs.getJockSalary(j), 0);
    const totalKills = (st.jocks || []).reduce((s, j) => s + (j.kills || 0), 0);
    const victories = (st.jocks || []).reduce((s, j) => s + (j.fightHistory || []).filter(f => f.outcome === 'VICTORY').length, 0);
    const awards = (st.jocks || []).reduce((s, j) => s + (j.awards || []).length, 0);
    const fleetValue = (st.mechs || []).reduce((s, m) => s + gs.computeMechMetrics(m).totalCost, 0);
    const unlocked = (window.TOS_DATA.chassisTemplates || []).filter(t => (t.reqRepLevel || 1) <= repLvl);
    const nextLocked = (window.TOS_DATA.chassisTemplates || []).find(t => (t.reqRepLevel || 1) > repLvl);

    const livingJocks = (st.jocks || []).filter(j => !j.isDead);
    const jobsList = window.TOS_DATA.companyJobs || [];

    const jobsHtml = jobsList.map(job => {
      const assigned = gs.getAssignedJobJock(job.id);
      const mod = job.calcModifier(assigned);

      // Find top recommendation based on skill + governing attribute
      let bestCand = null;
      let bestScore = -1;
      livingJocks.forEach(j => {
        let score = j.skills?.[job.governingSkill] || 0;
        if (job.governingAttr) {
          score += (j.stats?.[job.governingAttr] || 20) * 0.5;
        }
        if (score > bestScore) {
          bestScore = score;
          bestCand = j;
        }
      });

      const optionsHtml = [
        `<option value="">-- Unassigned (Standard Crew Baseline) --</option>`,
        ...livingJocks.map(j => {
          const isSelected = assigned && assigned.id === j.id;
          const otherJob = gs.getJockAssignedJob(j.id);
          const otherLabel = (!isSelected && otherJob) ? ` [Currently: ${otherJob.shortTitle}]` : '';
          const sVal = j.skills?.[job.governingSkill] || 0;
          const aVal = job.governingAttr ? (j.stats?.[job.governingAttr] || 20) : null;
          const attrStr = aVal !== null ? ` • ${job.governingAttr.slice(0, 3)}: ${aVal}` : '';
          return `<option value="${j.id}" ${isSelected ? 'selected' : ''}>${j.callsign} ("${j.name}") — ${job.governingSkill}: ${sVal}%${attrStr}${otherLabel}</option>`;
        })
      ].join('');

      return `
        <div class="col-6 card" style="display:flex; flex-direction:column; justify-content:space-between; gap:10px; background:var(--panel-bg); border:1px solid ${assigned ? 'rgba(34,197,94,0.35)' : 'var(--border-dark)'};">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:20px;">${job.icon}</span>
                <div>
                  <h3 style="font-size:15px; font-weight:800; margin:0;">${job.title}</h3>
                  <div class="subtext" style="font-size:11px;">Governed by: <strong>${job.governingSkill}</strong>${job.governingAttr ? ` &amp; <strong>${job.governingAttr}</strong>` : ''}</div>
                </div>
              </div>
              <span class="badge ${assigned ? 'green' : 'secondary'}" style="font-size:10px; text-transform:uppercase;">
                ${assigned ? 'Assigned' : 'Vacant'}
              </span>
            </div>

            <p style="font-size:12px; color:var(--text-muted); margin:8px 0 6px 0; line-height:1.4;">
              ${job.desc}
            </p>
            <div class="subtext" style="font-size:11px; color:#93c5fd; font-style:italic;">
              &#9889; <strong>Effect:</strong> ${job.effectDesc}
            </div>
          </div>

          <div>
            <label class="subtext" style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; margin-bottom:4px;">
              Appoint Jockey under Contract:
            </label>
            <select
              class="input select"
              style="width:100%; font-size:12px; font-weight:600; padding:6px 10px; background:var(--bg-dark); color:var(--text-bright); border:1px solid var(--border-bright);"
              onchange="CompanyModule.assignJob('${job.id}', this.value)"
            >
              ${optionsHtml}
            </select>

            <!-- Active Modifier Display -->
            <div class="panel" style="margin-top:8px; padding:7px 10px; border-left:3px solid ${assigned ? 'var(--accent-green)' : 'var(--border-bright)'}; background:${assigned ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)'};">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px;">
                <span class="subtext" style="font-size:10px; font-weight:800; text-transform:uppercase; color:${assigned ? 'var(--accent-green)' : 'var(--text-muted)'};">
                  ${assigned ? '&#9679; Active Modifier' : '&#9675; Baseline Level'}
                </span>
                <strong class="mono" style="font-size:12px; color:${assigned ? 'var(--accent-green)' : 'var(--text-muted)'};">
                  ${mod.label}
                </strong>
              </div>
            </div>

            ${(bestCand && (!assigned || assigned.id !== bestCand.id)) ? `
              <div style="margin-top:6px; display:flex; justify-content:flex-end;">
                <button
                  class="btn btn-sm"
                  style="font-size:11px; padding:3px 8px; border-color:var(--accent-cyan); color:#93c5fd;"
                  onclick="CompanyModule.assignJob('${job.id}', '${bestCand.id}')"
                  title="Appoint top qualified jockey in the company"
                >
                  &#9733; Appoint Best: ${bestCand.callsign} (${bestCand.skills?.[job.governingSkill] || 0}%)
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:16px;">
          <div class="panel" style="padding:10px;">${gs.getCompanyEmblemSvg(comp.emblemId)}</div>
          <div style="flex:1; min-width:240px;">
            <span class="badge primary">COMPANY</span>
            <h2 style="font-size:24px; font-weight:800; margin-top:4px;">${comp.name || 'Unregistered Mercenary Unit'}</h2>
            <div class="subtext" style="font-style:italic;">"${comp.motto || ''}"</div>
            <div class="subtext" style="margin-top:4px;">Commanded by <strong>${comp.commander || 'Commander'}</strong> • ${gs.getCalendarText()}</div>
          </div>
          <div class="hud-pill"><div class="label">Reputation</div><div class="val" style="color:var(--accent-amber);">Level ${repLvl}</div></div>
          <div class="hud-pill"><div class="label">Treasury</div><div class="val" style="color:var(--accent-green);">${st.credits.toLocaleString()} Cr</div></div>
        </div>
      </div>

      <!-- Company Staff Positions & Active Modifiers Section -->
      <div class="card" style="margin-bottom:16px;">
        <div class="section-header">
          <div>
            <div class="section-title" style="display:flex; align-items:center; gap:8px;">
              <span>&#127970; Company Staff Positions</span>
              <span class="badge amber mono">${livingJocks.length} Active Jockeys</span>
            </div>
            <div class="subtext" style="margin-top:3px;">
              Appoint contracted MechJocks to operational staff posts. Each role applies active company-wide modifiers to medical recovery speed, repair discounts, store prices, combat firing accuracy, and contract bounties.
            </div>
          </div>
        </div>

        <div class="grid-12" style="gap:14px; margin-top:10px;">
          ${jobsHtml}
        </div>
      </div>

      <div class="grid-12">
        <div class="col-6 card">
          <div class="section-header"><div class="section-title">Company Charter</div></div>
          <div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">
            <div class="panel"><strong>${goal.title}</strong><div class="subtext">${goal.desc}</div></div>
            <div class="panel"><div class="subtext" style="font-weight:700; text-transform:uppercase;">Our Own Objectives</div><div>${comp.customGoals || 'None set.'}</div></div>
          </div>
        </div>

        <div class="col-6 card">
          <div class="section-header"><div class="section-title">Reputation</div><span class="badge amber mono">Level ${repLvl}</span></div>
          <div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Missions Completed</span><strong class="mono">${missions}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Next Reputation Level</span><strong class="mono">${missionsToNext} mission${missionsToNext === 1 ? '' : 's'} away</strong></div>
            <div class="bar-bg"><div class="bar-fill" style="width:${((missions % 2) / 2) * 100}%"></div></div>
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Titans Available to Buy</span><strong>${unlocked.map(t => t.weightClass).join(', ')}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Next Unlock</span><strong>${nextLocked ? `${nextLocked.weightClass} (Rep Lvl ${nextLocked.reqRepLevel})` : 'Everything unlocked'}</strong></div>
          </div>
        </div>

        <div class="col-6 card">
          <div class="section-header"><div class="section-title">Finances</div></div>
          <div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Treasury</span><strong class="mono" style="color:var(--accent-green);">${st.credits.toLocaleString()} Cr</strong></div>
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Monthly Payroll</span><strong class="mono" style="color:var(--accent-amber);">-${payroll.toLocaleString()} Cr/mo</strong></div>
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Fleet Value (Hangar)</span><strong class="mono">${fleetValue.toLocaleString()} Cr</strong></div>
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Spare Parts in Storage</span><strong class="mono">${(st.partStorage || []).length}</strong></div>
          </div>
        </div>

        <div class="col-6 card">
          <div class="section-header"><div class="section-title">Company Record</div></div>
          <div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Active Jockeys</span><strong class="mono">${st.jocks.length} / 8</strong></div>
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Hangar Titans</span><strong class="mono">${st.mechs.length}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Victories (Squad)</span><strong class="mono">${victories}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Confirmed Kills</span><strong class="mono">${totalKills}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Commendations Earned</span><strong class="mono">${awards}</strong></div>
          </div>
        </div>
      </div>
    `;
  },

  assignJob(jobId, jockId) {
    window.GameState.assignCompanyJob(jobId, jockId);
    if (window.SoundFX && typeof window.SoundFX.playInterfaceBeep === 'function') {
      window.SoundFX.playInterfaceBeep();
    }
    this.render();
  }
};

window.CommanderModule = {
  get backgrounds() { return window.TOS_DATA.commanderBackgrounds; },

  getTitle(repLvl) {
    return ['Rookie Commander', 'Contract Captain', 'Company Major', 'Battle Colonel', 'Warlord'][Math.min(4, Math.max(0, repLvl - 1))] ||
      'Warlord';
  },

  render() {
    const gs = window.GameState;
    const st = gs.data;
    const container = document.getElementById('view-commander');
    if (!container) return;

    const comp = st.company || {};
    if (!comp.commanderBackground) comp.commanderBackground = 'military';
    if (typeof comp.commanderBio !== 'string') comp.commanderBio = '';
    const bg = this.backgrounds.find(b => b.id === comp.commanderBackground) || this.backgrounds[0];
    const repLvl = gs.getCompanyReputationLevel();
    const missions = st.missionsCompleted || 0;
    const wins = (st.jocks || []).reduce((s, j) => s + (j.fightHistory || []).filter(f => f.outcome === 'VICTORY').length, 0);
    const hired = (st.jocks || []).length;

    container.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:16px;">
          ${(() => {
            const pt = window.TOS_DATA.commanderPortraits.find(p => p.id === comp.commanderPortraitId) || window.TOS_DATA.commanderPortraits[0];
            return `<img src="${pt.img}" alt="${pt.label}" onerror="this.onerror=null;this.src=window.CMDR_FALLBACK" style="width:96px; height:96px; object-fit:cover; border-radius:12px; border:2px solid var(--border-bright); background:#0f172a;" />`;
          })()}
          <div style="flex:1; min-width:240px;">
            <span class="badge primary">COMMANDER</span>
            <h2 style="font-size:24px; font-weight:800; margin-top:4px;">${comp.commander || 'Commander'}</h2>
            <div class="subtext"><strong>${this.getTitle(repLvl)}</strong> of ${comp.name || 'Unregistered Mercenary Unit'}</div>
          </div>
          <div class="hud-pill"><div class="label">Rank</div><div class="val" style="color:var(--accent-amber);">${this.getTitle(repLvl)}</div></div>
        </div>
      </div>

      <div class="grid-12">
        <div class="col-6 card">
          <div class="section-header"><div class="section-title">Background</div><span class="badge amber">Chosen at Company Creation</span></div>
          <div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">
            <div class="panel"><strong>${bg.name}</strong><div class="subtext" style="margin-top:2px;">${bg.desc}</div></div>
            <div class="subtext" style="font-weight:700; text-transform:uppercase;">Personal Bio</div>
            <textarea class="input" rows="5" placeholder="Write your Commander's story..." onchange="CommanderModule.setBio(this.value)">${comp.commanderBio}</textarea>
          </div>
        </div>

        <div class="col-6 card">
          <div class="section-header"><div class="section-title">Service Record</div></div>
          <div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Current Date</span><strong class="mono">${gs.getCalendarText()}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Missions Led</span><strong class="mono">${missions}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Victories (Squad)</span><strong class="mono">${wins}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Jockeys Under Command</span><strong class="mono">${hired}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span class="subtext">Company Reputation</span><strong class="mono">Level ${repLvl}</strong></div>
          </div>
        </div>
      </div>
    `;
  },

  setBio(text) {
    window.GameState.data.company.commanderBio = text;
    window.GameState.save();
  }
};
