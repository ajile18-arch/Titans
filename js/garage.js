// Garage, Chassis Dealership & Mech Parts Shop Module

window.GarageModule = {
  filterCat: 'All',

  renderShopkeeperBanner(repLvl, totalSpareParts = 0) {
    const quote = repLvl >= 5
      ? `"Reputation Level ${repLvl}! You're legends in this sector, Commander. I've unlocked my entire vault—including the 200-ton Sovereign Assault frames."`
      : repLvl === 4
        ? `"Word of your victories is spreading fast (Reputation Level ${repLvl}). I'm now authorized to sell you 160-ton Heavy Marauder chassis!"`
        : repLvl === 3
          ? `"Strong showing out there, Commander! At Reputation Level ${repLvl}, I can clear you for 120-ton Medium Guillotine frames. Keep winning to unlock Heavy iron."`
          : repLvl === 2
            ? `"You've proven your squad can survive a drop (Reputation Level ${repLvl})! I'm now cleared to sell you 80-ton Light Lynx chassis alongside Recon frames."`
            : `"Welcome to Vos Heavy Salvage & Ordnance! At Reputation Level 1, I can only clear you for 50-ton Recon Wasp chassis. Remember: you gotta buy a part from my shop before bolting it on, and I buy back gear at 50%—less if you bring it back shot up!"`;

    return `
      <div class="card" style="margin-bottom:16px; border-color:var(--accent-amber);">
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px;">
          <div style="display:flex; align-items:center; gap:14px; flex:1; min-width:280px;">
            <img
              src="assets/portraits/shopkeeper_rusty.jpg"
              alt="Shopkeeper Kaelen 'Rusty' Vos"
              style="width:78px; height:78px; object-fit:cover; border-radius:12px; border:2px solid var(--accent-amber); flex-shrink:0; background:#0f172a;"
            />
            <div>
              <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px;">
                <span class="badge amber">SHOPKEEPER &amp; QUARTERMASTER</span>
                <h2 style="font-size:18px; font-weight:800;">Kaelen "Rusty" Vos</h2>
                <span class="subtext mono">— Vos Heavy Salvage &amp; Ordnance</span>
              </div>
              <div style="font-style:italic; color:#fde68a; font-size:13px; margin-top:4px;">
                ${quote}
              </div>
              <div class="subtext" style="margin-top:4px; font-size:12px;">
                <strong>Shop Policy:</strong> Chassis unlocked by <strong>Company Reputation (Lvl ${repLvl})</strong> • Buy parts to equip • <strong>50% Base Buyback</strong> (Reduced if damaged)
              </div>
            </div>
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <div class="hud-pill">
              <div class="label">Company Rep</div>
              <div class="val" style="color:var(--accent-amber);">Level ${repLvl}</div>
            </div>
            <div class="hud-pill">
              <div class="label">Spare Parts Owned</div>
              <div class="val" style="color:var(--accent-green);">${totalSpareParts} in Storage</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  render() {
    const st = window.GameState.data;
    const container = document.getElementById('view-garage');
    if (!container) return;

    const repLvl = window.GameState.getCompanyReputationLevel();
    const mech = st.mechs.find(m => m.id === st.selectedMechId) || st.mechs[0];
    if (mech && st.selectedMechId !== mech.id) st.selectedMechId = mech.id;
    const activeLoc = st.selectedBodyPart || 'RA';
    const totalSpareParts = (st.partStorage || []).length;

    if (!mech) {
      container.innerHTML = `
        ${this.renderShopkeeperBanner(repLvl, totalSpareParts)}
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
              <label class="subtext" style="font-weight:600;">1. Select Available Mech Chassis (Larger Chassis Take More Months to Build)</label>
              <select id="new-chassis-select" class="select" style="margin-top:6px;">
                ${window.TOS_DATA.chassisTemplates.map(t => {
                  const req = t.reqRepLevel || 1;
                  const locked = repLvl < req;
                  const buildTime = window.GameState.formatWeeksDuration(window.GameState.getChassisBuildWeeks(t, 'stripped'));
                  return `
                    <option value="${t.id}" ${locked ? 'disabled' : ''}>
                      ${locked ? `[LOCKED — Requires Rep Lvl ${req}] ` : '✔ '}${t.model} (${t.maxTons}t ${t.weightClass}) — ${t.baseCost.toLocaleString()} Cr [${buildTime}]
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
                const buildTime = window.GameState.formatWeeksDuration(window.GameState.getChassisBuildWeeks(t, 'stripped'));
                return `
                  <div class="card" style="padding:8px 10px; background:var(--bg-main); opacity:${unlocked ? '1' : '0.55'}; border-color:${unlocked ? 'var(--accent-green)' : 'var(--border)'};">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <strong style="font-size:12px;">${t.weightClass} (${t.maxTons}t)</strong>
                      <span class="badge ${unlocked ? 'green' : 'amber'} mono">Rep Lvl ${req}</span>
                    </div>
                    <div class="subtext" style="font-size:11px; margin-top:2px;">${t.model} • ${t.baseCost.toLocaleString()} Cr</div>
                    <div class="mono" style="font-size:11px; color:#93c5fd; margin-top:2px;">Build Time: ${buildTime}</div>
                  </div>
                `;
              }).join('')}
            </div>

            <div>
              <label class="subtext" style="font-weight:600;">2. Choose Factory Frame Package</label>
              <select id="new-chassis-mode" class="select" style="margin-top:6px;">
                <option value="stripped">Stripped Bare Frame (0 Weapons / 50% Armor — Standard Build Time)</option>
                <option value="standard">Basic Starter Package (+28,000 Cr / +2 Wks: Includes 2x Medium Lasers, 2x Heat Sinks &amp; Full Armor)</option>
              </select>
            </div>

            <button class="btn btn-primary" style="padding:11px; font-size:14px; margin-top:4px;" onclick="GarageModule.commissionChassis()">
              + Buy &amp; Commission Titan Chassis
            </button>
          </div>

          ${(st.partStorage || []).length > 0 ? `
            <div class="panel" style="width:100%; max-width:620px; text-align:left; padding:16px; display:flex; flex-direction:column; gap:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-size:14px;">Spare Weapons &amp; Components in Hangar Storage (${st.partStorage.length})</strong>
                <span class="subtext">Sell back at 50% base value (less if damaged)</span>
              </div>
              <div style="display:flex; flex-direction:column; gap:6px;">
                ${st.partStorage.map(item => {
                  const comp = window.GameState.getComponent(item.compId);
                  if (!comp) return '';
                  const cond = item.condition ?? 100;
                  const sellPrice = window.GameState.getPartResaleValue(item.compId, cond);
                  return `
                    <div class="card" style="padding:8px 12px; background:var(--bg-main); display:flex; justify-content:space-between; align-items:center;">
                      <div>
                        <strong>${comp.name}</strong>
                        <span class="badge ${cond < 100 ? 'amber' : 'green'} mono" style="margin-left:6px;">${cond}% Cond</span>
                      </div>
                      <button class="btn btn-danger" style="padding:4px 10px;" onclick="GarageModule.sellStoredPartByUid('${item.uid}')">
                        Sell (+${sellPrice.toLocaleString()} Cr)
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
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
    const resaleInfo = window.GameState.getChassisResaleInfo(mech);

    container.innerHTML = `
      ${this.renderShopkeeperBanner(repLvl, totalSpareParts)}
      <div class="grid-12">
        <!-- Left 7 Cols: Fleet Selection Bar & Large Interactive Mech Factory Schematic Bay -->
        <div class="col-7" style="display:flex; flex-direction:column; gap:16px;">
          
          <!-- Hangar Bay Roster & Chassis Dealership (Reputation Gated) -->
          <div class="card">
            <div class="section-header">
              <div>
                <div class="section-title">Hangar Fleet Roster (${st.mechs.length} Mech${st.mechs.length > 1 ? 's' : ''})</div>
                <div class="subtext">Select an active Titan to configure, or buy a new chassis frame</div>
              </div>
              <span class="badge amber mono">Rep Lvl ${repLvl}</span>
            </div>

            <!-- Fleet Selector Pills -->
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
              ${st.mechs.map(m => {
                const mm = window.GameState.computeMechMetrics(m);
                const rInfo = window.GameState.getChassisResaleInfo(m);
                const pilot = st.jocks.find(j => j.assignedMechId === m.id);
                const isSel = m.id === mech.id;
                return `
                  <div
                    class="mech-switcher-pill ${isSel ? 'active' : ''}"
                    onclick="GarageModule.selectMech('${m.id}')"
                    title="${m.customName} (${mm.tpl.model}) • ${pilot ? `Pilot: ${pilot.callsign}` : 'No Pilot'}"
                  >
                    <div style="display:flex; flex-direction:column; gap:2px;">
                      <div style="display:flex; align-items:center; gap:6px;">
                        <strong style="font-size:13px; color:${isSel ? '#38bdf8' : '#f1f5f9'};">${m.customName}</strong>
                        <span class="badge primary" style="font-size:10px;">${mm.tpl.weightClass} (${mm.maxTons}t)</span>
                      </div>
                      <div style="display:flex; align-items:center; gap:6px; font-size:11px;" class="subtext mono">
                        <span class="badge ${rInfo.conditionPct < 100 ? 'amber' : 'green'} mono" style="font-size:9px; padding:1px 4px;">
                          ${rInfo.conditionPct}% HP
                        </span>
                        <span>${pilot ? `Pilot: ${pilot.callsign}` : 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Buy New Titan Chassis Bar -->
            <div class="panel" style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px;">
                <span class="subtext" style="font-weight:700;">Buy New Titan Chassis Frame:</span>
                <span class="mono subtext">Win fights for higher Rep Lvls</span>
              </div>
              <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                <select id="new-chassis-select" class="select" style="flex:1; min-width:200px;">
                  ${window.TOS_DATA.chassisTemplates.map(t => {
                    const req = t.reqRepLevel || 1;
                    const locked = repLvl < req;
                    const buildTime = window.GameState.formatWeeksDuration(window.GameState.getChassisBuildWeeks(t, 'stripped'));
                    return `
                      <option value="${t.id}" ${locked ? 'disabled' : ''}>
                        ${locked ? `[Locked: Req Rep Lvl ${req}] ` : ''}${t.model} (${t.maxTons}t ${t.weightClass}) — ${t.baseCost.toLocaleString()} Cr [${buildTime}]
                      </option>
                    `;
                  }).join('')}
                </select>
                <button class="btn btn-primary" onclick="GarageModule.commissionChassis()">+ Buy Chassis</button>
              </div>
            </div>
          </div>

          <!-- Large Detailed Interactive Mech Factory Schematic Bay -->
          ${this.renderInteractiveMechSchematic(mech, tpl, metrics, resaleInfo, activeLoc)}

        </div>

        <!-- Right 5 Cols: Blueprint Telemetry, Armor Plating, Active Hardpoint Workshop & Inventory -->
        <div class="col-5" style="display:flex; flex-direction:column; gap:16px;">
          
          <!-- Blueprint Telemetry, Condition & Chassis Sell-Back Card -->
          <div class="card">
            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px; border-bottom:1px solid var(--border); padding-bottom:12px;">
              <div style="display:flex; align-items:center; gap:8px; flex:1;">
                <input id="mech-name-inp" class="input" style="max-width:200px; font-weight:700; font-size:14px;" value="${mech.customName}" onchange="GarageModule.renameMech(this.value)" />
                <span class="badge primary">${tpl.weightClass} (${tpl.maxTons}t)</span>
                <span class="badge ${resaleInfo.conditionPct < 100 ? 'amber' : 'green'} mono">Chassis: ${resaleInfo.conditionPct}%</span>
              </div>

              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <div class="hud-pill">
                  <div class="label">Mass / Max</div>
                  <div class="val" style="color:${overTons ? 'var(--accent-red)' : 'var(--accent-green)'};">
                    ${metrics.totalTons} / ${metrics.maxTons}.0 t
                  </div>
                </div>
                <div class="hud-pill" style="border-color:${metrics.openWeight < 0 ? 'var(--accent-red)' : 'var(--accent-cyan)'};">
                  <div class="label">Open Weight</div>
                  <div class="val" style="color:${metrics.openWeight < 0 ? 'var(--accent-red)' : '#38bdf8'}; font-weight:700;">
                    ${metrics.openWeight >= 0 ? `${metrics.openWeight.toFixed(1)}t Free` : `${Math.abs(metrics.openWeight).toFixed(1)}t Over`}
                  </div>
                </div>
                <div class="hud-pill">
                  <div class="label">Armor Rating</div>
                  <div class="val" style="color:var(--accent-cyan); font-weight:700;">
                    ${metrics.armorRating} (-${metrics.damageReductionPct}% DR)
                  </div>
                </div>
                <div class="hud-pill">
                  <div class="label">Alpha Heat / Cool</div>
                  <div class="val" style="color:${overHeat ? 'var(--accent-red)' : 'var(--accent-amber)'};">
                    ${metrics.alphaHeat} / ${metrics.coolingCap} C
                  </div>
                </div>
              </div>
            </div>

            <!-- Assigned Jock & Sell Back Chassis Controls -->
            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:10px; font-size:12px; margin-top:10px;">
              <div>
                Assigned Jock: <strong>${assignedJock ? `${assignedJock.firstName} "${assignedJock.callsign}" ${assignedJock.lastName}` : 'Unassigned (Assign in HQ)'}</strong>
                ${assignedJock ? (() => {
                  const tpl = window.GameState.getMechTemplate(mech);
                  const wClass = tpl ? tpl.weightClass : 'Medium';
                  const affInfo = window.GameState.getJockChassisAffinity(assignedJock, wClass);
                  return `<span class="badge ${affInfo.tier.badgeClass} mono" style="margin-left:6px; font-size:10px;">Comfort: ${affInfo.rating}% (${affInfo.tier.tier})</span>`;
                })() : ''}
              </div>

              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button
                  class="btn btn-danger"
                  style="font-size:11px; padding:4px 8px;"
                  title="Strip all equipped parts into Hangar Storage and sell the Chassis for ${resaleInfo.chassisResale.toLocaleString()} Cr"
                  onclick="GarageModule.sellChassis('${mech.id}', false)"
                >
                  Sell Chassis (${(resaleInfo.chassisResale / 1000).toFixed(1)}k Cr)
                </button>
                ${resaleInfo.partCount > 0 ? `
                  <button
                    class="btn btn-danger"
                    style="font-size:11px; padding:4px 8px;"
                    title="Sell both the Chassis and all ${resaleInfo.partCount} equipped parts for ${resaleInfo.totalResale.toLocaleString()} Cr"
                    onclick="GarageModule.sellChassis('${mech.id}', true)"
                  >
                    Sell All (${(resaleInfo.totalResale / 1000).toFixed(1)}k Cr)
                  </button>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Dedicated Armor Plating & Damage Reduction Module (Open Weight Equipping) -->
          <div class="card" style="border: 1px solid rgba(56, 189, 248, 0.35); background: linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.85) 100%);">
            <div class="section-header">
              <div>
                <div class="section-title" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                  <span>🛡️ Armor Plating Allocation</span>
                  <span class="badge cyan mono" style="font-size:11px;">Armor Rating: ${metrics.armorRating}</span>
                  <span class="badge green mono" style="font-size:11px;">-${metrics.damageReductionPct}% DR</span>
                </div>
                <div class="subtext">
                  Equip armor plating using open weight up to ${metrics.maxTons}.0 tons.
                </div>
              </div>
              <div class="hud-pill" style="border-color:${metrics.openWeight < 0 ? 'var(--accent-red)' : 'var(--accent-green)'};">
                <div class="label">Open Weight Left</div>
                <div class="val" style="color:${metrics.openWeight < 0 ? 'var(--accent-red)' : 'var(--accent-green)'}; font-size:13px;">
                  ${metrics.openWeight >= 0 ? `${metrics.openWeight.toFixed(1)} t` : `${Math.abs(metrics.openWeight).toFixed(1)} t Over`}
                </div>
              </div>
            </div>

            <!-- Interactive Armor Weight Controls -->
            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:8px; padding:8px 0; border-top:1px solid rgba(255,255,255,0.06); border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
                <button class="btn" style="padding:4px 6px; font-size:11px;" onclick="GarageModule.adjustArmorTons(-5)">-5t</button>
                <button class="btn" style="padding:4px 6px; font-size:11px;" onclick="GarageModule.adjustArmorTons(-1)">-1t</button>
                <button class="btn" style="padding:4px 6px; font-size:11px;" onclick="GarageModule.adjustArmorTons(-0.5)">-0.5t</button>
                <div style="padding:4px 10px; background:#020617; border:1px solid var(--accent-cyan); border-radius:4px; text-align:center; min-width:85px;">
                  <div class="mono" style="font-size:14px; font-weight:900; color:#38bdf8;">${metrics.armorTons.toFixed(1)}t</div>
                  <div class="subtext mono" style="font-size:9px; color:#94a3b8;">${metrics.armorRating} Rating</div>
                </div>
                <button class="btn" style="padding:4px 6px; font-size:11px;" onclick="GarageModule.adjustArmorTons(0.5)">+0.5t</button>
                <button class="btn" style="padding:4px 6px; font-size:11px;" onclick="GarageModule.adjustArmorTons(1)">+1t</button>
                <button class="btn" style="padding:4px 6px; font-size:11px;" onclick="GarageModule.adjustArmorTons(5)">+5t</button>
              </div>

              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button class="btn btn-primary" style="padding:5px 8px; font-size:11px;" onclick="GarageModule.fillMaxArmor()" title="Equip maximum armor plating up to chassis weight capacity">
                  🛡️ Fill Max Armor (${metrics.openWeight > 0 ? `+${metrics.openWeight.toFixed(1)}t` : 'Full'})
                </button>
                <button class="btn btn-secondary" style="padding:5px 8px; font-size:11px;" onclick="GarageModule.stripArmor()" title="Remove all armor to test heavy weapon loadouts">
                  Strip (0t)
                </button>
              </div>
            </div>
          </div>

          <!-- Selected Body Part Slot Workshop -->
          <div class="card">
            <div class="section-header">
              <div>
                <span class="section-title">${locObj.name} (${activeLoc})</span>
                <span class="badge primary mono" style="margin-left:8px;">Slots: ${usedSlots} / ${maxSlots}</span>
              </div>
              <span class="subtext mono">Structure: <strong style="color:${curArmor <= 0 ? 'var(--accent-red)' : 'var(--accent-green)'};">${curArmor} / ${limArmor} HP</strong></span>
            </div>

            <!-- Installed in this Location -->
            <div style="display:flex; flex-direction:column; gap:6px;">
              <div class="subtext" style="font-weight:600; text-transform:uppercase; font-size:11px;">Equipped in ${activeLoc}:</div>
              ${installedIds.length === 0 ? `
                <div class="panel subtext" style="padding:8px 10px; font-size:12px;">
                  No parts equipped in ${activeLoc}. Drag a part from Storage or Shop below onto the diagram, or click <strong>Equip</strong>!
                </div>
              ` : installedIds.map((cid, idx) => {
                const comp = window.GameState.getComponent(cid);
                if (!comp) return '';
                const cond = window.GameState.getInstalledPartCondition(mech, activeLoc, idx);
                const sellPrice = window.GameState.getPartResaleValue(cid, cond);
                const icon = this.getComponentIcon(comp);
                const partDead = curArmor <= 0 || cond <= 0;
                return `
                  <div class="panel" style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:6px 10px;">
                    <div style="flex:1; min-width:0;">
                      <div style="display:flex; align-items:center; gap:6px;">
                        <span>${icon}</span>
                        <strong style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${comp.name}</strong>
                        <span class="badge ${partDead ? 'red' : (cond < 100 ? 'amber' : 'green')} mono" style="font-size:9px;">
                          ${partDead ? 'DEAD' : `${cond}%`}
                        </span>
                      </div>
                      <div class="subtext" style="font-size:11px; margin-top:2px;">
                        ${comp.tons}t • ${comp.slots}s ${comp.dmg ? `• ${comp.dmg} Dmg` : ''} • Sell: ${sellPrice.toLocaleString()} Cr
                      </div>
                    </div>
                    <div style="display:flex; gap:4px; flex-shrink:0;">
                      <button class="btn" style="padding:3px 8px; font-size:11px;" onclick="GarageModule.removeComponent('${activeLoc}', ${idx})">
                        Unequip (+1 Wk)
                      </button>
                      <button class="btn btn-danger" style="padding:3px 6px; font-size:11px;" onclick="GarageModule.sellInstalledComponent('${activeLoc}', ${idx})">
                        Sell
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Hangar Storage (Owned Spare Parts) -->
          <div class="card" style="border: 1px solid rgba(56, 189, 248, 0.35);">
            <div class="section-header">
              <div>
                <div class="section-title" style="display:flex; align-items:center; gap:6px;">
                  <span>📦 Hangar Storage (${(st.partStorage || []).length} Spare)</span>
                  <span class="badge green mono" style="font-size:10px;">Drag to Equip</span>
                </div>
                <div class="subtext" style="font-size:11px;">
                  Drag any part onto the Mech picture to mount, or click to equip in active slot
                </div>
              </div>
            </div>

            ${(st.partStorage || []).length === 0 ? `
              <div class="panel subtext" style="text-align:center; padding:10px; font-size:12px;">
                Storage is empty. Purchase weapons in the Catalog below, or strip parts from Mechs!
              </div>
            ` : `
              <div style="display:flex; flex-direction:column; gap:6px; max-height:220px; overflow-y:auto; padding-right:4px;">
                ${st.partStorage.map(item => {
                  const comp = window.GameState.getComponent(item.compId);
                  if (!comp) return '';
                  const cond = item.condition ?? 100;
                  const sellVal = window.GameState.getPartResaleValue(item.compId, cond);
                  const icon = this.getComponentIcon(comp);
                  return `
                    <div
                      class="panel inventory-part-card"
                      draggable="true"
                      ondragstart="GarageModule.onPartDragStart(event, '${item.compId}', '${item.uid}')"
                      ondragend="GarageModule.onPartDragEnd(event)"
                      style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:6px 10px; cursor:grab;"
                    >
                      <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:0;">
                        <span style="font-size:16px;">${icon}</span>
                        <div style="overflow:hidden;">
                          <div style="display:flex; align-items:center; gap:6px;">
                            <strong style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${comp.name}</strong>
                            <span class="badge ${cond < 100 ? 'amber' : 'green'} mono" style="font-size:9px;">${cond}%</span>
                          </div>
                          <div class="subtext" style="font-size:11px;">
                            ${comp.tons}t • ${comp.slots}s ${comp.dmg ? `• ${comp.dmg} Dmg` : ''} • Sell: ${sellVal.toLocaleString()} Cr
                          </div>
                        </div>
                      </div>

                      <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
                        <span class="badge cyan mono" style="font-size:9px; padding:2px 5px;" title="Drag onto any hardpoint on the Mech picture">
                          ⠿ DRAG
                        </span>
                        <button
                          class="btn btn-primary"
                          style="padding:3px 7px; font-size:11px;"
                          onclick="GarageModule.mountComponent('${activeLoc}', '${item.compId}')"
                          title="Equip to selected ${activeLoc}"
                        >
                          + Equip
                        </button>
                        <button
                          class="btn btn-danger"
                          style="padding:3px 6px; font-size:11px;"
                          onclick="GarageModule.sellStoredPartByUid('${item.uid}')"
                          title="Sell for ${sellVal.toLocaleString()} Cr"
                        >
                          Sell
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

          <!-- Mech Parts Shop Catalog -->
          <div class="card">
            <div style="display:flex; flex-wrap:wrap; gap:6px; align-items:center; justify-content:space-between; margin-bottom:8px;">
              <div>
                <span class="subtext" style="font-weight:700; text-transform:uppercase; color:#93c5fd;">Mech Parts Catalog</span>
                <div class="subtext" style="font-size:11px;">Buy parts to equip or hold in storage</div>
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:4px;">
                ${categories.map(cat => `
                  <button class="btn ${this.filterCat === cat ? 'btn-primary' : ''}" style="padding:3px 7px; font-size:11px;" onclick="GarageModule.setFilter('${cat}')">
                    ${cat === 'All' ? 'All' : cat.split(' ')[0]}
                  </button>
                `).join('')}
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:8px; max-height:360px; overflow-y:auto; padding-right:4px;">
              ${(() => {
                const qm = window.GameState.getAssignedJobJock('quartermaster');
                const qmMod = qm ? (window.TOS_DATA?.companyJobs?.find(j => j.id === 'quartermaster')?.calcModifier(qm)) : null;
                const qmDiscountPct = qmMod ? qmMod.discountPct : 0;

                return filteredCatalog.map(comp => {
                  const ownedItems = window.GameState.getOwnedPartsByCompId(comp.id);
                  const owned = ownedItems.length;
                  const nextToSell = owned > 0 ? ownedItems[ownedItems.length - 1] : null;
                  const nextSellCond = nextToSell ? (nextToSell.condition ?? 100) : 100;
                  const sellValue = window.GameState.getPartResaleValue(comp.id, nextSellCond);
                  const baseHalfValue = window.GameState.getPartResaleValue(comp.id, 100);

                  const effectiveCost = Math.round(comp.cost * (1 - (qmDiscountPct / 100)));
                  const fitsSlots = (usedSlots + comp.slots) <= maxSlots;
                  const fitsTons = (metrics.totalTons - metrics.armorTons + comp.tons) <= metrics.maxTons;
                  const canAfford = st.credits >= effectiveCost;
                  const canEquip = owned > 0 && fitsSlots && fitsTons;
                  const icon = this.getComponentIcon(comp);

                  return `
                    <div
                      class="panel inventory-part-card ${owned > 0 ? 'draggable' : ''}"
                      ${owned > 0 ? `
                        draggable="true"
                        ondragstart="GarageModule.onPartDragStart(event, '${comp.id}')"
                        ondragend="GarageModule.onPartDragEnd(event)"
                      ` : ''}
                      style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:8px; border-color:${owned > 0 ? 'var(--accent-green)' : 'var(--border)'};"
                    >
                      <div style="flex:1; min-width:180px;">
                        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                          <span>${icon}</span>
                          <strong>${comp.name}</strong>
                          <span class="badge" style="font-size:10px;">${comp.tons}t / ${comp.slots}s</span>
                          <span class="badge ${owned > 0 ? 'green' : 'amber'} mono" style="font-size:10px;">Owned: ${owned}</span>
                        </div>
                        <div class="subtext" style="margin-top:2px; font-size:11px;">
                          ${comp.dmg > 0 ? `Dmg: ${comp.dmg} • Heat: +${comp.heat}C • Recycle: ${comp.sec}s • Range: ${comp.range} Hex` : `Heat: ${comp.heat}C • Support System`}
                        </div>
                        <div class="mono" style="font-size:11px; margin-top:3px;">
                          <span style="color:var(--accent-amber); font-weight:700;">Buy: ${effectiveCost.toLocaleString()} Cr</span>
                          ${qmDiscountPct > 0 ? `<span class="badge green" style="font-size:9px; padding:1px 4px; margin-left:3px;">-${qmDiscountPct}% QM</span>` : ''}
                          <span class="subtext" style="margin-left:6px;">• Sell: ${sellValue.toLocaleString()} Cr</span>
                        </div>
                      </div>

                      <div style="display:flex; flex-direction:column; gap:4px; min-width:130px;">
                        <div style="display:flex; gap:4px;">
                          <button
                            class="btn"
                            style="flex:1; padding:4px 6px; font-size:11px; border-color:var(--accent-amber); color:#fde68a;"
                            ${!canAfford ? 'disabled' : ''}
                            onclick="GarageModule.buyPart('${comp.id}')"
                          >
                            Buy (${(effectiveCost / 1000).toFixed(1)}k)
                          </button>
                          ${owned > 0 ? `
                            <button
                              class="btn btn-danger"
                              style="padding:4px 6px; font-size:10px;"
                              title="Sell 1 stored ${comp.name} (${nextSellCond}% Cond) for ${sellValue.toLocaleString()} Cr"
                              onclick="GarageModule.sellPart('${comp.id}')"
                            >
                              Sell
                            </button>
                          ` : ''}
                        </div>

                        ${owned > 0 ? `
                          <div style="display:flex; gap:3px;">
                            <span class="badge cyan mono" style="font-size:9px; padding:2px 4px; display:inline-flex; align-items:center;" title="Drag this component onto any hardpoint on the Mech picture">
                              ⠿ DRAG
                            </span>
                            <button
                              class="btn ${canEquip ? 'btn-primary' : ''}"
                              style="flex:1; padding:3px 6px; font-size:10px;"
                              ${!canEquip ? 'disabled' : ''}
                              onclick="GarageModule.mountComponent('${activeLoc}', '${comp.id}')"
                            >
                              ${!fitsSlots ? 'No Room' : (!fitsTons ? 'Over Tonnage' : `+ Equip (${activeLoc})`)}
                            </button>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `;
                }).join('');
              })()}
            </div>
          </div>

        </div>
      </div>
    `;
  },

  LOCATION_INFO: {
    HD: { name: 'Cockpit / Head', label: 'HD' },
    LA: { name: 'Left Arm', label: 'LA' },
    LT: { name: 'Left Torso', label: 'LT' },
    CT: { name: 'Center Torso (Core)', label: 'CT' },
    RT: { name: 'Right Torso', label: 'RT' },
    RA: { name: 'Right Arm', label: 'RA' },
    LL: { name: 'Left Leg', label: 'LL' },
    RL: { name: 'Right Leg', label: 'RL' }
  },

  getComponentIcon(comp) {
    if (!comp) return '⚙️';
    const cat = comp.cat || '';
    if (cat.includes('Energy')) return '⚡';
    if (cat.includes('Ballistic') || cat.includes('Cannon')) return '💥';
    if (cat.includes('Missile')) return '🚀';
    if (cat.includes('Close Combat') || cat.includes('Melee')) return '⚔️';
    return '🛡️';
  },

  // Large Detailed Interactive Mech Factory Schematic Bay
  renderInteractiveMechSchematic(mech, tpl, metrics, resaleInfo, activeLoc) {
    const destroyedLocs = ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'].filter(loc => (mech.armor?.[loc] ?? 0) <= 0);
    const destroyedCount = destroyedLocs.length;

    return `
      <div class="card mech-schematic-card" style="padding:0;">
        <!-- Header Bar -->
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid rgba(56, 189, 248, 0.25); background:rgba(15, 23, 42, 0.85);">
          <div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span class="badge primary mono" style="font-size:11px;">BAY-01 ACTIVE</span>
              <strong style="font-size:16px; color:#ffffff;">${mech.customName}</strong>
              <span class="badge cyan mono" style="font-size:11px;">${tpl.model} (${tpl.maxTons}t ${tpl.weightClass})</span>
              <span class="badge ${resaleInfo.conditionPct < 100 ? (resaleInfo.conditionPct < 50 ? 'red' : 'amber') : 'green'} mono" style="font-size:11px;">
                ${resaleInfo.conditionPct}% Integrity
              </span>
            </div>
            <div class="subtext" style="font-size:11px; margin-top:2px;">
              🛡️ Armor: <strong>${metrics.armorTons}t</strong> (Rating ${metrics.armorRating} • -${metrics.damageReductionPct}% DR) • Alpha Heat: <strong>${metrics.alphaHeat} C</strong> • Cooling: <strong>${metrics.coolingCap} C</strong>
            </div>
          </div>

          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn ${destroyedCount > 0 || resaleInfo.conditionPct < 100 ? 'btn-primary' : ''}" style="font-size:12px; padding:6px 10px;" onclick="GarageModule.repairCurrentMech()">
              ${destroyedCount > 0 ? `⚠️ Repair Chassis & Parts (+2 Wks)` : `Repair Structure (+2 Wks)`}
            </button>
            <button class="btn" style="font-size:12px; padding:6px 10px;" onclick="GarageModule.fillMaxArmor()">
              Fill Max Armor (+1 Wk)
            </button>
          </div>
        </div>

        <!-- The Interactive Blueprint Schematic Stage -->
        <div class="mech-schematic-stage">
          
          <div class="schematic-anatomy-grid">
            
            <!-- Left Flank Column: Left Arm (LA), Left Torso (LT), Left Leg (LL) -->
            <div class="schematic-column">
              ${this.renderSchematicHardpointNode(mech, tpl, 'LA', activeLoc)}
              ${this.renderSchematicHardpointNode(mech, tpl, 'LT', activeLoc)}
              ${this.renderSchematicHardpointNode(mech, tpl, 'LL', activeLoc)}
            </div>

            <!-- Center Column: Head (HD) at top, Central Mech Sprite & Shadow, Center Torso (CT) at bottom -->
            <div class="schematic-column" style="justify-content:space-between; align-items:stretch;">
              ${this.renderSchematicHardpointNode(mech, tpl, 'HD', activeLoc)}

              <div class="mech-schematic-center-view">
                <div class="mech-schematic-shadow"></div>
                <img
                  src="${tpl.sprite || 'assets/mechs/mech_guillotine.png'}"
                  alt="${tpl.model}"
                  class="mech-schematic-sprite"
                  style="${destroyedCount > 0 ? 'filter:drop-shadow(0 14px 28px rgba(0,0,0,0.95)) drop-shadow(0 0 16px rgba(239,68,68,0.6)) grayscale(25%);' : ''}"
                />
                ${destroyedCount > 0 ? `
                  <div style="position:absolute; bottom:20px; background:rgba(127,29,29,0.95); border:1px solid #ef4444; border-radius:4px; padding:4px 10px; font-size:11px; font-weight:800; color:#fff; display:flex; align-items:center; gap:6px; box-shadow:0 0 14px rgba(239,68,68,0.8);">
                    <span>⚠️ ${destroyedCount} SECTION${destroyedCount > 1 ? 'S' : ''} BREACHED / DESTROYED</span>
                  </div>
                ` : ''}
              </div>

              ${this.renderSchematicHardpointNode(mech, tpl, 'CT', activeLoc)}
            </div>

            <!-- Right Flank Column: Right Arm (RA), Right Torso (RT), Right Leg (RL) -->
            <div class="schematic-column">
              ${this.renderSchematicHardpointNode(mech, tpl, 'RA', activeLoc)}
              ${this.renderSchematicHardpointNode(mech, tpl, 'RT', activeLoc)}
              ${this.renderSchematicHardpointNode(mech, tpl, 'RL', activeLoc)}
            </div>

          </div>

          <!-- Bottom Telemetry & Drag-and-Drop Instruction Strip -->
          <div style="margin-top:12px; padding:6px 12px; background:rgba(15, 23, 42, 0.75); border:1px solid rgba(56, 189, 248, 0.2); border-radius:4px; display:flex; justify-content:space-between; align-items:center; font-size:11px; flex-wrap:wrap; gap:8px;">
            <span class="subtext">
              💡 <strong>Interactive Hardpoints:</strong> Drag any owned part from <strong>Hangar Storage</strong> or the <strong>Catalog</strong> on the right to mount it on compatible locations. Click any section to inspect.
            </span>
            <span class="mono" style="color:#38bdf8; font-weight:700;">
              Chassis Weight: ${metrics.totalTons} / ${metrics.maxTons}.0 t
            </span>
          </div>

        </div>
      </div>
    `;
  },

  // Renders a single interactive hardpoint box on the schematic diagram
  renderSchematicHardpointNode(mech, tpl, locCode, activeLoc) {
    const isSel = (locCode === activeLoc);
    const locInfo = this.LOCATION_INFO[locCode] || { name: locCode, label: locCode };
    const curArmor = Math.max(0, mech.armor?.[locCode] ?? 0);
    const maxArmor = Math.max(1, mech.maxArmorCurrent?.[locCode] ?? tpl.maxArmor[locCode] ?? 10);
    const armorPct = Math.round((curArmor / maxArmor) * 100);
    const isDestroyed = (curArmor <= 0);
    const isCritical = (!isDestroyed && armorPct <= 34);
    const isDamaged = (!isDestroyed && armorPct < 100);

    let statusClass = 'status-intact';
    let statusBadge = '<span class="badge green mono" style="font-size:9px; padding:1px 4px;">INTACT</span>';
    let barColor = 'green';

    if (isDestroyed) {
      statusClass = 'status-destroyed';
      statusBadge = '<span class="badge red mono" style="font-size:9px; font-weight:900; padding:1px 4px;">⚠️ DESTROYED</span>';
      barColor = 'red';
    } else if (isCritical) {
      statusClass = 'status-critical';
      statusBadge = `<span class="badge red mono" style="font-size:9px; padding:1px 4px;">CRIT (${armorPct}%)</span>`;
      barColor = 'red';
    } else if (isDamaged) {
      statusClass = 'status-damaged';
      statusBadge = `<span class="badge amber mono" style="font-size:9px; padding:1px 4px;">${armorPct}%</span>`;
      barColor = armorPct < 70 ? 'amber' : 'lime';
    }

    const compIds = mech.locations[locCode] || [];
    const usedSlots = compIds.reduce((a, cid) => a + (window.GameState.getComponent(cid)?.slots || 0), 0);
    const maxSlots = tpl.slotLimits[locCode] || 4;

    return `
      <div
        id="schematic-node-${locCode}"
        class="schematic-hardpoint-node ${statusClass} ${isSel ? 'selected' : ''}"
        data-loc="${locCode}"
        onclick="GarageModule.selectPart('${locCode}')"
        ondragover="GarageModule.onSchematicDragOver(event, '${locCode}')"
        ondragleave="GarageModule.onSchematicDragLeave(event, '${locCode}')"
        ondrop="GarageModule.onSchematicDrop(event, '${locCode}')"
        title="Click to inspect ${locInfo.name} in workshop, or drag an item here to mount"
      >
        <div class="hardpoint-header">
          <div class="hardpoint-title">
            <span class="hardpoint-code">${locCode}</span>
            <span class="hardpoint-name" style="font-size:12px;">${locInfo.name}</span>
          </div>
          ${statusBadge}
        </div>

        <!-- Structural Health Bar -->
        <div class="hardpoint-hp-bar">
          <div style="display:flex; justify-content:space-between; font-size:10px; font-family:var(--font-mono, monospace);">
            <span style="color:#94a3b8;">${isDestroyed ? '<strong style="color:#ef4444;">OFFLINE</strong>' : 'Structure:'}</span>
            <span style="color:${isDestroyed ? '#ef4444' : (armorPct < 100 ? '#f59e0b' : '#10b981')}; font-weight:700;">
              ${curArmor}/${maxArmor} HP
            </span>
          </div>
          <div class="hardpoint-hp-track">
            <div class="hardpoint-hp-fill ${barColor}" style="width:${armorPct}%;"></div>
          </div>
        </div>

        <!-- Critical Slots Meter -->
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; font-family:var(--font-mono, monospace);">
          <span style="color:#64748b;">Slots:</span>
          <span style="color:${usedSlots >= maxSlots ? '#f59e0b' : '#38bdf8'}; font-weight:700;">
            ${usedSlots} / ${maxSlots} Used
          </span>
        </div>

        <!-- Weapons & Equipment Mounted in this Location -->
        <div class="hardpoint-weapons-list">
          ${compIds.length === 0 ? `
            <div class="hardpoint-empty-slot">
              ${isDestroyed ? '⛔ Hardpoint Destroyed' : '+ Drop Part to Mount'}
            </div>
          ` : compIds.map((cid, idx) => {
            const comp = window.GameState.getComponent(cid);
            if (!comp) return '';
            const cond = window.GameState.getInstalledPartCondition(mech, locCode, idx);
            const partDead = isDestroyed || cond <= 0;
            const icon = this.getComponentIcon(comp);
            return `
              <div class="schematic-weapon-chip ${partDead ? 'is-destroyed' : ''}" title="${comp.name} (${comp.tons}t, ${comp.slots}s) • ${partDead ? 'DESTROYED' : `${cond}% Condition`}">
                <div style="display:flex; align-items:center; gap:5px; overflow:hidden;">
                  <span>${icon}</span>
                  <span class="mono" style="font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:90px;">
                    ${comp.name}
                  </span>
                </div>
                <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
                  <span class="badge ${partDead ? 'red' : (cond < 100 ? 'amber' : 'green')} mono" style="font-size:9px; padding:1px 4px;">
                    ${partDead ? 'DEAD' : `${cond}%`}
                  </span>
                  <button
                    class="chip-unequip-btn"
                    title="Unequip ${comp.name}"
                    onclick="event.stopPropagation(); GarageModule.removeComponent('${locCode}', ${idx})"
                  >
                    &times;
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  renderPartBox(mech, tpl, code, activeLoc) {
    return this.renderSchematicHardpointNode(mech, tpl, code, activeLoc);
  },

  // Drag and Drop Event Handlers
  onPartDragStart(event, compId, uid = '') {
    const comp = window.GameState.getComponent(compId);
    if (!comp) return;

    this.draggedPart = { compId, uid, comp };

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copyMove';
      event.dataTransfer.setData('text/plain', JSON.stringify({ compId, uid }));
    }

    const garageEl = document.getElementById('view-garage');
    if (garageEl) garageEl.classList.add('is-dragging-part');

    if (event.currentTarget) {
      event.currentTarget.classList.add('is-being-dragged');
    }

    // Highlight eligible drop zones on the schematic
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === st.selectedMechId);
    if (mech) {
      const metrics = window.GameState.computeMechMetrics(mech);
      const locs = ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
      locs.forEach(loc => {
        const node = document.getElementById(`schematic-node-${loc}`);
        if (!node) return;
        const curArmor = Math.max(0, mech.armor?.[loc] ?? 0);
        if (curArmor <= 0) return; // destroyed location
        const usedSlots = (mech.locations[loc] || []).reduce((a, cid) => a + (window.GameState.getComponent(cid)?.slots || 0), 0);
        const maxSlots = metrics.tpl.slotLimits[loc] || 4;
        const nonArmorTons = +(metrics.totalTons - metrics.armorTons).toFixed(1);
        const fitsSlots = (usedSlots + comp.slots) <= maxSlots;
        const fitsTons = (nonArmorTons + comp.tons) <= metrics.maxTons;
        if (fitsSlots && fitsTons) {
          node.classList.add('drop-target-eligible');
        }
      });
    }

    // Create the attachable preview element matching the schematic aesthetic
    const existing = document.getElementById('mech-drag-ghost');
    if (existing) existing.remove();

    const ghost = document.createElement('div');
    ghost.id = 'mech-drag-ghost';
    ghost.className = 'mech-attachable-part-preview';
    const icon = this.getComponentIcon(comp);
    ghost.innerHTML = `
      <div class="attachable-coupling">
        <span>⬡ HARDPOINT MODULE</span>
        <span>[COUPLING READY]</span>
      </div>
      <div class="attachable-body">
        <span class="attachable-icon">${icon}</span>
        <div style="flex:1; min-width:0;">
          <div class="attachable-name">${comp.name}</div>
          <div class="attachable-meta">${comp.tons}t • ${comp.slots} Slot${comp.slots > 1 ? 's' : ''} ${comp.dmg ? `• ${comp.dmg} Dmg` : ''}</div>
        </div>
      </div>
      <div class="attachable-footer">
        ⚡ ATTACHABLE MODULE ➔ DROP TO MOUNT
      </div>
    `;
    document.body.appendChild(ghost);

    if (event.dataTransfer && typeof event.dataTransfer.setDragImage === 'function') {
      event.dataTransfer.setDragImage(ghost, 115, 30);
    }
  },

  onPartDragEnd(event) {
    this.draggedPart = null;
    const garageEl = document.getElementById('view-garage');
    if (garageEl) garageEl.classList.remove('is-dragging-part');

    if (event.currentTarget) {
      event.currentTarget.classList.remove('is-being-dragged');
    }

    const ghost = document.getElementById('mech-drag-ghost');
    if (ghost) ghost.remove();

    // Remove all drop highlight classes from nodes
    document.querySelectorAll('.schematic-hardpoint-node').forEach(node => {
      node.classList.remove('drop-target-eligible', 'drop-hover-valid', 'drop-hover-invalid', 'drop-hover-destroyed');
    });
  },

  onSchematicDragOver(event, locCode) {
    event.preventDefault();
    if (!this.draggedPart) return;

    const node = event.currentTarget;
    const comp = this.draggedPart.comp;
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === st.selectedMechId);
    if (!mech || !comp) return;

    const curArmor = Math.max(0, mech.armor?.[locCode] ?? 0);
    if (curArmor <= 0) {
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'none';
      node.classList.add('drop-hover-destroyed');
      node.classList.remove('drop-hover-valid', 'drop-hover-invalid');
      return;
    }

    const metrics = window.GameState.computeMechMetrics(mech);
    const usedSlots = (mech.locations[locCode] || []).reduce((a, cid) => a + (window.GameState.getComponent(cid)?.slots || 0), 0);
    const maxSlots = metrics.tpl.slotLimits[locCode] || 4;
    const nonArmorTons = +(metrics.totalTons - metrics.armorTons).toFixed(1);

    const fitsSlots = (usedSlots + comp.slots) <= maxSlots;
    const fitsTons = (nonArmorTons + comp.tons) <= metrics.maxTons;

    if (fitsSlots && fitsTons) {
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      node.classList.add('drop-hover-valid');
      node.classList.remove('drop-hover-invalid', 'drop-hover-destroyed');
    } else {
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'none';
      node.classList.add('drop-hover-invalid');
      node.classList.remove('drop-hover-valid', 'drop-hover-destroyed');
    }
  },

  onSchematicDragLeave(event, locCode) {
    const node = event.currentTarget;
    node.classList.remove('drop-hover-valid', 'drop-hover-invalid', 'drop-hover-destroyed');
  },

  onSchematicDrop(event, locCode) {
    event.preventDefault();
    event.stopPropagation();

    let compId = this.draggedPart?.compId;
    if (!compId) {
      try {
        const raw = event.dataTransfer?.getData('text/plain');
        if (raw) {
          const parsed = JSON.parse(raw);
          compId = parsed.compId;
        }
      } catch (e) {
        // ignore
      }
    }

    this.onPartDragEnd(event);

    if (!compId) return;

    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === st.selectedMechId);
    if (!mech) return;

    // Check if location is destroyed
    const curArmor = Math.max(0, mech.armor?.[locCode] ?? 0);
    if (curArmor <= 0) {
      alert(`Cannot equip component on ${locCode}: Location structural integrity is breached/destroyed! Repair the chassis first.`);
      return;
    }

    // Mount the component
    this.mountComponent(locCode, compId);

    // Audio feedback
    if (window.SoundFX && typeof window.SoundFX.playEquipPart === 'function') {
      window.SoundFX.playEquipPart();
    }

    // Success flash on target node
    setTimeout(() => {
      const node = document.getElementById(`schematic-node-${locCode}`);
      if (node) {
        node.classList.add('hardpoint-locked-flash');
        setTimeout(() => node.classList.remove('hardpoint-locked-flash'), 600);
      }
    }, 50);
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

  adjustArmorTons(delta) {
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === st.selectedMechId);
    if (!mech) return;
    const metrics = window.GameState.computeMechMetrics(mech);
    const tpl = metrics.tpl;
    const compTons = +(metrics.totalTons - metrics.armorTons - tpl.baseChassisTons).toFixed(1);
    const maxAllowed = Math.max(0, +(tpl.maxTons - tpl.baseChassisTons - compTons).toFixed(1));
    const cur = typeof mech.armorTons === 'number' ? mech.armorTons : metrics.armorTons;
    const nextVal = Math.max(0, Math.min(maxAllowed, +(cur + delta).toFixed(1)));
    mech.armorTons = nextVal;
    window.GameState.save();
    this.render();
  },

  fillMaxArmor() {
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === st.selectedMechId);
    if (!mech) return;
    const metrics = window.GameState.computeMechMetrics(mech);
    const tpl = metrics.tpl;
    const compTons = +(metrics.totalTons - metrics.armorTons - tpl.baseChassisTons).toFixed(1);
    const maxAllowed = Math.max(0, +(tpl.maxTons - tpl.baseChassisTons - compTons).toFixed(1));
    mech.armorTons = maxAllowed;
    window.GameState.advanceTimeWeeks(1, `Equipped Maximum Armor Plating on ${mech.customName} (${maxAllowed}t)`);
    window.GameState.save();
    this.render();
  },

  stripArmor() {
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === st.selectedMechId);
    if (!mech) return;
    mech.armorTons = 0;
    window.GameState.advanceTimeWeeks(1, `Stripped Armor Plating from ${mech.customName}`);
    window.GameState.save();
    this.render();
  },

  maxAllArmor() {
    this.fillMaxArmor();
  },

  repairCurrentMech() {
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === st.selectedMechId);
    if (!mech) return;
    window.GameState.ensureMechPartConditions(mech);

    let missingUnits = 0;
    Object.keys(mech.armor).forEach(k => {
      missingUnits += Math.max(0, mech.maxArmorCurrent[k] - mech.armor[k]);
      mech.armor[k] = mech.maxArmorCurrent[k];
    });
    Object.keys(mech.partConditions || {}).forEach(loc => {
      mech.partConditions[loc] = (mech.partConditions[loc] || []).map(cond => {
        missingUnits += Math.max(0, Math.round((100 - cond) * 0.5));
        return 100;
      });
    });

    if (missingUnits <= 0) return;
    const discount = window.GameState.getRepairDiscount();
    const leadMech = window.GameState.getLeadMechanic();
    const cost = Math.round(missingUnits * 40 * (1 - discount));
    if (st.credits < cost) {
      alert(`Insufficient funds to repair this Mech & its damaged parts (${cost.toLocaleString()} Cr required)!`);
      return;
    }

    st.credits -= cost;
    const mechDesc = leadMech ? ` (Lead Mechanic: ${leadMech.callsign}, ${(discount * 100).toFixed(0)}% Guild Discount)` : '';
    window.GameState.advanceTimeWeeks(2, `Repaired ${mech.customName} & Components${mechDesc}`);
    this.render();
  },

  buyPart(compId) {
    const st = window.GameState.data;
    const comp = window.GameState.getComponent(compId);
    if (!comp) return;

    // Apply Quartermaster component catalog discount if appointed
    const qm = window.GameState.getAssignedJobJock('quartermaster');
    const qmMod = qm ? (window.TOS_DATA?.companyJobs?.find(j => j.id === 'quartermaster')?.calcModifier(qm)) : null;
    const qmDiscountPct = qmMod ? qmMod.discountPct : 0;
    const effectiveCost = Math.round(comp.cost * (1 - (qmDiscountPct / 100)));

    if (st.credits < effectiveCost) {
      alert(`Insufficient treasury funds to purchase ${comp.name} (${effectiveCost.toLocaleString()} Cr required)!`);
      return;
    }

    st.credits -= effectiveCost;
    if (!Array.isArray(st.partStorage)) st.partStorage = [];
    st.partStorage.push({
      uid: 'part-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      compId,
      condition: 100
    });
    window.GameState.save();
    App.updateHUD();
    this.render();
  },

  sellStoredPartByUid(uid) {
    const st = window.GameState.data;
    const item = (st.partStorage || []).find(p => p.uid === uid);
    if (!item) return;
    const sellVal = window.GameState.getPartResaleValue(item.compId, item.condition ?? 100);
    st.partStorage = (st.partStorage || []).filter(p => p.uid !== uid);
    st.credits += sellVal;
    window.GameState.save();
    App.updateHUD();
    this.render();
  },

  sellPart(compId) {
    const st = window.GameState.data;
    const comp = window.GameState.getComponent(compId);
    const ownedItems = window.GameState.getOwnedPartsByCompId(compId);
    if (!comp || ownedItems.length === 0) return;

    // Sell the lowest-condition copy in storage first
    const targetItem = ownedItems[ownedItems.length - 1];
    const cond = targetItem.condition ?? 100;
    const sellVal = window.GameState.getPartResaleValue(compId, cond);

    st.partStorage = (st.partStorage || []).filter(p => p.uid !== targetItem.uid);
    st.credits += sellVal;
    window.GameState.save();
    App.updateHUD();
    this.render();
  },

  mountComponent(locCode, compId) {
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === st.selectedMechId);
    const comp = window.GameState.getComponent(compId);
    const ownedItems = window.GameState.getOwnedPartsByCompId(compId);
    if (!mech || !comp || ownedItems.length === 0) return;

    // Check if location is destroyed
    const curArmor = Math.max(0, mech.armor?.[locCode] ?? 0);
    if (curArmor <= 0) {
      alert(`Cannot equip ${comp.name} on ${locCode}: Location structure is destroyed! Repair the chassis first.`);
      return;
    }

    const metrics = window.GameState.computeMechMetrics(mech);
    const usedSlots = (mech.locations[locCode] || []).reduce((a, cid) => a + (window.GameState.getComponent(cid)?.slots || 0), 0);
    if (usedSlots + comp.slots > metrics.tpl.slotLimits[locCode]) {
      alert(`Cannot equip ${comp.name}: Requires ${comp.slots} critical slot(s), but ${locCode} only has ${metrics.tpl.slotLimits[locCode] - usedSlots} slot(s) remaining!`);
      return;
    }

    // Check if equipment fits chassis mass limit
    const nonArmorTons = +(metrics.totalTons - metrics.armorTons).toFixed(1);
    if (nonArmorTons + comp.tons > metrics.maxTons) {
      alert(`Cannot equip ${comp.name} (${comp.tons}t): Exceeds chassis weight capacity (${metrics.maxTons}t) even without armor!`);
      return;
    }

    // If equipping this part exceeds max tonnage with current armor, auto-trim armor to fit open weight
    if (metrics.totalTons + comp.tons > metrics.maxTons) {
      const excess = +(metrics.totalTons + comp.tons - metrics.maxTons).toFixed(1);
      mech.armorTons = Math.max(0, +(metrics.armorTons - excess).toFixed(1));
    }

    // Mount the highest-condition owned copy first
    const bestPart = ownedItems[0];
    st.partStorage = (st.partStorage || []).filter(p => p.uid !== bestPart.uid);

    window.GameState.ensureMechPartConditions(mech);
    mech.locations[locCode].push(compId);
    mech.partConditions[locCode].push(bestPart.condition ?? 100);
    window.GameState.advanceTimeWeeks(1, `Equipped ${comp.name} in ${locCode}`);

    if (window.SoundFX && typeof window.SoundFX.playEquipPart === 'function') {
      window.SoundFX.playEquipPart();
    }

    window.GameState.save();
    if (window.App && typeof window.App.updateHUD === 'function') window.App.updateHUD();
    this.render();
  },

  removeComponent(locCode, idx) {
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === st.selectedMechId);
    if (!mech || !mech.locations[locCode]) return;
    window.GameState.ensureMechPartConditions(mech);

    const removedCompId = mech.locations[locCode].splice(idx, 1)[0];
    const removedCond = mech.partConditions[locCode].splice(idx, 1)[0] ?? 100;
    if (removedCompId) {
      if (!Array.isArray(st.partStorage)) st.partStorage = [];
      st.partStorage.push({
        uid: 'part-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        compId: removedCompId,
        condition: removedCond
      });
    }
    const compObj = window.GameState.getComponent(removedCompId);
    window.GameState.advanceTimeWeeks(1, `Stripped ${compObj ? compObj.name : 'Component'} from ${locCode}`);
    this.render();
  },

  sellInstalledComponent(locCode, idx) {
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === st.selectedMechId);
    if (!mech || !mech.locations[locCode]) return;
    window.GameState.ensureMechPartConditions(mech);

    const removedCompId = mech.locations[locCode].splice(idx, 1)[0];
    const removedCond = mech.partConditions[locCode].splice(idx, 1)[0] ?? 100;
    if (removedCompId) {
      const sellVal = window.GameState.getPartResaleValue(removedCompId, removedCond);
      st.credits += sellVal;
    }
    window.GameState.save();
    App.updateHUD();
    this.render();
  },

  sellChassis(mechId, includeEquippedParts = false) {
    const st = window.GameState.data;
    const mech = st.mechs.find(m => m.id === mechId);
    if (!mech) return;

    window.GameState.ensureMechPartConditions(mech);
    const resaleInfo = window.GameState.getChassisResaleInfo(mech);

    if (includeEquippedParts) {
      st.credits += resaleInfo.totalResale;
    } else {
      // Strip all installed parts into Hangar Storage with their condition preserved, then sell the Chassis
      if (!Array.isArray(st.partStorage)) st.partStorage = [];
      Object.entries(mech.locations || {}).forEach(([loc, compIds]) => {
        compIds.forEach((cid, idx) => {
          const cond = window.GameState.getInstalledPartCondition(mech, loc, idx);
          st.partStorage.push({
            uid: 'part-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
            compId: cid,
            condition: cond
          });
        });
      });
      st.credits += resaleInfo.chassisResale;
    }

    // Unassign any Jockey assigned to this Mech
    (st.jocks || []).forEach(j => {
      if (j.assignedMechId === mechId) j.assignedMechId = '';
    });

    st.mechs = st.mechs.filter(m => m.id !== mechId);
    st.selectedMechId = st.mechs[0]?.id || '';

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

    const locations = mode === 'stripped'
      ? { HD: [], CT: [], LT: [], RT: [], LA: [], RA: [], LL: [], RL: [] }
      : { HD: [], CT: ['hs', 'hs'], LT: [], RT: [], LA: ['mlas'], RA: ['mlas'], LL: [], RL: [] };

    const rawOpen = +(tpl.maxTons - tpl.baseChassisTons - (mode === 'standard' ? 8 : 0)).toFixed(1);
    const initialArmorTons = mode === 'stripped'
      ? Math.max(0, +(rawOpen * 0.4).toFixed(1))
      : Math.max(0, +(rawOpen * 0.75).toFixed(1));

    const newMech = {
      id: newId,
      customName: tpl.model,
      templateId: tpl.id,
      armor: { ...armorCopy },
      maxArmorCurrent: { ...armorCopy },
      armorTons: initialArmorTons,
      locations
    };
    window.GameState.ensureMechPartConditions(newMech);

    st.mechs.push(newMech);
    st.selectedMechId = newId;

    // Auto-assign to the first unassigned Jock if one exists
    const unassignedJock = st.jocks.find(j => !j.assignedMechId);
    if (unassignedJock) {
      unassignedJock.assignedMechId = newId;
    }

    const buildWeeks = window.GameState.getChassisBuildWeeks(tpl, mode);
    window.GameState.advanceTimeWeeks(buildWeeks, `Built ${tpl.model} (${tpl.weightClass})`);
    this.render();
  }
};
