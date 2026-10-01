#!/usr/bin/env python3
"""Package a compiled Nano sketch for the controlled local USB provisioner."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

VERSION = "0.1.0-bench.1"


def package(source: Path, destination: Path) -> None:
    if not source.is_file():
        raise FileNotFoundError(source)
    data = source.read_bytes()
    if not data.startswith(b":") or b":00000001FF" not in data:
        raise ValueError("Expected an Arduino Intel HEX image")
    destination.mkdir(parents=True, exist_ok=True)
    target = destination / "sim.hex"
    shutil.copyfile(source, target)
    manifest = {
        "schemaVersion": 1,
        "target": "atmega328p-nano",
        "firmwareVersion": VERSION,
        "hexFile": target.name,
        "sha256": hashlib.sha256(data).hexdigest(),
        "baud": 57600,
    }
    (destination / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hex", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    package(args.hex, args.output_dir)
