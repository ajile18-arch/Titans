// Garage & Mech Factory Module (Mode A: Classic 8-Part Free-Slot Sim)

window.GarageModule = {
  filterCat: 'All',

  render() {
    const st = window.GameState.data;
    const container = document.getElementById('view-garage');
    if (!container) return;

    const mech = st.mechs.find(m => m.id === st.selectedMechId) || st.mechs[0];
    if (mech && st.selectedMechId !== mech.id) st.selectedMechId = mech.id;
    const activeLoc = st.selectedBodyPart || 'RA';

    if (!mech) {
      container.innerHTML = `
        <div class="card" style="padding:36px 28px; text-align:center; align-items:center; gap:18px;">
          <span class="badge primary">FACTORY &amp; HANGAR BAY</span>
          <h2 style="font-size:22px; font-weight:800;">No Titans in Your Hangar Yet</h2>
          <p class="subtext" style="max-width:560px; font-size:14px;">
            Commission your first Titan chassis below to begin mounting weapons, heat sinks, electronics, and armor across all 8 body sections.
          </p>

          <div class="panel" style="display:flex; flex-direction:column; gap:12px; width:100%; max-width:540px; text-align:left; padding:18px;">
            <div>
              <label class="subtext" style="font-weight:600;">1. Choose Chassis Weight Class</label>
              <select id="new-chassis-select" class="select" style="margin-top:6px;">
                ${window.TOS_DATA.chassisTemplates.map(t => `
                  <option value="${t.id}">${t.model} (${t.maxTons}t ${t.weightClass}) — ${t.baseCost.toLocaleString()} Cr</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="subtext" style="font-weight:600;">2. Choose Starting Configuration</label>
              <select id="new-chassis-mode" class="select" style="margin-top:6px;">
                <option value="stripped">Stripped Bare Frame (0 Weapons / 50% Armor — Build Everything Yourself)</option>
                <option value="standard">Basic Factory Frame (2x Medium Lasers, 2x Heat Sinks, Full Armor)</option>
              </select>
            </div>

            <button class="btn btn-primary" style="padding:11px; font-size:14px; margin-top:4px;" onclick="GarageModule.commissionChassis()">
              + Commission Titan Chassis
            </button>
          </div>
        </div>
      `;
      return;
    }

    const metrics = window.GameState.computeMechMetrics(mech);
    const tpl = metrics.tpl;
    const assignedJock = st.jocks.find(j => j.assignedMechId === mech.id);
    const overTons = metrics.totalTons > metrics.maxTons;
    const overHeat = metrics.alphaHeat > metrics.coolingCap;

    const locObj = window.TOS_DATA.locationOrder.find(l => l.code === activeLoc) || window.TOS_DATA.locationOrder[5];
    const installedIds = mech.locations[activeLoc] || [];
    const usedSlots = installedIds.reduce((acc, cid) => acc + (window.GameState.getComponent(cid)?.slots || 0), 0);
    const maxSlots = tpl.slotLimits[activeLoc];
    const curArmor = mech.maxArmorCurrent[activeLoc];
    const limArmor = tpl.maxArmor[activeLoc];

    const categories = ['All', 'Energy Weapons', 'Cannons / Ballistic', 'Guided Missiles', 'Close Combat', 'Support'];
    const filteredCatalog = window.TOS_DATA.components.filter(c => this.filterCat === 'All' || c.cat === this.filterCat);

    container.innerHTML = `
      <div class="grid-12">
        <!-- Left 5 Cols: Hangar Bay Roster + 8-Location Titan Paperdoll -->
        <div class="col-5" style="display:flex; flex-direction:column; gap:16px;">
          
          <!-- Hangar Roster & Commission New Chassis -->
          <div class="card">
            <div class="section-header">
              <div>
                <div class="section-title">Hangar Bay Titans (${st.mechs.length})</div>
                <div class="subtext">Select a Titan to refit or commission a new chassis</div>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:8px;">
              ${st.mechs.map(m => {
                const mm = window.GameState.computeMechMetrics(m);
                const pilot = st.jocks.find(j => j.assignedMechId === m.id);
                const isSel = m.id === mech.id;
                return `
                  <div class="list-item ${isSel ? 'selected' : ''}" onclick="GarageModule.selectMech('${m.id}')">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <strong>${m.customName}</strong>
                      <span class="badge primary">${mm.tpl.weightClass} (${mm.maxTons}t)</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:12px;" class="subtext">
                      <span>Pilot: <strong>${pilot ? pilot.callsign : 'Unassigned'}</strong></span>
                      <span class="mono" style="color:${mm.totalTons > mm.maxTons ? 'var(--accent-red)' : 'var(--accent-green)'};">
                        ${mm.totalTons} / ${mm.maxTons}t
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Commission New Titan Chassis Bar -->
            <div class="panel" style="display:flex; gap:8px; align-items:center; margin-top:4px;">
              <select id="new-chassis-select" class="select" style="flex:1;">
                ${window.TOS_DATA.chassisTemplates.map(t => `
                  <option value="${t.id}">Build ${t.model} (${t.maxTons}t ${t.weightClass}) - ${t.baseCost.toLocaleString()} Cr</option>
                `).join('')}
              </select>
              <button class="btn btn-primary" onclick="GarageModule.commissionChassis()">+ Build</button>
            </div>
          </div>

          <!-- 8-Location Interactive Paperdoll -->
          <div class="card">
            <div class="section-header">
              <div>
                <div class="section-title">8-Part Titan Anatomy Diagram</div>
                <div class="subtext">Click any body section to inspect slots, armor &amp; weapons</div>
              </div>
              <button class="btn" onclick="GarageModule.maxAllArmor()">Max All Armor</button>
            </div>

            <div class="paperdoll-grid">
              <div></div>
              ${this.renderPartBox(mech, tpl, 'HD', activeLoc)}
              <div></div>

              ${this.renderPartBox(mech, tpl, 'LA', activeLoc)}
              ${this.renderPartBox(mech, tpl, 'CT', activeLoc)}
              ${this.renderPartBox(mech, tpl, 'RA', activeLoc)}

              ${this.renderPartBox(mech, tpl, 'LT', activeLoc)}
              <div class="panel" style="display:flex; flex-direction:column; justify-content:center; align-items:center; gap:4px;">
                <span class="subtext">Total Armor</span>
                <strong class="mono" style="font-size:15px;">${metrics.totalMaxArmor} Pts</strong>
                <span class="subtext mono">${(metrics.totalMaxArmor * 0.08).toFixed(1)} Tons</span>
              </div>
              ${this.renderPartBox(mech, tpl, 'RT', activeLoc)}

              ${this.renderPartBox(mech, tpl, 'LL', activeLoc)}
              <div></div>
              ${this.renderPartBox(mech, tpl, 'RL', activeLoc)}
            </div>
          </div>

        </div>

        <!-- Right 7 Cols: Blueprint Telemetry + Selected Body Part Slot Workshop + Component Warehouse -->
        <div class="col-7" style="display:flex; flex-direction:column; gap:16px;">
          
          <!-- Blueprint Telemetry & Designation Header -->
          <div class="card">
            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px; border-bottom:1px solid var(--border); padding-bottom:12px;">
              <div style="display:flex; align-items:center; gap:8px; flex:1;">
                <input id="mech-name-inp" class="input" style="max-width:280px; font-weight:700; font-size:15px;" value="${mech.customName}" onchange="GarageModule.renameMech(this.value)" />
                <span class="badge primary">${tpl.weightClass} (${tpl.maxTons}t)</span>
                <span class="badge">${tpl.baseSpeedHex + metrics.jumpJets} Hex Move</span>
              </div>

              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <div class="hud-pill">
                  <div class="label">Mass / Max Tonnage</div>
                  <div class="val" style="color:${overTons ? 'var(--accent-red)' : 'var(--accent-green)'};">
                    ${metrics.totalTons} / ${metrics.maxTons}.0 t
                  </div>
                </div>
                <div class="hud-pill">
                  <div class="label">Alpha Heat / Cooling</div>
                  <div class="val" style="color:${overHeat ? 'var(--accent-red)' : 'var(--accent-amber)'};">
                    ${metrics.alphaHeat} / ${metrics.coolingCap} C
                  </div>
                </div>
                <div class="hud-pill">
                  <div class="label">Total Value</div>
                  <div class="val">${metrics.totalCost.toLocaleString()} Cr</div>
                </div>
              </div>
            </div>

            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:10px; font-size:13px;">
              <div>
                Assigned Jock: <strong>${assignedJock ? `${assignedJock.firstName} "${assignedJock.callsign}" ${assignedJock.lastName}` : 'Unassigned (Assign in HQ)'}</strong>
                ${metrics.hitBonus ? `<span class="badge green" style="margin-left:8px;">+${metrics.hitBonus}% Battle Computer</span>` : ''}
                ${metrics.defenseBonus ? `<span class="badge primary" style="margin-left:6px;">+${metrics.defenseBonus}% ECM Jammer</span>` : ''}
                ${metrics.shieldPts ? `<span class="badge amber" style="margin-left:6px;">+${metrics.shieldPts} Shield</span>` : ''}
              </div>
              <span class="subtext">Classic Free-Slot Mode: Any component mounts in any open slot within tonnage.</span>
            </div>
          </div>

          <!-- Selected Body Part Slot & Armor Editor -->
          <div class="card">
            <div class="section-header">
              <div>
                <span class="section-title">${locObj.name}</span>
                <span class="badge primary mono" style="margin-left:8px;">Critical Slots: ${usedSlots} / ${maxSlots}</span>
              </div>

              <!-- Armor Controls for this Part -->
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="subtext">Location Armor:</span>
                <button class="btn" onclick="GarageModule.adjustArmor('${activeLoc}', -4)">-4</button>
                <span class="mono" style="font-weight:700; min-width:58px; text-align:center;">${curArmor} / ${limArmor}</span>
                <button class="btn" onclick="GarageModule.adjustArmor('${activeLoc}', 4)">+4</button>
              </div>
            </div>

            <div class="grid-12">
              <!-- Installed in this Location (5 Cols) -->
              <div class="col-5" style="display:flex; flex-direction:column; gap:8px;">
                <div class="subtext" style="font-weight:600; text-transform:uppercase;">Installed in ${activeLoc} (Click to Strip)</div>
                ${installedIds.length === 0 ? `<div class="panel subtext">No components mounted in this location.</div>` : installedIds.map((cid, idx) => {
                  const comp = window.GameState.getComponent(cid);
                  if (!comp) return '';
                  return `
                    <div class="list-item" onclick="GarageModule.removeComponent('${activeLoc}', ${idx})" style="display:flex; justify-content:space-between; align-items:center;">
                      <div>
                        <strong>${comp.name}</strong>
                        <div class="subtext">${comp.cat} ${comp.dmg ? `• ${comp.dmg} Dmg` : ''}</div>
                      </div>
                      <div class="mono subtext" style="text-align:right;">
                        <div>${comp.tons}t • ${comp.slots}s</div>
                        <span style="color:var(--accent-red); font-size:12px;">Remove &times;</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Component Warehouse Catalog (7 Cols) -->
              <div class="col-7" style="display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; flex-wrap:wrap; gap:6px; align-items:center; justify-content:space-between;">
                  <span class="subtext" style="font-weight:600; text-transform:uppercase;">Factory Warehouse (Click + to Mount)</span>
                  <div style="display:flex; flex-wrap:wrap; gap:4px;">
                    ${categories.map(cat => `
                      <button class="btn ${this.filterCat === cat ? 'btn-primary' : ''}" style="padding:3px 8px;" onclick="GarageModule.setFilter('${cat}')">
                        ${cat === 'All' ? 'All' : cat.split(' ')[0]}
                      </button>
                    `).join('')}
                  </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:6px; max-height:340px; overflow-y:auto; padding-right:4px;">
                  ${filteredCatalog.map(comp => {
                    const fitsSlots = (usedSlots + comp.slots) <= maxSlots;
                    const fitsTons = (metrics.totalTons + comp.tons) <= metrics.maxTons;
                    const canMount = fitsSlots && fitsTons;
                    return `
                      <div class="panel" style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                        <div>
                          <strong>${comp.name}</strong>
                          <span class="badge" style="margin-left:6px;">${comp.tons}t / ${comp.slots} Slot${comp.slots > 1 ? 's' : ''}</span>
                          <div class="subtext" style="margin-top:2px;">
                            ${comp.dmg > 0 ? `Dmg: ${comp.dmg} • Heat: +${comp.heat}C • Recycle: ${comp.sec}s • Range: ${comp.range} Hex` : `Heat: ${comp.heat}C • Support System`}
                          </div>
                        </div>
                        <button class="btn btn-primary" ${!canMount ? 'disabled' : ''} onclick="GarageModule.mountComponent('${activeLoc}', '${comp.id}')">
                          + Mount
                        </button>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    `;
  },

  renderPartBox(mech, tpl, code, activeLoc) {
    const isSel = code === activeLoc;
    const compIds = mech.locations[code] || [];
    const usedSlots = compIds.reduce((a, cid) => a + (window.GameState.getComponent(cid)?.slots || 0), 0);
    const maxSlots = tpl.slotLimits[code];
    const curArmor = mech.maxArmorCurrent[code];
    const limArmor = tpl.maxArmor[code];

    return `
      <div class="part-box ${isSel ? 'selected' : ''}" onclick="GarageModule.selectPart('${code}')">
        <div style="font-weight:700; font-size:14px;">${code}</div>
        <div class="mono subtext" style="margin-top:2px;">Armor: ${curArmor}/${limArmor}</div>
        <div class="mono" style="font-size:12px; margin-top:2px; color:${usedSlots >= maxSlots ? 'var(--accent-amber)' : 'var(--accent-green)'};">
          Slots: ${usedSlots}/${maxSlots}
        </div>
      </div>
    `;
  },

  selectMech(id) {
    window.GameState.data.selectedMechId = id;
    window.GameState.save();
    this.render();
  },

  selectPart(code) {
    window.GameState.data.selectedBodyPart = code;
    window.GameState.save();
    this.render();
  },

  setFilter(cat) {
    this.filterCat = cat;
    this.render();
  },

  renameMech(newName) {
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === st.selectedMechId);
    if (mech && newName.trim()) {
      mech.customName = newName.trim();
      window.GameState.save();
      this.render();
    }
  },

  adjustArmor(locCode, delta) {
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === st.selectedMechId);
    if (!mech) return;
    const tpl = window.GameState.getMechTemplate(mech);
    const nextVal = Math.max(0, Math.min(tpl.maxArmor[locCode], mech.maxArmorCurrent[locCode] + delta));
    mech.maxArmorCurrent[locCode] = nextVal;
    mech.armor[locCode] = nextVal;
    window.GameState.save();
    this.render();
  },

  maxAllArmor() {
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === st.selectedMechId);
    if (!mech) return;
    const tpl = window.GameState.getMechTemplate(mech);
    Object.keys(tpl.maxArmor).forEach(k => {
      mech.maxArmorCurrent[k] = tpl.maxArmor[k];
      mech.armor[k] = tpl.maxArmor[k];
    });
    window.GameState.save();
    this.render();
  },

  mountComponent(locCode, compId) {
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === st.selectedMechId);
    const comp = window.GameState.getComponent(compId);
    if (!mech || !comp) return;

    const metrics = window.GameState.computeMechMetrics(mech);
    const usedSlots = (mech.locations[locCode] || []).reduce((a, cid) => a + (window.GameState.getComponent(cid)?.slots || 0), 0);
    if (usedSlots + comp.slots > metrics.tpl.slotLimits[locCode]) return;
    if (metrics.totalTons + comp.tons > metrics.maxTons) return;

    mech.locations[locCode].push(compId);
    window.GameState.save();
    this.render();
  },

  removeComponent(locCode, idx) {
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === st.selectedMechId);
    if (!mech || !mech.locations[locCode]) return;
    mech.locations[locCode].splice(idx, 1);
    window.GameState.save();
    this.render();
  },

  commissionChassis() {
    const st = window.GameState.data;
    const selId = document.getElementById('new-chassis-select')?.value || 'recon-50';
    const mode = document.getElementById('new-chassis-mode')?.value || 'stripped';
    const tpl = window.TOS_DATA.chassisTemplates.find(t => t.id === selId);
    if (!tpl || st.credits < tpl.baseCost) return;

    st.credits -= tpl.baseCost;
    const newId = 'mech-' + Date.now();
    const armorCopy = {};
    Object.keys(tpl.maxArmor).forEach(k => {
      armorCopy[k] = mode === 'stripped' ? Math.round(tpl.maxArmor[k] * 0.5) : tpl.maxArmor[k];
    });

    st.mechs.push({
      id: newId,
      customName: tpl.model,
      templateId: tpl.id,
      armor: { ...armorCopy },
      maxArmorCurrent: { ...armorCopy },
      locations: mode === 'stripped'
        ? { HD: [], CT: [], LT: [], RT: [], LA: [], RA: [], LL: [], RL: [] }
        : { HD: [], CT: ['hs', 'hs'], LT: [], RT: [], LA: ['mlas'], RA: ['mlas'], LL: [], RL: [] }
    });
    st.selectedMechId = newId;

    // Auto-assign to the first unassigned Jock if one exists
    const unassignedJock = st.jocks.find(j => !j.assignedMechId);
    if (unassignedJock) {
      unassignedJock.assignedMechId = newId;
    }

    window.GameState.save();
    App.updateHUD();
    this.render();
  }
};
