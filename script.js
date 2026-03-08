// Tic-Tac-Toe+ v4
// Added CSS class mapping for Neon glows

const board = document.getElementById("game-board");
const cells = Array.from(board.getElementsByClassName("cell"));
const playPauseButton = document.getElementById("play-pause-button");
const resetButton = document.getElementById("reset-button");
const nextRoundBtn = document.getElementById("next-round-button");
const swapStarterButton = document.getElementById("swap-starter-button");
const playerXTimerElem = document.getElementById("player-x-timer");
const playerOTimerElem = document.getElementById("player-o-timer");
const cardX = document.getElementById("card-x");
const cardO = document.getElementById("card-o");
const popup = document.getElementById("popup");
const popupMessage = document.querySelector(".popup-message");
const overlay = document.getElementById("overlay");
const rulesButton = document.getElementById("rules-button");
const rulesModal = document.getElementById("rules-modal");
const settingsButton = document.getElementById("settings-button");
const settingsModal = document.getElementById("settings-modal");
const closeButtons = document.querySelectorAll(".close-button");
const currentTurnElem = document.getElementById("current-turn");
const scoreXElem = document.getElementById("score-x");
const scoreOElem = document.getElementById("score-o");
const nameXInput = document.getElementById("name-x");
const nameOInput = document.getElementById("name-o");

const enableSfxInput = document.getElementById("enable-sfx");
const highlightWinsInput = document.getElementById("highlight-wins");
const adjacentMovesInput = document.getElementById("adjacent-moves");
const vibrateInput = document.getElementById("vibrate");
const timeInput = document.getElementById("time-input");
const applySettingsBtn = document.getElementById("apply-settings");
const randomStarterInput = document.getElementById("random-starter");
const confettiCanvas = document.getElementById("confetti-canvas");
const modeToggle = document.getElementById("mode-toggle");

// ---- audio ----
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const sfx = {
  click: () => tone(370, 0.05),
  place: () => tone(520, 0.08),
  move: () => tone(440, 0.08),
  win: () => arpeggio([660, 880, 1100], 0.07),
  illegal: () => tone(120, 0.12),
  start: () => arpeggio([330, 440, 550], 0.05),
};

function tone(freq, dur) {
  if (!enableSfxInput.checked) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g).connect(audioCtx.destination);
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.value = 0.06;
  o.start();
  o.stop(audioCtx.currentTime + dur);
}

function arpeggio(freqs, dur) {
  if (!enableSfxInput.checked) return;
  let t = audioCtx.currentTime;
  freqs.forEach((f, i) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g).connect(audioCtx.destination);
    o.type = "triangle";
    o.frequency.value = f;
    g.gain.setValueAtTime(0.05, t + i * dur);
    o.start(t + i * dur);
    o.stop(t + (i + 1) * dur);
  });
}

// ---- game state ----
let currentPlayer = "X";
let selectedCell = null;
let lastPieceIndex = { X: null, O: null };
let playerTurns = { X: 0, O: 0 };
let playerPieces = { X: [], O: [] };
let timers = { X: 180, O: 180 };
let timerInterval = null;
let gameStarted = false;
let paused = false;
let scores = { X: 0, O: 0 };
let starter = "X";
let autoNextTimeout = null;
let countdownInterval = null;

// ---- helpers ----
function formatTime(s) {
  const m = Math.floor(s / 60),
    r = s % 60;
  return `${m}:${r < 10 ? "0" : ""}${r}`;
}

function updateTurnUI() {
  const name =
    currentPlayer === "X"
      ? nameXInput.value || "Player X"
      : nameOInput.value || "Player O";
  currentTurnElem.textContent = `${name}'s Turn${playerTurns[currentPlayer] < 3 ? "" : " (Select & Move)"}`;

  if (currentPlayer === "X") {
    cardX.classList.add("active-turn");
    cardO.classList.remove("active-turn");
  } else {
    cardO.classList.add("active-turn");
    cardX.classList.remove("active-turn");
  }
}

function startTimer(player) {
  stopTimer();
  currentPlayer = player;
  updateTurnUI();
  timerInterval = setInterval(() => {
    if (timers[player] > 0) {
      timers[player]--;
      document.getElementById(
        `player-${player.toLowerCase()}-timer`,
      ).textContent = formatTime(timers[player]);
    } else {
      clearInterval(timerInterval);
      handleWin(opponent(player), `${labelFor(player)} ran out of time!`);
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function opponent(p) {
  return p === "X" ? "O" : "X";
}
function labelFor(p) {
  return p === "X"
    ? nameXInput.value || "Player X"
    : nameOInput.value || "Player O";
}

function neighborsOf(i) {
  const r = Math.floor(i / 3),
    c = i % 3,
    res = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr,
        nc = c + dc;
      if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) res.push(nr * 3 + nc);
    }
  return res;
}

function checkWinFor(p) {
  const W = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  return W.some((w) => {
    if (w.every((i) => cells[i].textContent === p)) {
      if (highlightWinsInput.checked)
        w.forEach((i) => cells[i].classList.add("win"));
      return true;
    }
    return false;
  });
}

function handleWin(winner, customMsg = null) {
  scores[winner]++;
  scoreXElem.textContent = scores.X;
  scoreOElem.textContent = scores.O;

  sfx.win();
  celebrate(); // Fireworks!

  popupMessage.innerHTML = customMsg || `${labelFor(winner)} Wins!`;
  popup.classList.add("active");
  overlay.classList.add("active");
  if (vibrateInput.checked && navigator.vibrate) navigator.vibrate(200);

  endRound();
}

function endRound() {
  stopTimer();
  gameStarted = false;
  playPauseButton.disabled = true;
  playPauseButton.innerHTML = "⏸ Pause";

  let countdown = 10;
  document.querySelector(".popup-subtext").textContent =
    `Next round starts in ${countdown}s...`;

  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    countdown--;
    document.querySelector(".popup-subtext").textContent =
      `Next round starts in ${countdown}s...`;
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      triggerNextRound();
    }
  }, 1000);
}

function triggerNextRound() {
  if (countdownInterval) clearInterval(countdownInterval);
  popup.classList.remove("active");
  overlay.classList.remove("active");
  starter = randomStarterInput.checked
    ? Math.random() < 0.5
      ? "X"
      : "O"
    : opponent(starter);
  resetBoardState();
}

function resetBoardState() {
  selectedCell = null;
  lastPieceIndex = { X: null, O: null };
  playerTurns = { X: 0, O: 0 };
  playerPieces = { X: [], O: [] };

  const secs = parseTimeToSeconds(timeInput.value);
  timers = { X: secs, O: secs };
  playerXTimerElem.textContent = formatTime(timers.X);
  playerOTimerElem.textContent = formatTime(timers.O);

  currentPlayer = starter;
  cells.forEach((c) => {
    c.textContent = "";
    c.className = "cell";
  });

  currentTurnElem.textContent = "Click any tile to start!";
  cardX.classList.remove("active-turn");
  cardO.classList.remove("active-turn");
  playPauseButton.disabled = true;
  gameStarted = false;
  paused = false;

  confettiParticles = [];
}

function selectCellElement(cell) {
  if (selectedCell) selectedCell.classList.remove("selected");
  selectedCell = cell;
  if (cell) cell.classList.add("selected");
}

function parseTimeToSeconds(str) {
  const m = /^(\d+):(\d{2})$/.exec(str.trim());
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 180;
}

// ---- clicks ----
function handleCellClick(e) {
  const cell = e.currentTarget;
  const idx = +cell.getAttribute("data-index");

  // Auto-start on first click
  if (!gameStarted) {
    if (paused) return;
    gameStarted = true;
    playPauseButton.disabled = false;
    sfx.start();
    startTimer(currentPlayer);
  }

  if (paused) {
    sfx.illegal();
    return;
  }

  // Deselect / Select own piece
  if (cell.classList.contains("taken") && cell.textContent === currentPlayer) {
    if (selectedCell === cell) {
      selectCellElement(null);
      sfx.click();
    } else {
      selectCellElement(cell);
      sfx.click();
    }
    return;
  }

  // Move Phase
  if (!cell.classList.contains("taken") && selectedCell) {
    const fromIdx = +selectedCell.getAttribute("data-index");
    const canMove = playerPieces[currentPlayer].includes(fromIdx);
    const adjacencyOK =
      !adjacentMovesInput.checked || neighborsOf(fromIdx).includes(idx);

    if (canMove && adjacencyOK) {
      // Clear old cell
      selectedCell.textContent = "";
      selectedCell.classList.remove("taken", "selected", "x-piece", "o-piece");

      // Update new cell
      cell.textContent = currentPlayer;
      cell.classList.add(
        "taken",
        currentPlayer === "X" ? "x-piece" : "o-piece",
      );

      playerPieces[currentPlayer] = playerPieces[currentPlayer].map((i) =>
        i === fromIdx ? idx : i,
      );
      lastPieceIndex[currentPlayer] = idx;
      selectCellElement(null);
      sfx.move();

      if (checkWinFor(currentPlayer)) return handleWin(currentPlayer);
      switchPlayer();
      return;
    } else {
      sfx.illegal();
      bounce(cell);
      return;
    }
  }

  // Place Phase
  if (!cell.classList.contains("taken") && playerTurns[currentPlayer] < 3) {
    cell.textContent = currentPlayer;
    cell.classList.add("taken", currentPlayer === "X" ? "x-piece" : "o-piece");

    playerPieces[currentPlayer].push(idx);
    playerTurns[currentPlayer]++;
    lastPieceIndex[currentPlayer] = idx;
    sfx.place();

    if (checkWinFor(currentPlayer)) return handleWin(currentPlayer);
    switchPlayer();
    return;
  }

  sfx.illegal();
  bounce(cell);
}

function bounce(el) {
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

function switchPlayer() {
  currentPlayer = opponent(currentPlayer);
  updateTurnUI();
  if (playerTurns[currentPlayer] >= 3) {
    const lastCell = cells[lastPieceIndex[currentPlayer]];
    selectCellElement(lastCell);
  } else {
    selectCellElement(null);
  }
  startTimer(currentPlayer);
}

// ---- header controls ----
playPauseButton.addEventListener("click", () => {
  if (!gameStarted) return;
  paused = !paused;
  if (paused) {
    stopTimer();
    playPauseButton.innerHTML = "▶️ Play";
    currentTurnElem.textContent = "Game Paused";
  } else {
    startTimer(currentPlayer);
    playPauseButton.innerHTML = "⏸ Pause";
  }
});

resetButton.addEventListener("click", () => {
  stopTimer();
  scores = { X: 0, O: 0 };
  scoreXElem.textContent = "0";
  scoreOElem.textContent = "0";
  starter = "X";
  resetBoardState();
});

swapStarterButton.addEventListener("click", () => {
  if (gameStarted) return;
  starter = opponent(starter);
  currentPlayer = starter;
  cardX.classList.remove("active-turn");
  cardO.classList.remove("active-turn");
  currentTurnElem.textContent = `${labelFor(starter)} will start. Click a tile!`;
});

nextRoundBtn.addEventListener("click", () => {
  triggerNextRound();
});

// ---- Modals ----
function openModal(m) {
  m.classList.add("active");
  m.setAttribute("aria-hidden", "false");
  overlay.classList.add("active");
}
function closeAllModals() {
  [rulesModal, settingsModal].forEach((m) => {
    m.classList.remove("active");
    m.setAttribute("aria-hidden", "true");
  });
  if (!popup.classList.contains("active")) overlay.classList.remove("active");
}
rulesButton.addEventListener("click", () => openModal(rulesModal));
settingsButton.addEventListener("click", () => openModal(settingsModal));
closeButtons.forEach((btn) => btn.addEventListener("click", closeAllModals));
overlay.addEventListener("click", () => {
  if (!popup.classList.contains("active")) closeAllModals();
});

applySettingsBtn.addEventListener("click", () => {
  const seconds = parseTimeToSeconds(timeInput.value);
  if (!gameStarted) {
    playerXTimerElem.textContent = formatTime(seconds);
    playerOTimerElem.textContent = formatTime(seconds);
    timers = { X: seconds, O: seconds };
  }
  closeAllModals();
});

modeToggle.addEventListener("change", (e) => {
  const dark = e.target.checked;
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  e.target.nextElementSibling.textContent = dark ? "Dark" : "Light";
});

// ---- Fireworks Confetti ----
let confettiParticles = [];
function celebrate() {
  resizeCanvas();
  confettiParticles = makeFireworksParticles();
  let t0 = null;
  function frame(ts) {
    if (!t0) t0 = ts;
    const dt = Math.min(16, ts - t0);
    t0 = ts;
    drawConfetti(dt);
    if (confettiParticles.some((p) => p.life > 0)) requestAnimationFrame(frame);
    else {
      const ctx = confettiCanvas.getContext("2d");
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }
  requestAnimationFrame(frame);
}

function makeFireworksParticles() {
  const W = confettiCanvas.width,
    H = confettiCanvas.height,
    parts = [];
  const colors = ["#ff2a6d", "#05d9e8", "#f59e0b", "#10b981", "#8b5cf6"];

  for (let i = 0; i < 200; i++) {
    const isLeft = i % 2 === 0;
    const x = isLeft ? 0 : W;
    const y = H;
    const vx = (isLeft ? 1 : -1) * (Math.random() * 15 + 5);
    const vy = -(Math.random() * 20 + 10);
    const g = 0.15 + Math.random() * 0.1;

    parts.push({
      x,
      y,
      vx,
      vy,
      g,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 10,
      r: Math.random() * Math.PI,
      vr: -0.2 + Math.random() * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 3000 + Math.random() * 2000,
    });
  }
  return parts;
}

function resizeCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);

function drawConfetti(dt) {
  const ctx = confettiCanvas.getContext("2d");
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles.forEach((p) => {
    if (p.life <= 0) return;
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.r += p.vr;
    p.life -= dt;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  });
}

// ---- init ----
document.addEventListener("DOMContentLoaded", () => {
  resetBoardState();
  cells.forEach((c) => c.addEventListener("click", handleCellClick));
  resizeCanvas();
});
