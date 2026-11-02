// Company & Commander pages

window.CompanyModule = {
  render() {
    const gs = window.GameState;
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
  }
};

window.CommanderModule = {
  backgrounds: [
    { id: 'military', name: 'Ex-Military Officer', desc: 'Disciplined and tactical. Raised on formation drills and chain of command.' },
    { id: 'arena', name: 'Retired Arena Champion', desc: 'Once packed stadiums. Knows what a Jockey needs to win a crowd and a fight.' },
    { id: 'corporate', name: 'Corporate Fixer', desc: 'Contracts, contacts and margins. Never pays full price for anything.' },
    { id: 'salvager', name: 'Wasteland Salvager', desc: 'Built a company out of scrap. Knows what every bolt in a Titan is worth.' }
  ],

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
          <div class="panel" style="padding:10px; width:84px; height:84px; display:flex; align-items:center; justify-content:center; font-size:40px;">&#127894;</div>
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
          <div class="section-header"><div class="section-title">Background</div></div>
          <div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">
            <select class="select" onchange="CommanderModule.setBackground(this.value)">
              ${this.backgrounds.map(b => `<option value="${b.id}" ${b.id === bg.id ? 'selected' : ''}>${b.name}</option>`).join('')}
            </select>
            <div class="panel">${bg.desc}</div>
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

  setBackground(id) {
    window.GameState.data.company.commanderBackground = id;
    window.GameState.save();
    this.render();
  },

  setBio(text) {
    window.GameState.data.company.commanderBio = text;
    window.GameState.save();
  }
};
