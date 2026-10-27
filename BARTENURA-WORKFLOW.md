# Traduire le Bartenura

Le script `scripts/bartenura.py` gère la récupération, l'export et le réimport.
Chaque commentaire possède un identifiant stable : traité, chapitre, michna,
numéro du commentaire. Le dibour hamatḥil est extrait du `<b>` de Sefaria et
reste séparé des textes hébreu, anglais et français dans `lib/bartenura.json`.

## Commandes

Récupérer ou reprendre les données Sefaria :

```sh
python3 scripts/bartenura.py fetch
```

`fetch` reprend les chapitres déjà enregistrés. `fetch --force` les rafraîchit
et conserve les traductions françaises déjà importées.

Préparer les fichiers anglais par chapitre, par exemple seulement Berakhot :

```sh
python3 scripts/bartenura.py export --tractate Berakhot
```

Les fichiers sont dans `lib/bartenura-to-translate/`. Traduire le texte entre
les marqueurs, garder les lignes `[[COMMENT ...]]` et `[[/COMMENT]]` intactes,
puis enregistrer les fichiers traduits dans `lib/bartenura-fr/` en gardant
leurs noms.

Importer une traduction ou un dossier de traductions :

```sh
python3 scripts/bartenura.py import-fr lib/bartenura-fr
```

L'import peut se faire chapitre par chapitre. Il ne remplace que le champ
français et conserve les identifiants, le dibour, l'hébreu et l'anglais.

## Notes sur les données

Les dibour hamatḥil hébreux viennent des balises `<b>` de l'édition hébraïque
Sefaria. Les commentaires hébreu et anglais sont associés par michna et par
position de segment. Quand une édition n'a pas un segment, le script le garde
comme non apparié au lieu de décaler les commentaires suivants. Ces cas sont
indiqués dans `lib/bartenura-fetch-issues.txt` et ne sont pas exportés pour la
traduction automatique. Sefaria ne fournit pas actuellement Avot 6 dans cette
référence, et certaines entrées anglaises manquent.
