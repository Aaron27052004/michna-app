import Link from "next/link";
import { Frank_Ruhl_Libre, Figtree } from "next/font/google";
import Reminder from "@/components/Reminder";
import "./globals.css";

const serif = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], variable: "--serif" });
const sans = Figtree({ subsets: ["latin"], variable: "--sans" });

export const metadata = { title: "Michna", description: "Michna avec le commentaire du Bartenura" };

export default function Root({ children }) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <nav className="top">
          <Link href="/" className="brand">Michna</Link>
          <Link href="/daily">Du jour</Link>
          <Link href="/bookmarks">Marque-pages</Link>
        </nav>
        <main>{children}</main>
        <footer>Textes fournis par <a href="https://www.sefaria.org">Sefaria</a>.</footer>
        <Reminder />
      </body>
    </html>
  );
}
