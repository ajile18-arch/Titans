// Top-Level Controller & Company Charter Registration for MechJocks

window.App = {
  currentTab: 'hq',
  companyDraft: {
    isNewGame: true,
    name: 'Iron Wolf Mercenaries',
    commander: 'Vance',
    emblemId: 'emblem-wolf',
    motto: 'Steel Before Surrender',
    goalId: 'wealth',
    customGoals: 'Build a self-sustaining 8-Mech hangar and accumulate 2,000,000 Cr in combat contracts.'
  },

  init() {
    window.GameState.init();
    this.updateHUD();
    this.switchTab('hq');
  },

  openCompanyCreator(isNewGame) {
    const st = window.GameState.data;
    const cur = st.company || {};
    this.companyDraft = {
      isNewGame: !!isNewGame,
      name: (!isNewGame && cur.registered) ? cur.name : 'Iron Wolf Mercenaries',
      commander: (!isNewGame && cur.registered) ? cur.commander : 'Commander',
      emblemId: (!isNewGame && cur.registered) ? cur.emblemId : 'emblem-wolf',
      motto: (!isNewGame && cur.registered) ? cur.motto : 'Steel Before Surrender',
      goalId: (!isNewGame && cur.registered) ? cur.goalId : 'wealth',
      customGoals: (!isNewGame && cur.registered)
        ? cur.customGoals
        : 'Accumulate a 2,000,000 Cr mercenary war chest and build a profitable 8-Mech hangar.'
    };

    const intro = document.getElementById('intro-screen');
    const compScreen = document.getElementById('company-screen');
    if (intro) intro.classList.add('hidden');
    if (compScreen) compScreen.classList.remove('hidden');
    this.renderCompanyCreator();
  },

  closeCompanyCreator() {
    const compScreen = document.getElementById('company-screen');
    if (compScreen) compScreen.classList.add('hidden');
    if (this.companyDraft.isNewGame) {
      this.showIntro();
    } else {
      this.switchTab(this.currentTab);
    }
  },

  syncDraftInputs() {
    const nameEl = document.getElementById('comp-inp-name');
    const cmdrEl = document.getElementById('comp-inp-cmdr');
    const mottoEl = document.getElementById('comp-inp-motto');
    const goalsEl = document.getElementById('comp-inp-goals');
    if (nameEl) this.companyDraft.name = nameEl.value;
    if (cmdrEl) this.companyDraft.commander = cmdrEl.value;
    if (mottoEl) this.companyDraft.motto = mottoEl.value;
    if (goalsEl) this.companyDraft.customGoals = goalsEl.value;
  },

  pickCompanyEmblem(emblemId) {
    this.syncDraftInputs();
    this.companyDraft.emblemId = emblemId;
    this.renderCompanyCreator();
  },

  pickCompanyGoal(goalId) {
    this.syncDraftInputs();
    this.companyDraft.goalId = goalId;
    const goalObj = window.TOS_DATA.companyGoals.find(g => g.id === goalId);
    if (goalObj && goalId !== 'custom') {
      this.companyDraft.customGoals = goalObj.desc;
    }
    this.renderCompanyCreator();
  },

  pickPresetMotto(mottoText) {
    this.syncDraftInputs();
    this.companyDraft.motto = mottoText;
    this.renderCompanyCreator();
  },

  updateLiveCharterPreview() {
    this.syncDraftInputs();
    const prevName = document.getElementById('prev-comp-name');
    const prevCmdr = document.getElementById('prev-comp-cmdr');
    const prevMotto = document.getElementById('prev-comp-motto');
    const prevGoals = document.getElementById('prev-comp-goals');
    if (prevName) prevName.textContent = this.companyDraft.name || 'Unnamed Company';
    if (prevCmdr) prevCmdr.textContent = 'Cmdr. ' + (this.companyDraft.commander || 'Unknown');
    if (prevMotto) prevMotto.textContent = `"${this.companyDraft.motto || 'No Motto'}"`;
    if (prevGoals) prevGoals.textContent = this.companyDraft.customGoals || '';
  },

  confirmCompanyCharter() {
    this.syncDraftInputs();
    if (this.companyDraft.isNewGame) {
      window.GameState.reset();
      window.BattleModule.active = false;
    }

    const st = window.GameState.data;
    st.company = {
      registered: true,
      name: (this.companyDraft.name || 'Iron Wolf Mercenaries').trim(),
      commander: (this.companyDraft.commander || 'Commander').trim(),
      emblemId: this.companyDraft.emblemId,
      motto: (this.companyDraft.motto || 'Steel Before Surrender').trim(),
      goalId: this.companyDraft.goalId,
      customGoals: (this.companyDraft.customGoals || 'Build a premier MechJock mercenary company.').trim()
    };

    window.GameState.save();
    const compScreen = document.getElementById('company-screen');
    if (compScreen) compScreen.classList.add('hidden');
    this.enterGame('hq');
  },

  renderCompanyCreator() {
    const mount = document.getElementById('company-creator-mount');
    if (!mount) return;

    const d = this.companyDraft;
    const goalObj = window.TOS_DATA.companyGoals.find(g => g.id === d.goalId) || window.TOS_DATA.companyGoals[0];
    const mottoPresets = [
      'Steel Before Surrender',
      'No Contract Too Hot',
      'Victory Through Superior Tonnage',
      'First Into the Breach'
    ];

    mount.innerHTML = `
      <div class="card" style="padding:24px; border-color:var(--border-bright); box-shadow:0 20px 50px rgba(0,0,0,0.75);">
        <div class="section-header" style="padding-bottom:14px;">
          <div>
            <span class="badge primary">MERCENARY GUILD REGISTRY // SECTOR 04</span>
            <h2 style="font-size:24px; font-weight:900; margin-top:4px; text-transform:uppercase; letter-spacing:0.03em;">
              ${d.isNewGame ? 'Create Mercenary Company Charter' : 'Update Mercenary Company Charter'}
            </h2>
            <p class="subtext">Register your company's name, emblem, motto, and strategic goals before deploying to Command HQ.</p>
          </div>
          <button class="btn" onclick="App.closeCompanyCreator()">&larr; Cancel</button>
        </div>

        <div class="grid-12" style="margin-top:6px;">
          <!-- Left 7 Cols: Registration Inputs (Name, Commander, Emblem, Motto, Goals) -->
          <div class="col-7" style="display:flex; flex-direction:column; gap:14px;">
            
            <div class="grid-12">
              <div class="col-7">
                <label class="subtext" style="font-weight:600;">Company Name</label>
                <input id="comp-inp-name" class="input" style="margin-top:4px; font-weight:700; font-size:15px;" value="${d.name}" oninput="App.updateLiveCharterPreview()" placeholder="e.g. Iron Wolf Mercenaries" />
              </div>
              <div class="col-5">
                <label class="subtext" style="font-weight:600;">Commanding Officer Name</label>
                <input id="comp-inp-cmdr" class="input" style="margin-top:4px;" value="${d.commander}" oninput="App.updateLiveCharterPreview()" placeholder="e.g. Cmdr. Vance" />
              </div>
            </div>

            <!-- Emblem Selector -->
            <div>
              <label class="subtext" style="font-weight:600;">Select Company Emblem / Insignia</label>
              <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-top:6px;">
                ${window.TOS_DATA.companyEmblems.map(em => `
                  <div class="list-item ${d.emblemId === em.id ? 'selected' : ''}" onclick="App.pickCompanyEmblem('${em.id}')" style="display:flex; align-items:center; gap:10px;">
                    <div style="flex-shrink:0;">${em.svg}</div>
                    <span style="font-size:12px; font-weight:700;">${em.label}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Company Motto -->
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <label class="subtext" style="font-weight:600;">Company Motto</label>
                <div style="display:flex; gap:4px; flex-wrap:wrap;">
                  ${mottoPresets.map(m => `
                    <button class="btn" style="padding:2px 7px; font-size:12px;" onclick="App.pickPresetMotto('${m}')">${m.split(' ')[0]}...</button>
                  `).join('')}
                </div>
              </div>
              <input id="comp-inp-motto" class="input" style="margin-top:4px; font-style:italic;" value="${d.motto}" oninput="App.updateLiveCharterPreview()" placeholder="Enter your unit's battle cry or motto..." />
            </div>

            <!-- Company Goals & Charter Doctrine -->
            <div>
              <label class="subtext" style="font-weight:600;">Company Goals &amp; Charter Focus</label>
              <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; margin-top:6px;">
                ${window.TOS_DATA.companyGoals.map(g => `
                  <div class="list-item ${d.goalId === g.id ? 'selected' : ''}" onclick="App.pickCompanyGoal('${g.id}')">
                    <div style="font-weight:700; font-size:13px;">${g.title}</div>
                    <div class="subtext" style="margin-top:2px;">${g.desc}</div>
                  </div>
                `).join('')}
              </div>
              <label class="subtext" style="display:block; margin-top:8px; font-weight:600;">Specific Company Goals &amp; Mission Statement (Editable):</label>
              <textarea id="comp-inp-goals" class="textarea" rows="2" style="margin-top:4px;" oninput="App.updateLiveCharterPreview()">${d.customGoals}</textarea>
            </div>

          </div>

          <!-- Right 5 Cols: Live Mercenary Charter Certificate Preview & Confirm -->
          <div class="col-5" style="display:flex; flex-direction:column; justify-content:space-between; gap:14px;">
            <div class="panel" style="padding:20px; display:flex; flex-direction:column; gap:14px; border-color:var(--primary);">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:10px;">
                <span class="mono" style="font-size:12px; color:var(--accent-amber); font-weight:700;">OFFICIAL MERCENARY CHARTER</span>
                <span class="badge green">AUTHORIZED</span>
              </div>

              <div style="display:flex; align-items:center; gap:14px;">
                <div class="card" style="padding:10px; background:var(--bg-main);">
                  ${window.GameState.getCompanyEmblemSvg(d.emblemId)}
                </div>
                <div>
                  <h3 id="prev-comp-name" style="font-size:19px; font-weight:800;">${d.name}</h3>
                  <div id="prev-comp-cmdr" class="subtext" style="font-weight:600; margin-top:2px;">Cmdr. ${d.commander}</div>
                  <div id="prev-comp-motto" style="font-style:italic; color:#93c5fd; font-size:13px; margin-top:4px;">"${d.motto}"</div>
                </div>
              </div>

              <div class="card" style="background:var(--bg-main); padding:12px; gap:6px;">
                <div class="subtext" style="font-weight:700; text-transform:uppercase;">Charter Doctrine: ${goalObj.title}</div>
                <div id="prev-comp-goals" style="font-size:13px;">${d.customGoals}</div>
              </div>

              <div class="card" style="background:var(--bg-main); padding:12px; gap:6px;">
                <div class="subtext" style="font-weight:700; text-transform:uppercase;">Starting Assets (${d.isNewGame ? 'Scratch Start' : 'Current Campaign'})</div>
                <div style="display:flex; justify-content:space-between; font-size:13px;">
                  <span>Starting Treasury:</span>
                  <strong class="mono" style="color:var(--accent-green);">500,000 Cr</strong>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:13px;">
                  <span>Initial Jock Roster:</span>
                  <strong class="mono">0 / 8 (Recruit From Scratch)</strong>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:13px;">
                  <span>Initial Mech Hangar:</span>
                  <strong class="mono">0 Units (Build From Scratch)</strong>
                </div>
              </div>
            </div>

            <button class="intro-btn primary-action" style="width:100%; justify-content:center; gap:10px; padding:16px;" onclick="App.confirmCompanyCharter()">
              <span>${d.isNewGame ? 'Register Charter &amp; Launch Company HQ' : 'Save Company Charter Changes'}</span>
              <span class="btn-sub">&rarr;</span>
            </button>
          </div>
        </div>

      </div>
    `;
  },

  enterGame(tab) {
    const intro = document.getElementById('intro-screen');
    const compScreen = document.getElementById('company-screen');
    if (intro) intro.classList.add('hidden');
    if (compScreen) compScreen.classList.add('hidden');
    this.switchTab(tab || 'hq');
  },

  showIntro() {
    this.updateHUD();
    const intro = document.getElementById('intro-screen');
    const compScreen = document.getElementById('company-screen');
    if (compScreen) compScreen.classList.add('hidden');
    if (intro) intro.classList.remove('hidden');
  },

  switchTab(tab) {
    this.currentTab = tab;
    ['hq', 'garage', 'battle'].forEach(t => {
      const view = document.getElementById('view-' + t);
      const btn = document.getElementById('nav-' + t);
      if (view) view.classList.toggle('hidden', t !== tab);
      if (btn) btn.classList.toggle('active', t === tab);
    });

    this.updateHUD();
    if (tab === 'hq') window.HQModule.render();
    else if (tab === 'garage') window.GarageModule.render();
    else if (tab === 'battle') window.BattleModule.render();
  },

  updateHUD() {
    const st = window.GameState.data;
    const ver = window.GAME_VERSION || '1.00';
    const wmEl = document.getElementById('intro-version-watermark');
    const topVerEl = document.getElementById('intro-top-version');
    const introCalEl = document.getElementById('intro-top-calendar');
    const hudCalEl = document.getElementById('hud-calendar');
    const hudCalSubEl = document.getElementById('hud-calendar-sub');
    const calText = window.GameState.getCalendarText();
    const lastEvt = st.calendar?.lastEvent || 'Campaign Active';

    if (wmEl) wmEl.textContent = `VERSION ${ver}`;
    if (topVerEl) topVerEl.textContent = `MECHJOCKS COMMAND // VER ${ver}`;
    if (introCalEl) introCalEl.textContent = `CAMPAIGN TIME // ${calText.toUpperCase()}`;
    if (hudCalEl) hudCalEl.textContent = calText;
    if (hudCalSubEl) hudCalSubEl.textContent = lastEvt;

    const creditsEl = document.getElementById('hud-credits');
    const upkeepEl = document.getElementById('hud-upkeep');
    const jocksEl = document.getElementById('hud-jocks');
    const mechsEl = document.getElementById('hud-mechs');

    const totalUpkeep = st.jocks.reduce((sum, j) => sum + window.GameState.getJockSalary(j), 0);
    if (creditsEl) creditsEl.textContent = st.credits.toLocaleString() + ' Cr';
    if (upkeepEl) upkeepEl.textContent = '-' + totalUpkeep.toLocaleString() + ' Cr/mo';
    if (jocksEl) jocksEl.textContent = `${st.jocks.length} / 8`;
    if (mechsEl) mechsEl.textContent = `${st.mechs.length} Units`;

    // Update Top Bar Company Identity
    const comp = st.company || {};
    const topEmblem = document.getElementById('top-company-emblem');
    const topName = document.getElementById('top-company-name');
    const topMotto = document.getElementById('top-company-motto');
    if (topEmblem) topEmblem.innerHTML = window.GameState.getCompanyEmblemSvg(comp.emblemId);
    if (topName) topName.textContent = comp.registered ? comp.name.toUpperCase() : 'MECHJOCKS';
    if (topMotto) topMotto.textContent = comp.registered ? `"${comp.motto}" • Cmdr. ${comp.commander}` : 'Jockey HQ • 8-Part Mech Factory • Action-Time Hex Combat';

    // Update Intro Screen dynamic telemetry
    const badgeEl = document.getElementById('intro-callout-badge');
    const titleEl = document.getElementById('intro-callout-title');
    const subEl = document.getElementById('intro-callout-sub');
    const contSub = document.getElementById('intro-continue-sub');

    if (!comp.registered && st.jocks.length === 0 && st.mechs.length === 0) {
      if (badgeEl) badgeEl.textContent = 'UNREGISTERED';
      if (titleEl) titleEl.textContent = 'Awaiting Company Charter';
      if (subEl) subEl.textContent = 'Click "Create Company" to register your Emblem, Motto, and Goals with 500,000 Cr.';
      if (contSub) contSub.textContent = 'EMPTY ROSTER →';
    } else {
      if (badgeEl) badgeEl.textContent = `${st.jocks.length} JOCKS • ${st.mechs.length} MECHS`;
      if (titleEl) titleEl.textContent = comp.name || 'Mercenary Unit';
      if (subEl) subEl.textContent = `"${comp.motto}" • Cmdr. ${comp.commander} • Treasury: ${st.credits.toLocaleString()} Cr`;
      if (contSub) contSub.textContent = `${comp.name.slice(0, 14).toUpperCase()} →`;
    }
  },

  resetSave() {
    this.openCompanyCreator(true);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});
