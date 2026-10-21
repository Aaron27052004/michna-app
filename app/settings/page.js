"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ALL } from "@/lib/data";
import { PLAN_DEFAULT, PREF_DEFAULT } from "@/lib/defaults";
import { useLS } from "@/lib/store";

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

  const updatePlan = (updates) => setPlan({ ...plan, ...updates, done: null });
  const tractate = ALL.find((item) => item.name === plan.t) || ALL[0];

  return (
    <>
      <h1>Paramètres</h1>
      <p className="msg">Personnalisez votre lecture et choisissez où commence votre étude journalière.</p>

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
