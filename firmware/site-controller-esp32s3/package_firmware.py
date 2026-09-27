#!/usr/bin/env python3
import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path

VERSION_PATTERNS = {
    "firmwareVersion": r'#define\s+BIOEMS_FIRMWARE_VERSION\s+"([^"]+)"',
    "protocolVersion": r'#define\s+BIOEMS_PROTOCOL_VERSION\s+"([^"]+)"',
    "bindingSchemaVersion": r"#define\s+BIOEMS_BINDING_SCHEMA_VERSION\s+(\d+)",
    "model": r'#define\s+BIOEMS_CONTROLLER_MODEL\s+"([^"]+)"',
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_version_header(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    result = {}
    for key, pattern in VERSION_PATTERNS.items():
        match = re.search(pattern, text)
        if not match:
            raise RuntimeError(f"Missing {key} in {path}")
        value = match.group(1)
        result[key] = int(value) if key == "bindingSchemaVersion" else value
    return result


def normalized_offset(value: str) -> str:
    parsed = int(value, 0)
    if parsed < 0:
        raise RuntimeError(f"Negative flash offset is not allowed: {value}")
    return hex(parsed)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--build-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--source-commit", required=True)
    parser.add_argument("--version-header", required=True)
    args = parser.parse_args()

    build_dir = Path(args.build_dir).resolve()
    output_dir = Path(args.output_dir).resolve()
    version_header = Path(args.version_header).resolve()

    if not re.fullmatch(r"[0-9a-f]{40}", args.source_commit):
        raise RuntimeError("Source commit must be a 40-character lowercase Git SHA")

    flasher_args_path = build_dir / "flasher_args.json"
    if not flasher_args_path.is_file():
        raise RuntimeError("ESP-IDF flasher_args.json was not produced")

    flasher_args = json.loads(flasher_args_path.read_text(encoding="utf-8"))
    extra = flasher_args.get("extra_esptool_args") or {}
    if str(extra.get("chip", "")).lower() != "esp32s3":
        raise RuntimeError("Firmware build target is not ESP32-S3")

    flash_files = flasher_args.get("flash_files")
    if not isinstance(flash_files, dict) or not flash_files:
        raise RuntimeError("ESP-IDF flash file inventory is missing")

    flash_settings = flasher_args.get("flash_settings") or {}
    mode = str(flash_settings.get("flash_mode") or "").lower()
    frequency = str(flash_settings.get("flash_freq") or "").lower()
    size = str(flash_settings.get("flash_size") or "").strip()
    if mode not in {"dio", "qio", "dout", "qout"}:
        raise RuntimeError(f"Unsupported flash mode: {mode}")
    if not re.fullmatch(r"\d+m", frequency):
        raise RuntimeError(f"Unsupported flash frequency: {frequency}")
    if not size:
        raise RuntimeError("Flash size is missing")

    versions = parse_version_header(version_header)
    if versions["bindingSchemaVersion"] != 1:
        raise RuntimeError("Pilot package requires binding schema version 1")

    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True)

    segments = []
    for offset, relative_file in sorted(
        flash_files.items(), key=lambda item: int(str(item[0]), 0)
    ):
        relative_path = Path(str(relative_file))
        if relative_path.is_absolute() or ".." in relative_path.parts:
            raise RuntimeError(f"Unsafe ESP-IDF flash file path: {relative_file}")
        source = (build_dir / relative_path).resolve()
        try:
            source.relative_to(build_dir)
        except ValueError as exc:
            raise RuntimeError(f"Flash file escaped build directory: {relative_file}") from exc
        if not source.is_file():
            raise RuntimeError(f"Flash file is missing: {relative_file}")

        offset_text = normalized_offset(str(offset))
        output_name = f"{int(offset_text, 0):08x}-{source.name}"
        destination = output_dir / output_name
        shutil.copyfile(source, destination)
        segments.append(
            {
                "offset": offset_text,
                "file": output_name,
                "sha256": sha256(destination),
            }
        )

    manifest = {
        "schemaVersion": 1,
        "target": "esp32s3",
        "model": versions["model"],
        "firmwareVersion": versions["firmwareVersion"],
        "protocolVersion": versions["protocolVersion"],
        "bindingSchemaVersion": versions["bindingSchemaVersion"],
        "sourceCommit": args.source_commit,
        "buildSystem": "ESP-IDF 5.5.5",
        "flash": {
            "baud": 460800,
            "mode": mode,
            "frequency": frequency,
            "size": size,
        },
        "segments": segments,
    }
    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    print(
        f"BIO-EMS ESP32-S3 firmware package: PASS "
        f"{versions['firmwareVersion']} segments={len(segments)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
