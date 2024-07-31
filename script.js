const board = document.getElementById('game-board');
const cells = board.getElementsByClassName('cell');
const startButton = document.getElementById('start-button');
const resetButton = document.getElementById('reset-button');
const playerXTimerElem = document.getElementById('player-x-timer');
const playerOTimerElem = document.getElementById('player-o-timer');
const popup = document.getElementById('popup');
const popupMessage = document.querySelector('.popup-message');
const overlay = document.getElementById('overlay');
const rulesButton = document.getElementById('rules-button');
const rulesModal = document.getElementById('rules-modal');
const closeButton = document.querySelector('.close-button');

let currentPlayer = 'X';
let selectedCell = null;
let playerTurns = {
    'X': 0,
    'O': 0
};
let playerPieces = {
    'X': [],
    'O': []
};
let timers = {
    'X': 180, // 3 minutes in seconds
    'O': 180
};
let timerInterval;
let timerRunning = false;
let gameStarted = false;

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function startTimer(player) {
    stopTimer(); // Stop any running timer first
    timerRunning = true;
    currentPlayer = player; // Set the current player to the one whose timer is starting

    timerInterval = setInterval(() => {
        if (timers[player] > 0) {
            timers[player]--;
            document.getElementById(`player-${player.toLowerCase()}-timer`).textContent = formatTime(timers[player]);
        } else {
            clearInterval(timerInterval);
            showPopup(`${player} ran out of time! ${currentPlayer === player ? 'Opponent wins!' : 'You win!'}`);
            // Reset game state if desired
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
}

function switchPlayer() {
    stopTimer();
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    document.getElementById('current-turn').textContent = `Current Turn: Player ${currentPlayer}`;
    if (gameStarted) {
        startTimer(currentPlayer);
    }
}

function checkWin() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]  // diagonals
    ];

    for (const pattern of winPatterns) {
        if (pattern.every(index => cells[index].textContent === currentPlayer)) {
            pattern.forEach(index => cells[index].classList.add('win'));
            return true;
        }
    }
    return false;
}

function handleClick(event) {
    const cell = event.target;
    if (!cell.classList.contains('cell')) {
        // If the clicked target is not a cell, do nothing
        return;
    }
    
    const cellIndex = parseInt(cell.getAttribute('data-index'));

    if (cell.classList.contains('taken') && cell.textContent === currentPlayer) {
        // Selecting an already placed piece to move
        if (selectedCell && selectedCell === cell) {
            // Deselecting the piece
            selectedCell.classList.remove('selected');
            selectedCell = null;
        } else {
            if (selectedCell) {
                selectedCell.classList.remove('selected');
            }
            selectedCell = cell;
            cell.classList.add('selected');
        }
    } else if (!cell.classList.contains('taken') && selectedCell) {
        // Moving the selected piece to an empty cell
        const selectedCellIndex = parseInt(selectedCell.getAttribute('data-index'));
        const isValidMove = playerPieces[currentPlayer].includes(selectedCellIndex);

        if (isValidMove) {
            selectedCell.textContent = '';
            selectedCell.classList.remove('taken', 'selected');
            cell.textContent = currentPlayer;
            cell.classList.add('taken');
            playerPieces[currentPlayer] = playerPieces[currentPlayer].map(index => 
                index === selectedCellIndex ? cellIndex : index
            );
            selectedCell = null; // Deselect the cell after moving the piece

            if (checkWin()) {
                showPopup(`${currentPlayer} wins!`);
                stopTimer(); // Stop the timer when a player wins
                return;
            }

            switchPlayer();
        }
    } else if (!cell.classList.contains('taken') && !selectedCell) {
        // Placing new piece
        if (playerTurns[currentPlayer] < 3) {
            // Placing initial pieces
            cell.textContent = currentPlayer;
            cell.classList.add('taken');
            playerPieces[currentPlayer].push(cellIndex);
            playerTurns[currentPlayer]++;
            if (playerTurns[currentPlayer] >= 3) {
                document.getElementById('current-turn').textContent = `Current Turn: Player ${currentPlayer} (move pieces)`;
            }

            if (checkWin()) {
                showPopup(`${currentPlayer} wins!`);
                stopTimer(); // Stop the timer when a player wins
                return;
            }

            switchPlayer();
        }
    }
}

function showPopup(message) {
    popupMessage.innerHTML = message;
    popup.classList.add('active');
    overlay.classList.add('active');

    setTimeout(() => {
        popupMessage.classList.add('text-glow');
    }, 0);
}

function hidePopup() {
    popup.classList.remove('active');
    overlay.classList.remove('active');
    popupMessage.classList.remove('text-glow');
}

startButton.addEventListener('click', () => {
    if (!gameStarted) {
        gameStarted = true;
        startTimer('X'); // Start with Player X
        document.getElementById('current-turn').textContent = `Current Turn: Player X`;
    }
});

resetButton.addEventListener('click', () => {
    // Reset game state
    stopTimer();
    gameStarted = false;
    currentPlayer = 'X';
    selectedCell = null;
    playerTurns = { 'X': 0, 'O': 0 };
    playerPieces = { 'X': [], 'O': [] };
    timers = { 'X': 180, 'O': 180 };
    playerXTimerElem.textContent = formatTime(timers['X']);
    playerOTimerElem.textContent = formatTime(timers['O']);
    document.getElementById('current-turn').textContent = `Current Turn: Player X`;

    Array.from(cells).forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'selected', 'win');
    });

    hidePopup();
});

overlay.addEventListener('click', hidePopup);

rulesButton.addEventListener('click', () => {
    rulesModal.classList.add('active');
    overlay.classList.add('active');
});

closeButton.addEventListener('click', () => {
    rulesModal.classList.remove('active');
    overlay.classList.remove('active');
});

document.addEventListener('DOMContentLoaded', () => {
    playerXTimerElem.textContent = formatTime(timers['X']);
    playerOTimerElem.textContent = formatTime(timers['O']);
});

board.addEventListener('click', handleClick);
