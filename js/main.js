// Application startup and event-listener registration.
  /**
   * ============================================================================
   * EVENT LISTENERS & SETUP
   * ============================================================================
   */
  function setupEventListeners() {
    // Brand title click returns home / setup if needed
    document.getElementById('brand-logo').addEventListener('click', () => {
      gameState.sound.playClick();
    });

    setupThemeEventListeners();

    // Confetti Toggle
    document.getElementById('setting-confetti-toggle').addEventListener('change', (e) => {
      gameState.confetti.enabled = e.target.checked;
    });

    // Bottle Spin Setting Toggle
    document.getElementById('setting-bottle-spin').addEventListener('change', (e) => {
      gameState.bottleSpinEnabled = e.target.checked;
      localStorage.setItem('tod_bottle_mode', e.target.checked);
      gameState.sound.playClick();
    });

    // Mode Selector (Setup Screen)
    document.querySelectorAll('.mode-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.mode-card').forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('active');
        card.setAttribute('aria-checked', 'true');
        gameState.activeMode = card.getAttribute('data-mode');
        document.getElementById('setting-active-mode-select').value = gameState.activeMode;
        gameState.sound.playClick();
      });
    });

    // Active mode in Settings
    document.getElementById('setting-active-mode-select').addEventListener('change', (e) => {
      gameState.activeMode = e.target.value;
      updateGameTurnUI();
      showToast('Switched to ' + e.target.value.toUpperCase() + ' mode!', '🌟');
    });

    // Add Player Events
    const playerInput = document.getElementById('player-name-input');
    const addBtn = document.getElementById('btn-add-player');
    
    addBtn.addEventListener('click', () => {
      addPlayer(playerInput.value);
      playerInput.value = '';
      playerInput.focus();
    });

    playerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addPlayer(playerInput.value);
        playerInput.value = '';
      }
    });

    // Quick Demo Squad
    document.getElementById('btn-load-demo-squad').addEventListener('click', () => {
      loadDemoSquad();
    });

    // Start Game
    document.getElementById('btn-start-game').addEventListener('click', () => {
      startGame();
    });

    // Choice Stage: Truth or Dare Buttons
    document.getElementById('btn-pick-truth').addEventListener('click', () => handleChoice('truth'));
    document.getElementById('btn-pick-dare').addEventListener('click', () => handleChoice('dare'));

    // Secondary bottle spin trigger
    document.getElementById('btn-spin-now').addEventListener('click', () => openBottleModal(false));

    // Prompt Card Actions
    document.getElementById('btn-prompt-done').addEventListener('click', handleDone);
    document.getElementById('btn-prompt-reroll').addEventListener('click', handleReroll);
    document.getElementById('btn-prompt-skip').addEventListener('click', handleSkip);

    // Forfeit Actions
    document.getElementById('btn-accept-forfeit').addEventListener('click', acceptForfeit);
    document.getElementById('btn-reroll-forfeit').addEventListener('click', () => {
      gameState.sound.playClick();
      const randomForfeit = FORFEIT_LIST[Math.floor(Math.random() * FORFEIT_LIST.length)];
      document.getElementById('forfeit-challenge-text').textContent = `"${randomForfeit}"`;
    });

    // Bottle Modal Actions
    document.getElementById('btn-trigger-bottle-spin').addEventListener('click', spinBottle);
    document.getElementById('bottle-svg').addEventListener('click', spinBottle);
    document.getElementById('btn-close-bottle').addEventListener('click', () => closeModal('modal-bottle'));

    // Scoreboard Modal
    document.getElementById('btn-open-scores').addEventListener('click', () => {
      renderScoreboard();
      openModal('modal-scoreboard');
    });
    document.getElementById('btn-close-scores').addEventListener('click', () => closeModal('modal-scoreboard'));
    document.getElementById('btn-close-scores-footer').addEventListener('click', () => closeModal('modal-scoreboard'));

    // Rules & Settings Modal
    document.getElementById('btn-open-rules').addEventListener('click', () => openModal('modal-rules'));
    document.getElementById('btn-close-rules').addEventListener('click', () => closeModal('modal-rules'));

    document.getElementById('tab-btn-rules').addEventListener('click', () => {
      document.getElementById('tab-btn-rules').classList.add('active');
      document.getElementById('tab-btn-settings').classList.remove('active');
      document.getElementById('pane-rules').classList.remove('hidden');
      document.getElementById('pane-settings').classList.add('hidden');
    });

    document.getElementById('tab-btn-settings').addEventListener('click', () => {
      document.getElementById('tab-btn-settings').classList.add('active');
      document.getElementById('tab-btn-rules').classList.remove('active');
      document.getElementById('pane-settings').classList.remove('hidden');
      document.getElementById('pane-rules').classList.add('hidden');
    });

    // Custom Prompts Modal
    document.getElementById('btn-open-custom').addEventListener('click', () => {
      renderCustomPromptsList();
      openModal('modal-custom');
    });
    document.getElementById('btn-close-custom').addEventListener('click', () => closeModal('modal-custom'));

    document.getElementById('tab-btn-add-custom').addEventListener('click', () => {
      document.getElementById('tab-btn-add-custom').classList.add('active');
      document.getElementById('tab-btn-view-custom').classList.remove('active');
      document.getElementById('pane-add-custom').classList.remove('hidden');
      document.getElementById('pane-view-custom').classList.add('hidden');
    });

    document.getElementById('tab-btn-view-custom').addEventListener('click', () => {
      document.getElementById('tab-btn-view-custom').classList.add('active');
      document.getElementById('tab-btn-add-custom').classList.remove('active');
      document.getElementById('pane-view-custom').classList.remove('hidden');
      document.getElementById('pane-add-custom').classList.add('hidden');
      renderCustomPromptsList();
    });

    document.getElementById('btn-save-custom-prompt').addEventListener('click', addCustomPrompt);

    document.getElementById('btn-clear-all-custom').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all saved custom prompts?')) {
        gameState.customPrompts = [];
        saveCustomPrompts();
        renderCustomPromptsList();
        showToast('All custom prompts cleared', '🗑️');
      }
    });

    // Reset Game Modals
    document.getElementById('btn-quick-reset').addEventListener('click', () => openModal('modal-reset'));
    document.getElementById('btn-close-reset').addEventListener('click', () => closeModal('modal-reset'));

    document.getElementById('btn-reset-scores-only').addEventListener('click', () => {
      resetPlayerScores();
      resetUsedPrompts();
      closeModal('modal-reset');
      updateGameTurnUI();
      showToast('Game restarted with scores & deck reset!', '🔄');
    });

    document.getElementById('btn-reset-to-setup').addEventListener('click', () => {
      resetPlayerScores();
      resetUsedPrompts();
      closeModal('modal-reset');
      document.getElementById('game-view').classList.add('hidden');
      document.getElementById('setup-view').classList.remove('hidden');
      renderPlayerRoster();
      updateStartButtonState();
      showToast('Returned to player setup (scores & deck reset)', '👥');
    });

    document.getElementById('btn-full-reset-all').addEventListener('click', () => {
      if (confirm('Are you sure you want to completely reset the game? This will clear all players, scores, and history.')) {
        gameState.players = [];
        resetUsedPrompts();
        resetPlayerScores();
        closeModal('modal-reset');
        document.getElementById('game-view').classList.add('hidden');
        document.getElementById('setup-view').classList.remove('hidden');
        renderPlayerRoster();
        updateStartButtonState();
        showToast('Full reset complete: all players and data cleared', '🗑️');
      }
    });

    // Prevent accidental browser navigation / refresh during active game
    window.addEventListener('beforeunload', (e) => {
      const gameView = document.getElementById('game-view');
      const isGameActive = gameView && !gameView.classList.contains('hidden');
      if (isGameActive && gameState.players.length > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    });

    // Keyboard Accessibility (Escape to close modals)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllModals();
      }
    });

    // Close modal on background overlay click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
  }

  /**
   * ============================================================================
   * INITIALIZATION
   * ============================================================================
   */
  window.addEventListener('DOMContentLoaded', () => {
    gameState.confetti = new ConfettiEngine('confetti-canvas');
    loadPersistedData();
    setupEventListeners();
    updateStartButtonState();
  });
