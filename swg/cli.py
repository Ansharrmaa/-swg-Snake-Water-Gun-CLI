"""
swg — Snake Water Gun CLI game + cloud toolkit
"""

import argparse
import sys

from swg.game import get_computer_choice, determine_result, format_choice, CHOICES
from swg.scores import init_db, save_result, get_stats, get_history, reset_stats
from swg.cloud import list_s3_buckets, list_ec2_instances


def play_session(player_name: str, rounds: int, auto: str = None):
    """Run N rounds and persist results."""
    wins = draws = losses = 0

    for i in range(1, rounds + 1):
        print(f"\n── Round {i}/{rounds} ──")
        print("Choices: s = Snake  |  w = Water  |  g = Gun")

        if auto:
            player_choice = auto
            print(f"[auto] Your choice: {format_choice(player_choice)}")
        else:
            raw = input("Your choice: ").strip().lower()
            if raw == "q":
                print("Quitting session early.")
                break
            if raw not in CHOICES:
                print("Invalid choice. Use s, w, or g. (q to quit)")
                i -= 1
                continue
            player_choice = raw

        computer_choice = get_computer_choice()
        result = determine_result(player_choice, computer_choice)

        save_result(player_name, result, player_choice, computer_choice)

        symbol = {"win": "✓ You win!", "lose": "✗ You lose.", "draw": "= Draw."
                  }[result]
        print(f"Computer chose: {format_choice(computer_choice)}  →  {symbol}")

        if result == "win":
            wins += 1
        elif result == "lose":
            losses += 1
        else:
            draws += 1

    print(f"\n── Session summary ──")
    print(f"  Wins: {wins}  Losses: {losses}  Draws: {draws}")


def cmd_play(args):
    init_db()
    play_session(args.name, args.rounds, getattr(args, "auto", None))


def cmd_stats(args):
    init_db()
    stats = get_stats(args.name)
    if stats["total"] == 0:
        print(f"No games found for '{args.name}'.")
        return
    win_pct = round(stats["win"] / stats["total"] * 100, 1)
    print(f"\n── Stats for {args.name} ──")
    print(f"  Total  : {stats['total']}")
    print(f"  Wins   : {stats['win']}  ({win_pct}%)")
    print(f"  Losses : {stats['lose']}")
    print(f"  Draws  : {stats['draw']}")


def cmd_history(args):
    init_db()
    rows = get_history(args.name, args.limit)
    if not rows:
        print(f"No history for '{args.name}'.")
        return
    print(f"\n── Last {len(rows)} rounds for {args.name} ──")
    for r in rows:
        print(f"  {r['played_at'][:19]}  "
              f"You={format_choice(r['player_choice'])}  "
              f"CPU={format_choice(r['computer_choice'])}  "
              f"→ {r['result'].upper()}")


def cmd_reset(args):
    init_db()
    confirm = input(f"Reset all stats for '{args.name}'? [y/N]: ").strip().lower()
    if confirm == "y":
        reset_stats(args.name)
        print("Stats reset.")
    else:
        print("Cancelled.")


# ── cloud handlers ────────────────────────────────────────────────────────────

def cmd_cloud_s3(args):
    list_s3_buckets()


def cmd_cloud_ec2(args):
    list_ec2_instances(args.region)


# ── parser ────────────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="swg",
        description="Snake Water Gun — CLI game + cloud toolkit."
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # play
    p_play = sub.add_parser("play", help="Play a session")
    p_play.add_argument("--name", default="player", help="Your player name")
    p_play.add_argument("--rounds", type=int, default=3,
                        help="Number of rounds (default: 3)")
    p_play.add_argument("--auto", choices=["s", "w", "g"],
                        help="Auto-pick a choice every round (useful for testing)")
    p_play.set_defaults(func=cmd_play)

    # stats
    p_stats = sub.add_parser("stats", help="View your win/loss stats")
    p_stats.add_argument("--name", default="player", help="Player name")
    p_stats.set_defaults(func=cmd_stats)

    # history
    p_hist = sub.add_parser("history", help="View recent rounds")
    p_hist.add_argument("--name", default="player", help="Player name")
    p_hist.add_argument("--limit", type=int, default=10,
                        help="Number of rounds to show (default: 10)")
    p_hist.set_defaults(func=cmd_history)

    # reset
    p_reset = sub.add_parser("reset", help="Reset your stats")
    p_reset.add_argument("--name", default="player", help="Player name")
    p_reset.set_defaults(func=cmd_reset)

    # cloud
    p_cloud = sub.add_parser(
        "cloud",
        help="AWS cloud commands (list S3 buckets, EC2 instances)"
    )
    cloud_sub = p_cloud.add_subparsers(dest="cloud_command", required=True)

    # cloud s3
    p_s3 = cloud_sub.add_parser("s3", help="List S3 buckets")
    p_s3.set_defaults(func=cmd_cloud_s3)

    # cloud ec2
    p_ec2 = cloud_sub.add_parser("ec2", help="List EC2 instances")
    p_ec2.add_argument("--region", default="us-east-1",
                       help="AWS region (default: us-east-1)")
    p_ec2.set_defaults(func=cmd_cloud_ec2)

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
