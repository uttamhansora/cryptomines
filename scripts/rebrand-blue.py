#!/usr/bin/env python3
"""Rebrand CryptoMines frontend theme: red/rose accents -> vibrant neon blue.

Pure colour-value + token-name mapping. No structural changes, so animation
timing / GPU-composited properties are untouched (performance preserved).
"""
import pathlib
import re
import sys

SRC = pathlib.Path("/workspace/frontend/src")

# ---------------------------------------------------------------- hex colours
HEX_MAP = {
    # primary accent family (red-500)
    "#ef4444": "#3b82f6",
    "#dc2626": "#2563eb",
    "#b91c1c": "#1d4ed8",
    "#7f1d1d": "#1e3a8a",
    "#450a0a": "#172554",
    # light tints (red-400/300/200/100/50) -> blue equivalents
    "#f87171": "#60a5fa",
    "#fca5a5": "#93c5fd",
    "#fecaca": "#bfdbfe",
    "#fee2e2": "#dbeafe",
    "#fef2f2": "#eff6ff",
    # rose secondary family -> deeper blues (no violet)
    "#fb7185": "#2563eb",
    "#e11d48": "#1d4ed8",
    "#fecdd3": "#bfdbfe",
    # warm off-white text -> cool off-white
    "#faf1f0": "#f0f5ff",
    "#f8e6e6": "#e6eeff",
    # muted greys with a red cast -> blue cast
    "#b0a89e": "#a3adbd",
    "#806464": "#64748b",
    # graphite / surfaces (reddish dark neutrals -> bluish dark neutrals)
    "#1f1416": "#141a26",
    "#2b1e21": "#1e2735",
    "#1a1012": "#10151f",
    "#201317": "#151d2b",
    "#150c0e": "#0c111c",
    "#0b0406": "#04070d",
    "#1c0a0c": "#0a101c",
    "#1a0c0e": "#0c111a",
    "#1a0404": "#040a1a",
    "#1c0505": "#050a14",
    # metallic frame stops
    "#3d1f24": "#1f2c4a",
    "#1b0f12": "#0f1522",
    "#2b171a": "#1a2436",
    "#1d0f12": "#101826",
    "#331c20": "#243350",
    "#331d21": "#1d2a42",
    "#241417": "#141d2c",
    "#241418": "#141d2c",
    "#331a1e": "#1d2840",
    "#2b1517": "#182234",
    "#1a1114": "#111825",
    "#1a0f11": "#0f1520",
}

# ------------------------------------------------------------- rgb(a) colours
RGB_TRIPLE_MAP = {
    (239, 68, 68): (59, 130, 246),     # primary glow
    (248, 113, 113): (96, 165, 250),   # primary-light glow
    (251, 113, 133): (37, 99, 235),    # rose secondary -> strong blue
    (254, 202, 202): (191, 219, 254),  # highlight-soft
    (252, 165, 165): (147, 197, 253),
    (220, 38, 38): (37, 99, 235),
    (185, 28, 28): (29, 78, 216),
    (150, 112, 112): (112, 132, 165),  # muted text w/ red cast
    (102, 24, 24): (30, 58, 138),
    (83, 18, 18): (23, 37, 84),
    (42, 12, 12): (12, 20, 42),
    # dark reddish neutral backgrounds -> dark bluish neutrals
    (26, 18, 20): (16, 21, 31),
    (22, 15, 17): (16, 21, 31),
    (14, 9, 10): (9, 14, 22),
    (43, 26, 29): (26, 33, 48),
    (20, 8, 10): (8, 13, 20),
    (20, 6, 8): (6, 13, 20),
    (18, 10, 11): (10, 15, 24),
    (16, 9, 10): (9, 14, 21),
    (14, 8, 9): (8, 13, 20),
    (14, 8, 10): (8, 13, 20),
    (10, 6, 7): (6, 11, 18),
    (10, 5, 6): (5, 10, 16),
    (9, 4, 5): (4, 9, 15),
    (8, 4, 4): (4, 8, 14),
    # warm-tinted near-whites -> cool
    (255, 240, 225): (225, 240, 255),
    (250, 248, 238): (238, 245, 250),
    # warm brown ambient tint -> deep navy
    (80, 30, 5): (10, 30, 80),
    (42, 20, 4): (12, 26, 55),
    (34, 22, 10): (16, 24, 42),
    (30, 27, 23): (23, 27, 34),
    (15, 14, 10): (11, 14, 20),
}

# already-cool rgb triples that just need to stay consistent (blue-cast neutrals)
COOL_TRIPLES = {(8, 12, 14), (5, 8, 12), (10, 16, 21)}

# ------------------------------------------------------------------ word map
WORD_MAP = [
    ("glow-red", "glow-blue"),
    ("red-deep", "blue-deep"),
    ("red-mid", "blue-mid"),
    ("red-light", "blue-light"),
    ("premium red", "neon blue"),
    ("red glow", "blue glow"),
    ("red shades", "blue shades"),
    ("red hues", "blue hues"),
    ("Red ", "Blue "),
]


def convert_rgb_triples(text: str) -> str:
    """Map red/warm rgb(a()) triples to their blue equivalents.

    Handles both `rgba(239, 68, 68, 0.3)` and compact `rgba(251,113,133,.35)`
    forms (including leading-dot alphas and % alpha units), preserving the
    original separator spacing so diffs stay minimal.
    """

    def make_repl(fn: str):
        def _r(m: re.Match) -> str:
            triple = (int(m.group(1)), int(m.group(2)), int(m.group(3)))
            out = RGB_TRIPLE_MAP.get(triple)
            if out is None:
                return m.group(0)
            body = ", ".join(str(v) for v in out) if ", " in m.group(0) else ",".join(str(v) for v in out)
            return f"{fn}({body}{m.group(4)}"

        return _r

    for fn in ("rgba", "rgb"):
        text = re.sub(
            rf"{fn}\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*((?:,\s*[\d.]+%?\s*)?\))",
            make_repl(fn),
            text,
        )
    return text


def main() -> int:
    changed = []
    for path in sorted(SRC.rglob("*")):
        if path.suffix not in {".svelte", ".css", ".ts", ".js", ".html"}:
            continue
        if ".test." in path.name:
            continue
        original = path.read_text(encoding="utf-8")
        text = original
        for old, new in HEX_MAP.items():
            text = text.replace(old, new)          # lowercase
            text = text.replace(old.upper(), new)  # uppercase source
        text = convert_rgb_triples(text)
        for old, new in WORD_MAP:
            text = text.replace(old, new)
        if text != original:
            path.write_text(text, encoding="utf-8")
            changed.append(str(path.relative_to(SRC.parent)))
    print(f"rewrote {len(changed)} files")
    for c in changed:
        print("  ", c)
    return 0


if __name__ == "__main__":
    sys.exit(main())
