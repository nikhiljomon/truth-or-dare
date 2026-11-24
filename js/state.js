// Shared player and game state, plus state reset and escaping helpers.
  /**
   * ============================================================================
   * SCORING CONFIGURATION
   * Easy to adjust point values across the entire game
   * ============================================================================
   */
  const SCORING_CONFIG = {
    truthDone: 1,
    dareDone: 2,
    skipPenalty: 1,
    minScore: 0
  };

  /**
   * ============================================================================
   * GAME STATE & CONTROLLER
   * ============================================================================
   */
  const PLAYER_COLORS = [
    '#00d2ff', '#ff2a85', '#06d6a0', '#ffd166', '#9b5de5',
    '#ff7300', '#3a7bd5', '#ec4899', '#10b981', '#f59e0b'
  ];

  const gameState = {
    players: [], // { id, name, color, points: 0, truths: 0, dares: 0, skips: 0, forfeits: 0 }
    currentPlayerIndex: 0,
    activeMode: 'party', // 'family' | 'party' | 'spicy'
    turnRound: 1,
    turnCount: 1,
    bottleSpinEnabled: false,
    
    // Pool tracking: stores strings of already used prompts to avoid repeats
    usedPrompts: {
      family: { truth: [], dare: [] },
      party: { truth: [], dare: [] },
      spicy: { truth: [], dare: [] }
    },

    // Custom prompts saved by users
    customPrompts: [],

    // Current active prompt on the card
    currentPrompt: null, // { type, text, isCustom, category }

    // Audio & visuals
    sound: new SoundEngine(),
    confetti: null
  };

  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function resetUsedPrompts() {
    gameState.usedPrompts = {
      family: { truth: [], dare: [] },
      party: { truth: [], dare: [] },
      spicy: { truth: [], dare: [] }
    };
  }

  function saveGameScores() {
    try {
      localStorage.setItem('tod_players', JSON.stringify(gameState.players));
    } catch (e) {
      console.warn('Could not save scores to localStorage:', e);
    }
  }

  function resetPlayerScores() {
    gameState.players.forEach(p => {
      p.points = 0;
      p.truths = 0;
      p.dares = 0;
      p.skips = 0;
      p.forfeits = 0;
    });
    gameState.currentPlayerIndex = 0;
    gameState.turnRound = 1;
    gameState.turnCount = 1;
    gameState.currentPrompt = null;
    saveGameScores();
  }
