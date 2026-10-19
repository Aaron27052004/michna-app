"use client";
import Link from "next/link";
import { useLS } from "@/lib/store";

export default function Bookmarks() {
  const [bms, setBms] = useLS("bm", []);
  const upd = (id, f) => setBms((l) => l.map((b) => (b.id === id ? { ...b, ...f } : b)));
  return (
    <>
      <h1>Marque-pages</h1>
      {bms.length === 0 && <p className="msg">Aucun marque-page. Ajoutes-en depuis n'importe quelle mishna.</p>}
      <ul className="bms">
        {bms.map((b) => {
          const [t, c, m] = b.id.split(".");
          return (
            <li key={b.id}>
              <Link href={`/t/${t}/${c}#m${m}`}>{t.replace(/_/g, " ")} {c}:{m}</Link>
              <input value={b.note} placeholder="Ajouter une note" aria-label="Note" onChange={(e) => upd(b.id, { note: e.target.value })} />
              <button onClick={() => setBms((l) => l.filter((x) => x.id !== b.id))}>Supprimer</button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
