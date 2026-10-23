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
          <Link href="/settings" className="settings-icon" aria-label="Paramètres" title="Paramètres">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm9 4.8v-2l-2.1-.6a7.3 7.3 0 0 0-.7-1.7l1.1-1.9-1.4-1.4-1.9 1.1a7.3 7.3 0 0 0-1.7-.7L13.7 3h-2l-.6 2.1a7.3 7.3 0 0 0-1.7.7L7.5 4.7 6.1 6.1l1.1 1.9a7.3 7.3 0 0 0-.7 1.7L4.4 10.3v2l2.1.6c.1.6.4 1.2.7 1.7l-1.1 1.9 1.4 1.4 1.9-1.1c.5.3 1.1.5 1.7.7l.6 2.1h2l.6-2.1a7.3 7.3 0 0 0 1.7-.7l1.9 1.1 1.4-1.4-1.1-1.9c.3-.5.5-1.1.7-1.7L21 13Z" /></svg>
          </Link>
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
