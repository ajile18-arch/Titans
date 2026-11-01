// HQ & Jockey Management Module (Mode A: Classic Sim + Custom Callsign/Portrait/Bio)

window.HQModule = {
  creatorOpen: false,
  editMode: false,
  selectedPortraitId: 'visor-blue',

  render() {
    const st = window.GameState.data;
    const container = document.getElementById('view-hq');
    if (!container) return;

    const jock = st.jocks.find(j => j.id === st.selectedJockId) || st.jocks[0];
    if (jock && st.selectedJockId !== jock.id) st.selectedJockId = jock.id;

    // Best Squad Mechanic & Medic
    const bestMechanic = st.jocks.reduce((best, j) => (j.skills['Mechanic (Repair)'] > (best?.skills['Mechanic (Repair)'] || 0) ? j : best), null);
    const bestMedic = st.jocks.reduce((best, j) => (j.skills['Medical (First Aid)'] > (best?.skills['Medical (First Aid)'] || 0) ? j : best), null);

    container.innerHTML = `
      <div class="grid-12">
        <!-- Left 4 Cols: Active Jock Roster + Hiring Hall + Squad Crew Support -->
        <div class="col-4" style="display:flex; flex-direction:column; gap:16px;">
          
          <!-- Squad Roster Card -->
          <div class="card">
            <div class="section-header">
              <div>
                <div class="section-title">Active Squad Jocks (${st.jocks.length} / 8)</div>
                <div class="subtext">Click a Jock to inspect or train</div>
              </div>
              <button class="btn btn-primary" onclick="HQModule.openCreator(false)">+ Custom Jock</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${st.jocks.map(j => {
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
                          <span class="mono subtext">HP: ${j.health}% • Kills: ${j.kills}</span>
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
                <strong>${bestMechanic ? `${bestMechanic.callsign} (${bestMechanic.skills['Mechanic (Repair)']}%Skill)` : 'None'}</strong>
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

          <!-- Mercenary Hiring Hall -->
          <div class="card">
            <div class="section-header">
              <div>
                <div class="section-title">Mercenary Hiring Hall</div>
                <div class="subtext">Recruit additional Jocks to your roster</div>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${st.recruits.length === 0 ? `<div class="subtext">All current applicants hired!</div>` : st.recruits.map((r, idx) => `
                <div class="panel" style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                  <div>
                    <strong>${r.firstName} "${r.callsign}" ${r.lastName}</strong>
                    <div class="subtext">${r.bio}</div>
                    <div class="mono" style="font-size:12px; margin-top:4px; color:var(--accent-amber);">
                      Signing Fee: ${r.hireCost.toLocaleString()} Cr
                    </div>
                  </div>
                  <button class="btn btn-primary" onclick="HQModule.hireRecruit(${idx})">Hire</button>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- Right 8 Cols: Selected Jock Full Dossier, Attributes & 0-100% Skills -->
        <div class="col-8" style="display:flex; flex-direction:column; gap:16px;">
          ${jock ? this.renderDossier(jock) : `<div class="card">Select or create a Jock.</div>`}
        </div>
      </div>

      ${this.renderCreatorModal(jock)}
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
            <div class="subtext" style="margin-top:4px;">Monthly Upkeep: <strong class="mono">${salary.toLocaleString()} Cr</strong></div>
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
    if (!this.creatorOpen) return '';
    const isEdit = this.editMode && currentJock;
    const fName = isEdit ? currentJock.firstName : 'Alex';
    const lName = isEdit ? currentJock.lastName : 'Mercer';
    const cSign = isEdit ? currentJock.callsign : 'Spectre';
    const bio = isEdit ? currentJock.bio : 'Independent mercenary Titan Jock seeking glory and salvage contracts in the Warring Suns sector.';

    return `
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="section-header">
            <div class="section-title">${isEdit ? 'Customize Jock Identity & Bio' : 'Recruit Custom Academy Jock (2,500 Cr)'}</div>
            <button class="btn" onclick="HQModule.closeCreator()">Close</button>
          </div>

          <div class="grid-12">
            <div class="col-4">
              <label class="subtext">First Name</label>
              <input id="inp-fname" class="input" value="${fName}" />
            </div>
            <div class="col-4">
              <label class="subtext">Callsign</label>
              <input id="inp-callsign" class="input" value="${cSign}" />
            </div>
            <div class="col-4">
              <label class="subtext">Last Name</label>
              <input id="inp-lname" class="input" value="${lName}" />
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
            <textarea id="inp-bio" class="textarea" rows="3" style="margin-top:4px;">${bio}</textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:4px;">
            <button class="btn" onclick="HQModule.closeCreator()">Cancel</button>
            <button class="btn btn-primary" onclick="HQModule.saveCreator()">
              ${isEdit ? 'Save Changes' : 'Commission Jock (2,500 Cr)'}
            </button>
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
    // Unassign from other jocks if needed
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
    this.editMode = editMode;
    this.selectedPortraitId = (editMode && jock) ? jock.portraitId : 'visor-blue';
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
    const firstName = (document.getElementById('inp-fname')?.value || 'Pilot').trim();
    const callsign = (document.getElementById('inp-callsign')?.value || 'Ace').trim();
    const lastName = (document.getElementById('inp-lname')?.value || 'Vance').trim();
    const bio = (document.getElementById('inp-bio')?.value || 'Veteran Titan pilot.').trim();

    if (this.editMode) {
      const jock = st.jocks.find(j => j.id === st.selectedJockId);
      if (jock) {
        jock.firstName = firstName;
        jock.callsign = callsign;
        jock.lastName = lastName;
        jock.bio = bio;
        jock.portraitId = this.selectedPortraitId;
      }
    } else {
      if (st.credits < 2500 || st.jocks.length >= 8) return;
      st.credits -= 2500;
      const newId = 'jock-' + Date.now();
      st.jocks.push({
        id: newId,
        firstName,
        lastName,
        callsign,
        portraitId: this.selectedPortraitId,
        bio,
        xp: 600,
        xpSpent: 0,
        baseSalary: 900,
        health: 100,
        kills: 0,
        missions: 0,
        assignedMechId: '',
        stats: { Constitution: 14, Intelligence: 14, Instinct: 14, Reflexes: 15, Piloting: 14, Bravery: 14 },
        skills: {
          'Energy Weapons': 50, 'Cannons / Ballistic': 50, 'Guided Missiles': 50, 'Close Combat': 40,
          'Recon / Scanner': 45, 'Damage Control': 45, 'Leadership': 40, 'Survival': 45,
          'Mechanic (Repair)': 40, 'Medical (First Aid)': 40
        }
      });
      st.selectedJockId = newId;
    }

    this.creatorOpen = false;
    window.GameState.save();
    App.updateHUD();
    this.render();
  },

  hireRecruit(idx) {
    const st = window.GameState.data;
    const r = st.recruits[idx];
    if (!r || st.credits < r.hireCost || st.jocks.length >= 8) return;
    st.credits -= r.hireCost;
    const newId = 'jock-' + Date.now();
    st.jocks.push({
      id: newId,
      firstName: r.firstName,
      lastName: r.lastName,
      callsign: r.callsign,
      portraitId: r.portraitId,
      bio: r.bio,
      xp: r.xp,
      xpSpent: r.xpSpent,
      baseSalary: r.baseSalary,
      health: 100,
      kills: 2,
      missions: 5,
      assignedMechId: '',
      stats: { ...r.stats },
      skills: { ...r.skills }
    });
    st.recruits.splice(idx, 1);
    st.selectedJockId = newId;
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
