#!/usr/bin/env python3
"""Verify preserved document bytes and supported active Markdown file links.

No network requests; historical archive links/anchors remain historical evidence.
"""
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess
from urllib.parse import unquote, urlsplit

ARCHIVE = 'docs/archive/2026-10-28-pre-audit/manifest.json'
AUDIT = 'docs/audit/2026-10-28'
LINK = re.compile(r'!?\[[^\]\n]*\]\((<[^>\n]+>|[^)\n]+)\)')


def local_target(document, raw):
    raw = raw.strip()
    if raw.startswith('<'):
        target = raw[1:raw.find('>')]
    else:
        target = re.split(r'\s+[\"\']', raw, maxsplit=1)[0]
    parts = urlsplit(target)
    if parts.scheme or parts.netloc or not parts.path:
        return None
    return document.parent / unquote(parts.path)


def check_archive(root, manifest):
    errors = []
    seen = set()
    for item in manifest['documents']:
        if item['path'] in seen:
            errors.append('Duplicate original: ' + item['path'])
        seen.add(item['path'])
        path = root / item['snapshot_path']
        if not path.is_file():
            errors.append('Missing original: ' + item['snapshot_path'])
            continue
        data = path.read_bytes()
        if len(data) != item['bytes'] or hashlib.sha256(data).hexdigest() != item['sha256']:
            errors.append('Modified original: ' + item['snapshot_path'])
    return errors


def check_links(root, paths):
    errors = []
    for relative in paths:
        path = root / relative
        if path.suffix.lower() != '.md' or relative.startswith('docs/archive/'):
            continue
        text = path.read_text(encoding='utf-8')
        # Examples inside fences are not rendered links.
        text = re.sub(r'^```[^\n]*\n.*?^```[^\n]*$', '', text, flags=re.M | re.S)
        for match in LINK.finditer(text):
            target = local_target(path, match[1])
            if target is not None and not target.exists():
                line = text[:match.start()].count('\n') + 1
                errors.append(f'{relative}:{line}: missing local target {match[1]}')
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    root = args.root.resolve()
    manifest = json.loads((root / ARCHIVE).read_text())
    inventory = json.loads((root / AUDIT / 'document-inventory.json').read_text())
    source = json.loads((root / AUDIT / 'source-inventory.json').read_text())
    errors = check_archive(root, manifest)
    before = {x['path'] for x in source['files'] if Path(x['path']).suffix.lower() in ('.md', '.txt', '.rst', '.adoc') and Path(x['path']).name not in ('CMakeLists.txt', 'requirements.txt')}
    originals = {x['path'] for x in manifest['documents']}
    if before != originals or originals != {x['path'] for x in inventory['documents']}:
        errors.append('Source/archive/document inventory accounting mismatch')
    if source['tracked_file_count'] != len(source['files']):
        errors.append('Source file count mismatch')
    paths = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard'], cwd=root, text=True).splitlines()
    errors += check_links(root, paths)
    for error in errors:
        print('ERROR:', error)
    print(f'Original documents: {len(originals)}; source files: {len(source["files"])}; errors: {len(errors)}')
    return 1 if errors else 0


if __name__ == '__main__':
    raise SystemExit(main())
