"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ALL } from "@/lib/data";
import { PLAN_DEFAULT, PREF_DEFAULT } from "@/lib/defaults";
import { useLS } from "@/lib/store";
import { downloadIcs } from "@/components/Reminder";

export default function Settings() {
  const [plan, setPlan] = useLS("plan", PLAN_DEFAULT);
  const [pref, setPref] = useLS("pref", PREF_DEFAULT);
  const [len, setLen] = useState(0);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let canceled = false;
    setLen(0);
    setErr(false);
    fetch(`/api/chapter?t=${plan.t}&c=${plan.c}`)
      .then((response) => {
        if (!response.ok) throw new Error("Chargement impossible");
        return response.json();
      })
      .then((chapter) => { if (!canceled) setLen(chapter.he.length); })
      .catch(() => { if (!canceled) setErr(true); });
    return () => { canceled = true; };
  }, [plan.t, plan.c]);

  const updatePlan = (updates) => setPlan({ ...plan, ...updates, done: null, achievement: null, pendingAchievement: null });
  const toggleRemind = async (on) => {
    if (on && "Notification" in window && Notification.permission !== "granted") await Notification.requestPermission();
    setPlan({ ...plan, remind: on });
  };
  const language = pref.lang ?? (pref.en ? "en" : "he");
  const tractate = ALL.find((item) => item.name === plan.t) || ALL[0];

  return (
    <>
      <h1>Paramètres</h1>
      <p className="msg">Personnalisez votre lecture et choisissez où commence votre étude journalière.</p>

      <section className="preference-card">
        <h2>Langue de lecture</h2>
        <p className="preference-description">L’hébreu reste affiché. Choisissez la traduction à ajouter au texte original.</p>
        <label>Traduction
          <select value={language} onChange={(e) => setPref({ ...pref, lang: e.target.value })}>
            <option value="he">Hébreu uniquement</option>
            <option value="en">Anglais · Sefaria</option>
            <option value="fr">Français · Talmédia</option>
          </select>
        </label>
      </section>

      <section className="preference-card">
        <h2>Taille du texte hébreu</h2>
        <label className="range-setting">
          <span>Taille : {pref.size.toFixed(1)} rem</span>
          <input
            type="range"
            min="1"
            max="2.4"
            step="0.1"
            value={pref.size}
            onChange={(e) => setPref({ ...pref, size: Number(e.target.value) })}
            aria-label="Taille du texte hébreu"
          />
          <span className="range-labels"><span>Petit</span><span>Grand</span></span>
        </label>
      </section>

      <section className="preference-card">
        <h2>Rythme de lecture</h2>
        <p className="preference-description">Définissez ici le nombre de michnayot à lire chaque jour.</p>
        <label>Mishnayot par jour
          <select value={plan.per || PLAN_DEFAULT.per} onChange={(e) => setPlan({ ...plan, per: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </section>

      <section className="preference-card">
        <h2>Rappels</h2>
        <p className="preference-description">Recevez un rappel lorsque l’application est ouverte ou ajoutez l’étude à votre agenda.</p>
        <div className="settings">
          <label className="row"><input type="checkbox" checked={Boolean(plan.remind)} onChange={(e) => toggleRemind(e.target.checked)} /> Notification quand l’app est ouverte</label>
          <label>Heure <input type="time" value={plan.at || PLAN_DEFAULT.at} onChange={(e) => setPlan({ ...plan, at: e.target.value })} /></label>
          <button onClick={() => downloadIcs(plan.at || PLAN_DEFAULT.at)}>Ajouter un rappel quotidien à mon agenda (.ics)</button>
        </div>
      </section>

      <section className="preference-card">
        <h2>Départ de la Michna journalière</h2>
        <p className="preference-description">Choisissez le traité, le chapitre et la Michna où commencer ou reprendre votre programme.</p>
        <div className="settings">
          <label>Traité
            <select value={plan.t} onChange={(e) => updatePlan({ t: e.target.value, c: 1, m: 1 })}>
              {ALL.map((item) => <option key={item.name} value={item.name}>{item.n}</option>)}
            </select>
          </label>
          <label>Chapitre
            <select value={plan.c} onChange={(e) => updatePlan({ c: Number(e.target.value), m: 1 })}>
              {Array.from({ length: tractate.c }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
            </select>
          </label>
          <label>Michna
            {err ? (
              <span className="field-error">Impossible de charger les Michnayot de ce chapitre.</span>
            ) : len === 0 ? (
              <span className="field-loading">Chargement…</span>
            ) : (
              <select value={Math.min(plan.m, len)} onChange={(e) => updatePlan({ m: Number(e.target.value) })}>
                {Array.from({ length: len }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
              </select>
            )}
          </label>
        </div>
      </section>

      <Link className="primary" href="/">Retour à l’accueil</Link>
    </>
  );
}
