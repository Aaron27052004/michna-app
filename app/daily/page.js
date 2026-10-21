"use client";
import { useEffect, useState } from "react";
import { useLS, today } from "@/lib/store";
import { getT } from "@/lib/data";
import Mishna, { Controls } from "@/components/Mishna";
import { downloadIcs } from "@/components/Reminder";
import { PLAN_DEFAULT } from "@/lib/defaults";

const load = (t, c) => fetch(`/api/chapter?t=${t}&c=${c}`).then((r) => (r.ok ? r.json() : Promise.reject()));

// Prend les k prochaines mishnayot à partir du pointeur, en passant au chapitre suivant si besoin
async function take(plan, k) {
  const out = [], cache = {};
  let { t, c, m } = plan;
  while (out.length < k && c <= getT(t).c) {
    const d = (cache[c] ??= await load(t, c));
    if (m > d.he.length) { c++; m = 1; continue; }
    out.push({ t, c, m, he: d.he[m - 1], en: d.en[m - 1], bart: d.bart[m - 1] });
    m++;
  }
  return { out, next: { t, c, m } };
}

export default function Daily() {
  const [plan, setPlan] = useLS("plan", PLAN_DEFAULT);
  const [day, setDay] = useState(null);
  const [err, setErr] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const done = plan.done === today();

  useEffect(() => {
    if (done) return;
    setDay(null); setErr(false);
    let canceled = false;
    take(plan, continuing ? 1 : plan.per)
      .then((result) => { if (!canceled) setDay(result); })
      .catch(() => { if (!canceled) setErr(true); });
    return () => { canceled = true; };
  }, [plan.t, plan.c, plan.m, plan.per, done, continuing]);

  const finish = () => {
    const y = new Date(Date.now() - 864e5).toLocaleDateString("sv");
    setPlan({
      ...plan,
      ...day.next,
      prev: continuing ? plan.prev : { t: plan.t, c: plan.c, m: plan.m },
      done: today(),
      streak: plan.done === y ? (plan.streak || 0) + 1 : 1,
    });
  };
  const undo = () => setPlan({ ...plan, ...plan.prev, done: null, streak: Math.max(0, (plan.streak || 1) - 1) });
  const changePlan = (updates) => {
    setContinuing(false);
    setPlan({ ...plan, ...updates });
  };
  const continueStudy = () => {
    setDay(null);
    setPlan({
      ...plan,
      ...day.next,
      prev: continuing ? plan.prev : { t: plan.t, c: plan.c, m: plan.m },
    });
    setContinuing(true);
  };
  const toggleRemind = async (on) => {
    if (on && "Notification" in window && Notification.permission !== "granted") await Notification.requestPermission();
    setPlan({ ...plan, remind: on });
  };
  const finished = day && day.out.length === 0;

  return (
    <>
      <h1>Michna du jour</h1>
      <section className="settings">
        <label>Mishnayot par jour
          <select value={plan.per} onChange={(e) => changePlan({ per: +e.target.value })}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
      </section>

      {done ? (
        <div className="msg done">
          <p>Terminé pour aujourd'hui. Série : {plan.streak} jour{plan.streak > 1 ? "s" : ""}. Prochaine étude : {plan.t.replace(/_/g, " ")} {plan.c}:{plan.m}.</p>
          <button onClick={undo}>Annuler</button>
        </div>
      ) : err ? (
        <p className="msg">Chargement impossible. Recharge la page.</p>
      ) : !day ? (
        <p className="msg">Chargement…</p>
      ) : finished ? (
        <p className="msg">Traité terminé. Choisis le suivant dans la liste ci-dessus.</p>
      ) : (
        <>
          <Controls />
          {day.out.map((x) => <Mishna key={`${x.c}.${x.m}`} {...x} />)}
          <button className="big" onClick={continueStudy}>
            J'ai terminé, afficher la michna suivante
          </button>
          <button className="primary big" onClick={finish}>J'ai terminé aujourd'hui</button>
        </>
      )}

      <section className="settings">
        <h2>Rappel</h2>
        <label className="row"><input type="checkbox" checked={plan.remind} onChange={(e) => toggleRemind(e.target.checked)} /> Notification quand l'app est ouverte</label>
        <label>Heure <input type="time" value={plan.at} onChange={(e) => setPlan({ ...plan, at: e.target.value })} /></label>
        <button onClick={() => downloadIcs(plan.at)}>Ajouter un rappel quotidien à mon agenda (.ics)</button>
      </section>
    </>
  );
}