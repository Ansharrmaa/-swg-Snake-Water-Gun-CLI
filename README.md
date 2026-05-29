# 🐍 swg — Snake Water Gun CLI

[![CI](https://github.com/Ansharrmaa/project-1-game-/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansharrmaa/project-1-game-/actions)
[![Python 3.8+](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A command-line **Snake Water Gun** game built in Python — play against the computer, track your stats with SQLite, and review your match history. Comes with a full test suite and GitHub Actions CI.

---

## 🎮 Demo

```
$ swg play --name ansh --rounds 3

── Round 1/3 ──
Choices: s = Snake  |  w = Water  |  g = Gun
Your choice: s
Computer chose: Gun  →  ✓ You win!

── Round 2/3 ──
Choices: s = Snake  |  w = Water  |  g = Gun
Your choice: w
Computer chose: Gun  →  ✗ You lose.

── Round 3/3 ──
Choices: s = Snake  |  w = Water  |  g = Gun
Your choice: g
Computer chose: Gun  →  = Draw.

── Session summary ──
  Wins: 1  Losses: 1  Draws: 1
```

---

## 📦 Installation

```bash
git clone https://github.com/Ansharrmaa/project-1-game-.git
cd project-1-game-
pip install -e .
```

> **Note:** Requires **Python 3.8** or higher.

---

## 🚀 Usage

### Play a game

```bash
swg play --name ansh --rounds 5
```

During a round, enter one of:
| Key | Choice |
|-----|--------|
| `s` | 🐍 Snake |
| `w` | 💧 Water |
| `g` | 🔫 Gun |
| `q` | Quit session early |

### View your stats

```bash
swg stats --name ansh
```

```
── Stats for ansh ──
  Total  : 15
  Wins   : 8  (53.3%)
  Losses : 4
  Draws  : 3
```

### View match history

```bash
swg history --name ansh --limit 5
```

```
── Last 5 rounds for ansh ──
  2026-05-29T23:10:01  You=Snake  CPU=Gun    → WIN
  2026-05-29T23:10:02  You=Water  CPU=Gun    → LOSE
  2026-05-29T23:10:03  You=Gun    CPU=Gun    → DRAW
  ...
```

### Reset your stats

```bash
swg reset --name ansh
```

---

## 📋 Commands & Options

### Commands

| Command        | Description                     |
|----------------|---------------------------------|
| `swg play`     | Start a new game session        |
| `swg stats`    | View win/loss/draw statistics   |
| `swg history`  | View recent match history       |
| `swg reset`    | Delete all saved stats          |

### Options

| Flag       | Default  | Applies to        | Description                        |
|------------|----------|--------------------|------------------------------------|
| `--name`   | `player` | all commands       | Your player name                   |
| `--rounds` | `3`      | `play`             | Number of rounds per session       |
| `--limit`  | `10`     | `history`          | Number of rounds to display        |
| `--auto`   | —        | `play`             | Auto-pick `s`, `w`, or `g` (testing) |

---

## 🎯 Game Rules

```
🐍 Snake  beats  🔫 Gun     → Snake eats the gun
💧 Water  beats  🐍 Snake   → Water drowns the snake
🔫 Gun    beats  💧 Water   → Gun shoots through water
```

Same choice = **Draw**

---

## 🏗️ Project Structure

```
project-1-game-/
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions CI pipeline
├── swg/
│   ├── __init__.py          # Package version
│   ├── cli.py               # argparse entry point & session logic
│   ├── game.py              # Core game logic (choices, win map)
│   └── scores.py            # SQLite persistence layer
├── tests/
│   └── test_swg.py          # 19 pytest unit tests
├── .gitignore
├── setup.py                 # Package configuration
└── README.md
```

### Architecture

| Module       | Responsibility                                                    |
|--------------|-------------------------------------------------------------------|
| `cli.py`     | Parses arguments, runs game sessions, displays stats and history  |
| `game.py`    | Defines choices, win conditions, computer random pick             |
| `scores.py`  | SQLite database init, save results, query stats/history, reset    |

Scores are stored in `~/.swg_scores.db` — a local SQLite database in your home directory. Each player's data is isolated by name.

---

## 🧪 Running Tests

```bash
pip install pytest
pytest tests/ -v
```

**19 tests** covering:
- ✅ All 9 win/lose/draw combinations
- ✅ Computer always picks a valid choice
- ✅ Choice formatting (including unknown keys)
- ✅ Empty stats for new players
- ✅ Save and count results
- ✅ History with limit
- ✅ Reset clears all data
- ✅ Player isolation (stats don't leak across players)

---

## ⚙️ CI / CD

GitHub Actions automatically runs the full test suite on every **push** and **pull request** to `main`:

| Python Version | Status |
|---------------|--------|
| 3.8           | ✅ Tested |
| 3.10          | ✅ Tested |
| 3.12          | ✅ Tested |

The pipeline also verifies that the `swg --help` entry point works correctly after installation.

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feat/my-feature`
3. **Commit** your changes: `git commit -m "feat: add my feature"`
4. **Push** to the branch: `git push origin feat/my-feature`
5. **Open** a Pull Request

Please make sure all tests pass before submitting:
```bash
pytest tests/ -v
```

---

## 📝 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

## 👤 Author

**Ansh Sharma** — [@Ansharrmaa](https://github.com/Ansharrmaa)
