"""Separate designated-board package, intentionally incompatible with ordinary flashers."""
import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path
from package_firmware import parse_version_header


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--build-dir', required=True)
    parser.add_argument('--output-dir', required=True)
    parser.add_argument('--source-commit', required=True)
    args = parser.parse_args()
    if not re.fullmatch('[0-9a-f]{40}', args.source_commit):
        raise ValueError('Exact source commit is required')
    build = Path(args.build_dir).resolve()
    config = (build / 'config/sdkconfig.h').read_text()
    if not all(flag in config for flag in ['#define CONFIG_BIOEMS_USB_AB_MAINTENANCE 1', '#define CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE 1']):
        raise ValueError('Maintenance and rollback profile was not built')
    if any(flag in config for flag in ['#define CONFIG_SECURE_BOOT 1', '#define CONFIG_SECURE_FLASH_ENC_ENABLED 1']):
        raise ValueError('Manufacturing security images require a separate owner-key workflow')
    output = Path(args.output_dir).resolve()
    if output.exists():
        raise ValueError('Do not overwrite a maintenance package')
    flash = json.loads((build / 'flasher_args.json').read_text())
    if str(flash.get('extra_esptool_args', {}).get('chip')) != 'esp32s3':
        raise ValueError('Wrong controller chip')
    app = build / 'bioems_site_controller.bin'
    if not 0 < app.stat().st_size <= 0x1f0000:
        raise ValueError('Application exceeds the inactive-slot size')
    if flash['flash_files'].get('0x20000') != 'bioems_site_controller.bin':
        raise ValueError('Unexpected initial maintenance application offset')
    output.mkdir(parents=True)
    files = []
    for offset, relative in flash['flash_files'].items():
        source = (build / relative).resolve()
        if not source.is_relative_to(build) or not source.is_file():
            raise ValueError('Unsafe build output path')
        target = output / source.name
        shutil.copyfile(source, target)
        files.append({'offset': offset, 'file': target.name, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
    manifest = {'schema': 1, 'purpose': 'designated-board-ab-maintenance-only', 'sourceCommit': args.source_commit,
                **parse_version_header(Path(__file__).parent / 'main/bioems_version.h'),
                'initialConversionRequiresPhysicalAcceptance': True, 'productionSecurityActivated': False,
                'application': {'file': app.name, 'sha256': hashlib.sha256(app.read_bytes()).hexdigest(), 'maxBytes': 0x1f0000},
                'initialImages': files, 'confirmationDeadlineSeconds': 180,
                'warning': 'Not an ordinary Tester/provisioner package. Do not repartition a field board without protected configuration backup and recovery qualification.'}
    (output / 'maintenance-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')

if __name__ == '__main__':
    main()
