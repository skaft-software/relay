#!/usr/bin/env python3
"""
Relay model catalog fetcher — pulls GGUF download URLs from HuggingFace.

Usage:
  python3 scripts/fetch-catalog.py              # refresh all download URLs
  python3 scripts/fetch-catalog.py --dry-run    # show what would change
  python3 scripts/fetch-catalog.py --model qwen3-6-35b  # single model

Reads docs/model-catalog.json, queries the HuggingFace API for each model's
hf_repo, finds the GGUF file matching the catalog quant, and writes back
verified download_url + filename fields.

All catalog entries must have an 'hf_repo' field pointing to the
HuggingFace repo (e.g. 'unsloth/Qwen3.6-35B-A3B-GGUF'). The script
lists sibling files and matches by quantization suffix.

Rate-limited to ~3 req/s. Requires Python 3.10+ stdlib only.
"""
import json
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CATALOG_PATH = REPO_ROOT / "docs" / "model-catalog.json"

# ── Quant suffix mapping ──────────────────────────────────────────────
# Catalog quant names → file-name suffix fragments to match.
# unsloth uses "UD-{QUANT}", bartowski uses "{Model}-{quant}", older
# unsloth repos drop the "UD-" prefix. We try multiple patterns.

QUANT_PATTERNS = {
    "iq1_m":     ["UD-IQ1_M", "IQ1_M"],
    "iq1_s":     ["UD-IQ1_S", "IQ1_S"],
    "iq2_xxs":   ["UD-IQ2_XXS", "IQ2_XXS"],
    "iq2_xs":    ["UD-IQ2_XS", "IQ2_XS"],
    "iq2_s":     ["UD-IQ2_S", "IQ2_S"],
    "iq2_m":     ["UD-IQ2_M", "IQ2_M"],
    "iq3_xxs":   ["UD-IQ3_XXS", "IQ3_XXS"],
    "iq3_xs":    ["UD-IQ3_XS", "IQ3_XS"],
    "iq3_s":     ["UD-IQ3_S", "IQ3_S"],
    "iq3_m":     ["UD-IQ3_M", "IQ3_M"],
    "iq4_xxs":   ["UD-IQ4_XXS", "IQ4_XXS"],
    "iq4_xs":    ["UD-IQ4_XS", "IQ4_XS"],
    "iq4_nl":    ["UD-IQ4_NL", "IQ4_NL"],
    "q2_k":      ["UD-Q2_K", "Q2_K", "-Q2_K."],
    "q2_k_l":    ["UD-Q2_K_L", "Q2_K_L"],
    "q2_k_xl":   ["UD-Q2_K_XL", "Q2_K_XL"],
    "q3_k_s":    ["UD-Q3_K_S", "Q3_K_S"],
    "q3_k_m":    ["UD-Q3_K_M", "Q3_K_M"],
    "q3_k_l":    ["UD-Q3_K_L", "Q3_K_L"],
    "q3_k_xl":   ["UD-Q3_K_XL", "Q3_K_XL"],
    "q4_0":      ["UD-Q4_0", "Q4_0"],
    "q4_1":      ["UD-Q4_1", "Q4_1"],
    "q4_k_s":    ["UD-Q4_K_S", "Q4_K_S"],
    "q4_k_m":    ["UD-Q4_K_M", "Q4_K_M"],
    "q4_k_l":    ["UD-Q4_K_L", "Q4_K_L"],
    "q4_k_xl":   ["UD-Q4_K_XL", "Q4_K_XL"],
    "q5_0":      ["UD-Q5_0", "Q5_0"],
    "q5_1":      ["UD-Q5_1", "Q5_1"],
    "q5_k_s":    ["UD-Q5_K_S", "Q5_K_S"],
    "q5_k_m":    ["UD-Q5_K_M", "Q5_K_M"],
    "q5_k_l":    ["UD-Q5_K_L", "Q5_K_L"],
    "q6_k":      ["UD-Q6_K", "Q6_K"],
    "q6_k_l":    ["UD-Q6_K_L", "Q6_K_L"],
    "q8_0":      ["UD-Q8_0", "Q8_0"],
    "q8_k_xl":   ["UD-Q8_K_XL", "Q8_K_XL"],
    "tq1_0":     ["UD-TQ1_0", "TQ1_0"],
}


def hf_api(path: str) -> dict:
    """Call the HuggingFace API and return parsed JSON."""
    url = f"https://huggingface.co/api/{path}"
    req = urllib.request.Request(url, headers={"User-Agent": "relay-catalog-fetcher/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


def list_gguf_files(repo_id: str) -> list[str]:
    """Return all .gguf filenames in a HuggingFace repo."""
    try:
        data = hf_api(f"models/{repo_id}")
        siblings = data.get("siblings", [])
        return [s["rfilename"] for s in siblings if s["rfilename"].endswith(".gguf")]
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code} listing {repo_id}", file=sys.stderr)
        return []
    except Exception as e:
        print(f"  Error listing {repo_id}: {e}", file=sys.stderr)
        return []


def find_matching_gguf(files: list[str], quant: str) -> str | None:
    """Find the GGUF file matching the catalog quant."""
    patterns = QUANT_PATTERNS.get(quant.lower(), [quant.upper()])

    # Exclude mmproj / vision projector files
    ggufs = [f for f in files if "mmproj" not in f.lower() and "/mmproj" not in f.lower()]

    for pattern in patterns:
        for f in ggufs:
            basename = f.rsplit("/", 1)[-1] if "/" in f else f
            if pattern in basename:
                return f

    # Fuzzy fallback: match just the quant part
    quant_simple = quant.upper().replace("_", "")
    for f in ggufs:
        basename = f.rsplit("/", 1)[-1] if "/" in f else f
        if quant_simple in basename.upper().replace("_", ""):
            return f

    return None


def verify_url(url: str) -> bool:
    """HEAD request to verify the download URL is accessible."""
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "relay/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except Exception:
        return False


def refresh_catalog(dry_run: bool = False, model_filter: str | None = None) -> dict:
    """Refresh download URLs for all (or one) catalog entries."""
    catalog = json.loads(CATALOG_PATH.read_text())
    results = {"updated": 0, "verified": 0, "failed": 0, "skipped": 0}

    for entry in catalog:
        mid = entry["id"]
        if model_filter and mid != model_filter:
            continue

        repo = entry.get("hf_repo")
        quant = entry.get("quant", "")
        label = entry.get("label", mid)

        if not repo:
            print(f"  ⏭  {mid}: no hf_repo — skipping")
            results["skipped"] += 1
            continue

        print(f"  🔍 {mid} ({label}) — {repo} [{quant}]")

        files = list_gguf_files(repo)
        if not files:
            print(f"     ✗ no GGUF files found in {repo}")
            results["failed"] += 1
            continue

        match = find_matching_gguf(files, quant)
        if not match:
            print(f"     ✗ no file matching quant '{quant}'")
            # Show available quants for debugging
            ggufs = [f.rsplit("/", 1)[-1] for f in files if "mmproj" not in f.lower()]
            quants = sorted({f.split("-")[-1].replace(".gguf", "") for f in ggufs})
            print(f"     available: {', '.join(quants[:12])}")
            results["failed"] += 1
            continue

        url = f"https://huggingface.co/{repo}/resolve/main/{match}"
        filename = match.rsplit("/", 1)[-1] if "/" in match else match

        if dry_run:
            print(f"     → would set: {url}")
            results["updated"] += 1
            continue

        # Verify
        if verify_url(url):
            entry["download_url"] = url
            entry["filename"] = filename
            print(f"     ✓ {filename}")
            results["verified"] += 1
        else:
            print(f"     ✗ URL not reachable: {url}")
            results["failed"] += 1

        time.sleep(0.25)  # rate limit

    if not dry_run:
        CATALOG_PATH.write_text(json.dumps(catalog, indent=2) + "\n")

    return results


def main():
    dry_run = "--dry-run" in sys.argv
    model_filter = None
    for i, arg in enumerate(sys.argv):
        if arg == "--model" and i + 1 < len(sys.argv):
            model_filter = sys.argv[i + 1]
            break

    print("═══ Relay Catalog Fetcher ═══\n")
    print(f"Catalog: {CATALOG_PATH}")
    print(f"Mode: {'dry-run' if dry_run else 'live'}")

    if model_filter:
        print(f"Model: {model_filter}")

    print()
    results = refresh_catalog(dry_run=dry_run, model_filter=model_filter)

    print(f"\n═══ Results ═══")
    print(f"  Updated/verified: {results['updated'] + results['verified']}")
    print(f"  Failed:           {results['failed']}")
    print(f"  Skipped:          {results['skipped']}")

    if results["failed"] > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
