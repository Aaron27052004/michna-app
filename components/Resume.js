"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLS, today } from "@/lib/store";
import { ALL, getT } from "@/lib/data";
import { PLAN_DEFAULT } from "@/lib/defaults";

const reference = (point, tractate) => {
  const book = getT(point?.t) || tractate || ALL[0];
  return { book, chapter: Number(point?.c) || 1, mishna: Number(point?.m) || 1 };
};

export default function Resume() {
  const [savedPlan] = useLS("plan", null);
  const [last] = useLS("last", null);
  const plan = savedPlan || PLAN_DEFAULT;
  const done = plan.done === today();
  const achievement = done ? plan.achievement : null;
  const completedTractate = achievement?.type === "tractate" ? getT(achievement.t) : null;
  const progressBook = completedTractate || getT(plan.t) || ALL[0];
  const point = reference(plan, progressBook);
  const [chapterLength, setChapterLength] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const todayStart = done && plan.prev ? plan.prev : plan;
  const todayRef = reference(todayStart);
  const nextRef = reference(plan);

  useEffect(() => {
    if (completedTractate) {
      setChapterLength(0);
      setLoadingProgress(false);
      return;
    }
    let canceled = false;
    setLoadingProgress(true);
    fetch(`/api/chapter?t=${encodeURIComponent(progressBook.name)}&c=${point.chapter}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((chapter) => { if (!canceled) setChapterLength(chapter.he.length); })
      .catch(() => { if (!canceled) setChapterLength(0); })
      .finally(() => { if (!canceled) setLoadingProgress(false); });
    return () => { canceled = true; };
  }, [progressBook.name, point.chapter, completedTractate]);

  const position = completedTractate
    ? 1
    : Math.min(1, Math.max(0, (point.chapter - 1 + (chapterLength ? (point.mishna - 1) / chapterLength : 0)) / progressBook.c));
  const percent = Math.round(position * 100);
  const plannedCount = Number(plan.per) || PLAN_DEFAULT.per;

  return (
    <section className="study-dashboard" aria-label="Votre étude de Michna">
      <div className="study-main">
        <div className="study-topline">
          <span className="study-kicker">{done ? "Lecture du jour terminée" : "Votre étude du jour"}</span>
          <span className={`study-status${done ? " is-done" : ""}`}><span />{done ? "Terminé" : "À faire"}</span>
        </div>
        <p className="study-label">{done ? "Tu as lu" : "À lire aujourd’hui"}</p>
        <h2>{todayRef.book.n}</h2>
        <p className="study-reference">Perek {todayRef.chapter}, michna {todayRef.mishna}</p>
        <p className="study-count">{plannedCount} michna{plannedCount > 1 ? "s" : ""} prévues dans ton programme quotidien</p>
        <Link href="/daily" className="study-action primary">{done ? "Voir ma prochaine lecture" : "Commencer ma lecture"}<span aria-hidden="true">→</span></Link>
        {done && <p className="next-study">Prochaine : {nextRef.book.n}, perek {nextRef.chapter}, michna {nextRef.mishna}</p>}
        {plan.streak > 0 && <p className="study-streak">🔥 Série de {plan.streak} jour{plan.streak > 1 ? "s" : ""}</p>}
        {last && <Link href={`/t/${last.t}/${last.c}`} className="resume-last">Reprendre ma dernière page consultée</Link>}
      </div>

      <div className="tractate-progress">
        <div className="progress-heading">
          <div>
            <span className="study-label">Avancement dans la massekhet</span>
            <h3>{progressBook.n}</h3>
          </div>
          <strong>{loadingProgress ? "…" : `${percent}%`}</strong>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label={`Avancement dans ${progressBook.n}`}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={loadingProgress ? 0 : percent}
        >
          <span style={{ width: `${loadingProgress ? 0 : percent}%` }} />
        </div>
        <div className="progress-caption">
          <span>{completedTractate ? `${progressBook.c} perek sur ${progressBook.c} terminés` : `Perek ${point.chapter} sur ${progressBook.c}`}</span>
          <span>{completedTractate ? "Massekhet terminée" : `Michna ${point.mishna}`}</span>
        </div>
        <p className="progress-note">La barre avance au fil des perek étudiés.</p>
      </div>
    </section>
  );
}
