// Theme and sound preferences, along with their localStorage persistence.
  /**
   * ============================================================================
   * THEME CONTROLLER
   * ============================================================================
   */
  function applyTheme(theme) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', normalized);
    document.body.removeAttribute('data-theme');

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', normalized === 'dark' ? '#161616' : '#f5f5f0');
    }

    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.textContent = normalized === 'dark' ? '🌙' : '☀️';
      themeBtn.setAttribute('title', normalized === 'dark' ? 'Dark Mode (click to switch to Light)' : 'Light Mode (click to switch to Dark)');
      themeBtn.setAttribute('aria-label', normalized === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    }
  }

  function initTheme() {
    let savedTheme = null;
    try {
      savedTheme = localStorage.getItem('tod_theme');
    } catch (e) {
      console.warn('Could not read theme from localStorage:', e);
    }

    if (savedTheme === 'dark' || savedTheme === 'light') {
      applyTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  }

  /**
   * Load & Save LocalStorage
   */
  function loadPersistedData() {
    initTheme();

    try {
      const savedSound = localStorage.getItem('tod_sound');
      if (savedSound !== null) {
        const soundOn = savedSound === 'true';
        gameState.sound.enabled = soundOn;
        document.getElementById('setting-sound-fx').checked = soundOn;
        document.getElementById('btn-sound-toggle').textContent = soundOn ? '🔊' : '🔇';
      }

      const savedBottle = localStorage.getItem('tod_bottle_mode');
      if (savedBottle !== null) {
        const bottleOn = savedBottle === 'true';
        gameState.bottleSpinEnabled = bottleOn;
        document.getElementById('setting-bottle-spin').checked = bottleOn;
      }

      const savedCustom = localStorage.getItem('tod_custom_prompts');
      if (savedCustom) {
        gameState.customPrompts = JSON.parse(savedCustom);
        updateCustomPromptsBadge();
      }

      const savedPlayers = localStorage.getItem('tod_players');
      if (savedPlayers) {
        const parsed = JSON.parse(savedPlayers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          gameState.players = parsed;
          renderPlayerRoster();
          updateStartButtonState();
          if (typeof updateLiveScores === 'function') updateLiveScores();
        }
      }
    } catch (e) {
      console.warn('Storage load error:', e);
    }
  }

  function saveCustomPrompts() {
    try {
      localStorage.setItem('tod_custom_prompts', JSON.stringify(gameState.customPrompts));
      updateCustomPromptsBadge();
    } catch (e) {}
  }

  function setupThemeEventListeners() {
    // Theme Toggle
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        try {
          localStorage.setItem('tod_theme', newTheme);
        } catch (e) {
          console.warn('Could not save theme to localStorage:', e);
        }
        if (gameState && gameState.sound) {
          gameState.sound.playClick();
        }
      });
    }

    // Listen for OS color scheme change if user hasn't explicitly set a preference
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        let hasSaved = false;
        try {
          hasSaved = localStorage.getItem('tod_theme') !== null;
        } catch (err) {}
        if (!hasSaved) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }

    // Sound Toggle
    document.getElementById('btn-sound-toggle').addEventListener('click', () => {
      gameState.sound.enabled = !gameState.sound.enabled;
      const on = gameState.sound.enabled;
      document.getElementById('btn-sound-toggle').textContent = on ? '🔊' : '🔇';
      document.getElementById('setting-sound-fx').checked = on;
      localStorage.setItem('tod_sound', on);
      if (on) gameState.sound.playClick();
    });

    document.getElementById('setting-sound-fx').addEventListener('change', (e) => {
      gameState.sound.enabled = e.target.checked;
      document.getElementById('btn-sound-toggle').textContent = e.target.checked ? '🔊' : '🔇';
      localStorage.setItem('tod_sound', e.target.checked);
    });
  }
