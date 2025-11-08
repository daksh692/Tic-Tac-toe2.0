// Tic-Tac-Toe+ v2 (fixed modal interactions)
// - Auto-select last piece in movement phase
// - Confetti celebration + auto-next-round after 10s
// - Light/Dark mode

const board = document.getElementById("game-board");
const cells = Array.from(board.getElementsByClassName("cell"));
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const resetButton = document.getElementById("reset-button");
const nextRoundButton = document.getElementById("next-round-button");
const swapStarterButton = document.getElementById("swap-starter-button");
const playerXTimerElem = document.getElementById("player-x-timer");
const playerOTimerElem = document.getElementById("player-o-timer");
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

// ---- helpers ----
function formatTime(s) {
  const m = Math.floor(s / 60),
    r = s % 60;
  return `${m}:${r < 10 ? "0" : ""}${r}`;
}
function setTurnText() {
  const name =
    currentPlayer === "X"
      ? nameXInput.value || "Player X"
      : nameOInput.value || "Player O";
  currentTurnElem.textContent = `Current Turn: ${name}${
    playerTurns[currentPlayer] < 3 ? "" : " — select & move"
  }`;
}
function startTimer(player) {
  stopTimer();
  currentPlayer = player;
  setTurnText();
  timerInterval = setInterval(() => {
    if (timers[player] > 0) {
      timers[player]--;
      document.getElementById(
        `player-${player.toLowerCase()}-timer`
      ).textContent = formatTime(timers[player]);
    } else {
      clearInterval(timerInterval);
      announce(
        `${labelFor(player)} ran out of time! ${labelFor(
          opponent(player)
        )} wins the round.`
      );
      award(opponent(player));
      celebrate(opponent(player));
      endRound();
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
function applyWinHighlight(pat) {
  if (!highlightWinsInput.checked) return;
  pat.forEach((i) => cells[i].classList.add("win"));
}
function clearWinHighlight() {
  cells.forEach((c) => c.classList.remove("win"));
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
  return W.some(
    (w) =>
      w.every((i) => cells[i].textContent === p) && (applyWinHighlight(w), true)
  );
}
function announce(msg) {
  popupMessage.innerHTML = msg;
  popup.classList.add("active");
  overlay.classList.add("active");
  if (vibrateInput.checked && navigator.vibrate) navigator.vibrate(100);
}
function hidePopup() {
  popup.classList.remove("active");
  overlay.classList.remove("active");
}
function parseTimeToSeconds(str) {
  const m = /^(\d+):(\d{2})$/.exec(str.trim());
  if (!m) return 180;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}
function award(p) {
  scores[p] += 1;
  scoreXElem.textContent = scores.X;
  scoreOElem.textContent = scores.O;
}
function endRound() {
  stopTimer();
  gameStarted = false;
  if (autoNextTimeout) clearTimeout(autoNextTimeout);
  autoNextTimeout = setTimeout(() => {
    starter = opponent(starter);
    beginRound();
    hidePopup();
  }, 10000);
}
function beginRound() {
  resetBoardState();
  gameStarted = true;
  paused = false;
  startTimer(currentPlayer);
  sfx.start();
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
  clearWinHighlight();
  cells.forEach((c) => {
    c.textContent = "";
    c.classList.remove("taken", "selected", "win");
  });
  setTurnText();
}
function selectCellElement(cell) {
  if (selectedCell) selectedCell.classList.remove("selected");
  selectedCell = cell;
  if (cell) cell.classList.add("selected");
}
function selectIndexIfOwned(p, idx) {
  const cell = cells[idx];
  if (cell && cell.classList.contains("taken") && cell.textContent === p)
    selectCellElement(cell);
}

// ---- clicks ----
function handleCellClick(e) {
  const cell = e.currentTarget;
  const idx = +cell.getAttribute("data-index");
  if (!gameStarted || paused) {
    sfx.illegal();
    return;
  }

  if (cell.classList.contains("taken") && cell.textContent === currentPlayer) {
    if (selectedCell === cell) {
      cell.classList.remove("selected");
      selectedCell = null;
      sfx.click();
    } else {
      selectCellElement(cell);
      sfx.click();
    }
    return;
  }

  if (!cell.classList.contains("taken") && selectedCell) {
    const fromIdx = +selectedCell.getAttribute("data-index");
    const canMove = playerPieces[currentPlayer].includes(fromIdx);
    const adjacencyOK =
      !adjacentMovesInput.checked || neighborsOf(fromIdx).includes(idx);
    if (canMove && adjacencyOK) {
      selectedCell.textContent = "";
      selectedCell.classList.remove("taken", "selected");
      cell.textContent = currentPlayer;
      cell.classList.add("taken");
      playerPieces[currentPlayer] = playerPieces[currentPlayer].map((i) =>
        i === fromIdx ? idx : i
      );
      lastPieceIndex[currentPlayer] = idx;
      selectCellElement(null);
      sfx.move();
      if (checkWinFor(currentPlayer)) {
        award(currentPlayer);
        announce(`${labelFor(currentPlayer)} wins the round!`);
        sfx.win();
        celebrate(currentPlayer);
        endRound();
        return;
      }
      switchPlayer();
      return;
    } else {
      sfx.illegal();
      bounce(cell);
      return;
    }
  }

  if (!cell.classList.contains("taken") && playerTurns[currentPlayer] < 3) {
    cell.textContent = currentPlayer;
    cell.classList.add("taken");
    playerPieces[currentPlayer].push(idx);
    playerTurns[currentPlayer]++;
    lastPieceIndex[currentPlayer] = idx;
    sfx.place();
    if (playerTurns[currentPlayer] >= 3) {
      currentTurnElem.textContent = `${labelFor(currentPlayer)}: move pieces`;
      selectIndexIfOwned(currentPlayer, lastPieceIndex[currentPlayer]);
    }
    if (checkWinFor(currentPlayer)) {
      award(currentPlayer);
      announce(`${labelFor(currentPlayer)} wins the round!`);
      sfx.win();
      celebrate(currentPlayer);
      endRound();
      return;
    }
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
  stopTimer();
  currentPlayer = opponent(currentPlayer);
  setTurnText();
  if (playerTurns[currentPlayer] >= 3)
    selectIndexIfOwned(currentPlayer, lastPieceIndex[currentPlayer]);
  else selectCellElement(null);
  if (gameStarted && !paused) startTimer(currentPlayer);
}

// ---- header buttons ----
startButton.addEventListener("click", () => {
  if (gameStarted) return;
  starter = randomStarterInput.checked
    ? Math.random() < 0.5
      ? "X"
      : "O"
    : starter;
  currentPlayer = starter;
  beginRound();
});
pauseButton.addEventListener("click", () => {
  if (!gameStarted) return;
  paused = !paused;
  if (paused) stopTimer();
  else startTimer(currentPlayer);
  pauseButton.classList.toggle("active", paused);
  pauseButton.textContent = paused ? "Resume" : "Pause";
});
resetButton.addEventListener("click", () => {
  stopTimer();
  gameStarted = false;
  paused = false;
  starter = "X";
  scores = { X: 0, O: 0 };
  scoreXElem.textContent = "0";
  scoreOElem.textContent = "0";
  timeInput.value = "3:00";
  resetBoardState();
  hidePopup();
  pauseButton.textContent = "Pause";
});
nextRoundButton.addEventListener("click", () => {
  if (gameStarted) return;
  starter = randomStarterInput.checked
    ? Math.random() < 0.5
      ? "X"
      : "O"
    : opponent(starter);
  beginRound();
});
swapStarterButton.addEventListener("click", () => {
  if (gameStarted) return;
  starter = opponent(starter);
  currentPlayer = starter;
  setTurnText();
});

// ---- modals (FIXED) ----
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
  overlay.classList.remove("active");
}

rulesButton.addEventListener("click", () => openModal(rulesModal));
settingsButton.addEventListener("click", () => openModal(settingsModal));
closeButtons.forEach((btn) => btn.addEventListener("click", closeAllModals));
overlay.addEventListener("click", closeAllModals);

// ---- settings apply ----
applySettingsBtn.addEventListener("click", () => {
  const seconds = parseTimeToSeconds(timeInput.value);
  if (seconds <= 0 || isNaN(seconds)) {
    announce("Invalid time format. Use mm:ss (e.g., 3:00).");
    return;
  }
  if (!gameStarted) {
    playerXTimerElem.textContent = formatTime(seconds);
    playerOTimerElem.textContent = formatTime(seconds);
  }
  closeAllModals();
});

// ---- theme toggle ----
modeToggle.addEventListener("change", (e) => {
  const dark = e.target.checked;
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  e.target.nextElementSibling.textContent = dark ? "Dark" : "Light";
});

// ---- confetti ----
let confettiParticles = [];
function celebrate() {
  resizeCanvas();
  confettiParticles = makeConfettiParticles();
  let t0 = null;
  function frame(ts) {
    if (!t0) t0 = ts;
    const dt = Math.min(16, ts - t0);
    t0 = ts;
    drawConfetti(dt);
    if (confettiParticles.some((p) => p.life > 0)) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
function makeConfettiParticles() {
  const W = confettiCanvas.width,
    H = confettiCanvas.height,
    parts = [],
    colors = ["#ffd54f", "#4dd0e1", "#ab47bc", "#ef5350", "#66bb6a", "#42a5f5"];
  for (let i = 0; i < 160; i++) {
    const side = Math.random() < 0.5 ? -1 : 1,
      x = side < 0 ? -20 : W + 20,
      y = H * 0.1 + Math.random() * H * 0.8,
      vx = side < 0 ? 2 + Math.random() * 3 : -2 - Math.random() * 3,
      vy = -1 + Math.random() * 2,
      g = 0.06 + Math.random() * 0.04;
    parts.push({
      x,
      y,
      vx,
      vy,
      g,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 10,
      r: Math.random() * Math.PI,
      vr: -0.1 + Math.random() * 0.2,
      color: colors[i % colors.length],
      life: 4000 + Math.random() * 2000,
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
  playerXTimerElem.textContent = formatTime(timers["X"]);
  playerOTimerElem.textContent = formatTime(timers["O"]);
  cells.forEach((c) => c.addEventListener("click", handleCellClick));
  setTurnText();
  resizeCanvas();
});
