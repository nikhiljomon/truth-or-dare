// Sound, confetti, toast, scoreboard, prompt-list, and modal UI helpers.
  /**
   * ============================================================================
   * SOUND SYNTHESIZER (Web Audio API - No External Files Needed)
   * ============================================================================
   */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playClick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      } catch (e) {}
    }

    playCardFlip() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
      } catch (e) {}
    }

    playSuccess() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.07);
          gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.07 + 0.35);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(this.ctx.currentTime + idx * 0.07);
          osc.stop(this.ctx.currentTime + idx * 0.07 + 0.35);
        });
      } catch (e) {}
    }

    playSkip() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.28);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.28);
      } catch (e) {}
    }

    playTick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.03);
      } catch (e) {}
    }
  }

  /**
   * ============================================================================
   * CANVAS CONFETTI ENGINE
   * ============================================================================
   */
  class ConfettiEngine {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.particles = [];
      this.animId = null;
      this.enabled = true;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    burst(x = window.innerWidth / 2, y = window.innerHeight / 2, count = 90) {
      if (!this.enabled || !this.ctx) return;
      const colors = ['#00d2ff', '#ff2a85', '#ffd166', '#06d6a0', '#9b5de5', '#ffffff'];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 12 + 4;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 15,
          gravity: 0.28,
          friction: 0.96,
          life: 1,
          decay: Math.random() * 0.015 + 0.01
        });
      }
      if (!this.animId) {
        this.animate();
      }
    }

    animate() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.life -= p.decay;

        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        this.animId = requestAnimationFrame(() => this.animate());
      } else {
        this.animId = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }

  function showToast(message, icon = '🎉') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    const iconSpan = document.createElement('span');
    iconSpan.textContent = icon;
    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  /**
   * ============================================================================
   * SCOREBOARD RENDERING
   * ============================================================================
   */
  function renderScoreboard() {
    const tbody = document.getElementById('scoreboard-tbody');
    tbody.innerHTML = '';

    if (gameState.players.length === 0) {
      document.getElementById('scoreboard-empty-note').style.display = 'block';
      return;
    }
    document.getElementById('scoreboard-empty-note').style.display = 'none';

    // Sort by total score (truths + dares completed)
    const sorted = [...gameState.players].sort((a, b) => {
      const scoreA = a.truths + a.dares;
      const scoreB = b.truths + b.dares;
      return scoreB - scoreA;
    });

    sorted.forEach((p, idx) => {
      const tr = document.createElement('tr');
      const medals = ['🥇', '🥈', '🥉'];
      const rankDisplay = medals[idx] || (idx + 1);
      const totalScore = p.truths + p.dares;

      tr.innerHTML = `
        <td class="scoreboard-rank">${rankDisplay}</td>
        <td>
          <div class="scoreboard-player-info">
            <span class="player-avatar-circle" style="background:${p.color};width:24px;height:24px;font-size:0.75rem;">${escapeHTML(p.name.charAt(0))}</span>
            <span>${escapeHTML(p.name)}</span>
          </div>
        </td>
        <td>💬 ${p.truths}</td>
        <td>⚡ ${p.dares}</td>
        <td style="color:#f87171;">⚠️ ${p.skips}</td>
        <td><span class="stat-badge stat-badge-score">${totalScore} pts</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  /**
   * ============================================================================
   * CUSTOM PROMPTS MANAGER
   * ============================================================================
   */
  function updateCustomPromptsBadge() {
    document.getElementById('custom-count-badge').textContent = gameState.customPrompts.length;
  }

  function renderCustomPromptsList() {
    const list = document.getElementById('custom-prompts-list');
    list.innerHTML = '';

    if (gameState.customPrompts.length === 0) {
      document.getElementById('custom-empty-msg').style.display = 'block';
      return;
    }
    document.getElementById('custom-empty-msg').style.display = 'none';

    gameState.customPrompts.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'custom-prompt-item';
      div.innerHTML = `
        <div style="flex:1;">
          <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:${item.type === 'truth' ? 'var(--truth-base)' : 'var(--dare-base)'};margin-bottom:0.2rem;">
            ${item.type === 'truth' ? '💬 TRUTH' : '⚡ DARE'} • ${escapeHTML(item.category.toUpperCase())}
          </div>
          <div style="font-size:0.95rem;font-weight:500;">"${escapeHTML(item.text)}"</div>
        </div>
        <button class="player-remove-btn" style="font-size:1.15rem;padding:0.4rem;" data-index="${index}" title="Delete prompt">🗑️</button>
      `;
      div.querySelector('.player-remove-btn').addEventListener('click', () => {
        gameState.customPrompts.splice(index, 1);
        saveCustomPrompts();
        renderCustomPromptsList();
        showToast('Custom prompt removed', '🗑️');
      });
      list.appendChild(div);
    });
  }

  function addCustomPrompt() {
    const textInput = document.getElementById('custom-prompt-text');
    const text = textInput.value.trim();
    if (!text) {
      showToast('Please type a prompt first!', '⚠️');
      return;
    }

    const type = document.getElementById('custom-prompt-type').value;
    const category = document.getElementById('custom-prompt-category').value;

    gameState.customPrompts.push({
      id: Date.now(),
      type: type,
      category: category,
      text: text
    });

    saveCustomPrompts();
    textInput.value = '';
    gameState.sound.playSuccess();
    showToast('Custom prompt saved successfully!', '⭐');
  }

  /**
   * ============================================================================
   * MODAL UTILITIES
   * ============================================================================
   */
  function openModal(modalId) {
    gameState.sound.playClick();
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }
