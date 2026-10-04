#!/usr/bin/env python3
"""CryptoMines theme recolor: neon-blue -> premium sci-fi space palette.

Deterministic, idempotent hex/rgba mapping applied to CSS/SVG sources.
Gold (reward/success) and red (danger/mines) are introduced per the new
color system; every remaining blue hue is shifted toward cyan/teal.
"""
import re
import sys
from pathlib import Path

# Exact 6-digit hex mappings (case-insensitive match, uppercase output).
HEX_MAP = {
    # ── blues → cyan / teal accents ──────────────────────────────
    "3B82F6": "22D3EE",  # primary blue        → bright cyan
    "2563EB": "0891B2",  # mid blue            → deep cyan
    "1D4ED8": "0E7490",  # royal blue          → darker cyan
    "1E3A8A": "155E75",  # dark blue           → dark cyan
    "172554": "083344",  # deepest blue        → near-black cyan
    "60A5FA": "67E8F9",  # light blue          → pale cyan
    "93C5FD": "7DD3FC",  # softer blue         → sky-300 (cyan family)
    "BFDBFE": "A5F3FC",  # ice blue            → cyan-200
    "DBEAFE": "CFFAFE",  # frost blue          → cyan-100
    "EFF6FF": "ECFEFF",  # near-white blue     → cyan-50
    "E6EEFF": "E0F7FA",  # brand text blue     → pale cyan
    "9CA3AF": "8FA6B2",  # steel gray          → cool steel (slight cyan)
    "CBD5E1": "B9D6DE",  # slate-300           → cyan-tinted slate
    "94A3B8": "8AAAB8",  # slate-400           → cyan-tinted slate
    # ── violets → teals ──────────────────────────────────────────
    "A78BFA": "5EEAD4",  # violet              → teal-300
    "7C3AED": "0D9488",  # violet-600          → teal-600
    "9333EA": "14B8A6",  # purple-500          → teal-500
    "C084FC": "2DD4BF",  # purple-400          → teal-400
    "4C1D95": "134E4A",  # purple-900          → teal-900
    "9945D0": "10B9A1",  # solana brand purple → signature teal
    # ── greens → cyans (legacy assets) ───────────────────────────
    "10B981": "22D3EE",
    "059669": "0891B2",
    "065F46": "155E75",
    "064E3B": "164E63",
    "0A825A": "0E7490",
    "0ABF83": "22D3EE",
    "34D399": "67E8F9",
    "6EE7B7": "A5F3FC",
    "A7F3D0": "CFFAFE",
    "D1FAE5": "ECFEFF",
    "3DF3B6": "67E8F9",
    "81F8D0": "A5F3FC",
    "BCFBE6": "CFFAFE",
    "E1FDF4": "ECFEFF",
    "F1FEFA": "F0FDFA",
    "ECFDF5": "ECFEFF",
    "24A17B" : "0891B2",
    "26A17B": "0891B2",
    "3DFF9A": "5EEAD4",
    "9BFFCF": "A5F3FC",
    "2EE6D6": "22D3EE",  # already teal-cyan → align to token
    # ── golds/ambers → reward GOLD (#fde68a family) ──────────────
    "F59E0B": "FBBF24",
    "D97706": "F59E0B",
    "B45309": "D97706",
    "92400E": "B45309",
    "78350F": "92400E",
    "3D3520": "4A3A10",
    "403C2A": "4A3F1E",
    "C9A227": "F59E0B",
    "E8C547": "FCD34D",
    "FFB020": "FBBF24",
    "FFD98A": "FDE68A",
    "FFD27A": "FDE68A",
    "FFF8EB": "FEF7E0",
    # ── warm neutrals → cool space navy ──────────────────────────
    "1A1018": "0A121E",
    "050503": "04070D",
    "080705": "05080F",
    "080806": "05080F",
    "090806": "060910",
    "0A0A08": "060910",
    "0F0E0A": "0A101C",
    "12100A": "0C1420",
    "16150F": "0E1622",
    "171412": "101A28",
    "1A1714": "121C2A",
    "1A1810": "121C2A",
    "1A1812": "121D2B",
    "1C1917": "141E2C",
    "26221D": "1A2634",
    "3D3833": "2A3A48",
    "63574B": "3E5563",
    "35332A": "24353F",
    "2E2B1F": "1F2E38",
}

RGBA_MAP = [  # (old triple, new triple) — whitespace-normalized matching
    ((59, 130, 246), (34, 211, 238)),
    ((37, 99, 235), (8, 145, 178)),
    ((96, 165, 250), (103, 232, 249)),
    ((147, 197, 253), (125, 211, 252)),
    ((191, 219, 254), (165, 243, 252)),
    ((29, 78, 216), (14, 116, 144)),
    ((30, 58, 138), (21, 94, 117)),
    ((23, 37, 84), (8, 51, 68)),
    ((12, 26, 55), (12, 42, 55)),
]


def map_hex(m: re.Match) -> str:
    h = m.group(1).upper()
    return "#" + HEX_MAP.get(h, h)


def map_rgba(m: re.Match) -> str:
    nums = tuple(int(x) for x in m.group(1).split(","))[:3]
    if len(nums) < 3:
        return m.group(0)
    for old, new in RGBA_MAP:
        if nums == old:
            rest = m.group(1).split(",")[3:]
            tail = "," + ",".join(rest) if rest else ""
            return f"rgba({new[0]}, {new[1]}, {new[2]}{tail})"
    return m.group(0)


def transform(text: str) -> str:
    text = re.sub(r"#([0-9a-fA-F]{6})\b", map_hex, text)
    text = re.sub(r"rgba\(\s*([0-9]+\s*,\s*[0-9]+\s*,\s*[0-9]+(?:\s*,\s*[\d.]+)?)\s*\)",
                  lambda m: map_rgba_val(m), text)
    return text


def map_rgba_val(m: re.Match) -> str:
    parts = [p.strip() for p in m.group(1).split(",")]
    nums = tuple(int(p) for p in parts[:3])
    for old, new in RGBA_MAP:
        if nums == old:
            return "rgba(" + ", ".join([str(new[0]), str(new[1]), str(new[2])] + parts[3:]) + ")"
    return m.group(0)


def main(paths):
    changed = 0
    for p in paths:
        path = Path(p)
        if not path.exists():
            print(f"skip (missing): {path}")
            continue
        src = path.read_text(encoding="utf-8")
        out = transform(src)
        if out != src:
            path.write_text(out, encoding="utf-8")
            changed += 1
            print(f"updated: {path}")
    print(f"{changed} file(s) updated")


if __name__ == "__main__":
    args = sys.argv[1:]
    files = []
    for a in args:
        pp = Path(a)
        if pp.is_dir():
            files.extend(sorted(pp.rglob("*.svg")))
            files.extend(sorted(pp.rglob("*.css")))
        else:
            files.append(pp)
    main(files)
