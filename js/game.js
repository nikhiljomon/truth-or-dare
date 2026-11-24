// Prompt selection, player turns, scoring, and bottle-spin game logic.
  /**
   * ============================================================================
   * PROMPT POOL LOGIC (Never repeats until exhausted)
   * ============================================================================
   */
  function getRawPrompts(mode, type) {
    if (mode === 'family') {
      return type === 'truth' ? FAMILY_TRUTHS : FAMILY_DARES;
    } else if (mode === 'spicy') {
      return type === 'truth' ? SPICY_TRUTHS : SPICY_DARES;
    }
    return type === 'truth' ? PARTY_TRUTHS : PARTY_DARES;
  }

  function drawNextPrompt(mode, type) {
    // 1. Gather base built-in prompts
    const baseList = getRawPrompts(mode, type);

    // 2. Gather applicable custom prompts
    const matchingCustom = gameState.customPrompts.filter(p => {
      const matchType = p.type === type;
      const matchCategory = p.category === 'all' || p.category === mode;
      return matchType && matchCategory;
    }).map(p => ({ text: p.text, isCustom: true }));

    // 3. Combine into master pool items: { text, isCustom }
    const fullPool = [
      ...baseList.map(t => ({ text: t, isCustom: false })),
      ...matchingCustom
    ];

    // 4. Filter out already used prompts
    let usedList = gameState.usedPrompts[mode][type];
    let available = fullPool.filter(item => !usedList.includes(item.text));

    // 5. If pool is exhausted, reset pool and announce!
    if (available.length === 0) {
      gameState.usedPrompts[mode][type] = [];
      available = fullPool;
      showToast('All ' + type.toUpperCase() + 's played! Deck reshuffled.', '🔄');
    }

    // 6. Draw random prompt from available
    const randomIndex = Math.floor(Math.random() * available.length);
    const chosen = available[randomIndex];

    // Mark as used
    gameState.usedPrompts[mode][type].push(chosen.text);

    return {
      type: type,
      text: chosen.text,
      isCustom: chosen.isCustom,
      category: mode,
      remaining: available.length - 1
    };
  }

  /**
   * ============================================================================
   * ROSTER MANAGEMENT
   * ============================================================================
   */
  function addPlayer(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (gameState.players.length >= 10) {
      showToast('Maximum 10 players reached!', '⚠️');
      return;
    }
    if (gameState.players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Player "' + trimmed + '" is already in the game!', '⚠️');
      return;
    }

    const color = PLAYER_COLORS[gameState.players.length % PLAYER_COLORS.length];
    const player = {
      id: Date.now() + Math.random(),
      name: trimmed,
      color: color,
      points: 0,
      truths: 0,
      dares: 0,
      skips: 0,
      forfeits: 0
    };

    gameState.players.push(player);
    saveGameScores();
    gameState.sound.playClick();
    renderPlayerRoster();
    updateStartButtonState();
    if (typeof updateLiveScores === 'function') updateLiveScores();
  }

  function removePlayer(id) {
    gameState.players = gameState.players.filter(p => p.id !== id);
    if (gameState.currentPlayerIndex >= gameState.players.length) {
      gameState.currentPlayerIndex = 0;
    }
    saveGameScores();
    gameState.sound.playClick();
    renderPlayerRoster();
    updateStartButtonState();
    if (typeof updateLiveScores === 'function') updateLiveScores();
    if (document.getElementById('modal-scoreboard')?.classList.contains('active')) {
      renderScoreboard();
    }
  }

  function renderPlayerRoster() {
    const container = document.getElementById('player-roster-container');
    container.innerHTML = '';

    gameState.players.forEach(p => {
      const tag = document.createElement('div');
      tag.className = 'player-tag';
      tag.innerHTML = `
        <span class="player-avatar-circle" style="background:${p.color};">${escapeHTML(p.name.charAt(0))}</span>
        <span>${escapeHTML(p.name)}</span>
        <button class="player-remove-btn" data-id="${p.id}" aria-label="Remove ${escapeHTML(p.name)}">✕</button>
      `;
      tag.querySelector('.player-remove-btn').addEventListener('click', () => removePlayer(p.id));
      container.appendChild(tag);
    });

    document.getElementById('player-count-badge').textContent = `${gameState.players.length} / 10 Players`;
  }

  function updateStartButtonState() {
    const btn = document.getElementById('btn-start-game');
    const valid = gameState.players.length >= 2 && gameState.players.length <= 10;
    btn.disabled = !valid;
    if (valid) {
      btn.style.opacity = '1';
    } else {
      btn.style.opacity = '0.55';
    }
  }

  function loadDemoSquad() {
    const squad = ['Alex', 'Jordan', 'Sam', 'Riley'];
    squad.forEach(name => {
      if (gameState.players.length < 10 && !gameState.players.some(p => p.name === name)) {
        addPlayer(name);
      }
    });
    showToast('Demo squad loaded!', '✨');
  }

  /**
   * ============================================================================
   * GAME FLOW & TURN CONTROLS
   * ============================================================================
   */
  function startGame() {
    if (gameState.players.length < 2) return;
    gameState.sound.playSuccess();
    gameState.confetti.burst(window.innerWidth / 2, window.innerHeight * 0.3, 60);

    gameState.currentPlayerIndex = 0;
    gameState.turnRound = 1;
    gameState.turnCount = 1;

    document.getElementById('setup-view').classList.add('hidden');
    document.getElementById('game-view').classList.remove('hidden');

    updateGameTurnUI();
  }

  function getCurrentPlayer() {
    return gameState.players[gameState.currentPlayerIndex] || gameState.players[0];
  }

  let isProcessingTurn = false;

  function setTurnButtonsDisabled(disabled) {
    const btnDone = document.getElementById('btn-prompt-done');
    const btnSkip = document.getElementById('btn-prompt-skip');
    const btnReroll = document.getElementById('btn-prompt-reroll');
    const btnForfeit = document.getElementById('btn-accept-forfeit');
    if (btnDone) btnDone.disabled = disabled;
    if (btnSkip) btnSkip.disabled = disabled;
    if (btnReroll) btnReroll.disabled = disabled;
    if (btnForfeit) btnForfeit.disabled = disabled;
  }

  function updateGameTurnUI() {
    const player = getCurrentPlayer();
    if (!player) return;

    // Reset processing state and re-enable buttons for the new turn
    isProcessingTurn = false;
    setTurnButtonsDisabled(false);

    // Reset prompt stage to choice stage
    document.getElementById('choice-stage').style.display = 'grid';
    document.getElementById('prompt-stage').classList.remove('active');
    document.getElementById('turn-instruction-subtext').textContent = 'Will you reveal a secret or take a wild dare?';

    // Player banner
    document.getElementById('current-player-name').textContent = player.name;
    const avatarEl = document.getElementById('current-player-avatar');
    avatarEl.textContent = player.name.charAt(0);
    avatarEl.style.background = player.color;

    // Round counter
    document.getElementById('game-round-pill').textContent = `Round ${gameState.turnRound} • Turn ${gameState.turnCount}`;
    if (typeof updateLiveScores === 'function') updateLiveScores();

    // Active mode pill
    const modeConfig = {
      family: { icon: '🌟', text: 'Family Mode' },
      party: { icon: '🎉', text: 'Party Mode' },
      spicy: { icon: '🔥', text: 'Spicy Mode' }
    };
    const cur = modeConfig[gameState.activeMode] || modeConfig.party;
    document.getElementById('game-active-mode-icon').textContent = cur.icon;
    document.getElementById('game-active-mode-text').textContent = cur.text;
  }

  function handleChoice(type) {
    isProcessingTurn = false;
    setTurnButtonsDisabled(false);
    gameState.sound.playCardFlip();
    const prompt = drawNextPrompt(gameState.activeMode, type);
    gameState.currentPrompt = prompt;

    // Switch view to prompt card with smooth flip
    document.getElementById('choice-stage').style.display = 'none';
    const promptStage = document.getElementById('prompt-stage');
    promptStage.classList.add('active');

    const card = document.getElementById('active-prompt-card');
    card.className = `prompt-card type-${type}`;

    const typeBadge = document.getElementById('prompt-type-badge');
    typeBadge.className = `prompt-type-badge type-${type}`;
    document.getElementById('prompt-type-icon').textContent = type === 'truth' ? '💬' : '⚡';
    document.getElementById('prompt-type-text').textContent = type.toUpperCase();
    document.getElementById('card-watermark-text').textContent = type === 'truth' ? 'TRUTH' : 'DARE';

    document.getElementById('active-prompt-text').textContent = `"${prompt.text}"`;
    const curP = getCurrentPlayer();
    document.getElementById('prompt-target-player').textContent = `Challenge for ${curP.name} (${curP.points || 0} pts)`;

    const customBadge = document.getElementById('prompt-custom-badge');
    if (prompt.isCustom) {
      customBadge.classList.remove('hidden');
    } else {
      customBadge.classList.add('hidden');
    }

    document.getElementById('prompt-pool-count').textContent = `Deck: ${prompt.remaining} left`;
    document.getElementById('turn-instruction-subtext').textContent = `${getCurrentPlayer().name} picked ${type.toUpperCase()}!`;
  }

  function advanceTurn() {
    if (gameState.bottleSpinEnabled) {
      openBottleModal(true);
    } else {
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      gameState.turnCount++;
      if (gameState.currentPlayerIndex === 0) {
        gameState.turnRound++;
      }
      updateGameTurnUI();
    }
  }

  function handleDone() {
    if (isProcessingTurn) return;
    const player = getCurrentPlayer();
    if (!player || !gameState.currentPrompt) return;

    isProcessingTurn = true;
    setTurnButtonsDisabled(true);

    const earned = gameState.currentPrompt.type === 'truth' ? SCORING_CONFIG.truthDone : SCORING_CONFIG.dareDone;
    if (gameState.currentPrompt.type === 'truth') {
      player.truths++;
    } else {
      player.dares++;
    }
    player.points = (player.points || 0) + earned;

    saveGameScores();
    if (typeof updateLiveScores === 'function') updateLiveScores();

    gameState.sound.playSuccess();
    if (gameState.confetti) {
      gameState.confetti.burst(window.innerWidth / 2, window.innerHeight * 0.45, 110);
    }
    showToast(`Awesome! ${player.name} completed the ${gameState.currentPrompt.type}! (+${earned} pts)`, '🎉');

    setTimeout(() => {
      advanceTurn();
    }, 600);
  }

  function handleReroll() {
    if (!gameState.currentPrompt || isProcessingTurn) return;
    gameState.sound.playCardFlip();
    const flipper = document.getElementById('card-flipper');
    flipper.classList.add('flipped');

    setTimeout(() => {
      const newPrompt = drawNextPrompt(gameState.activeMode, gameState.currentPrompt.type);
      gameState.currentPrompt = newPrompt;

      document.getElementById('active-prompt-text').textContent = `"${newPrompt.text}"`;
      const customBadge = document.getElementById('prompt-custom-badge');
      if (newPrompt.isCustom) {
        customBadge.classList.remove('hidden');
      } else {
        customBadge.classList.add('hidden');
      }
      document.getElementById('prompt-pool-count').textContent = `Deck: ${newPrompt.remaining} left`;

      flipper.classList.remove('flipped');
    }, 280);
  }

  function handleSkip() {
    if (isProcessingTurn) return;
    const player = getCurrentPlayer();
    if (!player) return;

    isProcessingTurn = true;
    setTurnButtonsDisabled(true);

    player.skips++;
    const prevPoints = player.points || 0;
    player.points = Math.max(SCORING_CONFIG.minScore, prevPoints - SCORING_CONFIG.skipPenalty);
    saveGameScores();
    if (typeof updateLiveScores === 'function') updateLiveScores();

    gameState.sound.playSkip();

    // Pick random forfeit
    const randomForfeit = FORFEIT_LIST[Math.floor(Math.random() * FORFEIT_LIST.length)];
    document.getElementById('forfeit-player-name').textContent = player.name;
    document.getElementById('forfeit-challenge-text').textContent = `"${randomForfeit}"`;

    // Re-enable forfeit button specifically for the modal
    const btnForfeit = document.getElementById('btn-accept-forfeit');
    if (btnForfeit) btnForfeit.disabled = false;

    openModal('modal-forfeit');
  }

  function acceptForfeit() {
    const btnForfeit = document.getElementById('btn-accept-forfeit');
    if (btnForfeit && btnForfeit.disabled) return;
    if (btnForfeit) btnForfeit.disabled = true;

    const player = getCurrentPlayer();
    if (player) {
      player.forfeits++;
    }
    closeModal('modal-forfeit');
    gameState.sound.playSuccess();
    showToast(`Forfeit recorded for ${player ? player.name : 'player'}!`, '⚠️');
    advanceTurn();
  }

  /**
   * ============================================================================
   * BOTTLE SPIN PICKER LOGIC
   * ============================================================================
   */
  let isSpinning = false;
  let bottleRotation = 0;

  function setupBottleNodes() {
    const arena = document.getElementById('bottle-arena');
    // Remove existing nodes (preserve bottle svg)
    const existingNodes = arena.querySelectorAll('.bottle-player-node');
    existingNodes.forEach(n => n.remove());

    const numPlayers = gameState.players.length;
    if (numPlayers === 0) return;

    const radius = 120; // px
    const centerX = 160;
    const centerY = 160;

    gameState.players.forEach((p, idx) => {
      const angle = (idx / numPlayers) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const node = document.createElement('div');
      node.className = 'bottle-player-node';
      node.id = `bottle-node-${idx}`;
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.style.background = p.color;
      node.innerHTML = `
        <span>${escapeHTML(p.name.charAt(0))}</span>
        <span class="node-label">${escapeHTML(p.name)}</span>
      `;
      arena.appendChild(node);
    });
  }

  function openBottleModal(autoSpin = false) {
    setupBottleNodes();
    document.getElementById('bottle-result-msg').textContent = 'Tap Bottle or Click Spin!';
    openModal('modal-bottle');
    if (autoSpin) {
      setTimeout(() => spinBottle(), 400);
    }
  }

  function spinBottle() {
    if (isSpinning || gameState.players.length === 0) return;
    isSpinning = true;
    gameState.sound.init();

    // Clear previous winner highlights
    document.querySelectorAll('.bottle-player-node').forEach(n => n.classList.remove('winner'));

    const bottle = document.getElementById('bottle-svg');
    const numPlayers = gameState.players.length;

    // Exclude the current active player so the bottle does not pick the same player repeatedly
    const eligibleIndices = gameState.players
      .map((_, i) => i)
      .filter(i => i !== gameState.currentPlayerIndex);
    const targetPlayerIndex = eligibleIndices.length > 0
      ? eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)]
      : 0;

    // Calculate angle for target player
    // Top is -PI/2 (0 deg in SVG terms is facing up)
    const targetAngleDegrees = (targetPlayerIndex / numPlayers) * 360;
    const extraRotations = (Math.floor(Math.random() * 4) + 4) * 360; // 4 to 7 full spins
    const totalRotation = bottleRotation + extraRotations + (targetAngleDegrees - (bottleRotation % 360));
    bottleRotation = totalRotation;

    document.getElementById('bottle-result-msg').textContent = 'Spinning... Who will it be?';

    // Sound ticks simulation during spin
    let tickCount = 0;
    const totalTicks = 28;
    const startTick = () => {
      if (tickCount < totalTicks) {
        gameState.sound.playTick();
        tickCount++;
        const delay = 40 + (tickCount * tickCount * 0.45);
        setTimeout(startTick, delay);
      }
    };
    startTick();

    bottle.style.transition = 'transform 3.5s cubic-bezier(0.15, 0.9, 0.25, 1)';
    bottle.style.transform = `rotate(${totalRotation}deg)`;

    setTimeout(() => {
      isSpinning = false;
      const winner = gameState.players[targetPlayerIndex];
      gameState.currentPlayerIndex = targetPlayerIndex;
      gameState.turnCount++;

      // Increment turnRound in bottle spin mode every full cycle of turns across the player count
      if (gameState.players.length > 0 && (gameState.turnCount - 1) % gameState.players.length === 0) {
        gameState.turnRound++;
      }

      // Highlight winner node
      const winnerNode = document.getElementById(`bottle-node-${targetPlayerIndex}`);
      if (winnerNode) winnerNode.classList.add('winner');

      gameState.sound.playSuccess();
      gameState.confetti.burst(window.innerWidth / 2, window.innerHeight / 2, 70);

      document.getElementById('bottle-result-msg').innerHTML = `🎉 <strong>${escapeHTML(winner.name)}</strong> was chosen!`;

      setTimeout(() => {
        closeModal('modal-bottle');
        updateGameTurnUI();
      }, 1500);
    }, 3600);
  }

  function endGame() {
    if (gameState.players.length === 0) return;

    const sorted = [...gameState.players].sort((a, b) => (b.points || 0) - (a.points || 0));
    const topScore = sorted[0].points || 0;
    const leaders = sorted.filter(p => (p.points || 0) === topScore);

    let winnerMsg = '';
    if (leaders.length > 1) {
      winnerMsg = `Winner: ${leaders.map(l => l.name).join(' & ')} (Tie - ${topScore} pts)`;
    } else {
      winnerMsg = `Winner: ${leaders[0].name} (${topScore} pts)`;
    }

    gameState.sound.playSuccess();
    if (gameState.confetti && topScore > 0) {
      gameState.confetti.burst(window.innerWidth / 2, window.innerHeight * 0.45, 120);
    }

    showToast(`🏁 Game Over! ${winnerMsg}`, '🏆');

    const instructionEl = document.getElementById('turn-instruction-subtext');
    if (instructionEl) {
      instructionEl.textContent = `🏆 Game Over! ${winnerMsg}`;
    }

    renderScoreboard(true, winnerMsg);
    openModal('modal-scoreboard');
  }

  function handlePlayAgain() {
    resetPlayerScores();
    resetUsedPrompts();
    closeModal('modal-scoreboard');
    updateGameTurnUI();
    showToast('Play Again! Scores reset for all players.', '🔄');
  }
