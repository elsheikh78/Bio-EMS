# Project Audit Documentation Checks

From repository root:

```sh
python tools/project-audit/check_docs.py
python -m unittest discover -s tools/project-audit -p 'test_*.py' -v
```

The checker validates every original document against its immutable snapshot and matches source/archive/document accounting. Active Markdown file links must resolve; archived originals retain their old links. It deliberately does not fetch web URLs or validate every anchor/Markdown dialect. See the [maintenance guide](../../docs/current/DOCUMENTATION-MAINTENANCE.md) and [audit](../../docs/audit/2026-10-28/README.md).
