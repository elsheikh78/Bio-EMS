import hashlib
import tempfile
import unittest
from pathlib import Path
from check_docs import check_archive, check_links


class DocumentationIntegrityTests(unittest.TestCase):
    def test_original_accepts_correct_bytes_and_rejects_corruption_and_missing_file(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / 'original.md'
            path.write_bytes(b'original\n')
            manifest = {'documents': [{'path': 'README.md', 'snapshot_path': 'original.md', 'bytes': 9, 'sha256': hashlib.sha256(b'original\n').hexdigest()}]}
            self.assertEqual(check_archive(root, manifest), [])
            path.write_bytes(b'modified\n')
            self.assertIn('Modified original', check_archive(root, manifest)[0])
            path.unlink()
            self.assertIn('Missing original', check_archive(root, manifest)[0])

    def test_links_handle_spaces_fragments_external_and_missing_targets(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'with space.md').write_text('# Target')
            page = root / 'README.md'
            page.write_text('[ok](<with space.md#target>) [remote](https://example.invalid/) [anchor](#local)')
            self.assertEqual(check_links(root, ['README.md']), [])
            page.write_text('[bad](missing.md)')
            self.assertIn('missing local target', check_links(root, ['README.md'])[0])

    def test_immutable_archive_links_and_fenced_examples_do_not_mutate_history(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'docs/archive').mkdir(parents=True)
            (root / 'docs/archive/old.md').write_text('[old](missing.md)')
            (root / 'README.md').write_text('```md\n[example](missing.md)\n```\n')
            self.assertEqual(check_links(root, ['docs/archive/old.md', 'README.md']), [])


if __name__ == '__main__':
    unittest.main()
