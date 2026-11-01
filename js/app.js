// Top-Level Controller for Titans of Steel Remake

window.App = {
  currentTab: 'hq',

  init() {
    window.GameState.init();
    this.updateHUD();
    this.switchTab('hq');
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
  },

  resetSave() {
    if (confirm('Reset your squad, hangar mechs, and funds back to the starting campaign state?')) {
      window.GameState.reset();
      window.BattleModule.active = false;
      this.switchTab(this.currentTab);
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});
