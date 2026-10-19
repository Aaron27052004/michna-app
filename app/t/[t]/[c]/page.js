import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/lib/data";
import Chapter from "@/components/Chapter";

export default async function ChapterPage({ params }) {
  const { t, c } = await params;
  const T = getT(t), n = +c;
  if (!T || !(n >= 1 && n <= T.c)) notFound();
  return (
    <>
      <h1><Link href={`/t/${t}`}>{T.n}</Link>, chapitre {n}</h1>
      <Chapter t={t} c={n} />
      <nav className="pager">
        {n > 1 ? <Link href={`/t/${t}/${n - 1}`}>Chapitre précédent</Link> : <span />}
        {n < T.c && <Link href={`/t/${t}/${n + 1}`}>Chapitre suivant</Link>}
      </nav>
    </>
  );
}
