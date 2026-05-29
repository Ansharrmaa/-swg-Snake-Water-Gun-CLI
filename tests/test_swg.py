import pytest
import tempfile
import os

from swg.game import determine_result, get_computer_choice, format_choice, CHOICES
from swg.scores import init_db, save_result, get_stats, get_history, reset_stats


# ── game logic tests ──────────────────────────────────────────────────────────

class TestDetermineResult:
    def test_snake_beats_gun(self):
        assert determine_result("s", "g") == "win"

    def test_water_beats_snake(self):
        assert determine_result("w", "s") == "win"

    def test_gun_beats_water(self):
        assert determine_result("g", "w") == "win"

    def test_snake_loses_to_water(self):
        assert determine_result("s", "w") == "lose"

    def test_gun_loses_to_snake(self):
        assert determine_result("g", "s") == "lose"

    def test_water_loses_to_gun(self):
        assert determine_result("w", "g") == "lose"

    def test_draw_snake(self):
        assert determine_result("s", "s") == "draw"

    def test_draw_water(self):
        assert determine_result("w", "w") == "draw"

    def test_draw_gun(self):
        assert determine_result("g", "g") == "draw"


class TestComputerChoice:
    def test_always_valid(self):
        for _ in range(50):
            assert get_computer_choice() in CHOICES


class TestFormatChoice:
    def test_snake(self):
        assert format_choice("s") == "Snake"

    def test_water(self):
        assert format_choice("w") == "Water"

    def test_gun(self):
        assert format_choice("g") == "Gun"

    def test_unknown(self):
        assert format_choice("x") == "Unknown"


# ── score persistence tests ───────────────────────────────────────────────────

@pytest.fixture
def tmp_db():
    """Provide a fresh temporary database for each test."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    init_db(db_path)
    yield db_path
    try:
        os.unlink(db_path)
    except PermissionError:
        import gc, time
        gc.collect()
        time.sleep(0.1)
        os.unlink(db_path)


class TestScores:
    def test_empty_stats(self, tmp_db):
        stats = get_stats("ansh", tmp_db)
        assert stats["total"] == 0

    def test_save_and_count(self, tmp_db):
        save_result("ansh", "win", "s", "g", tmp_db)
        save_result("ansh", "lose", "w", "g", tmp_db)
        save_result("ansh", "draw", "s", "s", tmp_db)
        stats = get_stats("ansh", tmp_db)
        assert stats["total"] == 3
        assert stats["win"] == 1
        assert stats["lose"] == 1
        assert stats["draw"] == 1

    def test_history_limit(self, tmp_db):
        for i in range(15):
            save_result("ansh", "win", "s", "g", tmp_db)
        history = get_history("ansh", limit=5, db_path=tmp_db)
        assert len(history) == 5

    def test_reset(self, tmp_db):
        save_result("ansh", "win", "s", "g", tmp_db)
        reset_stats("ansh", tmp_db)
        stats = get_stats("ansh", tmp_db)
        assert stats["total"] == 0

    def test_player_isolation(self, tmp_db):
        save_result("ansh", "win", "s", "g", tmp_db)
        save_result("other", "lose", "w", "s", tmp_db)
        assert get_stats("ansh", tmp_db)["total"] == 1
        assert get_stats("other", tmp_db)["total"] == 1
