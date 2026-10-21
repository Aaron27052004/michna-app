import Link from "next/link";
import { SEDARIM } from "@/lib/data";
import Resume from "@/components/Resume";

export default function Home() {
  return (
    <>
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow">Une étude à votre rythme</p>
          <h1>La Michna, <span>chaque jour.</span></h1>
          <p className="hero-description">Parcourez les six ordres de la Michna et approfondissez chaque texte avec le commentaire du Bartenura.</p>
          <Resume />
          <Link href="/settings" className="settings-link">Paramètres de lecture</Link>
        </div>
      </section>
      <section className="library">
        <div className="section-heading">
          <p className="eyebrow">Explorez les six ordres</p>
          <h2>Choisissez votre traité</h2>
        </div>
        {SEDARIM.map((s, i) => (
          <section className="seder-section" key={s.seder}>
            <h3><span>{String(i + 1).padStart(2, "0")}</span>{s.seder}</h3>
            <ul className="tiles">
              {s.tractates.map((t) => <li key={t.name}><Link href={`/t/${t.name}`}>{t.n}<small>{t.c} chapitres</small></Link></li>)}
            </ul>
          </section>
        ))}
      </section>
    </>
  );
}
