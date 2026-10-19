import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/lib/data";

export default async function Tractate({ params }) {
  const { t } = await params;
  const T = getT(t);
  if (!T) notFound();
  return (
    <>
      <h1>{T.n}</h1>
      <ol className="chapters">
        {Array.from({ length: T.c }, (_, i) => <li key={i}><Link href={`/t/${t}/${i + 1}`}>{i + 1}</Link></li>)}
      </ol>
    </>
  );
}
