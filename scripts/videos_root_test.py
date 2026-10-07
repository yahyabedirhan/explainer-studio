"""Checks the Python videos root against the order of scripts/lib/videos-root.mjs, with scratch folders only.

    tts/bin/python -m unittest discover -s scripts -p '*_test.py'
"""

import json
import os
import tempfile
import unittest
from pathlib import Path

from videos_root import DEFAULT_ROOT, config_file, videos_root

HOME = Path.home()


class VideosRootTest(unittest.TestCase):
    def scratch(self):
        folder = tempfile.TemporaryDirectory(prefix="videos-root-")
        self.addCleanup(folder.cleanup)
        return folder.name

    def with_config(self, content):
        xdg = self.scratch()
        os.mkdir(os.path.join(xdg, "explainer-studio"))
        Path(xdg, "explainer-studio", "config.json").write_text(content)
        return xdg

    def test_environment_variable_wins_over_config(self):
        xdg = self.with_config(json.dumps({"videosDir": "/from/config"}))
        self.assertEqual(videos_root({"STUDIO_VIDEOS_DIR": "/from/env", "XDG_CONFIG_HOME": xdg}), Path("/from/env"))

    def test_relative_environment_variable_resolves_against_working_directory(self):
        self.assertEqual(videos_root({"STUDIO_VIDEOS_DIR": "here"}), Path(os.getcwd(), "here"))

    def test_environment_variable_expands_home(self):
        self.assertEqual(videos_root({"STUDIO_VIDEOS_DIR": "~/films"}), HOME / "films")

    def test_empty_environment_variable_counts_as_unset(self):
        self.assertEqual(videos_root({"STUDIO_VIDEOS_DIR": "", "XDG_CONFIG_HOME": self.scratch()}), DEFAULT_ROOT)

    def test_config_wins_over_default_and_home_expands(self):
        xdg = self.with_config(json.dumps({"videosDir": "~/films"}))
        self.assertEqual(videos_root({"XDG_CONFIG_HOME": xdg}), HOME / "films")

    def test_missing_config_falls_back_to_default(self):
        self.assertEqual(videos_root({"XDG_CONFIG_HOME": self.scratch()}), DEFAULT_ROOT)
        self.assertEqual(DEFAULT_ROOT, HOME / ".local/share/explainer-studio/videos")

    def test_config_without_videos_dir_falls_back_to_default(self):
        for content in ("{}", '{"videosDir": ""}', '{"videosDir": null}', "[]", "null"):
            with self.subTest(content=content):
                self.assertEqual(videos_root({"XDG_CONFIG_HOME": self.with_config(content)}), DEFAULT_ROOT)

    def test_config_that_is_not_json_stops_with_its_path(self):
        xdg = self.with_config("videosDir = nope")
        with self.assertRaises(SystemExit) as stop:
            videos_root({"XDG_CONFIG_HOME": xdg})
        self.assertIn(str(config_file({"XDG_CONFIG_HOME": xdg})), str(stop.exception))

    def test_non_string_videos_dir_stops_with_its_path(self):
        xdg = self.with_config(json.dumps({"videosDir": 3}))
        with self.assertRaises(SystemExit) as stop:
            videos_root({"XDG_CONFIG_HOME": xdg})
        self.assertIn(str(config_file({"XDG_CONFIG_HOME": xdg})), str(stop.exception))

    def test_config_file_defaults_to_home_config(self):
        self.assertEqual(config_file({}), HOME / ".config/explainer-studio/config.json")

    def test_relative_xdg_config_home_is_ignored(self):
        self.assertEqual(config_file({"XDG_CONFIG_HOME": "relative/config"}), HOME / ".config/explainer-studio/config.json")


if __name__ == "__main__":
    unittest.main()
