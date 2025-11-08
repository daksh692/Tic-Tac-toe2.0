# ⚡ Tic-Tac-Toe+ — 3-in-a-row (place 3, then move)

A fast, modern take on tic-tac-toe. Each player **places 3 pieces** and then **moves their own pieces** one step at a time to make 3-in-a-row. Timers, rounds, confetti celebration, and a clean dark/light UI keep it snappy and replayable.

> Built with **vanilla HTML/CSS/JS** — no frameworks, no build step.

---

## ✨ Features

- **Core rule**: place up to **3** pieces; after that, **select & move** your piece to an empty cell  
- **Auto-select last piece** when you enter movement phase (you can switch by clicking another own piece)  
- **Timers** (default 3:00 each) with flag-fall loss  
- **Rounds & scoreboard**; **Next Round** without page reload  
- **Randomize starter** or **Swap starter**  
- **Settings** modal: SFX, win highlight, **Adjacency rule** (optional), vibration, timer  
- **Victory celebration**: confetti + banner; **auto-next after 10s**  
- **Dark / Light mode** toggle  
- Keyboard & screen-reader friendly cells (buttons with labels)

---

## 🕹️ How to Play

1. Click **Start**. X goes first.  
2. **Placement phase** (each player):
   - Click an empty cell to place your mark.
   - After you’ve placed **3** marks, you switch to **movement**.
3. **Movement phase**:
   - Your **last placed/moved** piece is auto-selected and highlighted.
   - Click a different own piece to change the selection.
   - Click an empty cell to move the selected piece there. (If **Adjacency** is enabled, you can only move to neighboring cells.)
4. You win the round by making 3-in-a-row (row/column/diagonal) or when your opponent’s timer hits 0.

---

## 🔧 Controls

- **Start / Pause / Reset**: control the round and timers  
- **Rules**: quick reference  
- **Settings** (gear):
  - **Sound effects** on/off
  - **Highlight winning line** on/off
  - **Adjacency rule**: limit moves to neighboring cells (optional)
  - **Vibrate**: small haptics where supported
  - **Turn time**: `mm:ss` (e.g., `3:00`)
- **Next Round**: start a fresh board, keep scores  
- **Swap Starter**: alternate manually  
- **Randomize starter**: coin-flip for each new round  
- **Dark** toggle: switch themes

---

## 📦 Project Structure

```
.
├─ main.html      # App markup + modals
├─ styles.css     # Theme (dark/light), board, animations
└─ script.js      # Game state, timers, rules, confetti
```

No bundler. Just open `main.html` in a browser.

---

## 🚀 Run Locally

- **Option 1 (double-click)**: open `main.html` directly.  
- **Option 2 (local server, recommended)**:
  ```bash
  # Python 3
  python -m http.server 8080
  # then visit http://localhost:8080/main.html
  ```

### Deploy to GitHub Pages
1. Push these three files to your repo root (`main.html`, `styles.css`, `script.js`).  
2. In GitHub: **Settings → Pages → Source: `main` branch** (root).  
3. App URL: `https://<user>.github.io/<repo>/main.html`.

---

## 🧠 Game Logic Notes

- After each placement, win is checked immediately.  
- As soon as a player reaches 3 pieces, the **last** one becomes the **default selection** every time their turn starts.  
- Victory triggers **confetti** and a popup; the next round begins automatically after **10 seconds** (scores persist).

---

## ♿ Accessibility

- Cells are real `<button>`s with `aria-label`s.  
- High-contrast selection ring; optional win highlight.  
- Vibration is opt-in.

---

## 🛠️ Customize

- **Default timer**: change `3:00` (Settings) or tweak parsing in `script.js`.  
- **Auto-next timeout**: edit `autoNextTimeout = setTimeout(..., 10000)`.  
- **Confetti density/colors**: `makeConfettiParticles()` in `script.js`.  
- **Theme**: override CSS variables in `:root` and `:root[data-theme="light"]`.

---

## 🗺️ Roadmap

- Undo last move (one-ply)  
- Hotkeys (R: reset round, N: next round)  
- Adjacent-only default + rule presets  
- Minimal AI (heuristics)  
- Online play (WebSocket)

---

## License

MIT — do what you want, no warranty.
s
