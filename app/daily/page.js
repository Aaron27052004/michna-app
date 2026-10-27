"use client";
import { useEffect, useState } from "react";
import { useLS, today } from "@/lib/store";
import { getT, ALL } from "@/lib/data";
import Mishna from "@/components/Mishna";
import { PLAN_DEFAULT, PREF_DEFAULT } from "@/lib/defaults";

const load = (t, c, bartLang) => fetch(`/api/chapter?t=${t}&c=${c}&bart=${bartLang}`).then((r) => (r.ok ? r.json() : Promise.reject()));

// Prend les prochaines mishnayot à partir du pointeur et repère les fins de perek.
async function take(plan, k, bartLang) {
  const out = [], cache = {};
  let { t, c, m } = plan;
  while (out.length < k && c <= getT(t).c) {
    const d = (cache[c] ??= await load(t, c, bartLang));
    if (m > d.he.length) { c++; m = 1; continue; }
    out.push({ t, c, m, he: d.he[m - 1], en: d.en[m - 1], fr: d.fr?.[m - 1], bart: d.bart[m - 1], bartTranslation: d.bartTranslation?.[m - 1], bartLang, isLastInChapter: m === d.he.length });
    m++;
  }
  // Normalise le pointeur lorsque la lecture finit exactement à la dernière michna d'un perek.
  while (c <= getT(t).c) {
    const d = (cache[c] ??= await load(t, c, bartLang));
    if (m <= d.he.length) break;
    c++; m = 1;
  }
  return { out, next: { t, c, m } };
}

export default function Daily() {
  const [plan, setPlan] = useLS("plan", PLAN_DEFAULT);
  const [pref] = useLS("pref", PREF_DEFAULT);
  const [day, setDay] = useState(null);
  const [err, setErr] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const done = plan.done === today();

  useEffect(() => {
    if (done) return;
    setDay(null); setErr(false);
    let canceled = false;
    take(plan, continuing ? 1 : (plan.per || PLAN_DEFAULT.per), pref.bartLang ?? "he")
      .then((result) => { if (!canceled) setDay(result); })
      .catch(() => { if (!canceled) setErr(true); });
    return () => { canceled = true; };
  }, [plan.t, plan.c, plan.m, plan.per, done, continuing, pref.bartLang]);

  const finish = () => {
    const y = new Date(Date.now() - 864e5).toLocaleDateString("sv");
    const endedTractate = day.next.c > getT(day.next.t).c;
    const completedIndex = ALL.findIndex((x) => x.name === plan.t);
    const followingTractate = ALL[(completedIndex + 1 + ALL.length) % ALL.length];
    const lastCompletedChapter = [...day.out].reverse().find((item) => item.isLastInChapter);
    const achievement = endedTractate
      ? { type: "tractate", t: day.next.t }
      : lastCompletedChapter ? { type: "chapter", t: lastCompletedChapter.t, c: lastCompletedChapter.c }
      : plan.pendingAchievement ?? null;
    setPlan({
      ...plan,
      ...(endedTractate ? { t: followingTractate.name, c: 1, m: 1 } : day.next),
      achievement,
      pendingAchievement: null,
      prev: continuing ? plan.prev : { t: plan.t, c: plan.c, m: plan.m },
      done: today(),
      streak: plan.done === y ? (plan.streak || 0) + 1 : 1,
    });
  };
  const undo = () => setPlan({ ...plan, ...plan.prev, done: null, achievement: null, pendingAchievement: null, streak: Math.max(0, (plan.streak || 1) - 1) });
  const continueStudy = () => {
    const lastCompletedChapter = [...day.out].reverse().find((item) => item.isLastInChapter);
    const endedTractate = day.next.c > getT(day.next.t).c;
    if (endedTractate) {
      const y = new Date(Date.now() - 864e5).toLocaleDateString("sv");
      const completedIndex = ALL.findIndex((x) => x.name === plan.t);
      const followingTractate = ALL[(completedIndex + 1 + ALL.length) % ALL.length];
      setPlan({
        ...plan,
        t: followingTractate.name,
        c: 1,
        m: 1,
        achievement: { type: "tractate", t: plan.t },
        pendingAchievement: null,
        prev: continuing ? plan.prev : { t: plan.t, c: plan.c, m: plan.m },
        done: today(),
        streak: plan.done === y ? (plan.streak || 0) + 1 : 1,
      });
      return;
    }
    setDay(null);
    setPlan({
      ...plan,
      ...day.next,
      pendingAchievement: lastCompletedChapter
        ? { type: "chapter", t: lastCompletedChapter.t, c: lastCompletedChapter.c }
        : plan.pendingAchievement,
      prev: continuing ? plan.prev : { t: plan.t, c: plan.c, m: plan.m },
    });
    setContinuing(true);
  };
  const finished = day && day.out.length === 0;
  const achievement = plan.achievement;
  const currentIndex = ALL.findIndex((x) => x.name === achievement?.t);
  const defaultNext = ALL[(currentIndex + 1 + ALL.length) % ALL.length]?.name ?? ALL[0].name;
  const planIndex = ALL.findIndex((x) => x.name === plan.t);
  const nextFromCurrent = ALL[(planIndex + 1 + ALL.length) % ALL.length]?.name ?? ALL[0].name;
  const chooseNextTractate = (t) => setPlan({ ...plan, t, c: 1, m: 1 });
  const nextPicker = (selected = plan.t === achievement?.t ? defaultNext : plan.t) => (
    <label className="next-tractate">Quelle massekhet veux-tu commencer ensuite ?
      <select value={selected} onChange={(e) => chooseNextTractate(e.target.value)}>
        {ALL.map((item) => <option key={item.name} value={item.name}>{item.n}</option>)}
      </select>
    </label>
  );

  return (
    <>
      <h1>Michna du jour</h1>
      {done ? (
        <div className="msg done">
          {achievement?.type === "tractate" ? <><h2>Kol hakavod ! Tu as terminé la massekhet {achievement.t.replace(/_/g, " ")} !</h2>{nextPicker()}</>
            : achievement?.type === "chapter" ? <h2>Bravo ! Tu as terminé le perek {achievement.c} de {achievement.t.replace(/_/g, " ")}.</h2> : null}
          <p>Terminé pour aujourd'hui. Série : {plan.streak} jour{plan.streak > 1 ? "s" : ""}.</p>
          <button onClick={undo}>Annuler</button>
        </div>
      ) : err ? (
        <p className="msg">Chargement impossible. Recharge la page.</p>
      ) : !day ? (
        <p className="msg">Chargement…</p>
      ) : finished ? (
        <div className="msg done"><p>Cette massekhet est terminée. Choisis celle que tu veux étudier ensuite.</p>{nextPicker(nextFromCurrent)}</div>
      ) : (
        <>
          {day.out.map((x) => <Mishna key={`${x.c}.${x.m}`} {...x} />)}
          <button className="big" onClick={continueStudy}>J'ai terminé, afficher la michna suivante</button>
          <button className="primary big" onClick={finish}>J'ai terminé aujourd'hui</button>
        </>
      )}
    </>
  );
}
