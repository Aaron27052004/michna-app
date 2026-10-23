"use client";
import { useEffect, useState } from "react";
import Mishna from "./Mishna";
import { useLS } from "@/lib/store";

export default function Chapter({ t, c }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(false);
  const [, setLast] = useLS("last", null);
  useEffect(() => {
    setD(null); setErr(false); setLast({ t, c });
    fetch(`/api/chapter?t=${t}&c=${c}`).then((r) => (r.ok ? r.json() : Promise.reject())).then(setD).catch(() => setErr(true));
  }, [t, c]);
  useEffect(() => { if (d && location.hash) document.querySelector(location.hash)?.scrollIntoView(); }, [d]);
  if (err) return <p className="msg">Chargement impossible. Vérifie ta connexion puis recharge la page.</p>;
  if (!d) return <p className="msg">Chargement…</p>;
  return (
    <>
      {d.he.map((h, i) => <Mishna key={i} t={t} c={c} m={i + 1} he={h} en={d.en[i]} fr={d.fr?.[i]} bart={d.bart[i]} />)}
    </>
  );
}
