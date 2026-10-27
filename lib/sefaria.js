import { getT } from "./data";
import talmedia from "./talmedia-fr.json";
import bartenura from "./bartenura.json";
const API = "https://www.sefaria.org/api/v3/texts/";

// Garde uniquement b/i/small/big, retire notes de bas de page et autres balises
const clean = (s) =>
  String(s ?? "")
    .replace(/<sup[^>]*footnote-marker[^>]*>.*?<\/sup>/gi, "")
    .replace(/<i class="footnote">.*?<\/i>/gi, "")
    .replace(/<(?!\/?(b|i|small|big)\b)[^>]*>/gi, "")
    .replace(/&nbsp;/g, " ")
    .trim();
const flat = (x) => (Array.isArray(x) ? x.flatMap(flat) : [x]);

async function get(ref, versions) {
  const q = versions.map((v) => "version=" + v).join("&");
  const r = await fetch(`${API}${ref}?${q}`, { next: { revalidate: 86400 } });
  return r.ok ? r.json() : null;
}

export async function chapter(t, c) {
  const T = getT(t);
  const m = await get(`${T.m ?? "Mishnah_" + t}.${c}`, ["primary", "english"]);
  const pick = (d, lang) => d?.versions?.find((v) => v.language === lang)?.text ?? [];
  const tractateKey = String(t).replace(/_/g, " ").toLowerCase();
  const bart = bartenura[tractateKey]?.[String(c)] ?? [];
  return {
    he: flat(pick(m, "he")).map(clean),
    en: pick(m, "en").map((x) => flat(x).map(clean).join(" ")),
    fr: talmedia[frTractateKey(t)]?.[String(c)] ?? [],
    bart: bart.map((mishna) => mishna.map((comment) => ({
      ...comment,
      he: clean(comment.he),
      en: clean(comment.en),
    }))),
    bartMeta: bartenura._versions?.[tractateKey]?.[String(c)] ?? {},
  };
}

function frTractateKey(t) {
  const key = String(t).replace(/_/g, " ").toLowerCase();
  if (key === "avot") return "pirkei avot";
  if (key === "terumot") return "teroumot";
  return key;
}
