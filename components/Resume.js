"use client";
import Link from "next/link";
import { useLS, today } from "@/lib/store";

export default function Resume() {
  const [plan] = useLS("plan", null);
  const [last] = useLS("last", null);
  const done = plan?.done === today();
  return (
    <div className="resume">
      <Link href="/daily" className="primary">
        {done ? "Michna du jour terminée" : "Michna du jour"}
        {plan?.streak > 0 && <small> · série de {plan.streak} j</small>}
      </Link>
      {last && <Link href={`/t/${last.t}/${last.c}`}>Reprendre : {last.t.replace(/_/g, " ")} {last.c}</Link>}
    </div>
  );
}
