/* ═══════════════════════════════════════════════════════
   Snake Water Gun — Game Logic + Visual Effects (v2)
   Fully features-wired, interactive, and optimized
   ═══════════════════════════════════════════════════════ */

(() => {
  "use strict";

  // ── Constants ─────────────────────────────────────────
  const CHOICES = ["snake", "water", "gun"];
  const EMOJI = { snake: "🐍", water: "💧", gun: "🔫" };
  const LABEL = { snake: "Snake", water: "Water", gun: "Gun" };

  // Win map: key beats value
  const WIN_MAP = {
    snake: "gun",    // Snake eats the gun
    water: "snake",  // Water drowns the snake
    gun: "water",    // Gun shoots through water
  };

  const RESULT_MESSAGES = {
    win: [
      "You crushed it! 💪",
      "Victory is yours! 🏆",
      "Absolutely dominated! 🔥",
      "Clean win! ✨",
      "Legendary move! 👑",
    ],
    lose: [
      "Better luck next time 😅",
      "CPU got you this round 🤖",
      "Ouch, tough break 💔",
      "The machine strikes back 🦾",
      "Not your round… 😤",
    ],
    draw: [
      "Great minds think alike! 🤝",
      "A perfect mirror! 🪞",
      "Stalemate! ⚖️",
      "Tied up! 🔗",
      "Same wavelength! 📡",
    ],
  };

  const BEAT_DESCRIPTIONS = {
    snake_gun: "Snake eats the Gun",
    water_snake: "Water drowns the Snake",
    gun_water: "Gun shoots through Water",
    gun_snake: "Snake eats the Gun",
    snake_water: "Water drowns the Snake",
    water_gun: "Gun shoots through Water",
  };

  // ── Sound Synthesizer (Web Audio API) ──────────────────
  const synth = {
    ctx: null,
    enabled: true,

    init() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
    },

    play(type) {
      if (!this.enabled) return;
      
      try {
        this.init();
        if (this.ctx.state === "suspended") {
          this.ctx.resume();
        }

        const now = this.ctx.currentTime;

        switch (type) {
          case "clickHover": {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(800, now);
            gain.gain.setValueAtTime(0.015, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
            break;
          }
          case "click": {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
          }
          case "tick": {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = "square";
            osc.frequency.setValueAtTime(600, now);
            gain.gain.setValueAtTime(0.02, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
            break;
          }
          case "win": {
            const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
            notes.forEach((freq, idx) => {
              const t = now + idx * 0.08;
              const osc = this.ctx.createOscillator();
              const gain = this.ctx.createGain();
              osc.connect(gain);
              gain.connect(this.ctx.destination);
              osc.type = "triangle";
              osc.frequency.setValueAtTime(freq, t);
              gain.gain.setValueAtTime(0.15, t);
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
              osc.start(t);
              osc.stop(t + 0.3);
            });
            break;
          }
          case "lose": {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(110, now + 0.45);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
            break;
          }
          case "draw": {
            [0, 0.12].forEach((delayTime) => {
              const t = now + delayTime;
              const osc = this.ctx.createOscillator();
              const gain = this.ctx.createGain();
              osc.connect(gain);
              gain.connect(this.ctx.destination);
              osc.type = "sine";
              osc.frequency.setValueAtTime(300, t);
              gain.gain.setValueAtTime(0.1, t);
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
              osc.start(t);
              osc.stop(t + 0.08);
            });
            break;
          }
          case "matchWin": {
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
            notes.forEach((freq, idx) => {
              const t = now + idx * 0.12;
              const osc = this.ctx.createOscillator();
              const gain = this.ctx.createGain();
              osc.connect(gain);
              gain.connect(this.ctx.destination);
              osc.type = "triangle";
              osc.frequency.setValueAtTime(freq, t);
              gain.gain.setValueAtTime(0.2, t);
              gain.gain.exponentialRampToValueAtTime(0.002, t + 0.5);
              osc.start(t);
              osc.stop(t + 0.5);
            });
            break;
          }
          case "matchLose": {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(75, now + 0.8);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            osc.start(now);
            osc.stop(now + 0.8);
            break;
          }
        }
      } catch (err) {
        console.warn("Audio Context block or error: ", err);
      }
    }
  };

  // ── State ─────────────────────────────────────────────
  let state = {
    gameMode: "free", // "free", "bo3", "bo5", "bo7"
    scoreYou: 0,
    scoreCpu: 0,
    round: 1,
    streak: 0,
    history: [],
    isPlaying: false,
    matchOver: false,
    timeLeft: 5.0,
    timerInterval: null
  };

  const defaultStats = {
    total: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    bestStreak: 0,
    choiceCounts: { snake: 0, water: 0, gun: 0 }
  };

  let overallStats = { ...defaultStats };

  // ── DOM References ────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  
  const scoreYouEl = $("#score-you");
  const scoreCpuEl = $("#score-cpu");
  const roundBadge = $("#round-badge");
  const streakText = $("#streak-text");
  const playerCard = $("#player-card");
  const cpuCard = $("#cpu-card");
  const playerEmoji = $("#player-emoji");
  const cpuEmoji = $("#cpu-emoji");
  const vsBadge = $("#vs-badge");
  const resultBanner = $("#result-banner");
  const resultText = $("#result-text");
  const resultSub = $("#result-sub");
  const choicesContainer = $("#choices");
  const playAgainBtn = $("#play-again");
  const historyPanel = $("#history");
  const historyList = $("#history-list");
  
  const choiceButtons = document.querySelectorAll(".choice-card");
  const modeButtons = document.querySelectorAll(".mode-btn");
  
  // Toolbar and control buttons
  const soundToggle = $("#sound-toggle");
  const statsToggle = $("#stats-toggle");
  const resetBtn = $("#reset-btn");
  
  // Pips
  const pipsYouContainer = $("#pips-you");
  const pipsCpuContainer = $("#pips-cpu");
  
  // Timer Elements
  const timerContainer = $("#timer-container");
  const timerBar = $("#timer-bar");
  const timerLabel = $("#timer-label");

  // Match Winner Overlay
  const matchOverlay = $("#match-overlay");
  const winnerTrophy = $("#winner-trophy");
  const winnerTitle = $("#winner-title");
  const winnerScore = $("#winner-score");
  const newMatchBtn = $("#new-match-btn");

  // Stats Panel Overlay
  const statsOverlay = $("#stats-overlay");
  const statsClose = $("#stats-close");
  const resetStatsBtn = $("#reset-stats-btn");

  // ── Helper functions ──────────────────────────────────
  function getTargetWins() {
    if (state.gameMode === "bo3") return 2;
    if (state.gameMode === "bo5") return 3;
    if (state.gameMode === "bo7") return 4;
    return 0; // Infinite
  }

  function getComputerChoice() {
    return CHOICES[Math.floor(Math.random() * CHOICES.length)];
  }

  // Adaptive CPU Choice
  function getAdaptiveCpuChoice() {
    const history = state.history;
    // Pure random fallback if not enough history
    if (history.length < 3) {
      return getComputerChoice();
    }

    const lastChoice = history[history.length - 1].player;
    
    // Count player transition patterns from the last choice
    const transitions = { snake: 0, water: 0, gun: 0 };
    let totalTransitions = 0;
    
    for (let i = 0; i < history.length - 1; i++) {
      if (history[i].player === lastChoice) {
        const nextChoice = history[i + 1].player;
        transitions[nextChoice]++;
        totalTransitions++;
      }
    }

    let predictedPlayerChoice = null;
    if (totalTransitions > 0) {
      let maxCount = -1;
      for (const choice of CHOICES) {
        if (transitions[choice] > maxCount) {
          maxCount = transitions[choice];
          predictedPlayerChoice = choice;
        }
      }
    } else {
      // Fallback: Player's overall favorite choice
      const counts = { snake: 0, water: 0, gun: 0 };
      history.forEach(h => counts[h.player]++);
      let maxCount = -1;
      for (const choice of CHOICES) {
        if (counts[choice] > maxCount) {
          maxCount = counts[choice];
          predictedPlayerChoice = choice;
        }
      }
    }

    if (!predictedPlayerChoice) {
      predictedPlayerChoice = getComputerChoice();
    }

    // Adaptive CPU counters the prediction 75% of the time, other 25% is purely random
    if (Math.random() < 0.75) {
      const counterChoice = Object.keys(WIN_MAP).find(k => WIN_MAP[k] === predictedPlayerChoice);
      return counterChoice || getComputerChoice();
    } else {
      return getComputerChoice();
    }
  }

  function determineResult(player, computer) {
    if (player === computer) return "draw";
    if (WIN_MAP[player] === computer) return "win";
    return "lose";
  }

  function getRandomMessage(result) {
    const arr = RESULT_MESSAGES[result];
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getBeatDescription(player, computer) {
    const key = `${player}_${computer}`;
    return BEAT_DESCRIPTIONS[key] || "";
  }

  // ── UI Updates ────────────────────────────────────────
  function updateScoreboard() {
    scoreYouEl.textContent = state.scoreYou;
    scoreCpuEl.textContent = state.scoreCpu;
    roundBadge.textContent = `Round ${state.round}`;

    if (state.streak >= 2) {
      streakText.textContent = `🔥 ${state.streak} win streak!`;
    } else {
      streakText.textContent = "";
    }
  }

  function animateScore(el) {
    el.classList.remove("bump");
    void el.offsetWidth; // Force reflow
    el.classList.add("bump");
  }

  function disableChoices() {
    choiceButtons.forEach((btn) => btn.classList.add("disabled"));
  }

  function enableChoices() {
    choiceButtons.forEach((btn) => {
      btn.classList.remove("disabled", "selected");
    });
  }

  function resetArena() {
    playerCard.className = "arena-card glass";
    cpuCard.className = "arena-card glass";
    playerEmoji.textContent = "❓";
    cpuEmoji.textContent = "❓";
    resultBanner.classList.remove("visible");
    resultText.className = "result-text";
    playAgainBtn.style.display = "none";
  }

  function drawPips() {
    pipsYouContainer.innerHTML = "";
    pipsCpuContainer.innerHTML = "";

    if (state.gameMode === "free") return;

    const targetWins = getTargetWins();
    for (let i = 0; i < targetWins; i++) {
      const pipYou = document.createElement("div");
      pipYou.className = "pip";
      if (i < state.scoreYou) pipYou.classList.add("won-you");
      pipsYouContainer.appendChild(pipYou);

      const pipCpu = document.createElement("div");
      pipCpu.className = "pip";
      if (i < state.scoreCpu) pipCpu.classList.add("won-cpu");
      pipsCpuContainer.appendChild(pipCpu);
    }
  }

  function addHistoryRow(round, player, computer, result) {
    const row = document.createElement("div");
    row.className = "history-row";
    row.innerHTML = `
      <span class="history-round">#${round}</span>
      <span class="history-matchup">${EMOJI[player]} vs ${EMOJI[computer]}</span>
      <span class="history-result ${result}">${result.toUpperCase()}</span>
    `;
    historyList.prepend(row);
    historyPanel.style.display = "block";
  }

  // Sliding mode indicator
  function updateModeIndicator() {
    const activeBtn = $(`.mode-btn[data-mode="${state.gameMode}"]`);
    if (activeBtn) {
      const indicator = $("#mode-indicator");
      indicator.style.left = `${activeBtn.offsetLeft}px`;
      indicator.style.width = `${activeBtn.offsetWidth}px`;
    }
  }

  // ── Confetti Effect ───────────────────────────────────
  function spawnConfetti(count = 40) {
    const colors = ["#00e88f", "#60a5fa", "#a78bfa", "#fbbf24", "#f87171", "#22d3ee"];
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "confetti";
      el.style.left = `${Math.random() * 100}vw`;
      el.style.top = `${Math.random() * 30 + 20}vh`;
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      el.style.width = `${Math.random() * 8 + 4}px`;
      el.style.height = `${Math.random() * 8 + 4}px`;
      el.style.animationDuration = `${Math.random() * 1 + 1}s`;
      el.style.animationDelay = `${Math.random() * 0.3}s`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    }
  }

  // ── Timer Logic ───────────────────────────────────────
  function stopTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
    timerContainer.style.display = "none";
    timerContainer.classList.remove("urgent");
  }

  function startTimer() {
    stopTimer();
    if (state.gameMode === "free") return;

    state.timeLeft = 5.0;
    timerContainer.style.display = "flex";
    timerBar.style.width = "100%";
    timerLabel.textContent = "5s";
    
    let lastTickInt = 5;

    state.timerInterval = setInterval(() => {
      state.timeLeft -= 0.1;

      if (state.timeLeft <= 0) {
        stopTimer();
        // Time Out: pick random choice automatically
        const randomChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];
        playRound(randomChoice, true);
        return;
      }

      // Update UI
      const pct = (state.timeLeft / 5.0) * 100;
      timerBar.style.width = `${pct}%`;

      const currentCeil = Math.ceil(state.timeLeft);
      timerLabel.textContent = `${currentCeil}s`;

      // Play beep tick sound in final seconds
      if (state.timeLeft <= 2.0) {
        timerContainer.classList.add("urgent");
        if (currentCeil < lastTickInt) {
          synth.play("tick");
          lastTickInt = currentCeil;
        }
      } else {
        timerContainer.classList.remove("urgent");
      }
    }, 100);
  }

  // ── Match Overlays ────────────────────────────────────
  function showMatchWinnerOverlay() {
    stopTimer();
    const isUserWinner = state.scoreYou > state.scoreCpu;
    
    if (isUserWinner) {
      winnerTrophy.textContent = "🏆";
      winnerTitle.textContent = "You Win the Match!";
      winnerTitle.className = "winner-title";
      synth.play("matchWin");
      spawnConfetti(80);
      setTimeout(() => spawnConfetti(50), 300);
    } else {
      winnerTrophy.textContent = "🤖";
      winnerTitle.textContent = "CPU Wins the Match!";
      winnerTitle.className = "winner-title cpu-wins";
      synth.play("matchLose");
    }

    winnerScore.textContent = `${state.scoreYou} – ${state.scoreCpu}`;
    matchOverlay.style.display = "flex";
  }

  // ── Stats Tracking ────────────────────────────────────
  function loadStats() {
    const saved = localStorage.getItem("swg_overall_stats");
    if (saved) {
      try {
        overallStats = JSON.parse(saved);
        // Fallback for missing keys in older saves
        overallStats.total = overallStats.total || 0;
        overallStats.wins = overallStats.wins || 0;
        overallStats.losses = overallStats.losses || 0;
        overallStats.draws = overallStats.draws || 0;
        overallStats.bestStreak = overallStats.bestStreak || 0;
        overallStats.choiceCounts = overallStats.choiceCounts || { snake: 0, water: 0, gun: 0 };
      } catch (e) {
        overallStats = { ...defaultStats };
      }
    } else {
      overallStats = { ...defaultStats };
    }
  }

  function updateStatsPanel() {
    $("#stat-total").textContent = overallStats.total;
    $("#stat-wins").textContent = overallStats.wins;
    $("#stat-losses").textContent = overallStats.losses;
    $("#stat-draws").textContent = overallStats.draws;

    // Win Rate Percentage
    const winRate = overallStats.total > 0 ? Math.round((overallStats.wins / overallStats.total) * 100) : 0;
    $("#stat-winrate").textContent = `${winRate}%`;
    $("#win-rate-fill").style.width = `${winRate}%`;

    // Streak
    $("#stat-best-streak").textContent = `${overallStats.bestStreak} 🔥`;

    // Favorite Choice
    const counts = overallStats.choiceCounts;
    const maxVal = Math.max(counts.snake, counts.water, counts.gun);
    let fav = "—";
    if (maxVal > 0) {
      if (counts.snake === maxVal) fav = "Snake 🐍";
      else if (counts.water === maxVal) fav = "Water 💧";
      else fav = "Gun 🔫";
      
      const pct = Math.round((maxVal / overallStats.total) * 100);
      fav += ` (${pct}%)`;
    }
    $("#stat-fav-pick").textContent = fav;
  }

  // ── Play Round ────────────────────────────────────────
  async function playRound(playerChoice, isTimeout = false) {
    if (state.isPlaying || state.matchOver) return;
    state.isPlaying = true;

    stopTimer();

    // Sound effect feedback
    synth.play("click");

    // Highlight selected card
    choiceButtons.forEach((btn) => {
      if (btn.dataset.choice === playerChoice) {
        btn.classList.add("selected");
      }
    });
    disableChoices();

    // Show player choice immediately
    playerEmoji.textContent = EMOJI[playerChoice];
    playerCard.classList.add("revealed");

    // CPU "thinking" animation
    cpuCard.classList.add("thinking");
    cpuEmoji.textContent = "🤔";

    // Play suspense tick while computer thinks
    const thinkTick = setInterval(() => {
      if (state.isPlaying) synth.play("tick");
    }, 200);

    // Suspenseful animation delay
    await delay(800);
    clearInterval(thinkTick);

    // CPU picks
    const cpuChoice = getAdaptiveCpuChoice();
    cpuCard.classList.remove("thinking");
    cpuEmoji.textContent = EMOJI[cpuChoice];
    cpuCard.classList.add("revealed");

    // VS clash
    vsBadge.classList.remove("clash");
    void vsBadge.offsetWidth; // force reflow
    vsBadge.classList.add("clash");

    await delay(300);

    // Determine result
    const result = determineResult(playerChoice, cpuChoice);

    // Update arena cards & state
    if (result === "win") {
      playerCard.classList.add("win");
      cpuCard.classList.add("lose");
      state.scoreYou++;
      state.streak++;
      animateScore(scoreYouEl);
      spawnConfetti();
      synth.play("win");
    } else if (result === "lose") {
      playerCard.classList.add("lose");
      cpuCard.classList.add("win");
      state.scoreCpu++;
      state.streak = 0;
      animateScore(scoreCpuEl);
      synth.play("lose");
    } else {
      playerCard.classList.add("draw");
      cpuCard.classList.add("draw");
      state.streak = 0;
      synth.play("draw");
    }

    // Show result banner
    resultText.textContent = getRandomMessage(result);
    resultText.className = `result-text ${result}`;
    
    let description = result === "draw"
      ? `Both picked ${LABEL[playerChoice]}`
      : getBeatDescription(
          result === "win" ? playerChoice : cpuChoice,
          result === "win" ? cpuChoice : playerChoice
        );
    
    if (isTimeout) {
      description += " ⏱️ (Time Out!)";
    }

    resultSub.textContent = description;
    resultBanner.classList.add("visible");

    // Record history
    addHistoryRow(state.round, playerChoice, cpuChoice, result);
    state.history.push({ round: state.round, player: playerChoice, cpu: cpuChoice, result });

    // Save statistics in localStorage
    overallStats.total++;
    if (result === "win") overallStats.wins++;
    else if (result === "lose") overallStats.losses++;
    else overallStats.draws++;
    overallStats.choiceCounts[playerChoice] = (overallStats.choiceCounts[playerChoice] || 0) + 1;
    if (state.streak > overallStats.bestStreak) overallStats.bestStreak = state.streak;
    localStorage.setItem("swg_overall_stats", JSON.stringify(overallStats));
    updateStatsPanel();

    state.round++;
    updateScoreboard();
    drawPips();

    // Check Best-of Match Winner
    const targetWins = getTargetWins();
    if (state.gameMode !== "free" && (state.scoreYou >= targetWins || state.scoreCpu >= targetWins)) {
      state.matchOver = true;
      await delay(800);
      showMatchWinnerOverlay();
    } else {
      playAgainBtn.style.display = "block";
    }

    state.isPlaying = false;
  }

  // ── Reset Match ───────────────────────────────────────
  function resetMatch() {
    stopTimer();
    state.scoreYou = 0;
    state.scoreCpu = 0;
    state.round = 1;
    state.matchOver = false;

    updateScoreboard();
    drawPips();
    resetArena();
    enableChoices();

    matchOverlay.style.display = "none";
    historyList.innerHTML = "";
    historyPanel.style.display = "none";

    if (state.gameMode !== "free") {
      startTimer();
    }
  }

  // ── Event Listeners ───────────────────────────────────

  // Choice Cards
  choiceButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!state.isPlaying && !state.matchOver) {
        playRound(btn.dataset.choice);
      }
    });

    // Sound effect on hovered cards
    btn.addEventListener("mouseenter", () => {
      if (!state.isPlaying && !state.matchOver && !btn.classList.contains("disabled")) {
        synth.play("clickHover");
      }
    });
  });

  // Next Round Button
  playAgainBtn.addEventListener("click", () => {
    synth.play("click");
    resetArena();
    enableChoices();
    if (state.gameMode !== "free") {
      startTimer();
    }
  });

  // New Match Button
  newMatchBtn.addEventListener("click", () => {
    synth.play("click");
    resetMatch();
  });

  // Mode Selection buttons
  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.isPlaying) return;
      
      synth.play("click");
      state.gameMode = btn.dataset.mode;
      localStorage.setItem("swg_game_mode", state.gameMode);

      modeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      
      updateModeIndicator();
      resetMatch();
    });
  });

  // Sound Toggle control
  soundToggle.addEventListener("click", () => {
    synth.enabled = !synth.enabled;
    localStorage.setItem("swg_sound_enabled", synth.enabled ? "true" : "false");
    
    soundToggle.textContent = synth.enabled ? "🔊" : "🔇";
    soundToggle.title = synth.enabled ? "Mute Sound" : "Unmute Sound";
    
    if (synth.enabled) {
      synth.play("click");
    }
  });

  // Stats Panel Controls
  statsToggle.addEventListener("click", () => {
    synth.play("click");
    updateStatsPanel();
    statsOverlay.style.display = "flex";
  });

  statsClose.addEventListener("click", () => {
    synth.play("click");
    statsOverlay.style.display = "none";
  });

  statsOverlay.addEventListener("click", (e) => {
    if (e.target === statsOverlay) {
      synth.play("click");
      statsOverlay.style.display = "none";
    }
  });

  resetStatsBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all your stats? This cannot be undone.")) {
      synth.play("click");
      overallStats = {
        total: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        bestStreak: 0,
        choiceCounts: { snake: 0, water: 0, gun: 0 }
      };
      localStorage.setItem("swg_overall_stats", JSON.stringify(overallStats));
      updateStatsPanel();
    }
  });

  // Reset current match
  resetBtn.addEventListener("click", () => {
    synth.play("click");
    if (confirm("Reset the current match and score?")) {
      resetMatch();
    }
  });

  // Keyboard Shortcuts
  document.addEventListener("keydown", (e) => {
    if (state.isPlaying || state.matchOver) return;

    const keyMap = { s: "snake", w: "water", g: "gun" };
    const choice = keyMap[e.key.toLowerCase()];

    // Pick Choice (S / W / G)
    if (choice && !document.querySelector(".choice-card.disabled")) {
      playRound(choice);
    }

    // Play next round (Enter)
    if (e.key === "Enter" && playAgainBtn.style.display !== "none") {
      synth.play("click");
      resetArena();
      enableChoices();
      if (state.gameMode !== "free") {
        startTimer();
      }
    }
  });

  // ── Particle Background ───────────────────────────────
  function initParticles() {
    const canvas = document.getElementById("particles");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let particles = [];
    let animationId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createParticles() {
      particles = [];
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 80);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.3 + 0.05,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148, 163, 200, ${p.alpha})`;
        ctx.fill();
      });

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(148, 163, 200, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    }

    window.addEventListener("resize", () => {
      resize();
      createParticles();
    });

    resize();
    createParticles();
    draw();
  }

  // ── Utility ───────────────────────────────────────────
  function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ── Initialization ────────────────────────────────────
  function init() {
    // Load Preferences
    const savedMode = localStorage.getItem("swg_game_mode");
    if (savedMode && ["free", "bo3", "bo5", "bo7"].includes(savedMode)) {
      state.gameMode = savedMode;
    }
    
    // Toggle active mode buttons on start
    modeButtons.forEach((btn) => {
      if (btn.dataset.mode === state.gameMode) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Sound preferences
    const savedSound = localStorage.getItem("swg_sound_enabled");
    if (savedSound === "false") {
      synth.enabled = false;
      soundToggle.textContent = "🔇";
      soundToggle.title = "Unmute Sound";
    } else {
      synth.enabled = true;
      soundToggle.textContent = "🔊";
      soundToggle.title = "Mute Sound";
    }

    // Load and build Stats
    loadStats();
    updateStatsPanel();

    // Trigger match reset
    resetMatch();

    // Align sliding mode selector
    setTimeout(updateModeIndicator, 100);
    setTimeout(updateModeIndicator, 500);
    window.addEventListener("resize", updateModeIndicator);

    // Run particle background
    initParticles();
  }

  // Start the app when loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
