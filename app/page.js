import Link from "next/link";
import { SEDARIM } from "@/lib/data";
import Resume from "@/components/Resume";

export default function Home() {
  return (
    <>
      <h1>Michna et Bartenura</h1>
      <Resume />
      {SEDARIM.map((s) => (
        <section key={s.seder}>
          <h2>{s.seder}</h2>
          <ul className="tiles">
            {s.tractates.map((t) => <li key={t.name}><Link href={`/t/${t.name}`}>{t.n}<small>{t.c} chapitres</small></Link></li>)}
          </ul>
        </section>
      ))}
    </>
  );
}
