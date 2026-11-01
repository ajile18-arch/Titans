// Garage, Chassis Dealership & Mech Parts Shop Module

window.GarageModule = {
  filterCat: 'All',

  render() {
    const st = window.GameState.data;
    const container = document.getElementById('view-garage');
    if (!container) return;

    const repLvl = window.GameState.getCompanyReputationLevel();
    const mech = st.mechs.find(m => m.id === st.selectedMechId) || st.mechs[0];
    if (mech && st.selectedMechId !== mech.id) st.selectedMechId = mech.id;
    const activeLoc = st.selectedBodyPart || 'RA';

    if (!mech) {
      container.innerHTML = `
        <div class="card" style="padding:32px 28px; text-align:center; align-items:center; gap:18px;">
          <div style="display:flex; gap:8px; align-items:center; justify-content:center; flex-wrap:wrap;">
            <span class="badge primary">CHASSIS DEALERSHIP &amp; HANGAR BAY</span>
            <span class="badge amber mono">Company Reputation Level ${repLvl}</span>
          </div>
          <h2 style="font-size:22px; font-weight:800;">No Titans in Your Hangar Yet</h2>
          <p class="subtext" style="max-width:600px; font-size:14px;">
            Your <strong>Company Reputation (Level ${repLvl})</strong> determines which Mech Chassis weight classes manufacturers will sell to you. Purchase an unlocked Titan chassis below, then buy weapons and equipment in the <strong>Mech Parts Shop</strong> to outfit all 8 body sections!
          </p>

          <div class="panel" style="display:flex; flex-direction:column; gap:14px; width:100%; max-width:620px; text-align:left; padding:18px;">
            <div>
              <label class="subtext" style="font-weight:600;">1. Select Available Mech Chassis (Limited by Company Reputation Lvl ${repLvl})</label>
              <select id="new-chassis-select" class="select" style="margin-top:6px;">
                ${window.TOS_DATA.chassisTemplates.map(t => {
                  const req = t.reqRepLevel || 1;
                  const locked = repLvl < req;
                  return `
                    <option value="${t.id}" ${locked ? 'disabled' : ''}>
                      ${locked ? `[LOCKED — Requires Rep Lvl ${req}] ` : '✔ '}${t.model} (${t.maxTons}t ${t.weightClass}) — ${t.baseCost.toLocaleString()} Cr
                    </option>
                  `;
                }).join('')}
              </select>
            </div>

            <!-- Chassis Reputation Unlock Tier Guide -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(175px, 1fr)); gap:8px;">
              ${window.TOS_DATA.chassisTemplates.map(t => {
                const req = t.reqRepLevel || 1;
                const unlocked = repLvl >= req;
                return `
                  <div class="card" style="padding:8px 10px; background:var(--bg-main); opacity:${unlocked ? '1' : '0.55'}; border-color:${unlocked ? 'var(--accent-green)' : 'var(--border)'};">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <strong style="font-size:12px;">${t.weightClass} (${t.maxTons}t)</strong>
                      <span class="badge ${unlocked ? 'green' : 'amber'} mono">Rep Lvl ${req}</span>
                    </div>
                    <div class="subtext" style="font-size:11px; margin-top:2px;">${t.model} • ${t.baseCost.toLocaleString()} Cr</div>
                  </div>
                `;
              }).join('')}
            </div>

            <div>
              <label class="subtext" style="font-weight:600;">2. Choose Factory Frame Package</label>
              <select id="new-chassis-mode" class="select" style="margin-top:6px;">
                <option value="stripped">Stripped Bare Frame (0 Weapons / 50% Armor — Buy &amp; Equip Parts in the Shop)</option>
                <option value="standard">Basic Starter Package (+28,000 Cr: Includes 2x Medium Lasers, 2x Heat Sinks &amp; Full Armor)</option>
              </select>
            </div>

            <button class="btn btn-primary" style="padding:11px; font-size:14px; margin-top:4px;" onclick="GarageModule.commissionChassis()">
              + Buy &amp; Commission Titan Chassis
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
    const totalSpareParts = Object.values(st.partInventory || {}).reduce((a, b) => a + b, 0);

    container.innerHTML = `
      <div class="grid-12">
        <!-- Left 5 Cols: Hangar Bay Roster & Reputation-Gated Chassis Shop + 8-Location Titan Paperdoll -->
        <div class="col-5" style="display:flex; flex-direction:column; gap:16px;">
          
          <!-- Hangar Roster & Chassis Dealership (Reputation Gated) -->
          <div class="card">
            <div class="section-header">
              <div>
                <div class="section-title">Hangar Bay &amp; Chassis Shop (${st.mechs.length} Units)</div>
                <div class="subtext">Higher Company Reputation unlocks heavier Mech Chassis to buy</div>
              </div>
              <span class="badge amber mono">Rep Lvl ${repLvl}</span>
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

            <!-- Buy New Titan Chassis Bar (Filtered/Locked by Company Reputation) -->
            <div class="panel" style="display:flex; flex-direction:column; gap:8px; margin-top:6px;">
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px;">
                <span class="subtext" style="font-weight:700;">Buy New Mech Chassis (Stripped Frame):</span>
                <span class="mono subtext">Win every 2 fights for +1 Rep Lvl</span>
              </div>
              <div style="display:flex; gap:8px; align-items:center;">
                <select id="new-chassis-select" class="select" style="flex:1;">
                  ${window.TOS_DATA.chassisTemplates.map(t => {
                    const req = t.reqRepLevel || 1;
                    const locked = repLvl < req;
                    return `
                      <option value="${t.id}" ${locked ? 'disabled' : ''}>
                        ${locked ? `[Locked: Req Rep Lvl ${req}] ` : ''}${t.model} (${t.maxTons}t ${t.weightClass}) — ${t.baseCost.toLocaleString()} Cr
                      </option>
                    `;
                  }).join('')}
                </select>
                <button class="btn btn-primary" onclick="GarageModule.commissionChassis()">+ Buy Chassis</button>
              </div>
            </div>
          </div>

          <!-- 8-Location Interactive Paperdoll -->
          <div class="card">
            <div class="section-header">
              <div>
                <div class="section-title">8-Part Titan Anatomy Diagram</div>
                <div class="subtext">Click any body section to inspect slots, armor &amp; equip owned parts</div>
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

        <!-- Right 7 Cols: Blueprint Telemetry + Selected Body Part Slot Workshop + Mech Parts Shop -->
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
              <span class="badge green mono">Spare Parts in Storage: ${totalSpareParts}</span>
            </div>
          </div>

          <!-- Selected Body Part Slot & Armor Editor + Mech Parts Shop -->
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
                <div class="subtext" style="font-weight:600; text-transform:uppercase;">Equipped in ${activeLoc} (Click to Unequip to Storage)</div>
                ${installedIds.length === 0 ? `<div class="panel subtext">No parts equipped in ${activeLoc}. Buy parts in the Shop on the right, then click <strong>Equip</strong>!</div>` : installedIds.map((cid, idx) => {
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
                        <span style="color:var(--accent-amber); font-size:12px;">Unequip &rarr; Storage</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Mech Parts Shop & Owned Inventory (7 Cols) -->
              <div class="col-7" style="display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; flex-wrap:wrap; gap:6px; align-items:center; justify-content:space-between;">
                  <div>
                    <span class="subtext" style="font-weight:700; text-transform:uppercase; color:#93c5fd;">Mech Parts Shop &amp; Hangar Storage</span>
                    <div class="subtext" style="font-size:11px;">You must <strong>Buy</strong> a part before you can <strong>Equip</strong> it onto your Mech</div>
                  </div>
                  <div style="display:flex; flex-wrap:wrap; gap:4px;">
                    ${categories.map(cat => `
                      <button class="btn ${this.filterCat === cat ? 'btn-primary' : ''}" style="padding:3px 8px;" onclick="GarageModule.setFilter('${cat}')">
                        ${cat === 'All' ? 'All' : cat.split(' ')[0]}
                      </button>
                    `).join('')}
                  </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:8px; max-height:380px; overflow-y:auto; padding-right:4px;">
                  ${filteredCatalog.map(comp => {
                    const owned = window.GameState.getOwnedPartCount(comp.id);
                    const fitsSlots = (usedSlots + comp.slots) <= maxSlots;
                    const fitsTons = (metrics.totalTons + comp.tons) <= metrics.maxTons;
                    const canAfford = st.credits >= comp.cost;
                    const canEquip = owned > 0 && fitsSlots && fitsTons;
                    const sellValue = Math.round(comp.cost * 0.7);

                    return `
                      <div class="panel" style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:10px; border-color:${owned > 0 ? 'var(--accent-green)' : 'var(--border)'};">
                        <div style="flex:1; min-width:190px;">
                          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                            <strong>${comp.name}</strong>
                            <span class="badge">${comp.tons}t / ${comp.slots} Slot${comp.slots > 1 ? 's' : ''}</span>
                            <span class="badge ${owned > 0 ? 'green' : 'amber'} mono">Owned: ${owned}</span>
                          </div>
                          <div class="subtext" style="margin-top:3px;">
                            ${comp.dmg > 0 ? `Dmg: ${comp.dmg} • Heat: +${comp.heat}C • Recycle: ${comp.sec}s • Range: ${comp.range} Hex` : `Heat: ${comp.heat}C • Support System`}
                          </div>
                          <div class="mono" style="font-size:12px; margin-top:4px; color:var(--accent-amber); font-weight:700;">
                            Shop Price: ${comp.cost.toLocaleString()} Cr
                          </div>
                        </div>

                        <div style="display:flex; flex-direction:column; gap:5px; min-width:148px;">
                          <div style="display:flex; gap:4px;">
                            <button
                              class="btn"
                              style="flex:1; padding:5px 8px; border-color:var(--accent-amber); color:#fde68a;"
                              ${!canAfford ? 'disabled' : ''}
                              onclick="GarageModule.buyPart('${comp.id}')"
                            >
                              Buy (${(comp.cost / 1000).toFixed(0)}k Cr)
                            </button>
                            ${owned > 0 ? `
                              <button
                                class="btn"
                                style="padding:5px 7px; font-size:11px;"
                                title="Sell 1 spare part from storage for ${sellValue.toLocaleString()} Cr"
                                onclick="GarageModule.sellPart('${comp.id}')"
                              >
                                Sell
                              </button>
                            ` : ''}
                          </div>

                          <button
                            class="btn ${canEquip ? 'btn-primary' : ''}"
                            style="padding:5px 8px;"
                            ${!canEquip ? 'disabled' : ''}
                            onclick="GarageModule.mountComponent('${activeLoc}', '${comp.id}')"
                          >
                            ${owned <= 0 ? 'Buy First to Equip' : (!fitsSlots ? 'No Slot Room' : (!fitsTons ? 'Over Tonnage' : `+ Equip in ${activeLoc}`))}
                          </button>
                        </div>
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

  buyPart(compId) {
    const st = window.GameState.data;
    const comp = window.GameState.getComponent(compId);
    if (!comp) return;
    if (st.credits < comp.cost) {
      alert(`Insufficient treasury funds to purchase ${comp.name} (${comp.cost.toLocaleString()} Cr)!`);
      return;
    }

    st.credits -= comp.cost;
    if (!st.partInventory) st.partInventory = {};
    st.partInventory[compId] = (st.partInventory[compId] || 0) + 1;
    window.GameState.save();
    App.updateHUD();
    this.render();
  },

  sellPart(compId) {
    const st = window.GameState.data;
    const comp = window.GameState.getComponent(compId);
    const owned = window.GameState.getOwnedPartCount(compId);
    if (!comp || owned <= 0) return;

    const sellVal = Math.round(comp.cost * 0.7);
    st.partInventory[compId] = owned - 1;
    if (st.partInventory[compId] <= 0) delete st.partInventory[compId];
    st.credits += sellVal;
    window.GameState.save();
    App.updateHUD();
    this.render();
  },

  mountComponent(locCode, compId) {
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === st.selectedMechId);
    const comp = window.GameState.getComponent(compId);
    const owned = window.GameState.getOwnedPartCount(compId);
    if (!mech || !comp || owned <= 0) return;

    const metrics = window.GameState.computeMechMetrics(mech);
    const usedSlots = (mech.locations[locCode] || []).reduce((a, cid) => a + (window.GameState.getComponent(cid)?.slots || 0), 0);
    if (usedSlots + comp.slots > metrics.tpl.slotLimits[locCode]) return;
    if (metrics.totalTons + comp.tons > metrics.maxTons) return;

    st.partInventory[compId] = owned - 1;
    if (st.partInventory[compId] <= 0) delete st.partInventory[compId];
    mech.locations[locCode].push(compId);
    window.GameState.save();
    App.updateHUD();
    this.render();
  },

  removeComponent(locCode, idx) {
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === st.selectedMechId);
    if (!mech || !mech.locations[locCode]) return;
    const removedArr = mech.locations[locCode].splice(idx, 1);
    const removedCompId = removedArr[0];
    if (removedCompId) {
      if (!st.partInventory) st.partInventory = {};
      st.partInventory[removedCompId] = (st.partInventory[removedCompId] || 0) + 1;
    }
    window.GameState.save();
    App.updateHUD();
    this.render();
  },

  commissionChassis() {
    const st = window.GameState.data;
    const repLvl = window.GameState.getCompanyReputationLevel();
    const selId = document.getElementById('new-chassis-select')?.value || 'recon-50';
    const mode = document.getElementById('new-chassis-mode')?.value || 'stripped';
    const tpl = window.TOS_DATA.chassisTemplates.find(t => t.id === selId);
    if (!tpl) return;

    const reqRep = tpl.reqRepLevel || 1;
    if (repLvl < reqRep) {
      alert(`${tpl.model} (${tpl.weightClass}) requires Company Reputation Level ${reqRep}! Your current Reputation is Level ${repLvl}.`);
      return;
    }

    const totalCost = tpl.baseCost + (mode === 'standard' ? 28000 : 0);
    if (st.credits < totalCost) {
      alert(`Insufficient funds to purchase ${tpl.model} (${totalCost.toLocaleString()} Cr required)!`);
      return;
    }

    st.credits -= totalCost;
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
