"""The videos root for the Python scripts, mirroring scripts/lib/videos-root.mjs.

Every video is <root>/<slug>/. The root resolves in this order:
  1. STUDIO_VIDEOS_DIR (relative paths resolve against the working directory)
  2. "videosDir" in $XDG_CONFIG_HOME/explainer-studio/config.json (~/.config by default)
  3. ~/.local/share/explainer-studio/videos
A leading ~ expands in both settings. A missing or unreadable config file is skipped;
one that isn't JSON, or whose "videosDir" isn't a string, stops the script with its path.
Standard library only, so every script can import it.
"""

import json
import os
from pathlib import Path

DEFAULT_ROOT = Path.home() / ".local" / "share" / "explainer-studio" / "videos"


def _expand_home(path):
    return str(Path.home()) + path[1:] if path == "~" or path.startswith("~/") else path


def _reject_constant(name):
    raise ValueError(f"{name} is not JSON")


def config_file(env=None):
    env = os.environ if env is None else env
    xdg = env.get("XDG_CONFIG_HOME")
    base = Path(xdg) if xdg and os.path.isabs(xdg) else Path.home() / ".config"
    return base / "explainer-studio" / "config.json"


def _configured_root(env):
    file = config_file(env)
    try:
        data = file.read_bytes()
    except OSError:
        return None
    try:
        config = json.loads(data, parse_constant=_reject_constant)
    except ValueError as error:
        raise SystemExit(f"{file} is not valid JSON: {error}")
    value = config.get("videosDir") if isinstance(config, dict) else None
    if value is None or value == "":
        return None
    if not isinstance(value, str):
        raise SystemExit(f'{file}: "videosDir" must be a path string')
    return value


def videos_root(env=None):
    """The absolute videos root, without creating it."""
    env = os.environ if env is None else env
    setting = env.get("STUDIO_VIDEOS_DIR") or _configured_root(env)
    return Path(os.path.abspath(_expand_home(setting))) if setting else DEFAULT_ROOT
