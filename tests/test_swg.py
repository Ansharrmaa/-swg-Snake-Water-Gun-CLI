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


# ── cloud tests (all mocked — no real AWS calls) ─────────────────────────────

from unittest.mock import patch, MagicMock
from datetime import datetime, timezone


class TestCloudS3:
    @patch("swg.cloud.boto3")
    def test_list_s3_buckets(self, mock_boto3, capsys):
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client
        mock_client.list_buckets.return_value = {
            "Buckets": [
                {
                    "Name": "my-data-bucket",
                    "CreationDate": datetime(2025, 1, 15, 10, 30, tzinfo=timezone.utc),
                },
                {
                    "Name": "my-logs-bucket",
                    "CreationDate": datetime(2025, 3, 20, 8, 0, tzinfo=timezone.utc),
                },
            ]
        }

        from swg.cloud import list_s3_buckets
        results = list_s3_buckets()

        assert len(results) == 2
        assert results[0]["name"] == "my-data-bucket"
        assert results[1]["name"] == "my-logs-bucket"
        mock_boto3.client.assert_called_once_with("s3")

        output = capsys.readouterr().out
        assert "my-data-bucket" in output
        assert "2 bucket(s) total" in output

    @patch("swg.cloud.boto3")
    def test_list_s3_empty(self, mock_boto3, capsys):
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client
        mock_client.list_buckets.return_value = {"Buckets": []}

        from swg.cloud import list_s3_buckets
        results = list_s3_buckets()

        assert results == []
        output = capsys.readouterr().out
        assert "No S3 buckets found" in output

    @patch("swg.cloud.boto3")
    def test_s3_no_credentials(self, mock_boto3):
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client
        mock_boto3.exceptions.Boto3Error = Exception

        from botocore.exceptions import NoCredentialsError
        mock_client.list_buckets.side_effect = NoCredentialsError()

        from swg.cloud import list_s3_buckets
        with pytest.raises(SystemExit):
            list_s3_buckets()


class TestCloudEC2:
    @patch("swg.cloud.boto3")
    def test_list_ec2_instances(self, mock_boto3, capsys):
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client
        mock_client.describe_instances.return_value = {
            "Reservations": [
                {
                    "Instances": [
                        {
                            "InstanceId": "i-0abc123def456",
                            "InstanceType": "t3.micro",
                            "State": {"Name": "running"},
                            "Tags": [{"Key": "Name", "Value": "web-server"}],
                        },
                        {
                            "InstanceId": "i-0xyz789ghi012",
                            "InstanceType": "m5.large",
                            "State": {"Name": "stopped"},
                            "Tags": [],
                        },
                    ]
                }
            ]
        }

        from swg.cloud import list_ec2_instances
        results = list_ec2_instances("us-west-2")

        assert len(results) == 2
        assert results[0]["instance_id"] == "i-0abc123def456"
        assert results[0]["state"] == "running"
        assert results[0]["name"] == "web-server"
        assert results[1]["name"] == ""
        mock_boto3.client.assert_called_once_with("ec2", region_name="us-west-2")

        output = capsys.readouterr().out
        assert "web-server" in output
        assert "2 instance(s)" in output

    @patch("swg.cloud.boto3")
    def test_list_ec2_empty(self, mock_boto3, capsys):
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client
        mock_client.describe_instances.return_value = {"Reservations": []}

        from swg.cloud import list_ec2_instances
        results = list_ec2_instances("eu-west-1")

        assert results == []
        output = capsys.readouterr().out
        assert "No EC2 instances found" in output


class TestCloudSubparser:
    def test_cloud_s3_parses(self):
        from swg.cli import build_parser
        parser = build_parser()
        args = parser.parse_args(["cloud", "s3"])
        assert args.command == "cloud"
        assert args.cloud_command == "s3"

    def test_cloud_ec2_parses(self):
        from swg.cli import build_parser
        parser = build_parser()
        args = parser.parse_args(["cloud", "ec2", "--region", "ap-south-1"])
        assert args.command == "cloud"
        assert args.cloud_command == "ec2"
        assert args.region == "ap-south-1"

    def test_cloud_ec2_default_region(self):
        from swg.cli import build_parser
        parser = build_parser()
        args = parser.parse_args(["cloud", "ec2"])
        assert args.region == "us-east-1"

