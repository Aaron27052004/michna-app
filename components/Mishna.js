"use client";
import { useLS } from "@/lib/store";

const PREF = { en: false, size: 1.5 };
const html = (s) => ({ __html: s });

export function Controls() {
  const [p, setP] = useLS("pref", PREF);
  return (
    <div className="controls">
      <button onClick={() => setP({ ...p, size: Math.max(1, +(p.size - 0.1).toFixed(1)) })} aria-label="Réduire le texte">A−</button>
      <button onClick={() => setP({ ...p, size: Math.min(2.4, +(p.size + 0.1).toFixed(1)) })} aria-label="Agrandir le texte">A+</button>
      <button aria-pressed={p.en} onClick={() => setP({ ...p, en: !p.en })}>Traduction anglaise</button>
    </div>
  );
}

export default function Mishna({ t, c, m, he, en, bart }) {
  const id = `${t}.${c}.${m}`;
  const [bms, setBms] = useLS("bm", []);
  const [p] = useLS("pref", PREF);
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
          {p.en && en && <p className="en" lang="en" dir="ltr" dangerouslySetInnerHTML={html(en)} />}
        </div>
        {bart?.length > 0 && (
          <details open className="bart">
            <summary>Bartenura</summary>
            {bart.map((x, i) => <p key={i} lang="he" dir="rtl" dangerouslySetInnerHTML={html(x)} />)}
          </details>
        )}
      </div>
    </article>
  );
}
