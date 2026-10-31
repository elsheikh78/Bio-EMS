import unittest
from bridge import Frames, local_origin

class BridgeTests(unittest.TestCase):
    def test_fragment_and_multiple_frames(self):
        frames = Frames()
        self.assertEqual(frames.feed(b'{"b":'), [])
        self.assertEqual(frames.feed(b'1}\n{}\n'), [b'{"b":1}', b'{}'])

    def test_bound_memory(self):
        with self.assertRaises(ValueError):
            Frames().feed(b'x' * 8193)

    def test_only_local_https(self):
        self.assertEqual(local_origin('https://localhost/'), 'https://localhost')
        for value in ['http://localhost', 'https://example.com', 'https://a@localhost', 'https://localhost/a']:
            with self.assertRaises(ValueError):
                local_origin(value)

if __name__ == '__main__':
    unittest.main()
