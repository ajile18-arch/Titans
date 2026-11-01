// Top-Level Controller for Titans of Steel Remake

window.App = {
  currentTab: 'hq',

  init() {
    window.GameState.init();
    this.updateHUD();
    this.switchTab('hq');
  },

  startNewScratchGame() {
    window.GameState.reset();
    window.BattleModule.active = false;
    this.updateHUD();
    this.enterGame('hq');
  },

  enterGame(tab) {
    const intro = document.getElementById('intro-screen');
    if (intro) intro.classList.add('hidden');
    this.switchTab(tab || 'hq');
  },

  showIntro() {
    this.updateHUD();
    const intro = document.getElementById('intro-screen');
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
    const creditsEl = document.getElementById('hud-credits');
    const upkeepEl = document.getElementById('hud-upkeep');
    const jocksEl = document.getElementById('hud-jocks');
    const mechsEl = document.getElementById('hud-mechs');

    const totalUpkeep = st.jocks.reduce((sum, j) => sum + window.GameState.getJockSalary(j), 0);
    if (creditsEl) creditsEl.textContent = st.credits.toLocaleString() + ' Cr';
    if (upkeepEl) upkeepEl.textContent = '-' + totalUpkeep.toLocaleString() + ' Cr/mo';
    if (jocksEl) jocksEl.textContent = `${st.jocks.length} / 8`;
    if (mechsEl) mechsEl.textContent = `${st.mechs.length} Units`;

    // Update Intro Screen dynamic telemetry
    const badgeEl = document.getElementById('intro-callout-badge');
    const titleEl = document.getElementById('intro-callout-title');
    const subEl = document.getElementById('intro-callout-sub');
    const contSub = document.getElementById('intro-continue-sub');

    if (st.jocks.length === 0 && st.mechs.length === 0) {
      if (badgeEl) badgeEl.textContent = '0 JOCKS / 0 MECHS';
      if (titleEl) titleEl.textContent = 'Fresh Campaign Ready';
      if (subEl) subEl.textContent = 'Starting Capital: 500,000 Cr • Recruit Jocks & Commission Titans from scratch.';
      if (contSub) contSub.textContent = 'EMPTY ROSTER →';
    } else {
      const leadJock = st.jocks[0];
      const leadMech = st.mechs[0];
      if (badgeEl) badgeEl.textContent = `${st.jocks.length} JOCKS • ${st.mechs.length} MECHS`;
      if (titleEl) titleEl.textContent = leadJock ? `${leadJock.firstName} "${leadJock.callsign}" ${leadJock.lastName}` : 'Uncrewed Hangar';
      if (subEl) subEl.textContent = leadMech ? `Assigned Titan: ${leadMech.customName} • Funds: ${st.credits.toLocaleString()} Cr` : `Funds: ${st.credits.toLocaleString()} Cr`;
      if (contSub) contSub.textContent = `${st.jocks.length} JOCKS / ${st.mechs.length} MECHS →`;
    }
  },

  resetSave() {
    if (confirm('Start a brand-new game from scratch (0 Jocks, 0 Mechs, 500,000 Cr)?')) {
      window.GameState.reset();
      window.BattleModule.active = false;
      this.switchTab(this.currentTab);
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});
