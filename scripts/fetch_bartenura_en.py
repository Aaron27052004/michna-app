#!/usr/bin/env python3
"""Download Sefaria's English Bartenura text into lib/bartenura-en.json."""

from __future__ import annotations

import json
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = "https://www.sefaria.org/api/v3/texts"
USER_AGENT = "MichnaApp Bartenura importer/1.0"
ALIASES = {"Avot": "Pirkei_Avot"}
SYSTEM_CA = Path("/etc/ssl/cert.pem")
SSL_CONTEXT = ssl.create_default_context(
    cafile=str(SYSTEM_CA) if SYSTEM_CA.exists() else None
)


def tractates_from_app() -> list[tuple[str, int]]:
    """Read the app's existing tractate/chapter catalog to avoid duplicating it."""
    source = (ROOT / "lib/data.js").read_text(encoding="utf-8")
    rows = re.findall(r'\["[^"]+","([^"]+)"\]', source)
    return [
        (name, int(chapters))
        for row in rows
        for item in row.split(",")
        for name, chapters in [item.split(":", 1)]
    ]


def get_json(url: str) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=15, context=SSL_CONTEXT) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise
        time.sleep(2 ** attempt)
    raise RuntimeError(f"Could not fetch {url}")


def collect_text(value) -> list[str]:
    if isinstance(value, str):
        cleaned = re.sub(r"<[^>]+>", "", value).strip()
        return [cleaned] if cleaned else []
    if isinstance(value, list):
        return [part for item in value for part in collect_text(item)]
    return []


def main() -> int:
    target = ROOT / "lib/bartenura-en.json"
    result: dict[str, dict[str, list[dict]]] = {}
    if target.exists():
        result = json.loads(target.read_text(encoding="utf-8"))
    missing: list[str] = []
    tracts = tractates_from_app()
    for number, (tractate, chapter_count) in enumerate(tracts, start=1):
        index = ALIASES.get(tractate, f"Mishnah_{tractate}")
        book = f"Bartenura_on_{index}"
        key = tractate.lower().replace("_", " ")
        chapters: dict[str, list[dict]] = result.get(key, {})
        for chapter in range(1, chapter_count + 1):
            ref = f"{book}.{chapter}"
            url = f"{API}/{urllib.parse.quote(ref, safe='._')}?version=english"
            try:
                payload = get_json(url)
            except (urllib.error.URLError, urllib.error.HTTPError) as error:
                print(f"  indisponible {ref}: {error}", file=sys.stderr)
                missing.append(ref)
                continue

            versions = payload.get("versions", [])
            version = next((v for v in versions if v.get("language") == "en"), None)
            if not version or not version.get("text"):
                missing.append(ref)
                continue

            # Sefaria returns one outer item per mishnah; inner arrays are
            # preserved as paragraphs within that mishnah.
            entries = []
            for mishnah in version["text"]:
                paragraphs = collect_text(mishnah)
                if paragraphs:
                    entries.append({
                        "text": "\n\n".join(paragraphs),
                        "credit": version.get("versionTitle", "Bartenura on Mishnah (Sefaria)"),
                        "license": version.get("license", ""),
                        "source": f"Sefaria: {ref}",
                    })
            if entries:
                chapters[str(chapter)] = entries
            else:
                missing.append(ref)
            time.sleep(0.08)

            if chapters:
                result[key] = chapters
        temporary = target.with_suffix(".json.tmp")
        temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        temporary.replace(target)
        print(f"[{number}/{len(tracts)}] {tractate}: {len(chapters)}/{chapter_count} chapitres", flush=True)

    print(f"Fichier créé : {target} ({len(result)} traités)")
    if missing:
        print(f"Références sans traduction anglaise récupérée : {len(missing)}", file=sys.stderr)
        for ref in missing:
            print(f"  {ref}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
