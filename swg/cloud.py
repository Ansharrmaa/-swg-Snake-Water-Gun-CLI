"""
swg.cloud — AWS cloud resource listing via boto3.

Uses the default credential chain (env vars → ~/.aws/credentials → IAM role).
"""

import sys

try:
    import boto3
except ImportError:
    boto3 = None


def _check_boto3():
    """Exit with a helpful message if boto3 is not installed."""
    if boto3 is None:
        print("Error: boto3 is not installed.")
        print("Install it with:  pip install boto3")
        sys.exit(1)


# ── S3 ────────────────────────────────────────────────────────────────────────

def list_s3_buckets():
    """List all S3 buckets in the account and print a formatted table."""
    _check_boto3()

    try:
        client = boto3.client("s3")
        response = client.list_buckets()
    except boto3.exceptions.Boto3Error as exc:
        print(f"AWS error: {exc}")
        sys.exit(1)
    except Exception as exc:
        # Catches NoCredentialsError and other botocore errors
        print(f"AWS error: {exc}")
        sys.exit(1)

    buckets = response.get("Buckets", [])

    if not buckets:
        print("No S3 buckets found in this account.")
        return []

    # Build result list
    results = []
    for b in buckets:
        results.append({
            "name": b["Name"],
            "created_at": b["CreationDate"].strftime("%Y-%m-%d %H:%M UTC"),
        })

    # Pretty-print
    name_width = max(len(r["name"]) for r in results)
    name_width = max(name_width, 6)  # minimum header width

    print(f"\n{'Bucket':<{name_width}}  Created")
    print(f"{'─' * name_width}  {'─' * 20}")
    for r in results:
        print(f"{r['name']:<{name_width}}  {r['created_at']}")
    print(f"\n{len(results)} bucket(s) total.")

    return results


# ── EC2 ───────────────────────────────────────────────────────────────────────

def list_ec2_instances(region: str = "us-east-1"):
    """List EC2 instances in *region* and print a formatted table."""
    _check_boto3()

    try:
        client = boto3.client("ec2", region_name=region)
        response = client.describe_instances()
    except boto3.exceptions.Boto3Error as exc:
        print(f"AWS error: {exc}")
        sys.exit(1)
    except Exception as exc:
        print(f"AWS error: {exc}")
        sys.exit(1)

    # Flatten reservations → instances
    instances = []
    for reservation in response.get("Reservations", []):
        for inst in reservation.get("Instances", []):
            name = ""
            for tag in inst.get("Tags", []):
                if tag["Key"] == "Name":
                    name = tag["Value"]
                    break
            instances.append({
                "instance_id": inst["InstanceId"],
                "type": inst["InstanceType"],
                "state": inst["State"]["Name"],
                "name": name,
            })

    if not instances:
        print(f"No EC2 instances found in {region}.")
        return []

    # Column widths
    id_w = max(len(i["instance_id"]) for i in instances)
    id_w = max(id_w, 11)
    type_w = max(len(i["type"]) for i in instances)
    type_w = max(type_w, 4)
    state_w = max(len(i["state"]) for i in instances)
    state_w = max(state_w, 5)
    name_w = max((len(i["name"]) for i in instances), default=4)
    name_w = max(name_w, 4)

    # State indicators
    state_symbol = {
        "running": "●",
        "stopped": "○",
        "terminated": "✗",
        "pending": "◌",
        "shutting-down": "↓",
        "stopping": "↓",
    }

    print(f"\n{'Instance ID':<{id_w}}  {'Type':<{type_w}}  {'State':<{state_w + 2}}  Name")
    print(f"{'─' * id_w}  {'─' * type_w}  {'─' * (state_w + 2)}  {'─' * name_w}")
    for i in instances:
        sym = state_symbol.get(i["state"], "?")
        state_str = f"{sym} {i['state']}"
        print(f"{i['instance_id']:<{id_w}}  {i['type']:<{type_w}}  {state_str:<{state_w + 2}}  {i['name']}")
    print(f"\n{len(instances)} instance(s) in {region}.")

    return instances
