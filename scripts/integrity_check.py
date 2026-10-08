#!/usr/bin/env python3
"""
Frontend integrity check (no third-party dependencies).

Validates the single-page app shell without a browser or backend:
  1. Every LOCAL <script src="..."> referenced by index.html exists on disk
     (query strings such as ?v=... are stripped before the existence check).
  2. app.js is referenced with a ?v= cache-busting token (the token the
     deploy relies on so a new release is actually fetched by browsers).

Run from anywhere: `python3 scripts/integrity_check.py`
Exit code 0 = OK, 1 = failure (with a human-readable reason).
"""
import re
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"


def main() -> int:
    if not INDEX.exists():
        print("FRONTEND INTEGRITY: FAIL\n - index.html not found at repo root")
        return 1

    html = INDEX.read_text(encoding="utf-8")
    srcs = re.findall(r'<script[^>]+src="([^"]+)"', html)

    local, missing = [], []
    for s in srcs:
        if s.startswith(("http://", "https://", "//")):
            continue  # external CDN (Vue, xlsx) — not our file to vouch for
        path = s.split("?", 1)[0]
        local.append(path)
        if not (ROOT / path).exists():
            missing.append(s)

    errors = []
    if missing:
        errors.append(
            "Referenced local script(s) not found in the repo:\n   "
            + "\n   ".join(missing)
        )

    m = re.search(r'app\.js\?v=([^"]+)"', html)
    if not m:
        errors.append(
            "app.js is not referenced with a ?v= cache key — browsers will "
            "serve a stale bundle after deploy."
        )

    if errors:
        print("FRONTEND INTEGRITY: FAIL")
        for e in errors:
            print(" -", e)
        return 1

    print(
        f"FRONTEND INTEGRITY: OK ({len(local)} local scripts referenced, "
        f"all present; app.js cache key = {m.group(1)})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
