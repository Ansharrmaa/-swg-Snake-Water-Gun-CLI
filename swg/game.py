import random

CHOICES = {
    "s": "Snake",
    "w": "Water",
    "g": "Gun"
}

# Snake beats Gun, Water beats Snake, Gun beats Water
WIN_MAP = {
    ("s", "g"): True,
    ("w", "s"): True,
    ("g", "w"): True,
}


def get_computer_choice() -> str:
    return random.choice(list(CHOICES.keys()))


def determine_result(player: str, computer: str) -> str:
    """Return 'win', 'lose', or 'draw'."""
    if player == computer:
        return "draw"
    if WIN_MAP.get((player, computer)):
        return "win"
    return "lose"


def format_choice(key: str) -> str:
    return CHOICES.get(key, "Unknown")
