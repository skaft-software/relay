"""Pytest fixtures for the setup wizard's Python scripts.

setup-tui.py and size-model.py use hyphens, so they can't be imported with a
normal `import`. We load them by path with importlib. Both scripts guard their
entrypoints behind `if __name__ == "__main__"`, so importing has no side effects.
"""
import importlib.util
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parent.parent / "scripts"


def _load(name, filename):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture(scope="session")
def tui():
    """The setup-tui.py module."""
    return _load("setup_tui", "setup-tui.py")


@pytest.fixture(scope="session")
def sizer():
    """The size-model.py module."""
    return _load("size_model", "size-model.py")
