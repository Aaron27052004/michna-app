import { NextResponse } from "next/server";
import { chapter } from "@/lib/sefaria";
import { getT } from "@/lib/data";

export async function GET(req) {
  const p = new URL(req.url).searchParams;
  const t = p.get("t"), c = +p.get("c");
  const T = getT(t);
  if (!T || !(c >= 1 && c <= T.c)) return NextResponse.json({ error: "bad ref" }, { status: 400 });
  try { return NextResponse.json(await chapter(t, c)); }
  catch { return NextResponse.json({ error: "sefaria" }, { status: 502 }); }
}
