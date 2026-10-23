import Link from "next/link";
import Image from "next/image";
import { Frank_Ruhl_Libre, Figtree } from "next/font/google";
import Reminder from "@/components/Reminder";
import "./globals.css";

const serif = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], variable: "--serif" });
const sans = Figtree({ subsets: ["latin"], variable: "--sans" });

export const metadata = {
  title: "Michna",
  description: "Étudiez la Michna avec le commentaire du Bartenura.",
  icons: { icon: "/logo-michna.jpeg" },
};

export default function Root({ children }) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <nav className="top">
          <Link href="/" className="brand">
            <Image src="/logo-michna.jpeg" alt="" width={44} height={44} className="brand-mark" priority />
            <span>Michna<small>Étude &amp; Bartenura</small></span>
          </Link>
          <div className="nav-links">
            <Link href="/daily">Du jour</Link>
            <Link href="/bookmarks">Marque-pages</Link>
          </div>
          <Link href="/settings" className="settings-nav" aria-label="Paramètres" title="Paramètres">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm9 4.8v-2l-2.1-.6a7.3 7.3 0 0 0-.7-1.7l1.1-1.9-1.4-1.4-1.9 1.1a7.3 7.3 0 0 0-1.7-.7L13.7 3h-2l-.6 2.1a7.3 7.3 0 0 0-1.7.7L7.5 4.7 6.1 6.1l1.1 1.9a7.3 7.3 0 0 0-.7 1.7L4.4 10.3v2l2.1.6c.1.6.4 1.2.7 1.7l-1.1 1.9 1.4 1.4 1.9-1.1c.5.3 1.1.5 1.7.7l.6 2.1h2l.6-2.1a7.3 7.3 0 0 0 1.7-.7l1.9 1.1 1.4-1.4-1.1-1.9c.3-.5.5-1.1.7-1.7L21 13Z" /></svg>
            <span>Paramètres</span>
          </Link>
        </nav>
        <main>{children}</main>
        <footer>Textes hébreux et anglais fournis par <a href="https://www.sefaria.org">Sefaria</a>. Traductions françaises de <a href="https://github.com/micka-coder/talmedia">Talmédia</a>, avec crédits et licences affichés à la lecture.</footer>
        <Reminder />
      </body>
    </html>
  );
}
