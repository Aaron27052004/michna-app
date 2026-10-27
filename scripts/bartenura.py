#!/usr/bin/env python3
"""Fetch, export for translation, and import Bartenura texts from Sefaria."""

from __future__ import annotations

import argparse
import http.client
import html
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
LIB = ROOT / "lib"
DATA_FILE = LIB / "bartenura.json"
EXPORT_DIR = LIB / "bartenura-to-translate"
FRENCH_DIR = LIB / "bartenura-fr"
API = "https://www.sefaria.org/api/v3/texts/"
USER_AGENT = "MichnaApp Bartenura importer/2.0"
ALIASES = {"Avot": "Pirkei_Avot"}
SYSTEM_CA = Path("/etc/ssl/cert.pem")
SSL_CONTEXT = ssl.create_default_context(cafile=str(SYSTEM_CA) if SYSTEM_CA.exists() else None)
OPEN_MARK = re.compile(r"^\[\[COMMENT ([^\]\r\n]+)\]\]$")
CLOSE_MARK = "[[/COMMENT]]"


def catalog() -> list[tuple[str, int]]:
    """Use the app's tractate catalog as the source of truth."""
    source = (LIB / "data.js").read_text(encoding="utf-8")
    rows = re.findall(r'\["[^"]+","([^"]+)"\]', source)
    return [
        (name, int(count))
        for row in rows
        for item in row.split(",")
        for name, count in [item.split(":", 1)]
    ]


def key_for(tractate: str) -> str:
    return tractate.lower().replace("_", " ")


def api_index(tractate: str) -> str:
    return ALIASES.get(tractate, f"Mishnah_{tractate}")


def get_json(url: str) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=25, context=SSL_CONTEXT) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 3:
                raise
        except (urllib.error.URLError, TimeoutError, http.client.HTTPException):
            if attempt == 3:
                raise
        time.sleep(2 ** attempt)
    raise RuntimeError(f"Could not fetch {url}")


def text_only(value: str) -> str:
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    value = re.sub(r"</(?:p|div|li)>\s*", "\n", value, flags=re.I)
    value = re.sub(r"<[^>]+>", "", value)
    return html.unescape(value).strip()


def translation_text(value: str) -> str:
    value = text_only(value)
    # Keep the handouts English-only; the Hebrew dibur is stored separately.
    value = re.sub(r"[\u0590-\u05ff\ufb1d-\ufb4f]", "", value)
    value = re.sub(r"\(\s*[.,;:–—-]*\s*\)", "", value)
    return re.sub(r"\s+", " ", value).strip()


def extract_dibur(hebrew_html: str) -> tuple[str, str]:
    """Sefaria marks the dibur hamatchil in the Hebrew text with <b> tags."""
    match = re.search(r"<b\b[^>]*>(.*?)</b>", hebrew_html, flags=re.I | re.S)
    if match:
        dibur = text_only(match.group(1))
        body = hebrew_html[:match.start()] + hebrew_html[match.end():]
        body = re.sub(r"^\s*[.،,:;–—-]+\s*", "", body)
        return dibur, body.strip()

    # Fallback for editions without semantic bold markup: split only at the
    # first clear Sefaria separator, and accept the prefix only if it is Hebrew.
    match = re.match(r"\s*(.*?)\s+[–—]\s+(.*)$", hebrew_html, flags=re.S)
    if match and re.search(r"[\u0590-\u05ff]", text_only(match.group(1))):
        return text_only(match.group(1)), match.group(2).strip()
    return "", hebrew_html.strip()


def english_body(english_html: str) -> str:
    """Remove a duplicated Hebrew dibur when the English edition includes it."""
    match = re.match(r"\s*(.*?)\s+[–—]\s+(.*)$", english_html, flags=re.S)
    if match and re.search(r"[\u0590-\u05ff]", text_only(match.group(1))):
        return match.group(2).strip()
    return english_html.strip()


def save_data(data: dict) -> None:
    temp = DATA_FILE.with_suffix(".json.tmp")
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(DATA_FILE)


def fetch(force: bool = False) -> None:
    data = json.loads(DATA_FILE.read_text(encoding="utf-8")) if DATA_FILE.exists() else {
        "_schema": "bartenura-v1", "_versions": {},
    }
    issues = []
    tracts = catalog()
    for tract_no, (tractate, chapter_count) in enumerate(tracts, 1):
        key = key_for(tractate)
        index = f"Bartenura_on_{api_index(tractate)}"
        data.setdefault(key, {})
        for chapter in range(1, chapter_count + 1):
            ch = str(chapter)
            if not force and ch in data[key]:
                continue
            previous_chapter = data[key].get(ch, [])
            ref = f"{index}.{chapter}"
            url = f"{API}{urllib.parse.quote(ref, safe='._')}?version=primary&version=english"
            try:
                payload = get_json(url)
            except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, http.client.HTTPException) as error:
                print(f"  erreur {ref}: {error}", file=sys.stderr, flush=True)
                issues.append(f"{ref}: {error}")
                continue

            versions = payload.get("versions", [])
            hebrew_version = next((v for v in versions if v.get("language") == "he"), None)
            english_version = next((v for v in versions if v.get("language") == "en"), None)
            he_mishnayot = (hebrew_version or {}).get("text", [])
            en_mishnayot = (english_version or {}).get("text", [])
            chapter_rows = []

            for mishna_no in range(1, max(len(he_mishnayot), len(en_mishnayot)) + 1):
                he_comments = he_mishnayot[mishna_no - 1] if mishna_no <= len(he_mishnayot) else []
                en_comments = en_mishnayot[mishna_no - 1] if mishna_no <= len(en_mishnayot) else []
                comments = []
                for comment_no in range(1, max(len(he_comments), len(en_comments)) + 1):
                    raw_he = he_comments[comment_no - 1] if comment_no <= len(he_comments) else ""
                    raw_en = en_comments[comment_no - 1] if comment_no <= len(en_comments) else ""
                    previous = (
                        previous_chapter[mishna_no - 1][comment_no - 1]
                        if mishna_no <= len(previous_chapter)
                        and comment_no <= len(previous_chapter[mishna_no - 1])
                        else {}
                    )
                    dibur, he_body = extract_dibur(str(raw_he or "")) if raw_he else ("", "")
                    alignment = "index" if raw_he and raw_en else (
                        "hebrew-only" if raw_he and not raw_en else
                        "english-only" if raw_en and not raw_he else "count-mismatch"
                    )
                    comments.append({
                        "dibur": dibur,
                        "he": he_body,
                        "en": english_body(str(raw_en or "")),
                        "fr": previous.get("fr", ""),
                        "alignment": alignment,
                    })
                chapter_rows.append(comments)

            data[key][ch] = chapter_rows
            data["_versions"].setdefault(key, {})[ch] = {
                "he": version_meta(hebrew_version),
                "en": version_meta(english_version),
                "ref": ref,
            }
            save_data(data)  # Keep each chapter as a resumable checkpoint.
            print(f"[{tract_no}/{len(tracts)}] {tractate} {chapter}: {len(chapter_rows)} michnayot", flush=True)
            time.sleep(0.08)

    write_issue_report(data, issues)
    print(f"Données enregistrées : {DATA_FILE}")


def write_issue_report(data: dict, api_errors: list[str] | None = None) -> None:
    issues = list(api_errors or [])
    for tractate, chapter_count in catalog():
        key = key_for(tractate)
        chapters = data.get(key, {})
        for chapter in range(1, chapter_count + 1):
            if str(chapter) not in chapters:
                issue = f"Bartenura_on_{api_index(tractate)}.{chapter}: référence absente de l'API"
                if issue not in issues:
                    issues.append(issue)
                continue
            for mishna_no, comments in enumerate(chapters[str(chapter)], 1):
                for comment_no, comment in enumerate(comments, 1):
                    ref = f"{tractate} {chapter}:{mishna_no}:{comment_no}"
                    if comment.get("he") and not comment.get("dibur"):
                        issues.append(f"{ref}: dibour non marqué en gras par la source")
                    if comment.get("he") and not comment.get("en"):
                        issues.append(f"{ref}: traduction anglaise absente de Sefaria")
                    if comment.get("alignment") == "english-only":
                        issues.append(f"{ref}: segment anglais sans commentaire hébreu correspondant")
    issue_file = LIB / "bartenura-fetch-issues.txt"
    if issues:
        issue_file.write_text("\n".join(issues) + "\n", encoding="utf-8")
        print(f"Points à vérifier : {len(issues)} — {issue_file}", file=sys.stderr)
    elif issue_file.exists():
        issue_file.unlink()


def version_meta(version: dict | None) -> dict:
    if not version:
        return {}
    return {
        "versionTitle": version.get("versionTitle", ""),
        "license": version.get("license", ""),
        "versionSource": version.get("versionSource", ""),
    }


def comment_rows(data: dict):
    for tractate, chapters in data.items():
        if tractate.startswith("_"):
            continue
        for chapter, mishnayot in chapters.items():
            for mishna_no, comments in enumerate(mishnayot, 1):
                for comment_no, comment in enumerate(comments, 1):
                    yield f"{tractate}|{chapter}|{mishna_no}|{comment_no}", comment


def export_translation(tractate_filter: str | None = None) -> None:
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    total = 0
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    for tractate, chapters in data.items():
        if tractate.startswith("_"):
            continue
        if tractate_filter and tractate != key_for(tractate_filter):
            continue
        for chapter, mishnayot in chapters.items():
            filename = f"{tractate.replace(' ', '-')}-{int(chapter):02}.txt"
            target = EXPORT_DIR / filename
            with target.open("w", encoding="utf-8", newline="\n") as output:
                for mishna_no, comments in enumerate(mishnayot, 1):
                    for comment_no, comment in enumerate(comments, 1):
                        english = translation_text(comment.get("en", ""))
                        if not english or comment.get("alignment", "index") != "index" or comment.get("fr", "").strip():
                            continue
                        identifier = f"{tractate}|{chapter}|{mishna_no}|{comment_no}"
                        output.write(f"[[COMMENT {identifier}]]\n{english}\n{CLOSE_MARK}\n\n")
                        total += 1
    print(f"{total} commentaires exportés en fichiers par chapitre : {EXPORT_DIR}")


def import_french(path: Path) -> None:
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    expected = {
        identifier: comment for identifier, comment in comment_rows(data)
        if comment.get("en", "").strip() and comment.get("alignment", "index") == "index"
    }
    translations = {}
    current = None
    body = []

    def save_block():
        nonlocal current, body
        if current is None:
            return
        if current not in expected:
            raise ValueError(f"Identifiant inconnu : {current}")
        if current in translations:
            raise ValueError(f"Identifiant répété : {current}")
        translated = "\n".join(body).strip()
        if not translated:
            raise ValueError(f"Traduction française vide : {current}")
        translations[current] = translated
        current, body = None, []

    files = sorted(path.glob("*.txt")) if path.is_dir() else [path]
    if not files:
        raise ValueError(f"Aucun fichier TXT trouvé dans {path}")
    for input_file in files:
        for line in input_file.read_text(encoding="utf-8").replace("\r\n", "\n").split("\n"):
            match = OPEN_MARK.fullmatch(line)
            if match:
                if current is not None:
                    raise ValueError(f"Bloc non terminé avant {line}")
                current = match.group(1)
            elif line == CLOSE_MARK:
                if current is None:
                    raise ValueError("Marqueur de fin sans début")
                save_block()
            elif current is not None:
                body.append(line)
            elif line.strip():
                raise ValueError(f"Texte hors bloc dans {input_file} : {line[:80]}")
    if current is not None:
        raise ValueError(f"Bloc non terminé : {current}")

    for identifier, translated in translations.items():
        tractate, chapter, mishna_no, comment_no = identifier.split("|")
        comment = data[tractate][chapter][int(mishna_no) - 1][int(comment_no) - 1]
        comment["fr"] = translated
    save_data(data)
    remaining = sum(1 for comment in expected.values() if not comment.get("fr", "").strip())
    print(f"{len(translations)} traductions importées. Il en reste {remaining} à faire. Fichier : {DATA_FILE}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    fetch_parser = sub.add_parser("fetch", help="Récupère les textes hébreux et anglais depuis Sefaria")
    fetch_parser.add_argument("--force", action="store_true", help="Récupère aussi les chapitres déjà présents")
    export_parser = sub.add_parser("export", help="Exporte l'anglais dans des TXT balisés, un par chapitre")
    export_parser.add_argument("--tractate", help="Limite l'export à un traité, par exemple Berakhot")
    import_parser = sub.add_parser("import-fr", help="Importe un TXT traduit en français")
    import_parser.add_argument("file", nargs="?", type=Path, default=FRENCH_DIR)
    args = parser.parse_args()
    if args.command == "fetch":
        fetch(args.force)
    elif args.command == "export":
        export_translation(args.tractate)
    else:
        import_french(args.file)


if __name__ == "__main__":
    main()
