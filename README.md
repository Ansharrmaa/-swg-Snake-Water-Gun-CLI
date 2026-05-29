# swg — Snake Water Gun CLI

A command-line Snake Water Gun game built in Python with persistent score tracking via SQLite, argparse-based CLI, and a full test suite.

## Installation

```bash
git clone https://github.com/Ansharrmaa/project-1-game-.git
cd project-1-game-
pip install -e .
```

## Usage

```bash
# Play 5 rounds as "ansh"
swg play --name ansh --rounds 5

# View your stats
swg stats --name ansh

# View last 10 rounds
swg history --name ansh --limit 10

# Reset your stats
swg reset --name ansh
```

## Commands

| Command | Description |
|---------|-------------|
| `swg play` | Start a game session |
| `swg stats` | View win/loss/draw counts |
| `swg history` | View recent rounds |
| `swg reset` | Clear your saved stats |

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--name` | player | Your player name |
| `--rounds` | 3 | Number of rounds per session |
| `--limit` | 10 | Rounds to show in history |

## Rules

- **Snake** beats Gun
- **Water** beats Snake
- **Gun** beats Water

## Run Tests

```bash
pip install pytest
pytest tests/ -v
```

## CI

GitHub Actions runs the full test suite on Python 3.8, 3.10, and 3.12 on every push and pull request.

## Project Structure

```
swg_cli/
├── swg/
│   ├── __init__.py
│   ├── cli.py        # argparse entry point
│   ├── game.py       # core game logic
│   └── scores.py     # SQLite persistence layer
├── tests/
│   └── test_swg.py   # pytest unit tests
├── .github/
│   └── workflows/
│       └── ci.yml    # GitHub Actions CI
├── setup.py
└── README.md
```
