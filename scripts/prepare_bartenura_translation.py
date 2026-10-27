#!/usr/bin/env python3
"""Export Bartenura English as translatable text, or rebuild French JSON."""

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "lib/bartenura-en.json"
TEXT = ROOT / "lib/bartenura-en.txt"
FRENCH = ROOT / "lib/bartenura-fr.json"
OPEN = re.compile(r"^\[\[MISHNAH ([^\]\r\n]+)\]\]$")
CLOSE = "[[/MISHNAH]]"


def walk(data):
    for tractate, chapters in data.items():
        for chapter, mishnayot in chapters.items():
            for number, entry in enumerate(mishnayot, 1):
                yield f"{tractate}|{chapter}|{number}", entry


def english_only(text):
    # Remove Hebrew letters, vowel marks and cantillation, then compact the
    # remaining English so the translation file stays small and easy to edit.
    text = re.sub(r"[\u0590-\u05ff\ufb1d-\ufb4f]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip(" \t–—-,:;")


def export():
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    with TEXT.open("w", encoding="utf-8", newline="\n") as output:
        for identifier, entry in walk(data):
            output.write(f"[[MISHNAH {identifier}]]\n")
            output.write(english_only(entry["text"]))
            output.write(f"\n{CLOSE}\n\n")
    print(f"Texte prêt pour traduction : {TEXT}")


def import_translation(path: Path):
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    expected = dict(walk(source))
    translated = {}
    current_id = None
    body = []

    def save_block():
        nonlocal current_id, body
        if current_id is None:
            return
        if current_id not in expected:
            raise ValueError(f"Identifiant inconnu : {current_id}")
        if current_id in translated:
            raise ValueError(f"Identifiant répété : {current_id}")
        text = "\n".join(body).strip("\n")
        if not text.strip():
            raise ValueError(f"Traduction vide : {current_id}")
        translated[current_id] = text
        current_id, body = None, []

    for line in path.read_text(encoding="utf-8").replace("\r\n", "\n").split("\n"):
        match = OPEN.fullmatch(line)
        if match:
            if current_id is not None:
                raise ValueError(f"Bloc précédent non terminé avant {line}")
            current_id = match.group(1)
        elif line == CLOSE:
            if current_id is None:
                raise ValueError("Marqueur de fin sans début")
            save_block()
        elif current_id is not None:
            body.append(line)
        elif line.strip():
            raise ValueError(f"Texte hors d'un bloc : {line[:80]}")

    if current_id is not None:
        raise ValueError(f"Bloc non terminé : {current_id}")
    missing = expected.keys() - translated.keys()
    if missing:
        example = ", ".join(sorted(missing)[:5])
        raise ValueError(f"{len(missing)} traductions manquantes (ex. {example})")

    result = {}
    for identifier, entry in walk(source):
        tractate, chapter, number = identifier.split("|")
        result.setdefault(tractate, {}).setdefault(chapter, []).append({
            **entry,
            "text": translated[identifier],
            "credit": f"Traduction française à partir de {entry.get('credit', 'Sefaria')}",
        })
    FRENCH.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"JSON français créé : {FRENCH}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--import", dest="translated_file", type=Path,
                        help="Réimporte un TXT traduit et crée lib/bartenura-fr.json")
    args = parser.parse_args()
    if args.translated_file:
        import_translation(args.translated_file)
    else:
        export()


if __name__ == "__main__":
    main()
