"""Terminal management and arrow-key input tests for setup-tui.py.

Covers: _Cbreak context manager (cursor hide/show, terminal restore),
_read_key decoding, _draw_menu rendering, select_one/select_many
with mocked key inputs, and color helpers.
"""
import os
import sys
from unittest.mock import MagicMock

import pytest


# ── _NoopCbreak for select_one/select_many tests ──
class _NoopCbreak:
    """A no-op context manager that doesn't touch the terminal."""
    def __enter__(self): return self
    def __exit__(self, *exc): pass


# ── Cursor hide/show constants ──
def test_hide_is_csi_question_mark_25_l(tui):
    assert tui.HIDE == "\x1b[?25l"


def test_show_is_csi_question_mark_25_h(tui):
    assert tui.SHOW == "\x1b[?25h"


# ── _read_key decoding ──
@pytest.mark.parametrize(
    "raw_bytes,expected",
    [
        (b"\x1b[A", "up"),
        (b"\x1b[B", "down"),
        (b"\x1b[C", "right"),
        (b"\x1b[D", "left"),
        (b"\r", "enter"),
        (b"\n", "enter"),
        (b" ", "space"),
        (b"q", "q"),
        (b"j", "j"),
        (b"k", "k"),
        (b"\x04", "eof"),
    ],
)
def test_read_key_decodes_sequences(raw_bytes, expected, tui):
    """_read_key decodes arrow sequences, enter, space, and printable chars."""
    if len(raw_bytes) > 1:
        # Escape sequence: first read returns b'\x1b', second returns the rest
        call_count = [0]

        def mock_read(fd, n):
            call_count[0] += 1
            if call_count[0] == 1:
                return b"\x1b"
            return raw_bytes[1:]

        with patch("os.read", side_effect=mock_read):
            with patch("select.select", return_value=([0], [], [])):
                with patch("sys.stdin.fileno", return_value=0):
                    result = tui._read_key()
    else:
        with patch("os.read", return_value=raw_bytes):
            with patch("sys.stdin.fileno", return_value=0):
                result = tui._read_key()
    assert result == expected


def test_read_key_ctrl_c_raises_keyboardinterrupt(tui):
    with patch("os.read", return_value=b"\x03"):
        with patch("sys.stdin.fileno", return_value=0):
            with pytest.raises(KeyboardInterrupt):
                tui._read_key()


def test_read_key_esc_with_no_following_bytes_returns_esc(tui):
    """ESC alone (no following bytes within timeout) returns 'esc'."""
    with patch("os.read", return_value=b"\x1b"):
        with patch("select.select", return_value=([], [], [])):
            with patch("sys.stdin.fileno", return_value=0):
                result = tui._read_key()
    assert result == "esc"


def test_read_key_unknown_escape_seq_returns_esc(tui):
    """Unknown escape sequence returns 'esc'."""
    def mock_read(fd, n):
        mock_read.call_count += 1
        if mock_read.call_count == 1:
            return b"\x1b"
        return b"[X"  # unknown sequence
    mock_read.call_count = 0
    with patch("os.read", side_effect=mock_read):
        with patch("select.select", return_value=([0], [], [])):
            with patch("sys.stdin.fileno", return_value=0):
                result = tui._read_key()
    assert result == "esc"


# ── _Cbreak context manager ──
def test_cbreak_hides_cursor_on_enter(monkeypatch, tui):
    """_Cbreak.__enter__ emits HIDE (hide cursor)."""
    emitted = []
    monkeypatch.setattr(tui, "_emit", emitted.append)
    monkeypatch.setattr(tui, "_HAS_TTY", True)
    monkeypatch.setattr(sys.stdin, "fileno", lambda: 0)
    mock_termios = MagicMock()
    monkeypatch.setattr(tui, "termios", mock_termios)
    monkeypatch.setattr(tui, "tty", MagicMock())

    with tui._Cbreak():
        pass

    assert tui.HIDE in emitted


def test_cbreak_shows_cursor_on_exit(monkeypatch, tui):
    """_Cbreak.__exit__ emits SHOW (show cursor)."""
    emitted = []
    monkeypatch.setattr(tui, "_emit", emitted.append)
    monkeypatch.setattr(tui, "_HAS_TTY", True)
    monkeypatch.setattr(sys.stdin, "fileno", lambda: 0)
    mock_termios = MagicMock()
    monkeypatch.setattr(tui, "termios", mock_termios)
    monkeypatch.setattr(tui, "tty", MagicMock())

    with tui._Cbreak():
        pass

    assert tui.SHOW in emitted


def test_cbreak_restores_terminal_on_exit(monkeypatch, tui):
    """_Cbreak.__exit__ calls tcsetattr to restore terminal settings."""
    monkeypatch.setattr(tui, "_HAS_TTY", True)
    monkeypatch.setattr(tui, "_emit", lambda s: None)
    monkeypatch.setattr(sys.stdin, "fileno", lambda: 0)
    mock_termios = MagicMock()
    monkeypatch.setattr(tui, "termios", mock_termios)
    monkeypatch.setattr(tui, "tty", MagicMock())
    old_attrs = ["mock_attrs"]
    mock_termios.tcgetattr.return_value = old_attrs

    with tui._Cbreak():
        pass

    mock_termios.tcsetattr.assert_called_once()
    args = mock_termios.tcsetattr.call_args
    assert args[0][0] == 0  # fd
    assert args[0][1] == mock_termios.TCSADRAIN
    assert args[0][2] == old_attrs  # restored to original


# ── _draw_menu rendering ──
def test_draw_menu_includes_all_options(monkeypatch, tui):
    """_draw_menu output contains every option label."""
    emitted = []
    monkeypatch.setattr(tui, "_emit", emitted.append)
    options = [
        {"label": "First", "desc": "the first option"},
        {"label": "Second"},
        {"label": "Third", "desc": "the third option"},
    ]
    tui._draw_menu("Top line", options, idx=1, selected=None, hint="hint text")
    output = "".join(emitted)
    assert "First" in output
    assert "Second" in output
    assert "Third" in output
    assert "Top line" in output
    assert "hint text" in output


def test_draw_menu_shows_selected_markers(monkeypatch, tui):
    """Selected items show filled-circle markers."""
    emitted = []
    monkeypatch.setattr(tui, "_emit", emitted.append)
    options = [{"label": "A"}, {"label": "B"}, {"label": "C"}]
    tui._draw_menu("Top", options, idx=0, selected={0, 2}, hint="h")
    output = "".join(emitted)
    # Selected items should have the filled circle (not dimmed circle)
    assert tui.g("◉ ") in output


def test_draw_menu_active_item_has_pointer(monkeypatch, tui):
    """The active (highlighted) item shows a pointer."""
    emitted = []
    monkeypatch.setattr(tui, "_emit", emitted.append)
    options = [{"label": "X"}]
    tui._draw_menu("Top", options, idx=0, selected=None, hint="h")
    output = "".join(emitted)
    assert "❯" in output


def test_draw_menu_unselected_show_dimmed_circles(monkeypatch, tui):
    """Unselected items in a multi-select show dimmed circles."""
    emitted = []
    monkeypatch.setattr(tui, "_emit", emitted.append)
    options = [{"label": "A"}, {"label": "B"}]
    tui._draw_menu("Top", options, idx=0, selected={0}, hint="h")
    output = "".join(emitted)
    assert tui.d("○ ") in output  # dimmed circle for unselected


# ── select_one with mocked inputs ──
def test_select_one_returns_chosen_index(monkeypatch, tui):
    keys = iter(["down", "down", "enter"])
    monkeypatch.setattr(tui, "_read_key", lambda: next(keys))
    monkeypatch.setattr(tui, "_draw_menu", lambda *a, **kw: None)
    monkeypatch.setattr(tui, "_emit", lambda s: None)
    monkeypatch.setattr(tui, "INTERACTIVE", True)
    monkeypatch.setattr(tui, "_HAS_TTY", True)
    monkeypatch.setattr(tui, "_Cbreak", _NoopCbreak)

    result = tui.select_one("Pick", [{"label": "A"}, {"label": "B"}, {"label": "C"}])
    assert result == 2


def test_select_one_quit_raises_quitwizard(monkeypatch, tui):
    monkeypatch.setattr(tui, "_read_key", lambda: "q")
    monkeypatch.setattr(tui, "_draw_menu", lambda *a, **kw: None)
    monkeypatch.setattr(tui, "_emit", lambda s: None)
    monkeypatch.setattr(tui, "INTERACTIVE", True)
    monkeypatch.setattr(tui, "_HAS_TTY", True)
    monkeypatch.setattr(tui, "_Cbreak", _NoopCbreak)

    with pytest.raises(tui.QuitWizard):
        tui.select_one("Pick", [{"label": "A"}])


def test_select_one_wraps_around(monkeypatch, tui):
    # down x3 on 3 items wraps back to 0
    keys = iter(["down", "down", "down", "enter"])
    monkeypatch.setattr(tui, "_read_key", lambda: next(keys))
    monkeypatch.setattr(tui, "_draw_menu", lambda *a, **kw: None)
    monkeypatch.setattr(tui, "_emit", lambda s: None)
    monkeypatch.setattr(tui, "INTERACTIVE", True)
    monkeypatch.setattr(tui, "_HAS_TTY", True)
    monkeypatch.setattr(tui, "_Cbreak", _NoopCbreak)

    result = tui.select_one("Pick", [{"label": "A"}, {"label": "B"}, {"label": "C"}])
    assert result == 0


def test_select_one_esc_raises_quitwizard(monkeypatch, tui):
    monkeypatch.setattr(tui, "_read_key", lambda: "esc")
    monkeypatch.setattr(tui, "_draw_menu", lambda *a, **kw: None)
    monkeypatch.setattr(tui, "_emit", lambda s: None)
    monkeypatch.setattr(tui, "INTERACTIVE", True)
    monkeypatch.setattr(tui, "_HAS_TTY", True)
    monkeypatch.setattr(tui, "_Cbreak", _NoopCbreak)

    with pytest.raises(tui.QuitWizard):
        tui.select_one("Pick", [{"label": "A"}])


def test_select_one_eof_raises_quitwizard(monkeypatch, tui):
    monkeypatch.setattr(tui, "_read_key", lambda: "eof")
    monkeypatch.setattr(tui, "_draw_menu", lambda *a, **kw: None)
    monkeypatch.setattr(tui, "_emit", lambda s: None)
    monkeypatch.setattr(tui, "INTERACTIVE", True)
    monkeypatch.setattr(tui, "_HAS_TTY", True)
    monkeypatch.setattr(tui, "_Cbreak", _NoopCbreak)

    with pytest.raises(tui.QuitWizard):
        tui.select_one("Pick", [{"label": "A"}])


# ── select_many with mocked inputs ──
def test_select_many_toggles_with_space(monkeypatch, tui):
    keys = iter(["space", "down", "space", "enter"])
    monkeypatch.setattr(tui, "_read_key", lambda: next(keys))
    monkeypatch.setattr(tui, "_draw_menu", lambda *a, **kw: None)
    monkeypatch.setattr(tui, "_emit", lambda s: None)
    monkeypatch.setattr(tui, "INTERACTIVE", True)
    monkeypatch.setattr(tui, "_HAS_TTY", True)
    monkeypatch.setattr(tui, "_Cbreak", _NoopCbreak)

    result = tui.select_many("Pick", [{"label": "A"}, {"label": "B"}, {"label": "C"}])
    assert result == [0, 1]


def test_select_many_a_selects_all(monkeypatch, tui):
    keys = iter(["a", "enter"])
    monkeypatch.setattr(tui, "_read_key", lambda: next(keys))
    monkeypatch.setattr(tui, "_draw_menu", lambda *a, **kw: None)
    monkeypatch.setattr(tui, "_emit", lambda s: None)
    monkeypatch.setattr(tui, "INTERACTIVE", True)
    monkeypatch.setattr(tui, "_HAS_TTY", True)
    monkeypatch.setattr(tui, "_Cbreak", _NoopCbreak)

    result = tui.select_many("Pick", [{"label": "A"}, {"label": "B"}, {"label": "C"}])
    assert result == [0, 1, 2]


def test_select_many_enter_with_no_selection_returns_empty(monkeypatch, tui):
    keys = iter(["enter"])
    monkeypatch.setattr(tui, "_read_key", lambda: next(keys))
    monkeypatch.setattr(tui, "_draw_menu", lambda *a, **kw: None)
    monkeypatch.setattr(tui, "_emit", lambda s: None)
    monkeypatch.setattr(tui, "INTERACTIVE", True)
    monkeypatch.setattr(tui, "_HAS_TTY", True)
    monkeypatch.setattr(tui, "_Cbreak", _NoopCbreak)

    result = tui.select_many("Pick", [{"label": "A"}, {"label": "B"}])
    assert result == []


def test_select_many_quit_raises_quitwizard(monkeypatch, tui):
    monkeypatch.setattr(tui, "_read_key", lambda: "q")
    monkeypatch.setattr(tui, "_draw_menu", lambda *a, **kw: None)
    monkeypatch.setattr(tui, "_emit", lambda s: None)
    monkeypatch.setattr(tui, "INTERACTIVE", True)
    monkeypatch.setattr(tui, "_HAS_TTY", True)
    monkeypatch.setattr(tui, "_Cbreak", _NoopCbreak)

    with pytest.raises(tui.QuitWizard):
        tui.select_many("Pick", [{"label": "A"}])


# ── _Cbreak graceful degradation ──
def test_cbreak_graceful_without_has_tty(tui):
    """When _HAS_TTY is False, _Cbreak exists but won't be used."""
    assert hasattr(tui, "_Cbreak")


# ── Terminal color helpers ──
def test_color_accent_uses_steel_blue(tui):
    assert "38;5;75" in tui.a("test")


def test_color_green_is_ansi_32(tui):
    assert "\x1b[32m" in tui.g("test")


def test_color_bold_is_ansi_1(tui):
    assert "\x1b[1m" in tui.b("test")


def test_color_dim_is_ansi_2(tui):
    assert "\x1b[2m" in tui.d("test")


def test_color_red_is_ansi_31(tui):
    assert "\x1b[31m" in tui.r("test")


def test_color_yellow_is_ansi_33(tui):
    assert "\x1b[33m" in tui.y("test")


def test_color_inverse_is_ansi_7(tui):
    assert "\x1b[7m" in tui.inv("test")


def test_color_cyan_is_ansi_36(tui):
    assert "\x1b[36m" in tui.c("test")


# ── QuitWizard ──
def test_quitwizard_is_exception(tui):
    assert issubclass(tui.QuitWizard, Exception)


# ── patch helper for read_key tests ──
from unittest.mock import patch
