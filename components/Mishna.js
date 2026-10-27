"use client";
import { useLS } from "@/lib/store";
import { PREF_DEFAULT } from "@/lib/defaults";

const html = (s) => ({ __html: s });
const TALMEDIA_COMMIT = "46e01ba8b7ecabf7e4195789580fad3beb548369";

const frenchText = (text) => String(text ?? "").split(/(_[^_]+_)/g).map((part, i) =>
  part.startsWith("_") && part.endsWith("_")
    ? <em key={i}>{part.slice(1, -1)}</em>
    : part
);

export default function Mishna({ t, c, m, he, en, fr, bart, bartTranslation, bartLang = "he" }) {
  const id = `${t}.${c}.${m}`;
  const [bms, setBms] = useLS("bm", []);
  const [p] = useLS("pref", PREF_DEFAULT);
  const lang = p.lang ?? (p.en ? "en" : "he");
  const on = bms.some((b) => b.id === id);
  const toggle = () =>
    setBms((l) => (l.some((b) => b.id === id) ? l.filter((b) => b.id !== id) : [{ id, ts: Date.now(), note: "" }, ...l]));
  return (
    <article className="mishna" id={`m${m}`}>
      <header>
        <span className="ref">{t.replace(/_/g, " ")} {c}:{m}</span>
        <button className="bm" aria-pressed={on} onClick={toggle}>{on ? "Marque-page ajouté" : "Ajouter un marque-page"}</button>
      </header>
      <div className="body">
        <div>
          <p className="he" lang="he" dir="rtl" style={{ fontSize: p.size + "rem" }} dangerouslySetInnerHTML={html(he)} />
          {lang === "en" && en && <p className="translation en" lang="en" dir="ltr" dangerouslySetInnerHTML={html(en)} />}
          {lang === "fr" && (fr?.text
            ? <><p className="translation fr" lang="fr" dir="ltr">{frenchText(fr.text)}</p><small className="translation-credit">Traduction : {fr.credit} · {fr.license} · <a href={`https://github.com/micka-coder/talmedia/blob/${TALMEDIA_COMMIT}/michnayot/${encodeURI(fr.source)}`}>Source Talmédia</a></small></>
            : <p className="translation fr unavailable" lang="fr" dir="ltr">Traduction française non disponible pour cette michna.</p>)}
        </div>
        {bart?.length > 0 && (
          <details open className="bart">
            <summary>Bartenura</summary>
            {bart.map((x, i) => <p key={i} lang="he" dir="rtl" dangerouslySetInnerHTML={html(x)} />)}
            {bartLang !== "he" && (bartTranslation?.text
              ? <div className={`bart-translated ${bartLang}`} lang={bartLang} dir="ltr">
                <strong>{bartLang === "en" ? "Traduction anglaise" : "Traduction française"}</strong>
                <p>{bartTranslation.text}</p>
                <small className="bart-credit">{bartTranslation.credit} · {bartTranslation.license} · {bartTranslation.source}</small>
              </div>
              : bartLang === "fr" && <p className="bart-unavailable" lang="fr" dir="ltr">Traduction française non disponible pour ce commentaire.</p>)}
          </details>
        )}
      </div>
    </article>
  );
}
