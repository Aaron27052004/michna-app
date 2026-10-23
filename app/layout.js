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
        </nav>
        <main>{children}</main>
        <footer>Textes hébreux et anglais fournis par <a href="https://www.sefaria.org">Sefaria</a>. Traductions françaises de <a href="https://github.com/micka-coder/talmedia">Talmédia</a>, avec crédits et licences affichés à la lecture.</footer>
        <Reminder />
      </body>
    </html>
  );
}
